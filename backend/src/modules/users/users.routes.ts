import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { prisma } from '../../database/prisma.js';
import { authenticate, tenantContextMiddleware } from '../../core/http/middleware.js';
import { ConflictError, NotFoundError, ValidationAppError } from '../../shared/errors/index.js';
import { hashPassword } from '../../utils/password.js';

type UserRoleRow = {
  role?: {
    id: string;
    name: string;
    slug: string;
    type: string;
    rolePermissions: Array<{
      permission: {
        slug: string;
      };
    }>;
  } | null;
};

type SafeUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  tenantId: string;
  roles: Array<{
    id: string;
    name: string;
    slug: string;
    type: string;
  }>;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
};

type UserRecord = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  userRoles: UserRoleRow[];
};

type CreateUserBody = {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  role: string;
};

type UpdateUserBody = {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
};

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  role: z.string().min(1),
}).passthrough();

const updateUserSchema = z.object({
  email: z.string().trim().email().optional(),
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().optional(),
  isActive: z.boolean().optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

const validateBody = (schema: z.ZodTypeAny) => async (request: FastifyRequest, reply: FastifyReply) => {
  const result = schema.safeParse(request.body);

  if (!result.success) {
    reply.status(400).send({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues.map(({ message }) => message),
    });
    return;
  }

  request.body = result.data;
};

const getTenantId = (request: FastifyRequest): string => {
  const tenantId = request.currentTenant?.tenantId;

  if (!tenantId) {
    throw new ValidationAppError('Missing tenant context');
  }

  return tenantId;
};

const buildSafeUser = (user: UserRecord): SafeUser => {
  const roles = user.userRoles
    .map((userRole) => userRole.role)
    .filter((role): role is NonNullable<UserRoleRow['role']> => Boolean(role))
    .reduce<Array<{
      id: string;
      name: string;
      slug: string;
      type: string;
    }>>((acc, role) => {
      if (acc.some((entry) => entry.id === role.id)) {
        return acc;
      }

      acc.push({
        id: role.id,
        name: role.name,
        slug: role.slug,
        type: role.type,
      });

      return acc;
    }, []);

  const permissions = Array.from(
    new Set(
      user.userRoles.flatMap((userRole) =>
        userRole.role?.rolePermissions.map((rolePermission) => rolePermission.permission.slug) ?? [],
      ),
    ),
  );

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    tenantId: user.tenantId,
    roles,
    permissions,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
};

const buildUserWithRolesSelect = () => ({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isActive: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
  userRoles: {
    include: {
      role: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          rolePermissions: {
            select: {
              permission: {
                select: {
                  slug: true,
                },
              },
            },
          },
        },
      },
    },
  },
});

const usersRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', {
    preHandler: [authenticate, tenantContextMiddleware],
  }, async (request, reply) => {
    const tenantId = getTenantId(request);

    const users = await prisma.user.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      select: buildUserWithRolesSelect(),
      orderBy: {
        createdAt: 'desc',
      },
    }) as UserRecord[];

    return reply.send({
      success: true,
      data: users.map(buildSafeUser),
    });
  });

  app.put('/:id', {
    preHandler: [authenticate, tenantContextMiddleware],
    preValidation: validateBody(updateUserSchema),
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = request.params as { id: string };
    const body = request.body as UpdateUserBody;

    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        emailNormalized: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    const updateData: {
      email?: string;
      emailNormalized?: string;
      firstName?: string;
      lastName?: string;
      isActive?: boolean;
    } = {};

    if (typeof body.email === 'string') {
      const email = body.email.trim();
      const emailNormalized = email.toLowerCase();

      if (emailNormalized !== existingUser.emailNormalized) {
        const conflictingUser = await prisma.user.findFirst({
          where: {
            tenantId,
            emailNormalized,
            NOT: {
              id: existingUser.id,
            },
          },
          select: {
            id: true,
          },
        });

        if (conflictingUser) {
          throw new ConflictError('User already exists for this tenant');
        }
      }

      updateData.email = email;
      updateData.emailNormalized = emailNormalized;
    }

    if (typeof body.firstName === 'string') {
      updateData.firstName = body.firstName.trim();
    }

    if (typeof body.lastName === 'string') {
      updateData.lastName = body.lastName.trim();
    }

    if (typeof body.isActive === 'boolean') {
      updateData.isActive = body.isActive;
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: existingUser.id,
      },
      data: updateData,
      select: buildUserWithRolesSelect(),
    }) as UserRecord;

    return reply.send({
      success: true,
      data: buildSafeUser(updatedUser),
      message: 'User updated successfully',
    });
  });

  app.post('/', {
    preHandler: [authenticate, tenantContextMiddleware],
    preValidation: validateBody(createUserSchema),
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const body = request.body as CreateUserBody;
    const email = body.email.trim();
    const emailNormalized = email.toLowerCase();
    const firstName = body.firstName.trim();
    const lastName = (body.lastName ?? '').trim();
    const roleSlug = body.role.trim();

    const existingUser = await prisma.user.findFirst({
      where: {
        tenantId,
        emailNormalized,
      },
    });

    if (existingUser) {
      throw new ConflictError('User already exists for this tenant');
    }

    const role = await prisma.role.findFirst({
      where: {
        tenantId,
        OR: [
          { slug: roleSlug },
          { name: roleSlug },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
      },
    });

    if (!role) {
      throw new ValidationAppError('Role not found for tenant');
    }

    const hashedPassword = await hashPassword(body.password);

    const createdUser = await prisma.user.create({
      data: {
        email,
        emailNormalized,
        password: hashedPassword,
        firstName,
        lastName,
        tenant: {
          connect: {
            id: tenantId,
          },
        },
        userRoles: {
          create: {
            tenant: {
              connect: {
                id: tenantId,
              },
            },
            role: {
              connect: {
                id: role.id,
              },
            },
          },
        },
        isActive: true,
      },
      select: buildUserWithRolesSelect(),
    }) as UserRecord;

    return reply.status(201).send({
      success: true,
      data: buildSafeUser(createdUser),
      message: 'User created successfully',
    });
  });
};

export default usersRoutes;

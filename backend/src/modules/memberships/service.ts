// ============================================
// FINQZ PRO - Memberships Service
// ============================================

import { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { AppError, AuthorizationError, ValidationError } from '../../types';
import { createModuleLogger } from '../../shared/logger';
import type {
  CreateMembershipRequest,
  MembershipListQuery,
  MembershipRole,
  UpdateMembershipRequest,
} from './types';

const logger = createModuleLogger('MembershipsService');

const membershipInclude = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      jobTitle: true,
      isActive: true,
    },
  },
  organization: {
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
      level: true,
      parent: {
        select: { id: true, name: true, code: true },
      },
    },
  },
  invitedBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
} satisfies Prisma.MembershipInclude;

const canManageRole = (actorRole?: string | null): boolean =>
  actorRole === 'owner' || actorRole === 'admin';

const canViewMembership = (
  membershipUserId: string,
  actorUserId: string,
  actorMembershipRole?: string | null,
): boolean =>
  membershipUserId === actorUserId || actorMembershipRole === 'owner' || actorMembershipRole === 'admin' || actorMembershipRole === 'manager';

export class MembershipsService {
  async listMemberships(tenantId: string, query: MembershipListQuery) {
    const where: Prisma.MembershipWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (query.organizationId) where.organizationId = query.organizationId;
    if (query.userId) where.userId = query.userId;
    if (query.role) where.role = query.role;
    if (query.status) where.isActive = query.status === 'active';

    const skip = (query.page - 1) * query.limit;

    const [memberships, total] = await Promise.all([
      prisma.membership.findMany({
        where,
        include: membershipInclude,
        orderBy: { joinedAt: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.membership.count({ where }),
    ]);

    return { memberships, total };
  }

  async listUserMemberships(tenantId: string, userId: string) {
    return prisma.membership.findMany({
      where: {
        tenantId,
        userId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            level: true,
            parent: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });
  }

  async getMembership(
    tenantId: string,
    membershipId: string,
    actorUserId: string,
    actorMembershipRole?: string | null,
  ) {
    const membership = await prisma.membership.findFirst({
      where: {
        id: membershipId,
        tenantId,
        deletedAt: null,
      },
      include: membershipInclude,
    });

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    if (!canViewMembership(membership.userId, actorUserId, actorMembershipRole)) {
      throw new AuthorizationError('Access denied');
    }

    return membership;
  }

  async createMembership(tenantId: string, actorUserId: string, data: CreateMembershipRequest) {
    logger.info(`Creating membership for user ${data.userId} in organization ${data.organizationId}`);

    const [user, organization, actorMembership] = await Promise.all([
      prisma.user.findFirst({
        where: {
          id: data.userId,
          tenantId,
          isActive: true,
          deletedAt: null,
        },
      }),
      prisma.organization.findFirst({
        where: {
          id: data.organizationId,
          tenantId,
          isActive: true,
          deletedAt: null,
        },
      }),
      prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: actorUserId,
            organizationId: data.organizationId,
          },
        },
      }),
    ]);

    if (!user) {
      throw new ValidationError('User not found');
    }

    if (!organization) {
      throw new ValidationError('Organization not found');
    }

    if (!canManageRole(actorMembership?.role)) {
      throw new AuthorizationError('Only organization admins or owners can manage memberships');
    }

    if (data.role === 'owner' && actorMembership?.role !== 'owner') {
      throw new AuthorizationError('Only owners can assign the owner role');
    }

    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: data.userId,
          organizationId: data.organizationId,
        },
      },
    });

    if (existingMembership && !existingMembership.deletedAt) {
      throw new ValidationError('User is already a member of this organization');
    }

    const writeData: Prisma.MembershipUncheckedCreateInput = {
      userId: data.userId,
      organizationId: data.organizationId,
      role: data.role,
      invitedById: actorUserId,
      tenantId,
    };

    if (data.permissions !== undefined) writeData.permissions = data.permissions;

    const membership = existingMembership
      ? await prisma.membership.update({
          where: { id: existingMembership.id },
          data: {
            role: data.role,
            permissions: data.permissions ?? Prisma.JsonNull,
            invitedById: actorUserId,
            invitedAt: new Date(),
            joinedAt: new Date(),
            isActive: true,
            deletedAt: null,
          },
          include: membershipInclude,
        })
      : await prisma.membership.create({
          data: writeData,
          include: membershipInclude,
        });

    if (!user.organizationId) {
      await prisma.user.update({
        where: { id: data.userId },
        data: { organizationId: data.organizationId },
      });
    }

    return membership;
  }

  async updateMembership(
    tenantId: string,
    membershipId: string,
    actorUserId: string,
    actorMembershipRole: string | undefined,
    data: UpdateMembershipRequest,
  ) {
    const currentMembership = await prisma.membership.findFirst({
      where: {
        id: membershipId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!currentMembership) {
      throw new AppError('Membership not found', 404);
    }

    const actorMembership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: actorUserId,
          organizationId: currentMembership.organizationId,
        },
      },
    });

    const actorCanManage = canManageRole(actorMembership?.role ?? actorMembershipRole);
    const isSelfUpdate = currentMembership.userId === actorUserId;
    const changingPrivilegedFields = data.role !== undefined || data.isActive !== undefined;

    if (!actorCanManage && (!isSelfUpdate || changingPrivilegedFields)) {
      throw new AuthorizationError('Access denied');
    }

    if (data.role === 'owner' && actorMembership?.role !== 'owner') {
      throw new AuthorizationError('Only owners can assign the owner role');
    }

    if (currentMembership.role === 'owner' && data.role && data.role !== 'owner') {
      await this.assertAnotherActiveOwner(tenantId, currentMembership.organizationId, currentMembership.id);
    }

    if (currentMembership.role === 'owner' && data.isActive === false) {
      await this.assertAnotherActiveOwner(tenantId, currentMembership.organizationId, currentMembership.id);
    }

    const updateData: Prisma.MembershipUncheckedUpdateInput = {};
    if (data.role !== undefined) updateData.role = data.role;
    if (data.permissions !== undefined) updateData.permissions = data.permissions ?? Prisma.JsonNull;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.membership.update({
      where: { id: membershipId },
      data: updateData,
      include: membershipInclude,
    });
  }

  async deleteMembership(
    tenantId: string,
    membershipId: string,
    actorUserId: string,
    actorMembershipRole?: string,
  ): Promise<void> {
    const membership = await prisma.membership.findFirst({
      where: {
        id: membershipId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    const actorMembership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: actorUserId,
          organizationId: membership.organizationId,
        },
      },
    });

    const actorCanManage = canManageRole(actorMembership?.role ?? actorMembershipRole);
    const isSelfRemoval = membership.userId === actorUserId;

    if (!actorCanManage && !isSelfRemoval) {
      throw new AuthorizationError('Access denied');
    }

    if (membership.role === 'owner') {
      await this.assertAnotherActiveOwner(tenantId, membership.organizationId, membership.id);
    }

    await prisma.membership.update({
      where: { id: membershipId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: membership.userId },
      select: { organizationId: true },
    });

    if (user?.organizationId === membership.organizationId) {
      const replacementMembership = await prisma.membership.findFirst({
        where: {
          userId: membership.userId,
          tenantId,
          isActive: true,
          deletedAt: null,
          organizationId: { not: membership.organizationId },
        },
        orderBy: { joinedAt: 'desc' },
      });

      await prisma.user.update({
        where: { id: membership.userId },
        data: {
          organizationId: replacementMembership?.organizationId ?? null,
        },
      });
    }
  }

  async acceptMembership(tenantId: string, membershipId: string, userId: string) {
    const membership = await prisma.membership.findFirst({
      where: {
        id: membershipId,
        userId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!membership) {
      throw new AppError('Membership invitation not found', 404);
    }

    if (membership.isActive) {
      throw new ValidationError('Membership is already active');
    }

    return prisma.membership.update({
      where: { id: membershipId },
      data: {
        isActive: true,
        joinedAt: new Date(),
      },
      include: membershipInclude,
    });
  }

  private async assertAnotherActiveOwner(
    tenantId: string,
    organizationId: string,
    excludedMembershipId: string,
  ): Promise<void> {
    const ownerCount = await prisma.membership.count({
      where: {
        tenantId,
        organizationId,
        id: { not: excludedMembershipId },
        role: 'owner',
        isActive: true,
        deletedAt: null,
      },
    });

    if (ownerCount === 0) {
      throw new ValidationError('Organization must keep at least one active owner');
    }
  }
}

export const membershipsService = new MembershipsService();

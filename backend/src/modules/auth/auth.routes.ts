import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authController } from './controller';
import { tenantContext } from '../tenant/tenant.middleware';
import { requireRoles } from '../rbac/rbac.guard';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

const validateBody = (schema: any) => async (request: any, reply: any) => {
  const result = schema.safeParse(request.body);
  if (!result.success) {
    reply.status(400).send({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues.map(({ message }: { message: string }) => message),
    });
    return;
  }
  request.body = result.data;
};

export default async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/v1/auth/login', { preValidation: validateBody(loginSchema) }, authController.login);

  app.post('/api/v1/auth/refresh', { preValidation: validateBody(refreshSchema) }, authController.refreshToken);

  app.get('/api/v1/auth/profile', { preHandler: [app.authenticate, tenantContext] }, authController.getProfile);

  app.post('/api/v1/auth/logout', { preHandler: [app.authenticate, tenantContext] }, authController.logout);

  app.post('/api/v1/auth/logout-all', { preHandler: [app.authenticate, tenantContext] }, authController.logoutAll);

  app.patch('/api/v1/auth/change-password', {
    preHandler: [app.authenticate, tenantContext],
    preValidation: validateBody(changePasswordSchema),
  }, authController.changePassword);

  // Example of RBAC protected route using tenant context and role guard
  app.get('/api/v1/auth/admin-check', {
    preHandler: [app.authenticate, tenantContext, requireRoles('admin')],
  }, async (request, reply) => {
    reply.send({
      success: true,
      message: 'RBAC check passed for admin role',
      user: request.currentUser,
      tenant: request.currentTenant,
    });
  });
}


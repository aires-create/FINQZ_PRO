import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authController } from './controller';
import { authenticate, tenantContextMiddleware } from '../../core/http/middleware';
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

export default async function authRoutes(app: any): Promise<void> {
  app.post('/api/v1/auth/login', { preValidation: validateBody(loginSchema) }, authController.login);

  app.post('/api/v1/auth/refresh', { preValidation: validateBody(refreshSchema) }, authController.refreshToken);

  app.get('/api/v1/auth/profile', { preHandler: [authenticate, tenantContextMiddleware] }, authController.getProfile);

  app.post('/api/v1/auth/logout', { preHandler: [authenticate, tenantContextMiddleware] }, authController.logout);

  app.post('/api/v1/auth/logout-all', { preHandler: [authenticate, tenantContextMiddleware] }, authController.logoutAll);

  app.patch('/api/v1/auth/change-password', {
    preHandler: [authenticate, tenantContextMiddleware],
    preValidation: validateBody(changePasswordSchema),
  }, authController.changePassword);

  // Example of RBAC protected route using tenant context and role guard
  app.get('/api/v1/auth/admin-check', {
    preHandler: [authenticate, tenantContextMiddleware, requireRoles('admin')],
  }, async (request: any, reply: any) => {
    reply.send({
      success: true,
      message: 'RBAC check passed for admin role',
      user: request.currentUser,
      tenant: request.currentTenant,
    });
  });
}


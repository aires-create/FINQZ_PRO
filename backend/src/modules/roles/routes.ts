// ============================================
// FINQZ PRO - Roles Routes
// ============================================

import { Router } from 'express';
import Joi from 'joi';
import { rolesController } from './controller.js';
import { validate } from '../../middlewares/validation.js';
import { asyncHandler } from '../../middlewares/errorHandler.js';
import { authenticate, tenantGuard } from '../../middlewares/auth.js';
import { requireAnyPermission } from '../../middlewares/rbac.js';

const router = Router();

// Middleware
router.use(authenticate);
router.use(tenantGuard);

// Validation schemas
const createRoleSchema = Joi.object({
  name: Joi.string().required(),
  slug: Joi.string().required(),
  description: Joi.string().optional(),
  permissions: Joi.array().items(Joi.string()).optional(),
});

const updateRoleSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  permissions: Joi.array().items(Joi.string()).optional(),
});

// Routes
router.post(
  '/',
  requireAnyPermission('role:create'),
  validate(createRoleSchema),
  asyncHandler(rolesController.create.bind(rolesController))
);

router.get(
  '/',
  requireAnyPermission('role:read'),
  asyncHandler(rolesController.list.bind(rolesController))
);

router.get(
  '/:roleId',
  requireAnyPermission('role:read'),
  asyncHandler(rolesController.getById.bind(rolesController))
);

router.patch(
  '/:roleId',
  requireAnyPermission('role:update'),
  validate(updateRoleSchema),
  asyncHandler(rolesController.update.bind(rolesController))
);

router.delete(
  '/:roleId',
  requireAnyPermission('role:delete'),
  asyncHandler(rolesController.delete.bind(rolesController))
);

export default router;

// ============================================
// FINQZ PRO - Permissions Routes
// ============================================

import { Router } from 'express';
import Joi from 'joi';
import { permissionsController } from './controller';
import { validate } from '../../middlewares/validation';
import { asyncHandler } from '../../middlewares/errorHandler';
import { authenticate } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/rbac';

const router = Router();

// Middleware
router.use(authenticate);

// Validation schemas
const createPermissionSchema = Joi.object({
  name: Joi.string().required(),
  slug: Joi.string().required(),
  description: Joi.string().optional(),
  resource: Joi.string().required(),
  action: Joi.string().required(),
});

const updatePermissionSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
});

// Routes
router.post(
  '/',
  requireAdmin,
  validate(createPermissionSchema),
  asyncHandler(permissionsController.create.bind(permissionsController))
);

router.get(
  '/',
  asyncHandler(permissionsController.list.bind(permissionsController))
);

router.get(
  '/resource/:resource',
  asyncHandler(permissionsController.getByResource.bind(permissionsController))
);

router.get(
  '/:permissionId',
  asyncHandler(permissionsController.getById.bind(permissionsController))
);

router.patch(
  '/:permissionId',
  requireAdmin,
  validate(updatePermissionSchema),
  asyncHandler(permissionsController.update.bind(permissionsController))
);

router.delete(
  '/:permissionId',
  requireAdmin,
  asyncHandler(permissionsController.delete.bind(permissionsController))
);

export default router;

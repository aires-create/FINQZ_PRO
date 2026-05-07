// ============================================
// FINQZ PRO - Auth Routes
// ============================================

import { Router } from 'express';
import Joi from 'joi';
import { authController } from './controller';
import { validate } from '../../middlewares/validation';
import { schemas } from '../../middlewares/validation';
import { asyncHandler } from '../../middlewares/errorHandler';
import { authenticate } from '../../middlewares/auth';

const router = Router();

// Public routes
router.post(
  '/login',
  validate(schemas.login),
  asyncHandler(authController.login.bind(authController))
);

router.post(
  '/refresh',
  validate(schemas.refreshToken),
  asyncHandler(authController.refreshToken.bind(authController))
);

// Protected routes
router.use(authenticate);

router.post(
  '/change-password',
  validate(Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required(),
  })),
  asyncHandler(authController.changePassword.bind(authController))
);

router.get(
  '/profile',
  asyncHandler(authController.getProfile.bind(authController))
);

router.post(
  '/logout',
  asyncHandler(authController.logout.bind(authController))
);

export default router;
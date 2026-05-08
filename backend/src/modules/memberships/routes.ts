// ============================================
// FINQZ PRO - Memberships Routes
// ============================================

import { Router } from 'express';
import Joi from 'joi';
import { membershipsController } from './controller';
import { validate, validateParams, validateQuery } from '../../middlewares/validation';
import { asyncHandler } from '../../middlewares/errorHandler';
import { authenticate } from '../../middlewares/auth';
import {
  auditLogger,
  enterpriseTenantGuard,
  organizationAccessGuard,
  roleHierarchyGuard,
} from '../../middlewares/enterprise';

const router = Router();

router.use(authenticate);
router.use(enterpriseTenantGuard);

const idParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const listQuerySchema = Joi.object({
  organizationId: Joi.string().uuid().optional(),
  userId: Joi.string().uuid().optional(),
  role: Joi.string().valid('member', 'manager', 'admin', 'owner').optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const createMembershipSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  organizationId: Joi.string().uuid().required(),
  role: Joi.string().valid('member', 'manager', 'admin', 'owner').required(),
  permissions: Joi.object().unknown(true).optional(),
});

const updateMembershipSchema = Joi.object({
  role: Joi.string().valid('member', 'manager', 'admin', 'owner').optional(),
  permissions: Joi.object().unknown(true).allow(null).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

/**
 * @swagger
 * /api/v1/memberships:
 *   get:
 *     summary: List tenant memberships
 *     tags: [Memberships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Memberships retrieved successfully
 */
router.get(
  '/',
  validateQuery(listQuerySchema),
  roleHierarchyGuard(['membership:read']),
  auditLogger('READ', 'MEMBERSHIP'),
  asyncHandler(membershipsController.list.bind(membershipsController)),
);

/**
 * @swagger
 * /api/v1/memberships/my:
 *   get:
 *     summary: Get current user's memberships
 *     tags: [Memberships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User memberships retrieved successfully
 */
router.get(
  '/my',
  auditLogger('READ', 'MEMBERSHIP'),
  asyncHandler(membershipsController.my.bind(membershipsController)),
);

router.get(
  '/:id',
  validateParams(idParamSchema),
  auditLogger('READ', 'MEMBERSHIP'),
  asyncHandler(membershipsController.getById.bind(membershipsController)),
);

/**
 * @swagger
 * /api/v1/memberships:
 *   post:
 *     summary: Create an organization membership
 *     tags: [Memberships]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMembershipRequest'
 *     responses:
 *       201:
 *         description: Membership created successfully
 */
router.post(
  '/',
  validate(createMembershipSchema),
  organizationAccessGuard(['admin', 'owner']),
  roleHierarchyGuard(['membership:create']),
  auditLogger('CREATE', 'MEMBERSHIP'),
  asyncHandler(membershipsController.create.bind(membershipsController)),
);

router.patch(
  '/:id',
  validateParams(idParamSchema),
  validate(updateMembershipSchema),
  roleHierarchyGuard(['membership:update']),
  auditLogger('UPDATE', 'MEMBERSHIP'),
  asyncHandler(membershipsController.update.bind(membershipsController)),
);

router.delete(
  '/:id',
  validateParams(idParamSchema),
  roleHierarchyGuard(['membership:delete']),
  auditLogger('DELETE', 'MEMBERSHIP'),
  asyncHandler(membershipsController.delete.bind(membershipsController)),
);

router.post(
  '/:id/accept',
  validateParams(idParamSchema),
  auditLogger('UPDATE', 'MEMBERSHIP'),
  asyncHandler(membershipsController.accept.bind(membershipsController)),
);

export default router;

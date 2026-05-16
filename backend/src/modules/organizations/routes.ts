// ============================================
// FINQZ PRO - Organizations Routes
// ============================================

import { Router } from 'express';
import Joi from 'joi';
import { organizationsController } from './controller.js';
import { validate, validateParams, validateQuery } from '../../middlewares/validation.js';
import { asyncHandler } from '../../middlewares/errorHandler.js';
import { authenticate } from '../../middlewares/auth.js';
import {
  auditLogger,
  enterpriseTenantGuard,
  organizationAccessGuard,
  roleHierarchyGuard,
} from '../../middlewares/enterprise.js';

const router = Router();

router.use(authenticate);
router.use(enterpriseTenantGuard);

const idParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const listQuerySchema = Joi.object({
  parentId: Joi.string().uuid().optional(),
  type: Joi.string().valid('department', 'division', 'team', 'unit').optional(),
  level: Joi.number().integer().min(1).optional(),
  search: Joi.string().min(1).max(100).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const createOrganizationSchema = Joi.object({
  name: Joi.string().min(1).max(100).trim().required(),
  code: Joi.string().min(1).max(50).pattern(/^[A-Z0-9_-]+$/i).uppercase().required(),
  description: Joi.string().max(500).trim().optional(),
  type: Joi.string().valid('department', 'division', 'team', 'unit').required(),
  parentId: Joi.string().uuid().optional(),
  settings: Joi.object().unknown(true).optional(),
});

const updateOrganizationSchema = Joi.object({
  name: Joi.string().min(1).max(100).trim().optional(),
  description: Joi.string().max(500).trim().allow(null).optional(),
  type: Joi.string().valid('department', 'division', 'team', 'unit').optional(),
  settings: Joi.object().unknown(true).optional(),
}).min(1);

/**
 * @swagger
 * /api/v1/organizations:
 *   get:
 *     summary: List tenant organizations
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [department, division, team, unit]
 *     responses:
 *       200:
 *         description: Organizations retrieved successfully
 */
router.get(
  '/',
  validateQuery(listQuerySchema),
  auditLogger('READ', 'ORGANIZATION'),
  asyncHandler(organizationsController.list.bind(organizationsController)),
);

/**
 * @swagger
 * /api/v1/organizations/tree:
 *   get:
 *     summary: Get tenant organization hierarchy
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organization tree retrieved successfully
 */
router.get(
  '/tree',
  auditLogger('READ', 'ORGANIZATION'),
  asyncHandler(organizationsController.tree.bind(organizationsController)),
);

/**
 * @swagger
 * /api/v1/organizations/{id}:
 *   get:
 *     summary: Get an organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Organization retrieved successfully
 */
router.get(
  '/:id',
  validateParams(idParamSchema),
  organizationAccessGuard([], false),
  auditLogger('READ', 'ORGANIZATION'),
  asyncHandler(organizationsController.getById.bind(organizationsController)),
);

/**
 * @swagger
 * /api/v1/organizations:
 *   post:
 *     summary: Create an organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrganizationRequest'
 *     responses:
 *       201:
 *         description: Organization created successfully
 */
router.post(
  '/',
  validate(createOrganizationSchema),
  roleHierarchyGuard(['organization:create']),
  auditLogger('CREATE', 'ORGANIZATION'),
  asyncHandler(organizationsController.create.bind(organizationsController)),
);

router.patch(
  '/:id',
  validateParams(idParamSchema),
  validate(updateOrganizationSchema),
  organizationAccessGuard(['admin', 'owner'], false),
  roleHierarchyGuard(['organization:update']),
  auditLogger('UPDATE', 'ORGANIZATION'),
  asyncHandler(organizationsController.update.bind(organizationsController)),
);

router.delete(
  '/:id',
  validateParams(idParamSchema),
  organizationAccessGuard(['admin', 'owner'], false),
  roleHierarchyGuard(['organization:delete']),
  auditLogger('DELETE', 'ORGANIZATION'),
  asyncHandler(organizationsController.delete.bind(organizationsController)),
);

export default router;

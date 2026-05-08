// ============================================
// FINQZ PRO - Validation Utilities
// Enterprise-grade input validation
// ============================================

import { body, param, query, ValidationChain } from 'express-validator';
import { createModuleLogger } from '../shared/logger';

const logger = createModuleLogger('Validation');

/**
 * Common validation rules
 */
export const validationRules = {
  uuid: (field: string): ValidationChain => param(field).isUUID().withMessage(`${field} must be a valid UUID`),

  email: (field: string = 'email'): ValidationChain =>
    body(field).isEmail().normalizeEmail().withMessage('Invalid email format'),

  password: (field: string = 'password'): ValidationChain =>
    body(field)
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),

  name: (field: string, min: number = 1, max: number = 100): ValidationChain =>
    body(field)
      .isLength({ min, max })
      .trim()
      .matches(/^[a-zA-Z\s\-']+$/)
      .withMessage(`${field} must contain only letters, spaces, hyphens and apostrophes`),

  code: (field: string, min: number = 1, max: number = 50): ValidationChain =>
    body(field)
      .isLength({ min, max })
      .matches(/^[A-Z0-9_-]+$/i)
      .withMessage(`${field} must contain only alphanumeric characters, underscores and hyphens`),

  description: (field: string = 'description', max: number = 500): ValidationChain =>
    body(field)
      .optional()
      .isLength({ max })
      .trim()
      .withMessage(`${field} must be less than ${max} characters`),

  phone: (field: string = 'phone'): ValidationChain =>
    body(field)
      .optional()
      .matches(/^[\+]?[1-9][\d]{0,15}$/)
      .withMessage('Invalid phone number format'),

  url: (field: string): ValidationChain =>
    body(field)
      .optional()
      .isURL()
      .withMessage(`Invalid ${field} URL format`),

  json: (field: string): ValidationChain =>
    body(field)
      .optional()
      .custom((value) => {
        try {
          JSON.parse(JSON.stringify(value));
          return true;
        } catch {
          throw new Error(`${field} must be valid JSON`);
        }
      }),

  enum: (field: string, allowedValues: string[]): ValidationChain =>
    body(field)
      .isIn(allowedValues)
      .withMessage(`${field} must be one of: ${allowedValues.join(', ')}`),

  date: (field: string): ValidationChain =>
    body(field)
      .optional()
      .isISO8601()
      .withMessage(`Invalid ${field} date format`),

  positiveInteger: (field: string, min: number = 1, max?: number): ValidationChain => {
    let chain = body(field).isInt({ min }).withMessage(`${field} must be a positive integer`);
    if (max) {
      chain = chain.isInt({ max }).withMessage(`${field} must be less than or equal to ${max}`);
    }
    return chain;
  },

  boolean: (field: string): ValidationChain =>
    body(field)
      .optional()
      .isBoolean()
      .withMessage(`${field} must be a boolean value`),

  array: (field: string, min: number = 0, max?: number): ValidationChain => {
    let chain = body(field)
      .isArray({ min })
      .withMessage(`${field} must be an array with at least ${min} items`);
    if (max) {
      chain = chain.custom((value: any[]) => {
        if (value.length > max) {
          throw new Error(`${field} must have at most ${max} items`);
        }
        return true;
      });
    }
    return chain;
  }
};

/**
 * Organization validation schemas
 */
export const organizationValidators = {
  create: [
    validationRules.name('name'),
    validationRules.code('code'),
    validationRules.description('description'),
    validationRules.enum('type', ['department', 'division', 'team', 'unit']),
    body('parentId').optional().isUUID().withMessage('parentId must be a valid UUID'),
    validationRules.json('settings')
  ],

  update: [
    validationRules.name('name').optional(),
    validationRules.description('description'),
    validationRules.enum('type', ['department', 'division', 'team', 'unit']).optional(),
    validationRules.json('settings').optional()
  ]
};

/**
 * Membership validation schemas
 */
export const membershipValidators = {
  create: [
    body('userId').isUUID().withMessage('userId must be a valid UUID'),
    body('organizationId').isUUID().withMessage('organizationId must be a valid UUID'),
    validationRules.enum('role', ['member', 'admin', 'owner', 'manager']),
    validationRules.json('permissions').optional()
  ],

  update: [
    validationRules.enum('role', ['member', 'admin', 'owner', 'manager']).optional(),
    validationRules.json('permissions').optional(),
    validationRules.boolean('isActive')
  ]
};

/**
 * User validation schemas
 */
export const userValidators = {
  create: [
    validationRules.email(),
    validationRules.password(),
    validationRules.name('firstName'),
    validationRules.name('lastName'),
    validationRules.phone('phone'),
    validationRules.name('department', 0, 100).optional(),
    validationRules.name('jobTitle', 0, 100).optional(),
    body('organizationId').optional().isUUID().withMessage('organizationId must be a valid UUID')
  ],

  update: [
    validationRules.email().optional(),
    validationRules.password().optional(),
    validationRules.name('firstName').optional(),
    validationRules.name('lastName').optional(),
    validationRules.phone('phone').optional(),
    validationRules.name('department', 0, 100).optional(),
    validationRules.name('jobTitle', 0, 100).optional(),
    body('organizationId').optional().isUUID().withMessage('organizationId must be a valid UUID'),
    validationRules.boolean('isActive')
  ]
};

/**
 * Role validation schemas
 */
export const roleValidators = {
  create: [
    validationRules.name('name'),
    validationRules.code('slug'),
    validationRules.description('description'),
    validationRules.enum('type', ['SYSTEM', 'ADMIN', 'MANAGER', 'USER', 'AUDITOR', 'SUPPORT']),
    body('priority').optional().isInt({ min: 0, max: 100 }).withMessage('priority must be between 0 and 100'),
    body('parentId').optional().isUUID().withMessage('parentId must be a valid UUID'),
    validationRules.boolean('isSystem')
  ],

  update: [
    validationRules.name('name').optional(),
    validationRules.code('slug').optional(),
    validationRules.description('description'),
    validationRules.enum('type', ['SYSTEM', 'ADMIN', 'MANAGER', 'USER', 'AUDITOR', 'SUPPORT']).optional(),
    body('priority').optional().isInt({ min: 0, max: 100 }).withMessage('priority must be between 0 and 100'),
    body('parentId').optional().isUUID().withMessage('parentId must be a valid UUID'),
    validationRules.boolean('isSystem').optional()
  ]
};

/**
 * Permission validation schemas
 */
export const permissionValidators = {
  create: [
    validationRules.name('name'),
    validationRules.code('slug'),
    validationRules.name('resource'),
    validationRules.enum('action', ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'VIEW', 'APPROVE', 'ASSIGN', 'REVOKE']),
    validationRules.description('description')
  ],

  update: [
    validationRules.name('name').optional(),
    validationRules.code('slug').optional(),
    validationRules.name('resource').optional(),
    validationRules.enum('action', ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'VIEW', 'APPROVE', 'ASSIGN', 'REVOKE']).optional(),
    validationRules.description('description')
  ]
};

/**
 * Query parameter validation
 */
export const queryValidators = {
  pagination: [
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('limit must be between 1 and 100')
  ],

  search: [
    query('search').optional().isLength({ min: 1, max: 100 }).trim()
  ],

  filters: [
    query('status').optional().isIn(['active', 'inactive']),
    query('type').optional().isString(),
    query('role').optional().isString(),
    query('organizationId').optional().isUUID(),
    query('userId').optional().isUUID()
  ]
};

/**
 * Custom validation middleware
 */
export const validateRequest = (validations: ValidationChain[]) => {
  return async (req: any, res: any, next: any) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation failed', {
        errors: errors.array(),
        body: req.body,
        query: req.query,
        params: req.params
      });

      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    next();
  };
};

/**
 * Sanitization utilities
 */
export const sanitizers = {
  trim: (field: string) => body(field).trim(),
  escape: (field: string) => body(field).escape(),
  normalizeEmail: (field: string) => body(field).normalizeEmail(),
  toLowerCase: (field: string) => body(field).toLowerCase(),
  toUpperCase: (field: string) => body(field).toUpperCase()
};

/**
 * Business rule validations
 */
export const businessValidators = {
  uniqueEmail: async (email: string, tenantId: string, excludeUserId?: string) => {
    const existingUser = await import('../database/prisma').then(({ prisma }) =>
      prisma.user.findFirst({
        where: {
          emailNormalized: email.toLowerCase().trim(),
          tenantId,
          ...(excludeUserId && { id: { not: excludeUserId } })
        }
      })
    );

    if (existingUser) {
      throw new Error('Email already exists in this tenant');
    }
  },

  uniqueOrganizationCode: async (code: string, tenantId: string, excludeOrgId?: string) => {
    const existingOrg = await import('../database/prisma').then(({ prisma }) =>
      prisma.organization.findFirst({
        where: {
          tenantId,
          code,
          ...(excludeOrgId && { id: { not: excludeOrgId } })
        }
      })
    );

    if (existingOrg) {
      throw new Error('Organization code already exists in this tenant');
    }
  },

  validRoleHierarchy: async (roleId: string, parentId: string | null, tenantId: string) => {
    if (!parentId) return; // Root level is valid

    // Prevent circular references
    let currentParentId: string | null = parentId;
    const visited = new Set<string>();

    while (currentParentId) {
      if (visited.has(currentParentId)) {
        throw new Error('Circular role hierarchy detected');
      }

      if (currentParentId === roleId) {
        throw new Error('Role cannot be its own ancestor');
      }

      visited.add(currentParentId);
      const parentLookupId: string = currentParentId;

      const parent: { parentId: string | null } | null = await import('../database/prisma').then(({ prisma }) =>
        prisma.role.findUnique({
          where: { id: parentLookupId },
          select: { parentId: true }
        })
      );

      currentParentId = parent?.parentId || null;
    }
  }
};

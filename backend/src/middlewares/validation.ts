// ============================================
// FINQZ PRO - Validation Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../types';

// Generic validation middleware
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      throw new ValidationError('Validation failed', errors);
    }

    next();
  };
};

// Common validation schemas
export const schemas = {
  // Authentication
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),

  // User management
  createUser: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).required(),
    lastName: Joi.string().min(2).required(),
    phone: Joi.string().optional(),
    roleId: Joi.string().required(),
  }),

  updateUser: Joi.object({
    firstName: Joi.string().min(2).optional(),
    lastName: Joi.string().min(2).optional(),
    phone: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
  }),

  // Lead management
  createLead: Joi.object({
    firstName: Joi.string().min(2).required(),
    lastName: Joi.string().min(2).required(),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    cpf: Joi.string().optional(),
    birthDate: Joi.date().optional(),
    occupation: Joi.string().optional(),
    income: Joi.number().min(0).optional(),
    source: Joi.string().optional(),
    notes: Joi.string().optional(),
    assignedToId: Joi.string().optional(),
  }),

  updateLead: Joi.object({
    firstName: Joi.string().min(2).optional(),
    lastName: Joi.string().min(2).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    cpf: Joi.string().optional(),
    birthDate: Joi.date().optional(),
    occupation: Joi.string().optional(),
    income: Joi.number().min(0).optional(),
    status: Joi.string().valid('prospect', 'contact', 'negotiation', 'converted', 'lost').optional(),
    source: Joi.string().optional(),
    notes: Joi.string().optional(),
    assignedToId: Joi.string().optional(),
  }),

  // Partner management
  createPartner: Joi.object({
    name: Joi.string().min(2).required(),
    type: Joi.string().valid('company', 'franchise', 'partner').required(),
    document: Joi.string().optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
    commissionRates: Joi.object().optional(),
    notes: Joi.string().optional(),
  }),

  updatePartner: Joi.object({
    name: Joi.string().min(2).optional(),
    type: Joi.string().valid('company', 'franchise', 'partner').optional(),
    document: Joi.string().optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
    commissionRates: Joi.object().optional(),
    notes: Joi.string().optional(),
  }),

  // Proposal management
  createProposal: Joi.object({
    title: Joi.string().min(3).required(),
    description: Joi.string().optional(),
    value: Joi.number().min(0).required(),
    leadId: Joi.string().optional(),
    partnerId: Joi.string().optional(),
    validUntil: Joi.date().optional(),
    metadata: Joi.object().optional(),
  }),

  updateProposal: Joi.object({
    title: Joi.string().min(3).optional(),
    description: Joi.string().optional(),
    value: Joi.number().min(0).optional(),
    status: Joi.string().valid('draft', 'sent', 'approved', 'rejected', 'cancelled').optional(),
    validUntil: Joi.date().optional(),
    metadata: Joi.object().optional(),
  }),

  // Commission management
  createCommission: Joi.object({
    partnerId: Joi.string().required(),
    amount: Joi.number().min(0).required(),
    percentage: Joi.number().min(0).max(100).optional(),
    type: Joi.string().valid('sale', 'referral', 'bonus', 'adjustment').required(),
    description: Joi.string().optional(),
    referenceDate: Joi.date().required(),
    dueDate: Joi.date().optional(),
    notes: Joi.string().optional(),
  }),

  updateCommission: Joi.object({
    amount: Joi.number().min(0).optional(),
    percentage: Joi.number().min(0).max(100).optional(),
    status: Joi.string().valid('pending', 'approved', 'paid', 'cancelled').optional(),
    description: Joi.string().optional(),
    dueDate: Joi.date().optional(),
    notes: Joi.string().optional(),
  }),

  // Query parameters
  pagination: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
  }),

  search: Joi.object({
    search: Joi.string().optional(),
    filters: Joi.object().optional(),
  }),
};

// Query parameter validation middleware
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      throw new ValidationError('Query validation failed', errors);
    }

    next();
  };
};

// Params validation middleware
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      throw new ValidationError('Parameter validation failed', errors);
    }

    next();
  };
};
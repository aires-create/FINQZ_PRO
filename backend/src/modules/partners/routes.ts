// ============================================
// FINQZ PRO - Partners Routes
// ============================================

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/errorHandler.js';
import { logger } from '../../shared/logger.js';

const router = Router();

/**
 * GET /api/v1/partners
 * List all partners
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, status } = req.query;

  logger.info('Fetching partners', { page, limit, status });

  res.json({
    success: true,
    message: 'Partners listing endpoint ready',
    data: [],
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: 0,
    },
  });
}));

/**
 * GET /api/v1/partners/:id
 * Get partner by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  logger.info(`Fetching partner: ${id}`);

  res.json({
    success: true,
    message: 'Get partner endpoint ready',
    data: { id },
  });
}));

/**
 * POST /api/v1/partners
 * Create new partner
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { name, type, document, email, phone, companyId } = req.body;

  if (!name || !type || !companyId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
    });
  }

  logger.info(`Creating partner: ${name}`);

  return res.status(201).json({
    success: true,
    message: 'Partner creation endpoint ready',
    data: {
      id: 'new-partner-id',
      code: 'P-0001',
      name,
      type,
      status: 'active',
    },
  });
}));

export default router;
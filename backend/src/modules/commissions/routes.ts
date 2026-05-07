// ============================================
// FINQZ PRO - Commissions Routes
// ============================================

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/errorHandler';
import { logger } from '../../shared/logger';

const router = Router();

/**
 * GET /api/v1/commissions
 * List commissions
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, status, partnerId } = req.query;

  logger.info('Fetching commissions', { page, limit, status, partnerId });

  res.json({
    success: true,
    message: 'Commissions listing endpoint ready',
    data: [],
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: 0,
    },
  });
}));

/**
 * GET /api/v1/commissions/:id
 * Get commission by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  logger.info(`Fetching commission: ${id}`);

  res.json({
    success: true,
    message: 'Get commission endpoint ready',
    data: { id },
  });
}));

/**
 * POST /api/v1/commissions
 * Create commission
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { amount, partnerId, companyId, type } = req.body;

  if (!amount || !partnerId || !companyId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
    });
  }

  logger.info(`Creating commission for partner: ${partnerId}`);

  return res.status(201).json({
    success: true,
    message: 'Commission creation endpoint ready',
    data: {
      id: 'new-commission-id',
      amount,
      type: type || 'sale',
      status: 'pending',
    },
  });
}));

export default router;
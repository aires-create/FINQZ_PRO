// ============================================
// FINQZ PRO - Banking Routes
// ============================================

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/errorHandler';
import { logger } from '../../shared/logger';

const router = Router();

/**
 * GET /api/v1/banking/accounts
 * List banking accounts
 */
router.get('/accounts', asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = req.query;

  logger.info('Fetching banking accounts', { companyId });

  res.json({
    success: true,
    message: 'Banking accounts endpoint ready',
    data: [],
  });
}));

/**
 * GET /api/v1/banking/transactions
 * List banking transactions
 */
router.get('/transactions', asyncHandler(async (req: Request, res: Response) => {
  const { accountId, startDate, endDate } = req.query;

  logger.info('Fetching banking transactions', { accountId, startDate, endDate });

  res.json({
    success: true,
    message: 'Banking transactions endpoint ready',
    data: [],
  });
}));

export default router;
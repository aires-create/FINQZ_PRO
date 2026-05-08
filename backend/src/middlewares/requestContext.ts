// ============================================
// FINQZ PRO - Request Context Middleware
// ============================================

import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

export const requestContext = (req: Request, res: Response, next: NextFunction): void => {
  const inboundRequestId = req.get('X-Request-Id');
  const requestId = inboundRequestId && inboundRequestId.length <= 128 ? inboundRequestId : randomUUID();

  req.requestId = requestId;
  req.correlationId = requestId;
  req.startTime = Date.now();

  res.setHeader('X-Request-Id', requestId);

  next();
};

import { Request, Response, NextFunction } from 'express';

import { AppError } from '../shared/errors/AppError.js';

export function tenantContext(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (!req.user?.tenantId) {
    throw new AppError({
      message: 'Missing tenant context',
      statusCode: 400,
      code: 'BAD_REQUEST',
    });
  }

  req.tenantId = req.user.tenantId;

  next();
}
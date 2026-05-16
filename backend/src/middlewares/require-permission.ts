import { Request, Response, NextFunction } from 'express';

import { AppError } from '../shared/errors/AppError.js';

export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const permissions = req.user?.permissions ?? [];

    if (!permissions.includes(permission)) {
      throw new AppError({
        message: 'Permission denied',
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    }

    next();
  };
}
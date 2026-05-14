import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { AppError } from '../shared/errors/AppError';
import { JwtPayload } from '../types/request-context';

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError({
      message: 'Unauthorized',
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError({
      message: 'Invalid authorization header',
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new AppError({
      message: 'JWT secret not configured',
      statusCode: 500,
      code: 'INTERNAL_ERROR',
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);

    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      !('tenantId' in decoded) ||
      !('userId' in decoded)
    ) {
      throw new AppError({
        message: 'Invalid token payload',
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    req.user = decoded as JwtPayload;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError({
      message: 'Invalid token',
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }
}
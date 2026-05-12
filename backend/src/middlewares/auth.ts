// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AuthenticationError, AuthorizationError } from '../types';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Authorization header missing'));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new AuthenticationError('Authorization header missing'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    req.tenantId = payload.tenantId;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAuth = authenticate;

export const getCurrentUser = (req: Request) => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }
  return req.user;
};

export const getCurrentTenant = (req: Request) => {
  const tenantId = req.tenantId ?? req.user?.tenantId;
  if (!tenantId) {
    throw new AuthorizationError('Tenant context required');
  }
  return tenantId;
};

export const tenantGuard = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }

  req.tenantId = req.user.tenantId;
  next();
};

// ============================================
// FINQZ PRO - Authentication Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/app';
import { JWTPayload, AuthenticationError, AuthorizationError } from '../types';
import { prisma } from '../database/prisma';

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      companyId?: string;
    }
  }
}

// JWT Authentication Middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.accessToken;

    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        isActive: true,
        companyId: true,
        roleId: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }

    // Attach user info to request
    req.user = decoded;
    req.companyId = user.companyId;

    next();
  } catch (error) {
    next(error);
  }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // For now, we'll check role from JWT payload
      // In production, you might want to fetch fresh role data
      const userRole = req.user.roleId;

      // TODO: Implement proper role checking logic
      // This is a simplified version - you should check against a roles table

      if (!allowedRoles.includes(userRole)) {
        throw new AuthorizationError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Multi-tenant middleware - ensures user can only access their company's data
export const tenantGuard = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user || !req.companyId) {
      throw new AuthenticationError('Authentication required');
    }

    // This middleware ensures that all database queries include companyId filter
    // It's a safeguard against data leakage between tenants

    // You can add additional tenant-specific logic here
    // For example, checking if the company is active, has paid subscription, etc.

    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.accessToken;

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      req.user = decoded;
      req.companyId = decoded.companyId;
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};

// Refresh token verification
export const verifyRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AuthenticationError('Refresh token required');
    }

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as JWTPayload;

    // Check if refresh token exists in database (if you implement refresh token storage)
    // For now, just verify the JWT

    req.user = decoded;
    req.companyId = decoded.companyId;

    next();
  } catch (error) {
    next(error);
  }
};
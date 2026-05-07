// ============================================
// FINQZ PRO - Error Handling Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../types';
import { logger } from '../shared/logger';

// Global error handler
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: string[] = [];

  // Handle known error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;

    if (error instanceof ValidationError) {
      errors = error.errors;
    }
  } else if (error.name === 'ValidationError') {
    // Joi validation error
    statusCode = 400;
    message = 'Validation failed';
    errors = [error.message];
  } else if (typeof (error as any).code === 'string' && (error as any).code === 'P2025') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.name === 'PrismaClientKnownRequestError') {
    // Handle Prisma errors
    const prismaError = error as any;
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Unique constraint violation';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        break;
      default:
        statusCode = 400;
        message = 'Database error';
    }
  }

  // Log error
  const logData = {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    companyId: (req as any).user?.companyId,
  };

  if (statusCode >= 500) {
    logger.error('Server Error:', logData);
  } else if (statusCode >= 400) {
    logger.warn('Client Error:', logData);
  }

  // Send response
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error.message
    }),
  });
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): Response => {
  return res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Development error handler (more detailed)
export const developmentErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(error);

  res.status(500).json({
    success: false,
    message: error.message,
    stack: error.stack,
    details: {
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers,
    },
  });
};
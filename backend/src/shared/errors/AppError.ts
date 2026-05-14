export type AppErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: AppErrorCode;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(params: {
    message: string;
    statusCode?: number;
    code?: AppErrorCode;
    details?: unknown;
    isOperational?: boolean;
  }) {
    super(params.message);

    this.name = this.constructor.name;
    this.statusCode = params.statusCode ?? 500;
    this.code = params.code ?? 'INTERNAL_ERROR';
    this.details = params.details;
    this.isOperational = params.isOperational ?? true;

    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: unknown) {
    super({
      message,
      statusCode: 400,
      code: 'BAD_REQUEST',
      details,
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: unknown) {
    super({
      message,
      statusCode: 401,
      code: 'UNAUTHORIZED',
      details,
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details?: unknown) {
    super({
      message,
      statusCode: 403,
      code: 'FORBIDDEN',
      details,
    });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: unknown) {
    super({
      message,
      statusCode: 404,
      code: 'NOT_FOUND',
      details,
    });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', details?: unknown) {
    super({
      message,
      statusCode: 409,
      code: 'CONFLICT',
      details,
    });
  }
}

export class ValidationAppError extends AppError {
  constructor(message = 'Validation error', details?: unknown) {
    super({
      message,
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      details,
    });
  }
}
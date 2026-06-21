import { AppError } from '../../../shared/errors/AppError.js';

export class PartnerTenantRequiredError extends AppError {
  constructor() {
    super({
      message: 'Missing tenant context',
      statusCode: 400,
      code: 'BAD_REQUEST',
    });
  }
}

export class PartnerNotFoundError extends AppError {
  constructor(identifier: string) {
    super({
      message: `Partner not found: ${identifier}`,
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  }
}

export class PartnerCodeAlreadyExistsError extends AppError {
  constructor(code: string) {
    super({
      message: `Partner code already exists: ${code}`,
      statusCode: 409,
      code: 'CONFLICT',
    });
  }
}

export class PartnerParentNotFoundError extends AppError {
  constructor(parentId: string) {
    super({
      message: `Partner parent not found: ${parentId}`,
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  }
}

export class PartnerHierarchyDepthExceededError extends AppError {
  constructor() {
    super({
      message: 'Partner hierarchy depth cannot exceed 3 levels',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  }
}

export class PartnerHierarchyCycleError extends AppError {
  constructor() {
    super({
      message: 'Partner hierarchy cycle detected',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  }
}

export class PartnerInvalidStatusError extends AppError {
  constructor(status: string) {
    super({
      message: `Invalid partner status: ${status}`,
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  }
}

export class PartnerInvalidHierarchyError extends AppError {
  constructor(message: string) {
    super({
      message,
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  }
}

export class PartnerSoftDeleteBlockedByChildrenError extends AppError {
  constructor() {
    super({
      message: 'Cannot delete partner with active children',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  }
}

export class EdpDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EdpDomainError';
  }
}

export class EdpContractViolationError extends EdpDomainError {
  constructor(message: string) {
    super(message);
    this.name = 'EdpContractViolationError';
  }
}

export class EdpRepositoryNotFoundError extends EdpDomainError {
  constructor(aggregateType: string, aggregateId: string) {
    super(`${aggregateType} ${aggregateId} was not found`);
    this.name = 'EdpRepositoryNotFoundError';
  }
}

export class EdpDuplicateVersionError extends EdpDomainError {
  constructor(aggregateType: string, aggregateId: string, version: number) {
    super(`Duplicate ${aggregateType} version ${version} for ${aggregateId}`);
    this.name = 'EdpDuplicateVersionError';
  }
}

export class EdpIdempotencyConflictError extends EdpDomainError {
  constructor(idempotencyKey: string) {
    super(`Idempotency conflict for ${idempotencyKey}`);
    this.name = 'EdpIdempotencyConflictError';
  }
}


import { CommercialRequestStatus } from '../enums/commercial-request-status.enum.js';

export class CommercialRequestDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CommercialRequestDomainError';
  }
}

export class InvalidCommercialRequestTransitionError extends CommercialRequestDomainError {
  readonly from: CommercialRequestStatus;
  readonly to: CommercialRequestStatus;

  constructor(from: CommercialRequestStatus, to: CommercialRequestStatus) {
    super(`Invalid commercial request transition: ${from} -> ${to}`);
    this.name = 'InvalidCommercialRequestTransitionError';
    this.from = from;
    this.to = to;
  }
}

export class CommercialRequestAlreadyClosedError extends CommercialRequestDomainError {
  constructor() {
    super('Commercial request is already closed');
    this.name = 'CommercialRequestAlreadyClosedError';
  }
}

export class CommercialRequestNotSubmittedError extends CommercialRequestDomainError {
  readonly currentStatus: CommercialRequestStatus;

  constructor(currentStatus: CommercialRequestStatus) {
    super(
      `Commercial request must be Submitted to continue. Current status: ${currentStatus}`,
    );
    this.name = 'CommercialRequestNotSubmittedError';
    this.currentStatus = currentStatus;
  }
}

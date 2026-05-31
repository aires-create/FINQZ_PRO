import type { CommercialRequest } from './commercial-request.contract.js';
import type { CommercialRequestStatus } from '../enums/commercial-request-status.enum.js';

export type CreateCommercialRequestInput = {
  tenantId: string;
  requestedByUserId: string;
  reason: string;
  justification: string;
};

export type CreateCommercialRequestPersistenceInput = {
  tenantId: string;
  requestNumber: string;
  year: number;
  sequence: number;
  status: CommercialRequestStatus;
  requestedByUserId: string;
  reason: string;
  justification: string;
  requestedAt: string;
};

export type CreateCommercialRequestResult = CommercialRequest;

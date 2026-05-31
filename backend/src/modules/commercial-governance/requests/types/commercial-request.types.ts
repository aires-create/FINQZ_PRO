import type { CommercialRequestStatus } from '../enums/commercial-request-status.enum.js';

export type CommercialRequestId = string;

export type CommercialRequest = {
  id: CommercialRequestId;
  tenantId: string;
  requestNumber: string;
  status: CommercialRequestStatus;
  requestedByUserId: string;
  requestedAt: string;
  reason: string;
  justification: string;
  createdAt: string;
  updatedAt: string;
};

export type CommercialRequestListFilters = {
  status?: CommercialRequestStatus;
  requestedByUserId?: string;
  fromRequestedAt?: string;
  toRequestedAt?: string;
  search?: string;
};

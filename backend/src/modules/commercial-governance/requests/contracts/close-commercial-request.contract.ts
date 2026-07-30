import type { CommercialRequest } from './commercial-request.contract.js';

export type CloseCommercialRequestInput = {
  tenantId: string;
  requestId: string;
  closedByUserId: string;
  closedAt?: string;
};

export type CloseCommercialRequestResult = CommercialRequest;

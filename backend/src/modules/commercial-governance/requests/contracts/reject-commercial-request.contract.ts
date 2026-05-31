import type { CommercialRequest } from './commercial-request.contract.js';

export type RejectCommercialRequestInput = {
  tenantId: string;
  requestId: string;
  rejectedByUserId: string;
  rejectedAt?: string;
};

export type RejectCommercialRequestResult = CommercialRequest;

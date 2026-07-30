import type { CommercialRequest } from './commercial-request.contract.js';

export type SubmitCommercialRequestInput = {
  tenantId: string;
  requestId: string;
  submittedByUserId: string;
  submittedAt?: string;
};

export type SubmitCommercialRequestResult = CommercialRequest;

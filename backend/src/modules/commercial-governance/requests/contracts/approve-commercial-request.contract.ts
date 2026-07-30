import type { CommercialRequest } from './commercial-request.contract.js';

export type ApproveCommercialRequestInput = {
  tenantId: string;
  requestId: string;
  approvedByUserId: string;
  approvedAt?: string;
};

export type ApproveCommercialRequestResult = CommercialRequest;

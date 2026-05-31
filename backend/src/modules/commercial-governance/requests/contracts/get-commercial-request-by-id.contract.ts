import type { CommercialRequest } from './commercial-request.contract.js';

export type GetCommercialRequestByIdInput = {
  tenantId: string;
  requestId: string;
};

export type GetCommercialRequestByIdResult = CommercialRequest | null;

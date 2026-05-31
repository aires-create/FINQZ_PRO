import type { CommercialRequest, CommercialRequestListFilters } from '../types/commercial-request.types.js';

export type ListCommercialRequestsInput = {
  tenantId: string;
  filters?: CommercialRequestListFilters;
  page?: number;
  pageSize?: number;
};

export type ListCommercialRequestsResult = {
  items: CommercialRequest[];
  total: number;
  page: number;
  pageSize: number;
};

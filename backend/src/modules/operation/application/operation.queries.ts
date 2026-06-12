// ARCH-023 to ARCH-026: query contracts only, no handlers or execution logic.
export interface GetOperationByIdQuery {
  tenantId: string;
  operationId: string;
}

export interface GetOperationByNumberQuery {
  tenantId: string;
  operationNumber: string;
}

export interface ListOperationsQuery {
  tenantId: string;
  page?: number;
  limit?: number;
  status?: string;
  opportunityId?: string;
  bankProposalId?: string;
  createdById?: string;
  search?: string;
}

export interface GetOperationTimelineQuery {
  tenantId: string;
  operationId: string;
}

export interface GetOperationSummaryQuery {
  tenantId: string;
  operationId: string;
}

export interface GetOperationFinancialSummaryQuery {
  tenantId: string;
  operationId: string;
}


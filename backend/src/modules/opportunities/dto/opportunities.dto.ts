export interface ListOpportunitiesQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  pipelineId?: string;
  stageId?: string;
  customerId?: string;
  ownerId?: string;
}

export interface CreateOpportunityBodyDto {
  title: string;
  amount: number;
  pipelineId: string;
  stageId: string;
  customerId?: string | null;
  leadId?: string | null;
  ownerId?: string | null;
  description?: string | null;
  probability?: number;
  currency?: string;
  expectedCloseDate?: string | Date | null;
}

export interface UpdateOpportunityBodyDto {
  title?: string;
  description?: string | null;
  amount?: number;
  probability?: number;
  status?: string;
  expectedCloseDate?: string | Date | null;
  ownerId?: string | null;
  customerId?: string | null;
  leadId?: string | null;
}

export interface MoveOpportunityStageBodyDto {
  stageId: string;
  pipelineId?: string;
  status?: string;
  reason?: string | null;
}


import { apiCall, buildQueryString } from './base';

const OPPORTUNITIES_BASE_PATH = '/api/v1/opportunities';

export interface Opportunity {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  currency: string;
  probability: number;
  status: string;
  expectedCloseDate?: string | null;
  actualCloseDate?: string | null;
  tenantId: string;
  partnerId?: string | null;
  leadId?: string | null;
  customerId?: string | null;
  pipelineId: string;
  stageId: string;
  ownerId?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: OpportunityCustomer | null;
}

export interface OpportunityCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
}

export interface ListOpportunitiesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  pipelineId?: string;
  stageId?: string;
  customerId?: string;
  ownerId?: string;
}

export interface CreateOpportunityPayload {
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

export interface UpdateOpportunityPayload {
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

export interface MoveOpportunityStagePayload {
  stageId: string;
  pipelineId?: string;
  status?: string;
  reason?: string | null;
}

export interface CreateOpportunityIntakeCustomerPayload {
  id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  cpfCnpj?: string | null;
  phone?: string | null;
  birthDate?: string | Date | null;
  documentType?: string | null;
  address?: Record<string, unknown> | null;
  bankData?: Record<string, unknown> | null;
  profession?: string | null;
  maritalStatus?: string | null;
  gender?: string | null;
}

export interface CreateOpportunityIntakePayload {
  customer: CreateOpportunityIntakeCustomerPayload;
  opportunity: {
    title: string;
    amount: number;
    pipelineId: string;
    stageId: string;
    ownerId?: string | null;
    description?: string | null;
  };
  options?: {
    allowCreateCustomer?: boolean;
    updateExistingCustomer?: boolean;
  };
}

export interface OpportunityIntakeResponse {
  success: boolean;
  message: string;
  data: {
    customer: {
      id: string;
      status: 'linked_existing' | 'created';
    };
    opportunity: {
      id: string;
      customerId: string;
      pipelineId: string;
      stageId: string;
    };
  };
}

export interface ListOpportunitiesResponse {
  success: boolean;
  data: Opportunity[];
  total: number;
  page: number;
  limit: number;
}

export interface OpportunityResponse {
  success: boolean;
  data: Opportunity;
}

export interface OpportunityMutationResponse {
  success: boolean;
  message: string;
  data: Opportunity | { id: string };
}

export const opportunitiesApi = {
  async getAll(params?: ListOpportunitiesParams): Promise<ListOpportunitiesResponse> {
    const query = params ? buildQueryString(params as Record<string, unknown>) : '';
    return apiCall<ListOpportunitiesResponse>(`${OPPORTUNITIES_BASE_PATH}${query}`);
  },

  async getById(id: string): Promise<OpportunityResponse> {
    return apiCall<OpportunityResponse>(`${OPPORTUNITIES_BASE_PATH}/${id}`);
  },

  async create(payload: CreateOpportunityPayload): Promise<OpportunityMutationResponse> {
    return apiCall<OpportunityMutationResponse>(OPPORTUNITIES_BASE_PATH, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createIntake(payload: CreateOpportunityIntakePayload): Promise<OpportunityIntakeResponse> {
    return apiCall<OpportunityIntakeResponse>(`${OPPORTUNITIES_BASE_PATH}/intake`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async update(id: string, payload: UpdateOpportunityPayload): Promise<OpportunityMutationResponse> {
    return apiCall<OpportunityMutationResponse>(`${OPPORTUNITIES_BASE_PATH}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async moveStage(
    id: string,
    payload: MoveOpportunityStagePayload,
  ): Promise<OpportunityMutationResponse> {
    return apiCall<OpportunityMutationResponse>(`${OPPORTUNITIES_BASE_PATH}/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async delete(id: string): Promise<OpportunityMutationResponse> {
    return apiCall<OpportunityMutationResponse>(`${OPPORTUNITIES_BASE_PATH}/${id}`, {
      method: 'DELETE',
    });
  },
};

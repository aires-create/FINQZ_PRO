// FINQZ PRO - Partners API Module
// Wrapper fino para o backend oficial de partners

import { apiCall, buildQueryString } from './base';

const PARTNERS_BASE_PATH = '/api/v1/partners';

export type PartnerType = 'COMPANY' | 'FRANQUIA' | 'FRANQUEADO';

export type PartnerStatus = 'prospect' | 'contato' | 'negociacao' | 'ativo' | 'inativo';

export interface PartnerCorePayload {
  code: string;
  name: string;
  type: PartnerType;
  status: PartnerStatus;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  parentId?: string | null;
}

export interface PartnerRecord extends PartnerCorePayload {
  id: string;
  tenantId: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListPartnersParams {
  page?: number;
  limit?: number;
  status?: PartnerStatus;
  parentId?: string;
  search?: string;
}

export interface ListPartnersResponse {
  success: boolean;
  data: PartnerRecord[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PartnerResponse {
  success: boolean;
  data: PartnerRecord;
}

export interface PartnerMutationResponse {
  success: boolean;
  message?: string;
  data?: PartnerRecord | { id: string };
}

export const partnersApi = {
  async getAll(params?: ListPartnersParams): Promise<ListPartnersResponse> {
    const query = params ? buildQueryString(params as Record<string, unknown>) : '';
    return apiCall<ListPartnersResponse>(`${PARTNERS_BASE_PATH}${query}`);
  },

  async getById(id: string): Promise<PartnerResponse> {
    return apiCall<PartnerResponse>(`${PARTNERS_BASE_PATH}/${id}`);
  },

  async create(payload: PartnerCorePayload): Promise<PartnerMutationResponse> {
    return apiCall<PartnerMutationResponse>(PARTNERS_BASE_PATH, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async update(id: string, payload: Partial<PartnerCorePayload>): Promise<PartnerMutationResponse> {
    return apiCall<PartnerMutationResponse>(`${PARTNERS_BASE_PATH}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async delete(id: string): Promise<PartnerMutationResponse> {
    return apiCall<PartnerMutationResponse>(`${PARTNERS_BASE_PATH}/${id}`, {
      method: 'DELETE',
    });
  },
};

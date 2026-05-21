// FINQZ PRO - Commercial API Module
// Endpoints para tabelas comerciais em /api/v1/commercial

import { apiFetch, buildQueryString } from "../http";

const COMMERCIAL_BASE_PATH = "/api/v1/commercial";

type CommercialApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

export interface CommercialTableFilters {
  search?: string;
  providerId?: string;
  providerType?: string;
  productId?: string;
  subproductId?: string;
  modality?: string;
  active?: boolean;
}

export interface CommercialConditionPayload {
  minTerm: number;
  maxTerm: number;
  term: number;
  monthlyRate: number;
  cetRate: number;
  coefficient: number;
  flatCommission: number;
  bonusCommission: number;
  advanceCommission: number;
  commissionRate?: number;
  minAmount: number;
  maxAmount: number;
  minAge?: number;
  maxAge?: number;
  minConsumption?: number;
  maxConsumption?: number;
  tariffKwh?: number;
  savingsPercent?: number;
  estimatedValue?: number;
  contractTerm?: number;
  earlyTerminationFee?: number;
  campaignName?: string | null;
  notes?: string | null;
  active?: boolean;
}

export interface CommercialTablePayload {
  providerId: string;
  providerCode: string;
  providerName: string;
  providerType: string;
  productId: string;
  productCode: string;
  productName: string;
  subproductId: string;
  subproductCode: string;
  subproductName: string;
  modality: string;
  modalityLabel: string;
  name: string;
  code: string;
  active?: boolean;
  startDate?: string | number | Date | null;
  endDate?: string | number | Date | null;
  energyType?: string | null;
  customerType?: string | null;
  distributionCompany?: string | null;
  region?: string | null;
}

export interface CreateCommercialTablePayload extends CommercialTablePayload {
  conditions?: CommercialConditionPayload[];
}

export interface UpdateCommercialTablePayload extends Partial<CommercialTablePayload> {
  conditions?: CommercialConditionPayload[];
}

export interface CommercialConditionResponseDto {
  id: string;
  commercialTableId: string;
  minTerm: number;
  maxTerm: number;
  term: number;
  monthlyRate: number;
  cetRate: number;
  coefficient: number;
  flatCommission: number;
  bonusCommission: number;
  advanceCommission: number;
  totalCommission: number;
  commissionRate: number;
  minAmount: number;
  maxAmount: number;
  minAge: number | null;
  maxAge: number | null;
  minConsumption: number | null;
  maxConsumption: number | null;
  tariffKwh: number | null;
  savingsPercent: number | null;
  estimatedValue: number | null;
  contractTerm: number | null;
  earlyTerminationFee: number | null;
  campaignName: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommercialTableResponseDto {
  id: string;
  providerId: string;
  providerCode: string;
  providerName: string;
  providerType: string;
  productId: string;
  productCode: string;
  productName: string;
  subproductId: string;
  subproductCode: string;
  subproductName: string;
  modality: string;
  modalityLabel: string;
  name: string;
  code: string;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
  energyType: string | null;
  customerType: string | null;
  distributionCompany: string | null;
  region: string | null;
  createdAt: string;
  updatedAt: string;
  conditions: CommercialConditionResponseDto[];
}

const unwrapCommercialResponse = <T>(
  payload: CommercialApiEnvelope<T>,
  fallbackMessage: string,
): T => {
  if (!payload.success || payload.data === undefined) {
    throw new Error(payload.error?.message || payload.message || fallbackMessage);
  }

  return payload.data;
};

const requestCommercial = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const payload = await apiFetch<CommercialApiEnvelope<T>>(endpoint, {
    ...options,
    preserveApiPrefix: true,
  });

  return unwrapCommercialResponse(payload, "Erro ao acessar tabelas comerciais");
};

export const commercialApi = {
  async listTables(filters?: CommercialTableFilters): Promise<CommercialTableResponseDto[]> {
    const query = filters ? buildQueryString(filters as Record<string, unknown>) : "";
    return requestCommercial<CommercialTableResponseDto[]>(
      `${COMMERCIAL_BASE_PATH}/tables${query}`,
    );
  },

  async getTableById(id: string): Promise<CommercialTableResponseDto> {
    return requestCommercial<CommercialTableResponseDto>(
      `${COMMERCIAL_BASE_PATH}/tables/${id}`,
    );
  },

  async createTable(
    data: CreateCommercialTablePayload,
  ): Promise<CommercialTableResponseDto> {
    return requestCommercial<CommercialTableResponseDto>(
      `${COMMERCIAL_BASE_PATH}/tables`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  },

  async updateTable(
    id: string,
    data: UpdateCommercialTablePayload,
  ): Promise<CommercialTableResponseDto> {
    return requestCommercial<CommercialTableResponseDto>(
      `${COMMERCIAL_BASE_PATH}/tables/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );
  },

  async deleteTable(id: string): Promise<void> {
    const payload = await apiFetch<CommercialApiEnvelope<unknown>>(`${COMMERCIAL_BASE_PATH}/tables/${id}`, {
      method: "DELETE",
      preserveApiPrefix: true,
    });

    if (!payload.success) {
      throw new Error(payload.error?.message || payload.message || "Erro ao excluir tabela comercial");
    }
  },

  async replaceConditions(
    id: string,
    conditions: CommercialConditionPayload[],
  ): Promise<CommercialTableResponseDto> {
    return requestCommercial<CommercialTableResponseDto>(
      `${COMMERCIAL_BASE_PATH}/tables/${id}/conditions`,
      {
        method: "PUT",
        body: JSON.stringify({ conditions }),
      },
    );
  },
};

// FINQZ PRO - Master Catalog API Module
// Consumidor frontend read-only do catálogo mestre.

import { apiFetch, buildQueryString } from "../http";

const MASTER_CATALOG_BASE_PATH = "/api/v1/master-catalog";

type MasterCatalogApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

export type MasterCatalogStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface MasterCatalogListFilters {
  status?: MasterCatalogStatus;
  search?: string;
}

export interface MasterCatalogModalityDto {
  id: string;
  code: string;
  name: string;
  status: MasterCatalogStatus;
  displayOrder: number;
}

export interface MasterCatalogSubproductDto {
  id: string;
  code: string;
  name: string;
  status: MasterCatalogStatus;
  displayOrder: number;
  modalities: MasterCatalogModalityDto[];
}

export interface MasterCatalogProductDto {
  id: string;
  code: string;
  name: string;
  status: MasterCatalogStatus;
  displayOrder: number;
  subproducts: MasterCatalogSubproductDto[];
}

export interface MasterCatalogSegmentDto {
  id: string;
  code: string;
  name: string;
  status: MasterCatalogStatus;
  displayOrder: number;
}

export interface MasterCatalogTreeDto {
  segments: MasterCatalogSegmentDto[];
  products: MasterCatalogProductDto[];
}

const unwrapMasterCatalogResponse = <T>(
  payload: MasterCatalogApiEnvelope<T>,
  fallbackMessage: string,
): T => {
  if (!payload.success || payload.data === undefined) {
    throw new Error(payload.error?.message || payload.message || fallbackMessage);
  }

  return payload.data;
};

const requestMasterCatalog = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const payload = await apiFetch<MasterCatalogApiEnvelope<T>>(endpoint, {
    ...options,
    preserveApiPrefix: true,
  });

  return unwrapMasterCatalogResponse(payload, "Erro ao acessar catálogo mestre");
};

export const masterCatalogApi = {
  async getCatalogTree(
    filters?: MasterCatalogListFilters,
  ): Promise<MasterCatalogTreeDto> {
    const query = filters ? buildQueryString(filters as Record<string, unknown>) : "";
    return requestMasterCatalog<MasterCatalogTreeDto>(
      `${MASTER_CATALOG_BASE_PATH}/tree${query}`,
    );
  },

  async listProducts(
    filters?: MasterCatalogListFilters,
  ): Promise<MasterCatalogProductDto[]> {
    const query = filters ? buildQueryString(filters as Record<string, unknown>) : "";
    return requestMasterCatalog<MasterCatalogProductDto[]>(
      `${MASTER_CATALOG_BASE_PATH}/products${query}`,
    );
  },

  async listSubproductsByProduct(
    productId: string,
    filters?: MasterCatalogListFilters,
  ): Promise<MasterCatalogSubproductDto[]> {
    const query = filters ? buildQueryString(filters as Record<string, unknown>) : "";
    return requestMasterCatalog<MasterCatalogSubproductDto[]>(
      `${MASTER_CATALOG_BASE_PATH}/products/${productId}/subproducts${query}`,
    );
  },

  async listModalitiesBySubproduct(
    subproductId: string,
    filters?: MasterCatalogListFilters,
  ): Promise<MasterCatalogModalityDto[]> {
    const query = filters ? buildQueryString(filters as Record<string, unknown>) : "";
    return requestMasterCatalog<MasterCatalogModalityDto[]>(
      `${MASTER_CATALOG_BASE_PATH}/subproducts/${subproductId}/modalities${query}`,
    );
  },
};

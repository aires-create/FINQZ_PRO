import type { CatalogStatus } from './master-catalog.contract.js';
import type {
  CatalogModalityReadModel,
  CatalogProductReadModel,
  CatalogSegmentReadModel,
  CatalogSubproductReadModel,
  MasterCatalogTreeReadModel,
} from './master-catalog.read-model.js';

export interface ListCatalogSegmentsInput {
  tenantId: string;
  status?: CatalogStatus;
  search?: string;
}

export interface ListCatalogProductsInput {
  tenantId: string;
  status?: CatalogStatus;
  search?: string;
}

export interface ListCatalogSubproductsByProductInput {
  tenantId: string;
  productId: string;
  status?: CatalogStatus;
  search?: string;
}

export interface ListCatalogModalitiesBySubproductInput {
  tenantId: string;
  subproductId: string;
  status?: CatalogStatus;
  search?: string;
}

export interface GetMasterCatalogTreeInput {
  tenantId: string;
  status?: CatalogStatus;
  search?: string;
}

export interface FindCatalogProductByCodeInput {
  tenantId: string;
  code: string;
  status?: CatalogStatus;
}

export interface FindCatalogSubproductByCodeInput {
  tenantId: string;
  productId: string;
  code: string;
  status?: CatalogStatus;
}

export interface FindCatalogModalityByCodeInput {
  tenantId: string;
  subproductId: string;
  code: string;
  status?: CatalogStatus;
}

export interface MasterCatalogRepository {
  listSegments(
    input: ListCatalogSegmentsInput,
  ): Promise<CatalogSegmentReadModel[]>;
  listProducts(
    input: ListCatalogProductsInput,
  ): Promise<CatalogProductReadModel[]>;
  listSubproductsByProduct(
    input: ListCatalogSubproductsByProductInput,
  ): Promise<CatalogSubproductReadModel[]>;
  listModalitiesBySubproduct(
    input: ListCatalogModalitiesBySubproductInput,
  ): Promise<CatalogModalityReadModel[]>;
  getCatalogTree(
    input: GetMasterCatalogTreeInput,
  ): Promise<MasterCatalogTreeReadModel>;
  findProductByCode(
    input: FindCatalogProductByCodeInput,
  ): Promise<CatalogProductReadModel | null>;
  findSubproductByCode(
    input: FindCatalogSubproductByCodeInput,
  ): Promise<CatalogSubproductReadModel | null>;
  findModalityByCode(
    input: FindCatalogModalityByCodeInput,
  ): Promise<CatalogModalityReadModel | null>;
}

import type { CatalogStatus } from '../domain/master-catalog.contract.js';
import type {
  CatalogModalityReadModel,
  CatalogProductReadModel,
  CatalogSegmentReadModel,
  CatalogSubproductReadModel,
  MasterCatalogTreeReadModel,
} from '../domain/master-catalog.read-model.js';

// H-10D: service contract only, no runtime implementation or side effects.
export interface ListMasterCatalogSegmentsInput {
  tenantId: string;
  status?: CatalogStatus;
  search?: string;
}

export interface ListMasterCatalogProductsInput {
  tenantId: string;
  status?: CatalogStatus;
  search?: string;
}

export interface ListMasterCatalogSubproductsByProductInput {
  tenantId: string;
  productId: string;
  status?: CatalogStatus;
  search?: string;
}

export interface ListMasterCatalogModalitiesBySubproductInput {
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

export interface FindMasterCatalogProductByCodeInput {
  tenantId: string;
  code: string;
  status?: CatalogStatus;
}

export interface FindMasterCatalogSubproductByCodeInput {
  tenantId: string;
  productId: string;
  code: string;
  status?: CatalogStatus;
}

export interface FindMasterCatalogModalityByCodeInput {
  tenantId: string;
  subproductId: string;
  code: string;
  status?: CatalogStatus;
}

export interface MasterCatalogServiceContract {
  listSegments(
    input: ListMasterCatalogSegmentsInput,
  ): Promise<CatalogSegmentReadModel[]>;

  listProducts(
    input: ListMasterCatalogProductsInput,
  ): Promise<CatalogProductReadModel[]>;

  listSubproductsByProduct(
    input: ListMasterCatalogSubproductsByProductInput,
  ): Promise<CatalogSubproductReadModel[]>;

  listModalitiesBySubproduct(
    input: ListMasterCatalogModalitiesBySubproductInput,
  ): Promise<CatalogModalityReadModel[]>;

  getCatalogTree(
    input: GetMasterCatalogTreeInput,
  ): Promise<MasterCatalogTreeReadModel>;

  findProductByCode(
    input: FindMasterCatalogProductByCodeInput,
  ): Promise<CatalogProductReadModel | null>;

  findSubproductByCode(
    input: FindMasterCatalogSubproductByCodeInput,
  ): Promise<CatalogSubproductReadModel | null>;

  findModalityByCode(
    input: FindMasterCatalogModalityByCodeInput,
  ): Promise<CatalogModalityReadModel | null>;
}

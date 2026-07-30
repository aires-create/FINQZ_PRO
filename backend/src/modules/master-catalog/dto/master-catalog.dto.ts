import type {
  CatalogModalityReadModel,
  CatalogProductReadModel,
  CatalogSegmentReadModel,
  CatalogSubproductReadModel,
  MasterCatalogTreeReadModel,
} from '../domain/master-catalog.read-model.js';

export const MASTER_CATALOG_RUNTIME_VERSION = '3.1.0' as const;

export type MasterCatalogCompatibilityMode =
  | 'CANONICAL'
  | 'COMPATIBILITY'
  | 'LEGACY'
  | 'TRANSIENT';

export interface CatalogModalityDto extends CatalogModalityReadModel {}

export interface CatalogSubproductDto extends CatalogSubproductReadModel {
  modalities: CatalogModalityDto[];
}

export interface CatalogProductDto extends CatalogProductReadModel {
  subproducts: CatalogSubproductDto[];
}

export interface CatalogSegmentDto extends CatalogSegmentReadModel {}

export interface MasterCatalogTreeDto {
  segments: CatalogSegmentDto[];
  products: CatalogProductDto[];
}

export interface MasterCatalogRuntimeMetadataDto {
  version: typeof MASTER_CATALOG_RUNTIME_VERSION;
  compatibilityMode: MasterCatalogCompatibilityMode;
  source: 'backend/master-catalog';
}

export const toCatalogModalityDto = (
  modality: CatalogModalityReadModel,
): CatalogModalityDto => ({
  ...modality,
});

export const toCatalogSubproductDto = (
  subproduct: CatalogSubproductReadModel,
): CatalogSubproductDto => ({
  ...subproduct,
  modalities: subproduct.modalities.map(toCatalogModalityDto),
});

export const toCatalogProductDto = (
  product: CatalogProductReadModel,
): CatalogProductDto => ({
  ...product,
  subproducts: product.subproducts.map(toCatalogSubproductDto),
});

export const toCatalogSegmentDto = (
  segment: CatalogSegmentReadModel,
): CatalogSegmentDto => ({
  ...segment,
});

export const toMasterCatalogTreeDto = (
  tree: MasterCatalogTreeReadModel,
): MasterCatalogTreeDto => ({
  segments: tree.segments.map(toCatalogSegmentDto),
  products: tree.products.map(toCatalogProductDto),
});

export const createMasterCatalogRuntimeMetadata = (
  compatibilityMode: MasterCatalogCompatibilityMode = 'CANONICAL',
): MasterCatalogRuntimeMetadataDto => ({
  version: MASTER_CATALOG_RUNTIME_VERSION,
  compatibilityMode,
  source: 'backend/master-catalog',
});

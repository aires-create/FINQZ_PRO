import type {
  CatalogModality,
  CatalogProduct,
  CatalogSegment,
  CatalogStatus,
  CatalogSubproduct,
} from './master-catalog.contract.js';

export interface CatalogModalityReadModel {
  id: CatalogModality['id'];
  code: CatalogModality['code'];
  name: CatalogModality['name'];
  status: CatalogStatus;
  displayOrder: CatalogModality['displayOrder'];
}

export interface CatalogSubproductReadModel {
  id: CatalogSubproduct['id'];
  code: CatalogSubproduct['code'];
  name: CatalogSubproduct['name'];
  status: CatalogStatus;
  displayOrder: CatalogSubproduct['displayOrder'];
  modalities: CatalogModalityReadModel[];
}

export interface CatalogProductReadModel {
  id: CatalogProduct['id'];
  code: CatalogProduct['code'];
  name: CatalogProduct['name'];
  status: CatalogStatus;
  displayOrder: CatalogProduct['displayOrder'];
  subproducts: CatalogSubproductReadModel[];
}

export interface CatalogSegmentReadModel {
  id: CatalogSegment['id'];
  code: CatalogSegment['code'];
  name: CatalogSegment['name'];
  status: CatalogStatus;
  displayOrder: CatalogSegment['displayOrder'];
}

export interface MasterCatalogTreeReadModel {
  segments: CatalogSegmentReadModel[];
  products: CatalogProductReadModel[];
}

import type {
  CatalogModalityReadModel,
  CatalogProductReadModel,
  CatalogSegmentReadModel,
  CatalogSubproductReadModel,
  MasterCatalogTreeReadModel,
} from '../../domain/master-catalog.read-model.js';
import type {
  MasterCatalogListQuery,
  MasterCatalogProductIdParams,
  MasterCatalogSubproductIdParams,
} from '../../validators/master-catalog.http.schema.js';

// H-10G: HTTP contracts only, no controller, routes, or runtime hooks.
export type MasterCatalogHttpHeadersContract = {
  tenantId?: string;
  requestId?: string | null;
  correlationId?: string | null;
};

export type MasterCatalogHttpErrorContract = {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown> | null;
};

export type MasterCatalogHttpPermissionMap = {
  readMasterCatalog: 'master-catalog:read';
};

export type MasterCatalogHttpRouteContract =
  | {
      method: 'GET';
      path: '/master-catalog/tree';
      permission: MasterCatalogHttpPermissionMap['readMasterCatalog'];
      query?: MasterCatalogListQuery;
      response: MasterCatalogTreeReadModel;
      headers?: MasterCatalogHttpHeadersContract;
    }
  | {
      method: 'GET';
      path: '/master-catalog/segments';
      permission: MasterCatalogHttpPermissionMap['readMasterCatalog'];
      query?: MasterCatalogListQuery;
      response: CatalogSegmentReadModel[];
      headers?: MasterCatalogHttpHeadersContract;
    }
  | {
      method: 'GET';
      path: '/master-catalog/products';
      permission: MasterCatalogHttpPermissionMap['readMasterCatalog'];
      query?: MasterCatalogListQuery;
      response: CatalogProductReadModel[];
      headers?: MasterCatalogHttpHeadersContract;
    }
  | {
      method: 'GET';
      path: '/master-catalog/products/:productId/subproducts';
      permission: MasterCatalogHttpPermissionMap['readMasterCatalog'];
      params: MasterCatalogProductIdParams;
      query?: MasterCatalogListQuery;
      response: CatalogSubproductReadModel[];
      headers?: MasterCatalogHttpHeadersContract;
    }
  | {
      method: 'GET';
      path: '/master-catalog/subproducts/:subproductId/modalities';
      permission: MasterCatalogHttpPermissionMap['readMasterCatalog'];
      params: MasterCatalogSubproductIdParams;
      query?: MasterCatalogListQuery;
      response: CatalogModalityReadModel[];
      headers?: MasterCatalogHttpHeadersContract;
    };

export type MasterCatalogHttpRouteInventory = ReadonlyArray<
  Pick<MasterCatalogHttpRouteContract, 'method' | 'path' | 'permission'>
>;

export const MASTER_CATALOG_HTTP_ROUTE_INVENTORY = [
  {
    method: 'GET',
    path: '/master-catalog/tree',
    permission: 'master-catalog:read',
  },
  {
    method: 'GET',
    path: '/master-catalog/segments',
    permission: 'master-catalog:read',
  },
  {
    method: 'GET',
    path: '/master-catalog/products',
    permission: 'master-catalog:read',
  },
  {
    method: 'GET',
    path: '/master-catalog/products/:productId/subproducts',
    permission: 'master-catalog:read',
  },
  {
    method: 'GET',
    path: '/master-catalog/subproducts/:subproductId/modalities',
    permission: 'master-catalog:read',
  },
] as const satisfies MasterCatalogHttpRouteInventory;

export type MasterCatalogTreeRequest = {
  headers?: MasterCatalogHttpHeadersContract;
  query?: MasterCatalogListQuery;
};

export type MasterCatalogSegmentsRequest = {
  headers?: MasterCatalogHttpHeadersContract;
  query?: MasterCatalogListQuery;
};

export type MasterCatalogProductsRequest = {
  headers?: MasterCatalogHttpHeadersContract;
  query?: MasterCatalogListQuery;
};

export type MasterCatalogSubproductsByProductRequest = {
  headers?: MasterCatalogHttpHeadersContract;
  params: MasterCatalogProductIdParams;
  query?: MasterCatalogListQuery;
};

export type MasterCatalogModalitiesBySubproductRequest = {
  headers?: MasterCatalogHttpHeadersContract;
  params: MasterCatalogSubproductIdParams;
  query?: MasterCatalogListQuery;
};

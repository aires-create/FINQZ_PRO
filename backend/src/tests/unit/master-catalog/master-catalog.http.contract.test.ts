import { describe, expect, it } from 'vitest';

import {
  MASTER_CATALOG_HTTP_ROUTE_INVENTORY,
} from '../../../modules/master-catalog/presentation/http/master-catalog.http.contract.js';
import type { MasterCatalogHttpPermissionMap } from '../../../modules/master-catalog/presentation/http/master-catalog.http.contract.js';
import {
  MasterCatalogListQuerySchema,
  MasterCatalogProductIdParamsSchema,
  MasterCatalogSubproductIdParamsSchema,
} from '../../../modules/master-catalog/validators/master-catalog.http.schema.js';

describe('master-catalog.http.contract', () => {
  it('permission map contains master-catalog:read', () => {
    const permissions: MasterCatalogHttpPermissionMap = {
      readMasterCatalog: 'master-catalog:read',
    };

    expect(permissions.readMasterCatalog).toBe('master-catalog:read');
  });

  it('route inventory has only GET methods and the exact 5 authorized endpoints', () => {
    const routes = MASTER_CATALOG_HTTP_ROUTE_INVENTORY;

    expect(routes).toHaveLength(5);
    expect(routes.map((route) => route.method)).toEqual(['GET', 'GET', 'GET', 'GET', 'GET']);
    expect(routes.map((route) => route.path)).toEqual([
      '/master-catalog/tree',
      '/master-catalog/segments',
      '/master-catalog/products',
      '/master-catalog/products/:productId/subproducts',
      '/master-catalog/subproducts/:subproductId/modalities',
    ]);
    expect(routes.some((route) => route.method !== 'GET')).toBe(false);
    expect(routes.some((route) => route.method === 'POST' || route.method === 'PUT' || route.method === 'PATCH' || route.method === 'DELETE')).toBe(false);
  });

  it('MasterCatalogListQuerySchema accepts valid status and search values', () => {
    const result = MasterCatalogListQuerySchema.parse({
      status: 'ACTIVE',
      search: ' Consignado ',
    });

    expect(result).toEqual({
      status: 'ACTIVE',
      search: 'Consignado',
    });
  });

  it('MasterCatalogListQuerySchema rejects empty search', () => {
    expect(() =>
      MasterCatalogListQuerySchema.parse({
        search: '   ',
      }),
    ).toThrow();
  });

  it('MasterCatalogProductIdParamsSchema accepts valid uuid and rejects invalid uuid', () => {
    expect(
      MasterCatalogProductIdParamsSchema.parse({
        productId: '11111111-1111-1111-1111-111111111111',
      }),
    ).toEqual({
      productId: '11111111-1111-1111-1111-111111111111',
    });

    expect(() =>
      MasterCatalogProductIdParamsSchema.parse({
        productId: 'invalid',
      }),
    ).toThrow();
  });

  it('MasterCatalogSubproductIdParamsSchema accepts valid uuid and rejects invalid uuid', () => {
    expect(
      MasterCatalogSubproductIdParamsSchema.parse({
        subproductId: '22222222-2222-2222-2222-222222222222',
      }),
    ).toEqual({
      subproductId: '22222222-2222-2222-2222-222222222222',
    });

    expect(() =>
      MasterCatalogSubproductIdParamsSchema.parse({
        subproductId: 'invalid',
      }),
    ).toThrow();
  });
});

import { describe, expect, it, vi } from 'vitest';

import type {
  CatalogModalityReadModel,
  CatalogProductReadModel,
  CatalogSegmentReadModel,
  CatalogSubproductReadModel,
  MasterCatalogTreeReadModel,
} from '../../../modules/master-catalog/domain/master-catalog.read-model.js';
import type { MasterCatalogServiceContract } from '../../../modules/master-catalog/services/master-catalog.service.contract.js';
import { MasterCatalogRuntime } from '../../../modules/master-catalog/application/master-catalog.runtime.js';

const createServiceMock = (): MasterCatalogServiceContract => ({
  listSegments: vi.fn(),
  listProducts: vi.fn(),
  listSubproductsByProduct: vi.fn(),
  listModalitiesBySubproduct: vi.fn(),
  getCatalogTree: vi.fn(),
  findProductByCode: vi.fn(),
  findSubproductByCode: vi.fn(),
  findModalityByCode: vi.fn(),
});

describe('MasterCatalogRuntime', () => {
  it('exposes canonical metadata', () => {
    const runtime = new MasterCatalogRuntime(createServiceMock());

    expect(runtime.metadata).toEqual({
      version: '3.1.0',
      compatibilityMode: 'CANONICAL',
      source: 'backend/master-catalog',
    });
  });

  it('maps service responses to public DTOs', async () => {
    const service = createServiceMock();
    const segment: CatalogSegmentReadModel = {
      id: 'segment-inss',
      code: 'INSS',
      name: 'INSS',
      status: 'ACTIVE',
      displayOrder: 1,
    };
    const modality: CatalogModalityReadModel = {
      id: 'modality-auto',
      code: 'AUTO',
      name: 'Auto',
      status: 'ACTIVE',
      displayOrder: 1,
    };
    const subproduct: CatalogSubproductReadModel = {
      id: 'subproduct-auto-equity',
      code: 'AUTO_EQUITY',
      name: 'Auto Equity',
      status: 'ACTIVE',
      displayOrder: 1,
      modalities: [modality],
    };
    const product: CatalogProductReadModel = {
      id: 'product-emprestimo-com-garantia',
      code: 'EMPRESTIMO_COM_GARANTIA',
      name: 'Empréstimo com Garantia',
      status: 'ACTIVE',
      displayOrder: 1,
      subproducts: [subproduct],
    };
    const tree: MasterCatalogTreeReadModel = {
      segments: [segment],
      products: [product],
    };

    vi.mocked(service.getCatalogTree).mockResolvedValueOnce(tree);
    vi.mocked(service.listSegments).mockResolvedValueOnce([segment]);
    vi.mocked(service.listProducts).mockResolvedValueOnce([product]);
    vi.mocked(service.listSubproductsByProduct).mockResolvedValueOnce([subproduct]);
    vi.mocked(service.listModalitiesBySubproduct).mockResolvedValueOnce([modality]);
    vi.mocked(service.findProductByCode).mockResolvedValueOnce(product);
    vi.mocked(service.findSubproductByCode).mockResolvedValueOnce(subproduct);
    vi.mocked(service.findModalityByCode).mockResolvedValueOnce(modality);

    const runtime = new MasterCatalogRuntime(service);

    await expect(
      runtime.getCatalogTree({ tenantId: 'tenant-1', status: 'ACTIVE' }),
    ).resolves.toEqual(tree);
    await expect(
      runtime.listSegments({ tenantId: 'tenant-1', status: 'ACTIVE' }),
    ).resolves.toEqual([segment]);
    await expect(
      runtime.listProducts({ tenantId: 'tenant-1', status: 'ACTIVE' }),
    ).resolves.toEqual([product]);
    await expect(
      runtime.listSubproductsByProduct({
        tenantId: 'tenant-1',
        productId: product.id,
        status: 'ACTIVE',
      }),
    ).resolves.toEqual([subproduct]);
    await expect(
      runtime.listModalitiesBySubproduct({
        tenantId: 'tenant-1',
        subproductId: subproduct.id,
        status: 'ACTIVE',
      }),
    ).resolves.toEqual([modality]);
    await expect(
      runtime.findProductByCode({
        tenantId: 'tenant-1',
        code: 'EMPRESTIMO_COM_GARANTIA',
        status: 'ACTIVE',
      }),
    ).resolves.toEqual(product);
    await expect(
      runtime.findSubproductByCode({
        tenantId: 'tenant-1',
        productId: product.id,
        code: 'AUTO_EQUITY',
        status: 'ACTIVE',
      }),
    ).resolves.toEqual(subproduct);
    await expect(
      runtime.findModalityByCode({
        tenantId: 'tenant-1',
        subproductId: subproduct.id,
        code: 'AUTO',
        status: 'ACTIVE',
      }),
    ).resolves.toEqual(modality);
  });
});

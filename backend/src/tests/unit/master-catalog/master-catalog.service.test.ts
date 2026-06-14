import { describe, expect, it, vi } from 'vitest';

import type {
  CatalogModalityReadModel,
  CatalogProductReadModel,
  CatalogSegmentReadModel,
  CatalogSubproductReadModel,
  MasterCatalogTreeReadModel,
} from '../../../modules/master-catalog/domain/master-catalog.read-model.js';
import type { MasterCatalogRepository } from '../../../modules/master-catalog/domain/master-catalog-repository.contract.js';
import { MasterCatalogService } from '../../../modules/master-catalog/services/master-catalog.service.js';

const createRepositoryMock = (): MasterCatalogRepository => ({
  listSegments: vi.fn(),
  listProducts: vi.fn(),
  listSubproductsByProduct: vi.fn(),
  listModalitiesBySubproduct: vi.fn(),
  getCatalogTree: vi.fn(),
  findProductByCode: vi.fn(),
  findSubproductByCode: vi.fn(),
  findModalityByCode: vi.fn(),
});

describe('MasterCatalogService', () => {
  const tenantId = '11111111-1111-1111-1111-111111111111';
  const productId = '22222222-2222-2222-2222-222222222222';
  const subproductId = '33333333-3333-3333-3333-333333333333';

  const segment: CatalogSegmentReadModel = {
    id: 'segment-1',
    code: 'INSS',
    name: 'INSS',
    status: 'ACTIVE',
    displayOrder: 1,
  };
  const product: CatalogProductReadModel = {
    id: productId,
    code: 'CONSIGNADO',
    name: 'Consignado',
    status: 'ACTIVE',
    displayOrder: 1,
    subproducts: [],
  };
  const subproduct: CatalogSubproductReadModel = {
    id: subproductId,
    code: 'NOVO',
    name: 'Novo',
    status: 'ACTIVE',
    displayOrder: 1,
    modalities: [],
  };
  const modality: CatalogModalityReadModel = {
    id: '44444444-4444-4444-4444-444444444444',
    code: 'CARTAO',
    name: 'Cartão',
    status: 'ACTIVE',
    displayOrder: 1,
  };
  const tree: MasterCatalogTreeReadModel = {
    segments: [segment],
    products: [product],
  };

  it('listSegments delegates to repository', async () => {
    const repository = createRepositoryMock();
    const listSegmentsSpy = vi.mocked(repository.listSegments);
    listSegmentsSpy.mockResolvedValueOnce([segment]);
    const service = new MasterCatalogService(repository);

    const result = await service.listSegments({
      tenantId,
      status: 'ACTIVE',
      search: 'INSS',
    });

    expect(listSegmentsSpy).toHaveBeenCalledWith({
      tenantId,
      status: 'ACTIVE',
      search: 'INSS',
    });
    expect(result).toEqual([segment]);
  });

  it('listProducts delegates to repository', async () => {
    const repository = createRepositoryMock();
    const listProductsSpy = vi.mocked(repository.listProducts);
    listProductsSpy.mockResolvedValueOnce([product]);
    const service = new MasterCatalogService(repository);

    const result = await service.listProducts({
      tenantId,
      status: 'ACTIVE',
      search: 'CONSIGNADO',
    });

    expect(listProductsSpy).toHaveBeenCalledWith({
      tenantId,
      status: 'ACTIVE',
      search: 'CONSIGNADO',
    });
    expect(result).toEqual([product]);
  });

  it('listSubproductsByProduct delegates to repository', async () => {
    const repository = createRepositoryMock();
    const listSubproductsByProductSpy = vi.mocked(repository.listSubproductsByProduct);
    listSubproductsByProductSpy.mockResolvedValueOnce([subproduct]);
    const service = new MasterCatalogService(repository);

    const result = await service.listSubproductsByProduct({
      tenantId,
      productId,
      status: 'ACTIVE',
      search: 'NOVO',
    });

    expect(listSubproductsByProductSpy).toHaveBeenCalledWith({
      tenantId,
      productId,
      status: 'ACTIVE',
      search: 'NOVO',
    });
    expect(result).toEqual([subproduct]);
  });

  it('listModalitiesBySubproduct delegates to repository', async () => {
    const repository = createRepositoryMock();
    const listModalitiesBySubproductSpy = vi.mocked(repository.listModalitiesBySubproduct);
    listModalitiesBySubproductSpy.mockResolvedValueOnce([modality]);
    const service = new MasterCatalogService(repository);

    const result = await service.listModalitiesBySubproduct({
      tenantId,
      subproductId,
      status: 'ACTIVE',
      search: 'CARTAO',
    });

    expect(listModalitiesBySubproductSpy).toHaveBeenCalledWith({
      tenantId,
      subproductId,
      status: 'ACTIVE',
      search: 'CARTAO',
    });
    expect(result).toEqual([modality]);
  });

  it('getCatalogTree delegates to repository', async () => {
    const repository = createRepositoryMock();
    const getCatalogTreeSpy = vi.mocked(repository.getCatalogTree);
    getCatalogTreeSpy.mockResolvedValueOnce(tree);
    const service = new MasterCatalogService(repository);

    const result = await service.getCatalogTree({
      tenantId,
      status: 'ACTIVE',
      search: 'catalog',
    });

    expect(getCatalogTreeSpy).toHaveBeenCalledWith({
      tenantId,
      status: 'ACTIVE',
      search: 'catalog',
    });
    expect(result).toBe(tree);
  });

  it('findProductByCode delegates to repository', async () => {
    const repository = createRepositoryMock();
    const findProductByCodeSpy = vi.mocked(repository.findProductByCode);
    findProductByCodeSpy.mockResolvedValueOnce(product);
    const service = new MasterCatalogService(repository);

    const result = await service.findProductByCode({
      tenantId,
      code: 'CONSIGNADO',
      status: 'ACTIVE',
    });

    expect(findProductByCodeSpy).toHaveBeenCalledWith({
      tenantId,
      code: 'CONSIGNADO',
      status: 'ACTIVE',
    });
    expect(result).toBe(product);
  });

  it('findSubproductByCode delegates to repository', async () => {
    const repository = createRepositoryMock();
    const findSubproductByCodeSpy = vi.mocked(repository.findSubproductByCode);
    findSubproductByCodeSpy.mockResolvedValueOnce(subproduct);
    const service = new MasterCatalogService(repository);

    const result = await service.findSubproductByCode({
      tenantId,
      productId,
      code: 'NOVO',
      status: 'ACTIVE',
    });

    expect(findSubproductByCodeSpy).toHaveBeenCalledWith({
      tenantId,
      productId,
      code: 'NOVO',
      status: 'ACTIVE',
    });
    expect(result).toBe(subproduct);
  });

  it('findModalityByCode delegates to repository', async () => {
    const repository = createRepositoryMock();
    const findModalityByCodeSpy = vi.mocked(repository.findModalityByCode);
    findModalityByCodeSpy.mockResolvedValueOnce(modality);
    const service = new MasterCatalogService(repository);

    const result = await service.findModalityByCode({
      tenantId,
      subproductId,
      code: 'CARTAO',
      status: 'ACTIVE',
    });

    expect(findModalityByCodeSpy).toHaveBeenCalledWith({
      tenantId,
      subproductId,
      code: 'CARTAO',
      status: 'ACTIVE',
    });
    expect(result).toBe(modality);
  });

  it('rejects missing tenant context', async () => {
    const service = new MasterCatalogService(createRepositoryMock());

    await expect(
      service.listSegments({
        tenantId: ' ',
        status: 'ACTIVE',
      }),
    ).rejects.toThrow('Missing tenant context');
    await expect(
      service.listProducts({
        tenantId: undefined as unknown as string,
        status: 'ACTIVE',
      }),
    ).rejects.toThrow('Missing tenant context');
  });
});

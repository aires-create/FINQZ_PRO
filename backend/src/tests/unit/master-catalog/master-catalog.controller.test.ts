import { describe, expect, it, vi } from 'vitest';

import type { MasterCatalogServiceContract } from '../../../modules/master-catalog/services/master-catalog.service.contract.js';
import { MasterCatalogController } from '../../../modules/master-catalog/presentation/http/master-catalog.controller.js';

const createReplyMock = () => {
  const reply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn(),
  };

  return reply as never;
};

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

describe('MasterCatalogController', () => {
  const tenantId = '11111111-1111-1111-1111-111111111111';
  const productId = '22222222-2222-2222-2222-222222222222';
  const subproductId = '33333333-3333-3333-3333-333333333333';
  const tree = { segments: [], products: [] };

  it('getTree chama service.getCatalogTree com tenantId e query', async () => {
    const service = createServiceMock();
    const spy = vi.mocked(service.getCatalogTree);
    spy.mockResolvedValueOnce(tree);
    const controller = new MasterCatalogController(service);
    const reply = createReplyMock();

    await controller.getTree(
      {
        currentTenant: { tenantId },
        query: { status: 'ACTIVE', search: 'catalog' },
      } as never,
      reply,
    );

    expect(spy).toHaveBeenCalledWith({
      tenantId,
      status: 'ACTIVE',
      search: 'catalog',
    });
    expect(reply.send).toHaveBeenCalledWith({
      success: true,
      data: tree,
    });
  });

  it('listSegments chama service.listSegments com tenantId e query', async () => {
    const service = createServiceMock();
    const spy = vi.mocked(service.listSegments);
    spy.mockResolvedValueOnce([]);
    const controller = new MasterCatalogController(service);
    const reply = createReplyMock();

    await controller.listSegments(
      {
        currentTenant: { tenantId },
        query: { status: 'ACTIVE', search: 'INSS' },
      } as never,
      reply,
    );

    expect(spy).toHaveBeenCalledWith({
      tenantId,
      status: 'ACTIVE',
      search: 'INSS',
    });
  });

  it('listProducts chama service.listProducts com tenantId e query', async () => {
    const service = createServiceMock();
    const spy = vi.mocked(service.listProducts);
    spy.mockResolvedValueOnce([]);
    const controller = new MasterCatalogController(service);
    const reply = createReplyMock();

    await controller.listProducts(
      {
        currentTenant: { tenantId },
        query: { status: 'ACTIVE', search: 'Consignado' },
      } as never,
      reply,
    );

    expect(spy).toHaveBeenCalledWith({
      tenantId,
      status: 'ACTIVE',
      search: 'Consignado',
    });
  });

  it('listSubproductsByProduct valida productId e chama service', async () => {
    const service = createServiceMock();
    const spy = vi.mocked(service.listSubproductsByProduct);
    spy.mockResolvedValueOnce([]);
    const controller = new MasterCatalogController(service);
    const reply = createReplyMock();

    await controller.listSubproductsByProduct(
      {
        currentTenant: { tenantId },
        params: { productId },
        query: { status: 'ACTIVE', search: 'NOVO' },
      } as never,
      reply,
    );

    expect(spy).toHaveBeenCalledWith({
      tenantId,
      productId,
      status: 'ACTIVE',
      search: 'NOVO',
    });
  });

  it('listModalitiesBySubproduct valida subproductId e chama service', async () => {
    const service = createServiceMock();
    const spy = vi.mocked(service.listModalitiesBySubproduct);
    spy.mockResolvedValueOnce([]);
    const controller = new MasterCatalogController(service);
    const reply = createReplyMock();

    await controller.listModalitiesBySubproduct(
      {
        currentTenant: { tenantId },
        params: { subproductId },
        query: { status: 'ACTIVE', search: 'CARTAO' },
      } as never,
      reply,
    );

    expect(spy).toHaveBeenCalledWith({
      tenantId,
      subproductId,
      status: 'ACTIVE',
      search: 'CARTAO',
    });
  });

  it('tenant ausente retorna 400 Missing tenant context', async () => {
    const service = createServiceMock();
    const controller = new MasterCatalogController(service);
    const reply = createReplyMock();

    await controller.listSegments(
      {
        currentTenant: undefined,
        query: { status: 'ACTIVE' },
      } as never,
      reply,
    );

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Missing tenant context',
      },
    });
  });

  it('query inválida retorna 400 VALIDATION_ERROR', async () => {
    const service = createServiceMock();
    const controller = new MasterCatalogController(service);
    const reply = createReplyMock();

    await controller.listSegments(
      {
        currentTenant: { tenantId },
        query: { search: '   ' },
      } as never,
      reply,
    );

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: 'Validation error',
        }),
      }),
    );
  });

  it('erro inesperado retorna 500 INTERNAL_ERROR', async () => {
    const service = createServiceMock();
    vi.mocked(service.listSegments).mockRejectedValueOnce(new Error('boom'));
    const controller = new MasterCatalogController(service);
    const reply = createReplyMock();

    await controller.listSegments(
      {
        currentTenant: { tenantId },
        query: { status: 'ACTIVE' },
      } as never,
      reply,
    );

    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import type {
  CatalogProductReadModel,
  CatalogSegmentReadModel,
  MasterCatalogTreeReadModel,
} from '../../../modules/master-catalog/domain/master-catalog.read-model.js';

const readModelPath = resolve(
  process.cwd(),
  'src/modules/master-catalog/domain/master-catalog.read-model.ts',
);

const readModelSource = readFileSync(readModelPath, 'utf8');

describe('master-catalog.read-model', () => {
  it('builds a valid Consignado tree', () => {
    const tree = {
      segments: [
        {
          id: 'segment-inss',
          code: 'INSS',
          name: 'INSS',
          status: 'ACTIVE',
          displayOrder: 1,
        },
      ],
      products: [
        {
          id: 'product-consignado',
          code: 'CONSIGNADO',
          name: 'Consignado',
          status: 'ACTIVE',
          displayOrder: 1,
          subproducts: [
            {
              id: 'subproduct-novo',
              code: 'NOVO',
              name: 'Novo',
              status: 'ACTIVE',
              displayOrder: 1,
              modalities: [
                {
                  id: 'modality-cartao',
                  code: 'CARTAO',
                  name: 'Cartão',
                  status: 'ACTIVE',
                  displayOrder: 1,
                },
              ],
            },
          ],
        },
      ],
    } satisfies MasterCatalogTreeReadModel;

    expect(tree.products).toHaveLength(1);
    expect(tree.products[0]?.subproducts[0]?.modalities[0]?.code).toBe('CARTAO');
  });

  it('keeps Consignado as a product with Cartão RMC nested below subproducts', () => {
    const product = {
      id: 'product-consignado',
      code: 'CONSIGNADO',
      name: 'Consignado',
      status: 'ACTIVE',
      displayOrder: 1,
      subproducts: [
        {
          id: 'subproduct-cartao-rmc',
          code: 'CARTAO_RMC',
          name: 'Cartão RMC',
          status: 'ACTIVE',
          displayOrder: 1,
          modalities: [
            {
              id: 'modality-cartao',
              code: 'CARTAO',
              name: 'Cartão',
              status: 'ACTIVE',
              displayOrder: 1,
            },
            {
              id: 'modality-cartao-saque',
              code: 'CARTAO_SAQUE',
              name: 'Cartão + Saque',
              status: 'ACTIVE',
              displayOrder: 2,
            },
            {
              id: 'modality-saque-complementar',
              code: 'SAQUE_COMPLEMENTAR',
              name: 'Saque Complementar',
              status: 'ACTIVE',
              displayOrder: 3,
            },
          ],
        },
      ],
    } satisfies CatalogProductReadModel;

    expect(product.subproducts).toHaveLength(1);
    expect(product.subproducts[0]?.modalities).toHaveLength(3);
    expect(product.subproducts[0]?.modalities[0]?.code).toBe('CARTAO');
    expect(product.subproducts[0]?.modalities[1]?.code).toBe('CARTAO_SAQUE');
    expect(product.subproducts[0]?.modalities[2]?.code).toBe('SAQUE_COMPLEMENTAR');
  });

  it('keeps segments independent from products', () => {
    const segments = [
      {
        id: 'segment-inss',
        code: 'INSS',
        name: 'INSS',
        status: 'ACTIVE',
        displayOrder: 1,
      },
      {
        id: 'segment-clt',
        code: 'CLT',
        name: 'CLT',
        status: 'ACTIVE',
        displayOrder: 2,
      },
    ] satisfies CatalogSegmentReadModel[];

    expect(segments).toHaveLength(2);
    expect(segments.every((segment) => !('subproducts' in segment))).toBe(true);
  });

  it('does not expose tenantId on read models', () => {
    const segment = {
      id: 'segment-inss',
      code: 'INSS',
      name: 'INSS',
      status: 'ACTIVE',
      displayOrder: 1,
    } satisfies CatalogSegmentReadModel;

    expect('tenantId' in segment).toBe(false);
    expect(readModelSource).not.toContain('tenantId');
    expect(readModelSource).not.toContain('createdAt');
    expect(readModelSource).not.toContain('updatedAt');
  });

  it('does not import prohibited sources', () => {
    expect(readModelSource).not.toMatch(/from\s+['"][^'"]*(commercial|pipeline|opportunit|creditPfCatalog)[^'"]*['"]/i);
    expect(readModelSource).not.toContain('creditPfCatalog');
    expect(readModelSource).not.toContain('commercialTable');
    expect(readModelSource).not.toContain('commercialCondition');
    expect(readModelSource).not.toContain('pipeline');
    expect(readModelSource).not.toContain('opportunity');
  });
});

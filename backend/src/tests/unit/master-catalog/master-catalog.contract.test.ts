import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  CATALOG_SEGMENT_CODES,
  CATALOG_STATUSES,
  type CatalogModality,
  type CatalogProduct,
  type CatalogSegment,
  type CatalogStatus,
  type CatalogSubproduct,
  type MasterCatalogEntityBase,
} from '../../../modules/master-catalog/domain/master-catalog.contract.js';

const contractPath = resolve(
  process.cwd(),
  'src/modules/master-catalog/domain/master-catalog.contract.ts',
);

const contractSource = readFileSync(contractPath, 'utf8');

const baseEntity = {
  tenantId: 'tenant-1',
  id: 'entity-1',
  code: 'ENTITY_1',
  name: 'Entity One',
  status: 'ACTIVE',
  displayOrder: 10,
  createdAt: '2026-06-13T00:00:00.000Z',
  updatedAt: '2026-06-13T00:00:00.000Z',
} satisfies MasterCatalogEntityBase;

describe('master-catalog.contract', () => {
  it('exposes the accepted statuses', () => {
    const statuses: CatalogStatus[] = CATALOG_STATUSES;

    expect(statuses).toEqual(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']);
    expect(new Set(statuses).size).toBe(4);
  });

  it('allows segment representation for INSS, Servidor Público, Forças Armadas, CLT and FGTS', () => {
    const segments = [
      { ...baseEntity, id: 'segment-inss', code: 'INSS', name: 'INSS' },
      {
        ...baseEntity,
        id: 'segment-servidor-publico',
        code: 'SERVIDOR_PUBLICO',
        name: 'Servidor Público',
      },
      {
        ...baseEntity,
        id: 'segment-forcas-armadas',
        code: 'FORCAS_ARMADAS',
        name: 'Forças Armadas',
      },
      { ...baseEntity, id: 'segment-clt', code: 'CLT', name: 'CLT' },
      { ...baseEntity, id: 'segment-fgts', code: 'FGTS', name: 'FGTS' },
    ] satisfies CatalogSegment[];

    expect(segments.map((segment) => segment.code)).toEqual(CATALOG_SEGMENT_CODES.slice(0, 5));
    expect(segments).toHaveLength(5);
  });

  it('keeps Product free of hardcoded agreement or segment fields', () => {
    const product: CatalogProduct = {
      ...baseEntity,
      id: 'product-consignado',
      code: 'CONSIGNADO',
      name: 'Consignado',
    };

    expect(product).toMatchObject({
      tenantId: 'tenant-1',
      id: 'product-consignado',
      code: 'CONSIGNADO',
      name: 'Consignado',
      status: 'ACTIVE',
    });

    const productBlock =
      contractSource.match(
        /export interface CatalogProduct extends MasterCatalogEntityBase \{[\s\S]*?\}/,
      )?.[0] ?? '';

    expect(productBlock).not.toMatch(/agreement|segmentId|segment:/i);
  });

  it('requires productId for Subproduct', () => {
    const subproduct: CatalogSubproduct = {
      ...baseEntity,
      id: 'subproduct-novo',
      code: 'NOVO',
      name: 'Novo',
      productId: 'product-consignado',
    };

    expect(subproduct.productId).toBe('product-consignado');
    expect(subproduct).toMatchObject({
      id: 'subproduct-novo',
      code: 'NOVO',
      name: 'Novo',
    });
  });

  it('requires subproductId for Modality', () => {
    const modality: CatalogModality = {
      ...baseEntity,
      id: 'modality-novo',
      code: 'CARTAO_SAQUE',
      name: 'Cartão + Saque',
      subproductId: 'subproduct-cartao-rmc',
    };

    expect(modality.subproductId).toBe('subproduct-cartao-rmc');
    expect(modality).toMatchObject({
      id: 'modality-novo',
      code: 'CARTAO_SAQUE',
      name: 'Cartão + Saque',
    });
  });

  it('does not import commercial, pipeline, opportunity or credit catalog sources', () => {
    expect(contractSource).not.toMatch(/from\s+['"][^'"]*(commercial|pipeline|opportunit|creditPfCatalog)[^'"]*['"]/i);
    expect(contractSource).not.toContain('creditPfCatalog');
    expect(contractSource).not.toContain('commercialTable');
    expect(contractSource).not.toContain('commercialCondition');
    expect(contractSource).not.toContain('pipeline');
    expect(contractSource).not.toContain('opportunity');
  });
});

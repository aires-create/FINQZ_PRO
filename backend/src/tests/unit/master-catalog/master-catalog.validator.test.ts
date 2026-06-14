import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  catalogEntityBaseSchema,
  catalogListFiltersSchema,
  catalogModalitySchema,
  catalogProductSchema,
  catalogSegmentCodeSchema,
  catalogSegmentSchema,
  catalogStatusSchema,
  catalogSubproductSchema,
} from '../../../modules/master-catalog/validators/master-catalog.validator.js';

const validatorPath = resolve(
  process.cwd(),
  'src/modules/master-catalog/validators/master-catalog.validator.ts',
);

const validatorSource = readFileSync(validatorPath, 'utf8');

const baseEntity = {
  tenantId: 'tenant-1',
  id: 'entity-1',
  code: 'ENTITY_1',
  name: 'Entity One',
  status: 'ACTIVE',
  displayOrder: 10,
  createdAt: '2026-06-13T00:00:00.000Z',
  updatedAt: '2026-06-13T00:00:00.000Z',
};

describe('master-catalog.validator', () => {
  it('accepts valid statuses and rejects invalid ones', () => {
    expect(catalogStatusSchema.parse('ACTIVE')).toBe('ACTIVE');
    expect(() => catalogStatusSchema.parse('DRAFTING')).toThrow();
  });

  it('accepts valid segment codes and rejects invalid ones', () => {
    expect(catalogSegmentCodeSchema.parse('INSS')).toBe('INSS');
    expect(() => catalogSegmentCodeSchema.parse('INSS_PARCELADO')).toThrow();
  });

  it('parses the base entity strictly', () => {
    const result = catalogEntityBaseSchema.parse(baseEntity);

    expect(result).toMatchObject({
      tenantId: 'tenant-1',
      id: 'entity-1',
      code: 'ENTITY_1',
      name: 'Entity One',
      status: 'ACTIVE',
      displayOrder: 10,
    });
  });

  it('rejects extra fields on Product and segmentId is not allowed', () => {
    expect(() =>
      catalogProductSchema.parse({
        ...baseEntity,
        id: 'product-consignado',
        code: 'CONSIGNADO',
        name: 'Consignado',
        segmentId: 'segment-inss',
      }),
    ).toThrow();
  });

  it('requires productId for Subproduct', () => {
    expect(() =>
      catalogSubproductSchema.parse({
        ...baseEntity,
        id: 'subproduct-novo',
        code: 'NOVO',
        name: 'Novo',
      }),
    ).toThrow();

    const result = catalogSubproductSchema.parse({
      ...baseEntity,
      id: 'subproduct-novo',
      code: 'NOVO',
      name: 'Novo',
      productId: 'product-consignado',
    });

    expect(result.productId).toBe('product-consignado');
  });

  it('requires subproductId for Modality', () => {
    expect(() =>
      catalogModalitySchema.parse({
        ...baseEntity,
        id: 'modality-cartao',
        code: 'CARTAO',
        name: 'Cartão',
      }),
    ).toThrow();

    const result = catalogModalitySchema.parse({
      ...baseEntity,
      id: 'modality-cartao',
      code: 'CARTAO',
      name: 'Cartão',
      subproductId: 'subproduct-cartao-rmc',
    });

    expect(result.subproductId).toBe('subproduct-cartao-rmc');
  });

  it('rejects unknown filter fields and trims known filters', () => {
    const result = catalogListFiltersSchema.parse({
      search: '  consignado  ',
      status: 'ACTIVE',
      tenantId: '  tenant-1  ',
      code: '  CONSIGNADO  ',
    });

    expect(result).toEqual({
      search: 'consignado',
      status: 'ACTIVE',
      tenantId: 'tenant-1',
      code: 'CONSIGNADO',
    });

    expect(() =>
      catalogListFiltersSchema.parse({
        search: 'test',
        unknownField: 'nope',
      } as never),
    ).toThrow();
  });

  it('does not import commercial, pipeline, opportunity or creditPfCatalog sources', () => {
    expect(validatorSource).not.toMatch(/from\s+['"][^'"]*(commercial|pipeline|opportunit|creditPfCatalog)[^'"]*['"]/i);
    expect(validatorSource).not.toContain('creditPfCatalog');
    expect(validatorSource).not.toContain('commercialTable');
    expect(validatorSource).not.toContain('commercialCondition');
    expect(validatorSource).not.toContain('pipeline');
    expect(validatorSource).not.toContain('opportunity');
  });
});

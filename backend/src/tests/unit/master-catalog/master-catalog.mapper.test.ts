import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { MASTER_CATALOG_INITIAL_TREE } from '../../../modules/master-catalog/domain/master-catalog.seed.js';
import { normalizeMasterCatalogTree } from '../../../modules/master-catalog/domain/master-catalog.mapper.js';

const mapperPath = resolve(
  process.cwd(),
  'src/modules/master-catalog/domain/master-catalog.mapper.ts',
);

const mapperSource = readFileSync(mapperPath, 'utf8');

describe('master-catalog.mapper', () => {
  it('ordena segments', () => {
    const input = {
      ...MASTER_CATALOG_INITIAL_TREE,
      segments: [...MASTER_CATALOG_INITIAL_TREE.segments].reverse(),
    };

    const result = normalizeMasterCatalogTree(input);

    expect(result.segments.map((segment) => segment.code)).toEqual([
      'INSS',
      'SERVIDOR_PUBLICO',
      'FORCAS_ARMADAS',
      'CLT',
      'FGTS',
      'OUTROS_CONVENIOS',
    ]);
  });

  it('ordena products', () => {
    const input = {
      ...MASTER_CATALOG_INITIAL_TREE,
      products: [...MASTER_CATALOG_INITIAL_TREE.products].reverse(),
    };

    const result = normalizeMasterCatalogTree(input);

    expect(result.products.map((product) => product.code)).toEqual([
      'CONSIGNADO',
      'ANTECIPACAO_FGTS',
      'ENERGIA_POR_ASSINATURA',
      'SEGURO',
      'CONSORCIO',
    ]);
  });

  it('ordena subproducts', () => {
    const consignado = MASTER_CATALOG_INITIAL_TREE.products.find(
      (product) => product.code === 'CONSIGNADO',
    );

    const input = {
      ...MASTER_CATALOG_INITIAL_TREE,
      products: [
        {
          ...consignado!,
          subproducts: [...consignado!.subproducts].reverse(),
        },
      ],
    };

    const result = normalizeMasterCatalogTree(input);

    expect(result.products[0]?.subproducts.map((subproduct) => subproduct.code)).toEqual([
      'EMPRESTIMO_CONSIGNADO',
      'CARTAO_RMC',
      'CARTAO_BENEFICIO',
    ]);
  });

  it('ordena modalities of Empréstimo Consignado', () => {
    const consignado = MASTER_CATALOG_INITIAL_TREE.products.find(
      (product) => product.code === 'CONSIGNADO',
    );
    const emprestimoConsignado = consignado?.subproducts.find(
      (subproduct) => subproduct.code === 'EMPRESTIMO_CONSIGNADO',
    );

    const input = {
      ...MASTER_CATALOG_INITIAL_TREE,
      products: [
        {
          ...consignado!,
          subproducts: [
            {
              ...emprestimoConsignado!,
              modalities: [...emprestimoConsignado!.modalities].reverse(),
            },
          ],
        },
      ],
    };

    const result = normalizeMasterCatalogTree(input);

    expect(result.products[0]?.subproducts[0]?.modalities.map((modality) => modality.code)).toEqual([
      'NOVO',
      'REFINANCIAMENTO',
      'PORTABILIDADE',
      'PORT_REFIN',
    ]);
  });

  it('ordena modalities', () => {
    const consignado = MASTER_CATALOG_INITIAL_TREE.products.find(
      (product) => product.code === 'CONSIGNADO',
    );
    const cartaoRmc = consignado?.subproducts.find(
      (subproduct) => subproduct.code === 'CARTAO_RMC',
    );

    const input = {
      ...MASTER_CATALOG_INITIAL_TREE,
      products: [
        {
          ...consignado!,
          subproducts: [
            {
              ...cartaoRmc!,
              modalities: [...cartaoRmc!.modalities].reverse(),
            },
          ],
        },
      ],
    };

    const result = normalizeMasterCatalogTree(input);

    expect(result.products[0]?.subproducts[0]?.modalities.map((modality) => modality.code)).toEqual([
      'CARTAO',
      'CARTAO_SAQUE',
      'SAQUE_COMPLEMENTAR',
    ]);
  });

  it('não muta o input original', () => {
    const input = {
      ...MASTER_CATALOG_INITIAL_TREE,
      products: [...MASTER_CATALOG_INITIAL_TREE.products].reverse(),
    };

    const before = input.products.map((product) => product.code);
    const result = normalizeMasterCatalogTree(input);

    expect(input.products.map((product) => product.code)).toEqual(before);
    expect(result).not.toBe(input);
    expect(result.products).not.toBe(input.products);
  });

  it('não adiciona tenantId/createdAt/updatedAt', () => {
    const result = normalizeMasterCatalogTree(MASTER_CATALOG_INITIAL_TREE);

    expect(readFileSync(mapperPath, 'utf8')).not.toContain('tenantId');
    expect(readFileSync(mapperPath, 'utf8')).not.toContain('createdAt');
    expect(readFileSync(mapperPath, 'utf8')).not.toContain('updatedAt');
    expect(result.segments[0]).not.toHaveProperty('tenantId');
  });

  it('não importa fontes proibidas', () => {
    expect(mapperSource).not.toMatch(/from\s+['"][^'"]*(commercial|pipeline|opportunit|creditPfCatalog)[^'"]*['"]/i);
    expect(mapperSource).not.toContain('creditPfCatalog');
    expect(mapperSource).not.toContain('commercialTable');
    expect(mapperSource).not.toContain('commercialCondition');
    expect(mapperSource).not.toContain('pipeline');
    expect(mapperSource).not.toContain('opportunity');
  });

  it('funciona com MASTER_CATALOG_INITIAL_TREE', () => {
    const result = normalizeMasterCatalogTree(MASTER_CATALOG_INITIAL_TREE);
    const consignado = result.products.find((product) => product.code === 'CONSIGNADO');
    const cartaoRmc = consignado?.subproducts.find((subproduct) => subproduct.code === 'CARTAO_RMC');

    expect(result.segments).toHaveLength(6);
    expect(result.products).toHaveLength(5);
    expect(cartaoRmc?.modalities[0]?.code).toBe('CARTAO');
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { MASTER_CATALOG_INITIAL_TREE } from '../../../modules/master-catalog/domain/master-catalog.seed.js';

const seedPath = resolve(
  process.cwd(),
  'src/modules/master-catalog/domain/master-catalog.seed.ts',
);

const seedSource = readFileSync(seedPath, 'utf8');

describe('master-catalog.seed', () => {
  it('deve conter os 6 segments esperados', () => {
    expect(MASTER_CATALOG_INITIAL_TREE.segments).toHaveLength(6);
    expect(MASTER_CATALOG_INITIAL_TREE.segments.map((segment) => segment.code)).toEqual([
      'INSS',
      'SERVIDOR_PUBLICO',
      'FORCAS_ARMADAS',
      'CLT',
      'FGTS',
      'OUTROS_CONVENIOS',
    ]);
  });

  it('deve conter Product Consignado', () => {
    expect(
      MASTER_CATALOG_INITIAL_TREE.products.find((product) => product.code === 'CONSIGNADO'),
    ).toBeDefined();
  });

  it('Consignado deve conter os 6 subproducts esperados', () => {
    const consignado = MASTER_CATALOG_INITIAL_TREE.products.find(
      (product) => product.code === 'CONSIGNADO',
    );

    expect(consignado?.subproducts).toHaveLength(6);
    expect(consignado?.subproducts.map((subproduct) => subproduct.code)).toEqual([
      'NOVO',
      'REFINANCIAMENTO',
      'PORTABILIDADE',
      'PORT_REFIN',
      'CARTAO_RMC',
      'CARTAO_BENEFICIO',
    ]);
  });

  it('Cartão RMC deve conter as 3 modalities esperadas', () => {
    const consignado = MASTER_CATALOG_INITIAL_TREE.products.find(
      (product) => product.code === 'CONSIGNADO',
    );
    const cartaoRmc = consignado?.subproducts.find(
      (subproduct) => subproduct.code === 'CARTAO_RMC',
    );

    expect(cartaoRmc?.modalities).toHaveLength(3);
    expect(cartaoRmc?.modalities.map((modality) => modality.code)).toEqual([
      'CARTAO',
      'CARTAO_SAQUE',
      'SAQUE_COMPLEMENTAR',
    ]);
  });

  it('Cartão Benefício deve conter as 3 modalities esperadas', () => {
    const consignado = MASTER_CATALOG_INITIAL_TREE.products.find(
      (product) => product.code === 'CONSIGNADO',
    );
    const cartaoBeneficio = consignado?.subproducts.find(
      (subproduct) => subproduct.code === 'CARTAO_BENEFICIO',
    );

    expect(cartaoBeneficio?.modalities).toHaveLength(3);
    expect(cartaoBeneficio?.modalities.map((modality) => modality.code)).toEqual([
      'CARTAO',
      'CARTAO_SAQUE',
      'SAQUE_COMPLEMENTAR',
    ]);
  });

  it('Energia por Assinatura deve conter Geração Distribuída e Mercado Livre', () => {
    const energia = MASTER_CATALOG_INITIAL_TREE.products.find(
      (product) => product.code === 'ENERGIA_POR_ASSINATURA',
    );

    expect(energia?.subproducts.map((subproduct) => subproduct.code)).toEqual([
      'GERACAO_DISTRIBUIDA',
      'MERCADO_LIVRE',
    ]);
  });

  it('não deve conter dados comerciais como taxa, prazo, coeficiente, comissão', () => {
    expect(seedSource).not.toMatch(/taxa|prazo|coeficiente|comiss(ao|ão)/i);
  });

  it('não deve importar commercial/pipeline/opportunity/creditPfCatalog', () => {
    expect(seedSource).not.toMatch(/from\s+['"][^'"]*(commercial|pipeline|opportunit|creditPfCatalog)[^'"]*['"]/i);
    expect(seedSource).not.toContain('creditPfCatalog');
    expect(seedSource).not.toContain('commercialTable');
    expect(seedSource).not.toContain('commercialCondition');
    expect(seedSource).not.toContain('pipeline');
    expect(seedSource).not.toContain('opportunity');
  });
});

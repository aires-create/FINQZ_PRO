import { describe, expect, it } from 'vitest';

import {
  MASTER_CATALOG_RUNTIME_VERSION,
  createMasterCatalogRuntimeMetadata,
  toMasterCatalogTreeDto,
} from '../../../modules/master-catalog/dto/master-catalog.dto.js';
import type { MasterCatalogTreeReadModel } from '../../../modules/master-catalog/domain/master-catalog.read-model.js';

describe('master-catalog.dto', () => {
  it('exports the runtime version and canonical metadata', () => {
    expect(MASTER_CATALOG_RUNTIME_VERSION).toBe('3.1.0');
    expect(createMasterCatalogRuntimeMetadata()).toEqual({
      version: '3.1.0',
      compatibilityMode: 'CANONICAL',
      source: 'backend/master-catalog',
    });
  });

  it('maps tree read models without changing the public shape', () => {
    const tree: MasterCatalogTreeReadModel = {
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
          id: 'product-emprestimo-com-garantia',
          code: 'EMPRESTIMO_COM_GARANTIA',
          name: 'Empréstimo com Garantia',
          status: 'ACTIVE',
          displayOrder: 1,
          subproducts: [
            {
              id: 'subproduct-auto-equity',
              code: 'AUTO_EQUITY',
              name: 'Auto Equity',
              status: 'ACTIVE',
              displayOrder: 1,
              modalities: [],
            },
          ],
        },
      ],
    };

    const dto = toMasterCatalogTreeDto(tree);

    expect(dto).toEqual(tree);
    expect(dto).not.toBe(tree);
    expect(dto.products[0]).not.toBe(tree.products[0]);
    expect(dto.products[0]?.subproducts[0]).not.toBe(
      tree.products[0]?.subproducts[0],
    );
  });
});

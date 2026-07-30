import type { MasterCatalogTreeReadModel } from '../../../modules/master-catalog/domain/master-catalog.read-model'
import { mapMasterCatalogTreeToCommercialStructureCoverage } from '../../../modules/commercial-structure/domain/commercial-structure.mapper'

describe('Commercial Structure mapper', () => {
  it('maps master catalog tree to commercial structure coverage tree', () => {
    const catalogTree: MasterCatalogTreeReadModel = {
      segments: [
        {
          id: 'segment-id',
          code: 'INSS',
          name: 'INSS',
          status: 'ACTIVE',
          displayOrder: 1,
        },
      ],
      products: [
        {
          id: 'product-id',
          code: 'CREDIT',
          name: 'Crédito',
          status: 'ACTIVE',
          displayOrder: 1,
          subproducts: [
            {
              id: 'subproduct-id',
              code: 'PAYROLL_LOAN',
              name: 'Consignado',
              status: 'ACTIVE',
              displayOrder: 1,
              modalities: [
                {
                  id: 'modality-id',
                  code: 'NEW_LOAN',
                  name: 'Novo Empréstimo',
                  status: 'ACTIVE',
                  displayOrder: 1,
                },
              ],
            },
          ],
        },
      ],
    }

    const coverageTree =
      mapMasterCatalogTreeToCommercialStructureCoverage(catalogTree)

    expect(coverageTree.segments[0]).toEqual({
      id: 'segment-id',
      code: 'INSS',
      name: 'INSS',
      status: 'ACTIVE',
      displayOrder: 1,
    })

    expect(coverageTree.products[0]?.subproducts[0]).toMatchObject({
      id: 'subproduct-id',
      productId: 'product-id',
      code: 'PAYROLL_LOAN',
      status: 'ACTIVE',
    })

    expect(
      coverageTree.products[0]?.subproducts[0]?.modalities[0],
    ).toMatchObject({
      id: 'modality-id',
      subproductId: 'subproduct-id',
      code: 'NEW_LOAN',
      status: 'ACTIVE',
    })
  })

  it('maps non-active catalog statuses to commercial coverage statuses', () => {
    const catalogTree: MasterCatalogTreeReadModel = {
      segments: [
        {
          id: 'segment-draft',
          code: 'DRAFT_SEGMENT',
          name: 'Draft Segment',
          status: 'DRAFT',
          displayOrder: 1,
        },
        {
          id: 'segment-inactive',
          code: 'INACTIVE_SEGMENT',
          name: 'Inactive Segment',
          status: 'INACTIVE',
          displayOrder: 2,
        },
      ],
      products: [
        {
          id: 'product-archived',
          code: 'ARCHIVED_PRODUCT',
          name: 'Archived Product',
          status: 'ARCHIVED',
          displayOrder: 1,
          subproducts: [],
        },
      ],
    }

    const coverageTree =
      mapMasterCatalogTreeToCommercialStructureCoverage(catalogTree)

    expect(coverageTree.segments[0]?.status).toBe('SUSPENDED')
    expect(coverageTree.segments[1]?.status).toBe('INACTIVE')
    expect(coverageTree.products[0]?.status).toBe('SUSPENDED')
  })
})

import {
  COMMERCIAL_COVERAGE_STATUSES,
  COVERAGE_NODE_TYPES,
  type CommercialCoverageStatus,
  type CommercialCoverageViewModel,
  type CommercialStructureModalityView,
  type CommercialStructureProductView,
  type CommercialStructureSegmentView,
  type CommercialStructureSubproductView,
  type CoverageNodeType,
} from '../../../modules/commercial-structure/domain/commercial-structure.contract'

describe('Commercial Structure canonical contracts', () => {
  it('exposes only canonical coverage node types', () => {
    const nodeTypes: CoverageNodeType[] = [
      'SEGMENT',
      'PRODUCT',
      'SUBPRODUCT',
      'MODALITY',
    ]

    expect(COVERAGE_NODE_TYPES).toEqual(nodeTypes)
  })

  it('exposes only canonical commercial coverage statuses', () => {
    const statuses: CommercialCoverageStatus[] = [
      'ACTIVE',
      'SUSPENDED',
      'INACTIVE',
    ]

    expect(COMMERCIAL_COVERAGE_STATUSES).toEqual(statuses)
  })

  it('supports canonical commercial structure taxonomy views', () => {
    const segment: CommercialStructureSegmentView = {
      id: 'segment-id',
      code: 'PF',
      name: 'Pessoa Física',
      status: 'ACTIVE',
      displayOrder: 1,
    }

    const product: CommercialStructureProductView = {
      id: 'product-id',
      code: 'CREDIT',
      name: 'Crédito',
      status: 'ACTIVE',
      displayOrder: 1,
    }

    const subproduct: CommercialStructureSubproductView = {
      id: 'subproduct-id',
      productId: product.id,
      code: 'INSS',
      name: 'INSS',
      status: 'ACTIVE',
      displayOrder: 1,
    }

    const modality: CommercialStructureModalityView = {
      id: 'modality-id',
      subproductId: subproduct.id,
      code: 'NEW_LOAN',
      name: 'Novo Empréstimo',
      status: 'ACTIVE',
      displayOrder: 1,
    }

    expect(segment.code).toBe('PF')
    expect(product.code).toBe('CREDIT')
    expect(subproduct.productId).toBe(product.id)
    expect(modality.subproductId).toBe(subproduct.id)
  })

  it('supports canonical commercial coverage view model', () => {
    const coverage: CommercialCoverageViewModel = {
      segmentId: 'segment-id',
      productId: 'product-id',
      subproductId: 'subproduct-id',
      modalityId: 'modality-id',
      status: 'ACTIVE',
      startDate: null,
      endDate: null,
      reason: null,
      notes: null,
    }

    expect(coverage.status).toBe('ACTIVE')
    expect(coverage.segmentId).toBe('segment-id')
    expect(coverage.productId).toBe('product-id')
    expect(coverage.subproductId).toBe('subproduct-id')
    expect(coverage.modalityId).toBe('modality-id')
  })
})

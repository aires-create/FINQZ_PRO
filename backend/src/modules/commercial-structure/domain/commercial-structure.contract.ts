export const COVERAGE_NODE_TYPES = [
  'SEGMENT',
  'PRODUCT',
  'SUBPRODUCT',
  'MODALITY',
] as const

export type CoverageNodeType = (typeof COVERAGE_NODE_TYPES)[number]

export const COMMERCIAL_COVERAGE_STATUSES = [
  'ACTIVE',
  'SUSPENDED',
  'INACTIVE',
] as const

export type CommercialCoverageStatus =
  (typeof COMMERCIAL_COVERAGE_STATUSES)[number]

export interface CommercialStructureSegmentView {
  id: string
  code: string
  name: string
  status: CommercialCoverageStatus
  displayOrder: number
}

export interface CommercialStructureProductView {
  id: string
  code: string
  name: string
  status: CommercialCoverageStatus
  displayOrder: number
}

export interface CommercialStructureSubproductView {
  id: string
  productId: string
  code: string
  name: string
  status: CommercialCoverageStatus
  displayOrder: number
}

export interface CommercialStructureModalityView {
  id: string
  subproductId: string
  code: string
  name: string
  status: CommercialCoverageStatus
  displayOrder: number
}

export interface CommercialCoverageViewModel {
  segmentId: string
  productId: string
  subproductId: string
  modalityId: string
  status: CommercialCoverageStatus
  startDate?: Date | null
  endDate?: Date | null
  reason?: string | null
  notes?: string | null
}

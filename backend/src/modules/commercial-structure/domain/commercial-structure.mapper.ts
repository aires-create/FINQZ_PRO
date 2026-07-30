import type { MasterCatalogTreeReadModel } from '../../master-catalog/domain/master-catalog.read-model.js'
import type {
  CommercialCoverageStatus,
  CommercialStructureCoverageTreeView,
  CommercialStructureModalityView,
  CommercialStructureProductView,
  CommercialStructureSegmentView,
  CommercialStructureSubproductView,
} from './commercial-structure.contract.js'

const mapCatalogStatusToCoverageStatus = (
  status: string,
): CommercialCoverageStatus => {
  if (status === 'ACTIVE') {
    return 'ACTIVE'
  }

  if (status === 'INACTIVE') {
    return 'INACTIVE'
  }

  return 'SUSPENDED'
}

const mapSegment = (
  segment: MasterCatalogTreeReadModel['segments'][number],
): CommercialStructureSegmentView => ({
  id: segment.id,
  code: segment.code,
  name: segment.name,
  status: mapCatalogStatusToCoverageStatus(segment.status),
  displayOrder: segment.displayOrder,
})

const mapModality = (
  modality: MasterCatalogTreeReadModel['products'][number]['subproducts'][number]['modalities'][number],
  subproductId: string,
): CommercialStructureModalityView => ({
  id: modality.id,
  subproductId,
  code: modality.code,
  name: modality.name,
  status: mapCatalogStatusToCoverageStatus(modality.status),
  displayOrder: modality.displayOrder,
})

const mapSubproduct = (
  subproduct: MasterCatalogTreeReadModel['products'][number]['subproducts'][number],
  productId: string,
): CommercialStructureSubproductView & {
  modalities: CommercialStructureModalityView[]
} => ({
  id: subproduct.id,
  productId,
  code: subproduct.code,
  name: subproduct.name,
  status: mapCatalogStatusToCoverageStatus(subproduct.status),
  displayOrder: subproduct.displayOrder,
  modalities: subproduct.modalities.map((modality) =>
    mapModality(modality, subproduct.id),
  ),
})

const mapProduct = (
  product: MasterCatalogTreeReadModel['products'][number],
): CommercialStructureProductView & {
  subproducts: Array<
    CommercialStructureSubproductView & {
      modalities: CommercialStructureModalityView[]
    }
  >
} => ({
  id: product.id,
  code: product.code,
  name: product.name,
  status: mapCatalogStatusToCoverageStatus(product.status),
  displayOrder: product.displayOrder,
  subproducts: product.subproducts.map((subproduct) =>
    mapSubproduct(subproduct, product.id),
  ),
})

export function mapMasterCatalogTreeToCommercialStructureCoverage(
  catalogTree: MasterCatalogTreeReadModel,
): CommercialStructureCoverageTreeView {
  return {
    segments: catalogTree.segments.map(mapSegment),
    products: catalogTree.products.map(mapProduct),
  }
}

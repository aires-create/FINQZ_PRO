import type {
  MasterCatalogStatus,
  MasterCatalogTreeDto,
} from "../../api/modules/master-catalog.api";
import type {
  CommercialCoverageStatus,
  CommercialStructureCoverageTreeView,
} from "./commercialStructureCoverage.types";

const mapCatalogStatusToCoverageStatus = (
  status: MasterCatalogStatus,
): CommercialCoverageStatus => {
  if (status === "ACTIVE") return "ACTIVE";
  if (status === "INACTIVE") return "INACTIVE";
  return "SUSPENDED";
};

export const masterCatalogTreeToCoverageTree = (
  tree: MasterCatalogTreeDto,
): CommercialStructureCoverageTreeView => ({
  segments: (tree.segments ?? []).map((segment) => ({
    id: segment.id,
    code: segment.code,
    name: segment.name,
    status: mapCatalogStatusToCoverageStatus(segment.status),
    displayOrder: segment.displayOrder,
  })),
  products: (tree.products ?? []).map((product) => ({
    id: product.id,
    code: product.code,
    name: product.name,
    status: mapCatalogStatusToCoverageStatus(product.status),
    displayOrder: product.displayOrder,
    subproducts: (product.subproducts ?? []).map((subproduct) => ({
      id: subproduct.id,
      productId: product.id,
      code: subproduct.code,
      name: subproduct.name,
      status: mapCatalogStatusToCoverageStatus(subproduct.status),
      displayOrder: subproduct.displayOrder,
      modalities: (subproduct.modalities ?? []).map((modality) => ({
        id: modality.id,
        subproductId: subproduct.id,
        code: modality.code,
        name: modality.name,
        status: mapCatalogStatusToCoverageStatus(modality.status),
        displayOrder: modality.displayOrder,
      })),
    })),
  })),
});

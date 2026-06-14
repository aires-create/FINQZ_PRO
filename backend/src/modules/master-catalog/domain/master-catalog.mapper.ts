import type {
  CatalogModalityReadModel,
  CatalogProductReadModel,
  CatalogSegmentReadModel,
  CatalogSubproductReadModel,
  MasterCatalogTreeReadModel,
} from './master-catalog.read-model.js';

const compareByDisplayOrderAndName = <
  T extends { displayOrder: number; name: string },
>(
  left: T,
  right: T,
) => {
  if (left.displayOrder !== right.displayOrder) {
    return left.displayOrder - right.displayOrder;
  }

  return left.name.localeCompare(right.name);
};

const sortModalities = (modalities: CatalogModalityReadModel[]) =>
  [...modalities].sort(compareByDisplayOrderAndName);

const sortSubproducts = (subproducts: CatalogSubproductReadModel[]) =>
  [...subproducts]
    .sort(compareByDisplayOrderAndName)
    .map((subproduct) => ({
      ...subproduct,
      modalities: sortModalities(subproduct.modalities),
    }));

const sortProducts = (products: CatalogProductReadModel[]) =>
  [...products]
    .sort(compareByDisplayOrderAndName)
    .map((product) => ({
      ...product,
      subproducts: sortSubproducts(product.subproducts),
    }));

const sortSegments = (segments: CatalogSegmentReadModel[]) =>
  [...segments].sort(compareByDisplayOrderAndName);

export function normalizeMasterCatalogTree(
  input: MasterCatalogTreeReadModel,
): MasterCatalogTreeReadModel {
  return {
    segments: sortSegments(input.segments),
    products: sortProducts(input.products),
  };
}

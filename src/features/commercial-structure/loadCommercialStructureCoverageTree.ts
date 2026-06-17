import { masterCatalogApi } from "../../api/modules/master-catalog.api";
import { masterCatalogTreeToCoverageTree } from "./commercialStructureCoverage.mapper";

export const loadCommercialStructureCoverageTree = async () => {
  const tree = await masterCatalogApi.getCatalogTree({ status: "ACTIVE" });

  return masterCatalogTreeToCoverageTree(tree);
};

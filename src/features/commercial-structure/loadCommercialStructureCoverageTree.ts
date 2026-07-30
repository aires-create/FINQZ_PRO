import { masterCatalogApi } from "../../api/modules/master-catalog.api";
import { creditPfCatalog } from "../../data/creditPfCatalog";
import { masterCatalogTreeToCoverageTree } from "./commercialStructureCoverage.mapper";
import { compareCommercialCoverageShadow } from "./commercialCoverageShadowComparator";

const SHADOW_PREFIX = "[EPC-W4-03D][CommercialCoverageShadow]";

const toShadowErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Falha interna na comparação shadow da cobertura comercial.";
};

const logShadowComparison = (comparison: ReturnType<typeof compareCommercialCoverageShadow>): void => {
  const summary = {
    consumer: comparison.consumer,
    comparisonStatus: comparison.comparisonStatus,
    productCounts: comparison.productCounts,
    subproductCounts: comparison.subproductCounts,
    missingInMaster: comparison.missingInMaster,
    missingInCompatibility: comparison.missingInCompatibility,
    divergentNames: comparison.divergentNames,
    duplicateCodes: comparison.duplicateCodes,
    timestamp: comparison.comparedAt,
  };

  if (comparison.comparisonStatus === "MATCH" || comparison.comparisonStatus === "EMPTY") {
    console.info(SHADOW_PREFIX, summary);
    return;
  }

  console.warn(SHADOW_PREFIX, summary);
};

const logShadowFailure = (error: unknown): void => {
  console.error(SHADOW_PREFIX, {
    consumer: "CommercialCoveragePage",
    timestamp: new Date().toISOString(),
    message: toShadowErrorMessage(error),
  });
};

export const loadCommercialStructureCoverageTree = async () => {
  const tree = await masterCatalogApi.getCatalogTree({ status: "ACTIVE" });
  const coverageTree = masterCatalogTreeToCoverageTree(tree);

  try {
    const shadowComparison = compareCommercialCoverageShadow(tree, creditPfCatalog);
    logShadowComparison(shadowComparison);
  } catch (error) {
    logShadowFailure(error);
  }

  return coverageTree;
};

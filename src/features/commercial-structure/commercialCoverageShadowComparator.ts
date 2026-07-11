import type { MasterCatalogTreeDto } from "../../api/modules/master-catalog.api";
import type { CreditProduct } from "../../data/creditPfCatalog";

export type CommercialCoverageShadowComparisonStatus = "MATCH" | "DIVERGENT" | "EMPTY";

export interface CommercialCoverageShadowComparisonResult {
  consumer: string;
  primarySource: string;
  shadowSource: string;
  comparedAt: string;
  comparisonStatus: CommercialCoverageShadowComparisonStatus;
  productCounts: {
    primary: number;
    shadow: number;
    matched: number;
    missingInPrimary: number;
    missingInShadow: number;
  };
  subproductCounts: {
    primary: number;
    shadow: number;
    matched: number;
    missingInPrimary: number;
    missingInShadow: number;
  };
  matchedProductCodes: string[];
  matchedSubproductCodes: string[];
  missingInMaster: string[];
  missingInCompatibility: string[];
  missingSubproductInMaster: string[];
  missingSubproductInCompatibility: string[];
  divergentNames: string[];
  duplicateCodes: string[];
  invalidProductCodes: {
    master: string[];
    compatibility: string[];
  };
  invalidSubproductCodes: {
    master: string[];
    compatibility: string[];
  };
}

type ComparisonSubproduct = {
  code: string;
  name: string;
};

type ComparisonProduct = {
  code: string;
  name: string;
  subproducts: ComparisonSubproduct[];
};

type ComparisonCatalog = {
  products: ComparisonProduct[];
  invalidProductCodes: string[];
  invalidSubproductCodes: string[];
  productCount: number;
  subproductCount: number;
};

type CollectionsComparison = {
  matchedProductCodes: string[];
  missingInMaster: string[];
  missingInCompatibility: string[];
  matchedSubproductCodes: string[];
  missingSubproductInMaster: string[];
  missingSubproductInCompatibility: string[];
  divergentNames: string[];
  duplicateCodes: string[];
};

const PREFIX = "[EPC-W4-03D][CommercialCoverageShadow]";
const PRIMARY_SOURCE = "Master Catalog";
const SHADOW_SOURCE = "creditPfCatalog";
const COMPARISON_CONSUMER = "CommercialCoveragePage";

const normalizeText = (value: string): string => value.trim().replace(/\s+/g, " ");

const normalizeCode = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : null;
};

const normalizeName = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return normalizeText(value);
};

const sortUnique = (values: Iterable<string>): string[] =>
  Array.from(new Set(values)).sort((left, right) => left.localeCompare(right, "pt-BR"));

const buildDuplicateCodes = (codes: string[]): string[] => {
  const counts = new Map<string, number>();

  codes.forEach((code) => {
    counts.set(code, (counts.get(code) ?? 0) + 1);
  });

  return sortUnique(
    Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([code]) => code),
  );
};

const buildMasterCatalog = (tree: MasterCatalogTreeDto): ComparisonCatalog => {
  const products: ComparisonProduct[] = [];
  const invalidProductCodes: string[] = [];
  const invalidSubproductCodes: string[] = [];

  (tree.products ?? []).forEach((product) => {
    const productCode = normalizeCode(product.code);
    if (!productCode) {
      invalidProductCodes.push(normalizeName(product.name));
      return;
    }

    const subproducts: ComparisonSubproduct[] = [];
    (product.subproducts ?? []).forEach((subproduct) => {
      const subproductCode = normalizeCode(subproduct.code);
      if (!subproductCode) {
        invalidSubproductCodes.push(`${productCode}::${normalizeName(subproduct.name)}`);
        return;
      }

      subproducts.push({
        code: subproductCode,
        name: normalizeName(subproduct.name),
      });
    });

    products.push({
      code: productCode,
      name: normalizeName(product.name),
      subproducts,
    });
  });

  return {
    products,
    invalidProductCodes: sortUnique(invalidProductCodes),
    invalidSubproductCodes: sortUnique(invalidSubproductCodes),
    productCount: products.length,
    subproductCount: products.reduce((count, product) => count + product.subproducts.length, 0),
  };
};

const buildCompatibilityCatalog = (catalog: CreditProduct[]): ComparisonCatalog => {
  const products: ComparisonProduct[] = [];
  const invalidProductCodes: string[] = [];
  const invalidSubproductCodes: string[] = [];

  (catalog ?? []).forEach((product) => {
    if (!product.active) {
      return;
    }

    const productCode = normalizeCode(product.code);
    if (!productCode) {
      invalidProductCodes.push(normalizeName(product.name));
      return;
    }

    const subproducts: ComparisonSubproduct[] = [];
    (product.subproducts ?? []).forEach((subproduct) => {
      if (!subproduct.active) {
        return;
      }

      const subproductCode = normalizeCode(subproduct.code);
      if (!subproductCode) {
        invalidSubproductCodes.push(`${productCode}::${normalizeName(subproduct.name)}`);
        return;
      }

      subproducts.push({
        code: subproductCode,
        name: normalizeName(subproduct.name),
      });
    });

    products.push({
      code: productCode,
      name: normalizeName(product.name),
      subproducts,
    });
  });

  return {
    products,
    invalidProductCodes: sortUnique(invalidProductCodes),
    invalidSubproductCodes: sortUnique(invalidSubproductCodes),
    productCount: products.length,
    subproductCount: products.reduce((count, product) => count + product.subproducts.length, 0),
  };
};

const compareCollections = (
  primary: ComparisonProduct[],
  shadow: ComparisonProduct[],
): CollectionsComparison => {
  const primaryProductMap = new Map(primary.map((item) => [item.code, item]));
  const shadowProductMap = new Map(shadow.map((item) => [item.code, item]));

  const primaryProductCodes = primary.map((item) => item.code);
  const shadowProductCodes = shadow.map((item) => item.code);

  const matchedProductCodes = sortUnique(
    primaryProductCodes.filter((code) => shadowProductMap.has(code)),
  );
  const missingInCompatibility = sortUnique(
    primaryProductCodes.filter((code) => !shadowProductMap.has(code)),
  );
  const missingInMaster = sortUnique(
    shadowProductCodes.filter((code) => !primaryProductMap.has(code)),
  );

  const matchedSubproductCodes: string[] = [];
  const missingSubproductInCompatibility: string[] = [];
  const missingSubproductInMaster: string[] = [];
  const divergentNames: string[] = [];
  const primarySubproductCodesAll = primary.flatMap((product) =>
    product.subproducts.map((subproduct) => `${product.code}::${subproduct.code}`),
  );
  const shadowSubproductCodesAll = shadow.flatMap((product) =>
    product.subproducts.map((subproduct) => `${product.code}::${subproduct.code}`),
  );

  matchedProductCodes.forEach((productCode) => {
    const primaryProduct = primaryProductMap.get(productCode);
    const shadowProduct = shadowProductMap.get(productCode);

    if (!primaryProduct || !shadowProduct) {
      return;
    }

    if (primaryProduct.name !== shadowProduct.name) {
      divergentNames.push(`product::${productCode}`);
    }

    const primarySubproductMap = new Map(primaryProduct.subproducts.map((item) => [item.code, item]));
    const shadowSubproductMap = new Map(shadowProduct.subproducts.map((item) => [item.code, item]));

    const primarySubproductCodes = primaryProduct.subproducts.map((item) => item.code);
    const shadowSubproductCodes = shadowProduct.subproducts.map((item) => item.code);

    const matchedSubproductCodesForProduct = sortUnique(
      primarySubproductCodes.filter((code) => shadowSubproductMap.has(code)),
    );
    const missingCompatibilityForProduct = sortUnique(
      primarySubproductCodes.filter((code) => !shadowSubproductMap.has(code)),
    );
    const missingMasterForProduct = sortUnique(
      shadowSubproductCodes.filter((code) => !primarySubproductMap.has(code)),
    );

    matchedSubproductCodes.push(
      ...matchedSubproductCodesForProduct.map((subproductCode) => `${productCode}::${subproductCode}`),
    );
    missingSubproductInCompatibility.push(
      ...missingCompatibilityForProduct.map((subproductCode) => `${productCode}::${subproductCode}`),
    );
    missingSubproductInMaster.push(
      ...missingMasterForProduct.map((subproductCode) => `${productCode}::${subproductCode}`),
    );

    matchedSubproductCodesForProduct.forEach((subproductCode) => {
      const primarySubproduct = primarySubproductMap.get(subproductCode);
      const shadowSubproduct = shadowSubproductMap.get(subproductCode);

      if (primarySubproduct && shadowSubproduct && primarySubproduct.name !== shadowSubproduct.name) {
        divergentNames.push(`subproduct::${productCode}::${subproductCode}`);
      }
    });
  });

  const duplicateCodes = sortUnique([
    ...buildDuplicateCodes(primaryProductCodes),
    ...buildDuplicateCodes(shadowProductCodes),
    ...buildDuplicateCodes(primarySubproductCodesAll),
    ...buildDuplicateCodes(shadowSubproductCodesAll),
  ]);

  return {
    matchedProductCodes,
    missingInMaster,
    missingInCompatibility,
    matchedSubproductCodes: sortUnique(matchedSubproductCodes),
    missingSubproductInMaster: sortUnique(missingSubproductInMaster),
    missingSubproductInCompatibility: sortUnique(missingSubproductInCompatibility),
    divergentNames: sortUnique(divergentNames),
    duplicateCodes,
  };
};

const hasAnyDifference = (
  comparison: CollectionsComparison,
  primaryCatalog: ComparisonCatalog,
  shadowCatalog: ComparisonCatalog,
): boolean =>
  comparison.missingInMaster.length > 0 ||
  comparison.missingInCompatibility.length > 0 ||
  comparison.missingSubproductInMaster.length > 0 ||
  comparison.missingSubproductInCompatibility.length > 0 ||
  comparison.divergentNames.length > 0 ||
  comparison.duplicateCodes.length > 0 ||
  primaryCatalog.productCount !== shadowCatalog.productCount ||
  primaryCatalog.subproductCount !== shadowCatalog.subproductCount ||
  primaryCatalog.invalidProductCodes.length > 0 ||
  shadowCatalog.invalidProductCodes.length > 0 ||
  primaryCatalog.invalidSubproductCodes.length > 0 ||
  shadowCatalog.invalidSubproductCodes.length > 0;

const getComparisonStatus = (
  comparison: CollectionsComparison,
  primaryCatalog: ComparisonCatalog,
  shadowCatalog: ComparisonCatalog,
): CommercialCoverageShadowComparisonStatus => {
  if (primaryCatalog.productCount === 0 && shadowCatalog.productCount === 0) {
    return hasAnyDifference(comparison, primaryCatalog, shadowCatalog) ? "DIVERGENT" : "EMPTY";
  }

  return hasAnyDifference(comparison, primaryCatalog, shadowCatalog) ? "DIVERGENT" : "MATCH";
};

export const compareCommercialCoverageShadow = (
  masterTree: MasterCatalogTreeDto,
  compatibilityCatalog: CreditProduct[],
): CommercialCoverageShadowComparisonResult => {
  const primaryCatalog = buildMasterCatalog(masterTree);
  const shadowCatalog = buildCompatibilityCatalog(compatibilityCatalog);
  const comparison = compareCollections(primaryCatalog.products, shadowCatalog.products);

  return {
    consumer: COMPARISON_CONSUMER,
    primarySource: PRIMARY_SOURCE,
    shadowSource: SHADOW_SOURCE,
    comparedAt: new Date().toISOString(),
    comparisonStatus: getComparisonStatus(comparison, primaryCatalog, shadowCatalog),
    productCounts: {
      primary: primaryCatalog.productCount,
      shadow: shadowCatalog.productCount,
      matched: comparison.matchedProductCodes.length,
      missingInPrimary: comparison.missingInMaster.length,
      missingInShadow: comparison.missingInCompatibility.length,
    },
    subproductCounts: {
      primary: primaryCatalog.subproductCount,
      shadow: shadowCatalog.subproductCount,
      matched: comparison.matchedSubproductCodes.length,
      missingInPrimary: comparison.missingSubproductInMaster.length,
      missingInShadow: comparison.missingSubproductInCompatibility.length,
    },
    matchedProductCodes: comparison.matchedProductCodes,
    matchedSubproductCodes: comparison.matchedSubproductCodes,
    missingInMaster: comparison.missingInMaster,
    missingInCompatibility: comparison.missingInCompatibility,
    missingSubproductInMaster: comparison.missingSubproductInMaster,
    missingSubproductInCompatibility: comparison.missingSubproductInCompatibility,
    divergentNames: comparison.divergentNames,
    duplicateCodes: comparison.duplicateCodes,
    invalidProductCodes: {
      master: primaryCatalog.invalidProductCodes,
      compatibility: shadowCatalog.invalidProductCodes,
    },
    invalidSubproductCodes: {
      master: primaryCatalog.invalidSubproductCodes,
      compatibility: shadowCatalog.invalidSubproductCodes,
    },
  };
};

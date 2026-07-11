import { beforeEach, describe, expect, it, vi } from "vitest";
import { creditPfCatalog } from "../../data/creditPfCatalog";

const mocks = vi.hoisted(() => ({
  getCatalogTree: vi.fn(),
  mapCoverageTree: vi.fn(),
  compareShadow: vi.fn(),
}));

vi.mock("../../api/modules/master-catalog.api", () => ({
  masterCatalogApi: {
    getCatalogTree: mocks.getCatalogTree,
  },
}));

vi.mock("./commercialStructureCoverage.mapper", () => ({
  masterCatalogTreeToCoverageTree: mocks.mapCoverageTree,
}));

vi.mock("./commercialCoverageShadowComparator", () => ({
  compareCommercialCoverageShadow: mocks.compareShadow,
}));

import { loadCommercialStructureCoverageTree } from "./loadCommercialStructureCoverageTree";

describe("loadCommercialStructureCoverageTree", () => {
  beforeEach(() => {
    mocks.getCatalogTree.mockReset();
    mocks.mapCoverageTree.mockReset();
    mocks.compareShadow.mockReset();
  });

  it("returns the official tree unchanged and logs a MATCH summary", async () => {
    const masterTree = {
      segments: [],
      products: [],
    };
    const coverageTree = {
      segments: [],
      products: [],
    };
    const comparison = {
      consumer: "CommercialCoveragePage",
      primarySource: "Master Catalog",
      shadowSource: "creditPfCatalog",
      comparedAt: "2026-07-11T00:00:00.000Z",
      comparisonStatus: "MATCH",
      productCounts: {
        primary: 0,
        shadow: 0,
        matched: 0,
        missingInPrimary: 0,
        missingInShadow: 0,
      },
      subproductCounts: {
        primary: 0,
        shadow: 0,
        matched: 0,
        missingInPrimary: 0,
        missingInShadow: 0,
      },
      matchedProductCodes: [],
      matchedSubproductCodes: [],
      missingInMaster: [],
      missingInCompatibility: [],
      missingSubproductInMaster: [],
      missingSubproductInCompatibility: [],
      divergentNames: [],
      duplicateCodes: [],
      invalidProductCodes: {
        master: [],
        compatibility: [],
      },
      invalidSubproductCodes: {
        master: [],
        compatibility: [],
      },
    } as const;

    mocks.getCatalogTree.mockResolvedValue(masterTree);
    mocks.mapCoverageTree.mockReturnValue(coverageTree);
    mocks.compareShadow.mockReturnValue(comparison);

    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await loadCommercialStructureCoverageTree();

    expect(result).toBe(coverageTree);
    expect(mocks.getCatalogTree).toHaveBeenCalledWith({ status: "ACTIVE" });
    expect(mocks.mapCoverageTree).toHaveBeenCalledWith(masterTree);
    expect(mocks.compareShadow).toHaveBeenCalledWith(masterTree, creditPfCatalog);
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();

    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("logs divergences without changing the returned tree", async () => {
    const masterTree = {
      segments: [],
      products: [],
    };
    const coverageTree = {
      segments: [],
      products: [],
    };
    const comparison = {
      consumer: "CommercialCoveragePage",
      primarySource: "Master Catalog",
      shadowSource: "creditPfCatalog",
      comparedAt: "2026-07-11T00:00:00.000Z",
      comparisonStatus: "DIVERGENT",
      productCounts: {
        primary: 1,
        shadow: 1,
        matched: 0,
        missingInPrimary: 0,
        missingInShadow: 0,
      },
      subproductCounts: {
        primary: 0,
        shadow: 0,
        matched: 0,
        missingInPrimary: 0,
        missingInShadow: 0,
      },
      matchedProductCodes: [],
      matchedSubproductCodes: [],
      missingInMaster: [],
      missingInCompatibility: ["CONSIGNADO"],
      missingSubproductInMaster: [],
      missingSubproductInCompatibility: [],
      divergentNames: ["product::CONSIGNADO"],
      duplicateCodes: [],
      invalidProductCodes: {
        master: [],
        compatibility: [],
      },
      invalidSubproductCodes: {
        master: [],
        compatibility: [],
      },
    } as const;

    mocks.getCatalogTree.mockResolvedValue(masterTree);
    mocks.mapCoverageTree.mockReturnValue(coverageTree);
    mocks.compareShadow.mockReturnValue(comparison);

    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await loadCommercialStructureCoverageTree();

    expect(result).toBe(coverageTree);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();

    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("propagates master failures and does not execute the shadow", async () => {
    const error = new Error("Master offline");
    mocks.getCatalogTree.mockRejectedValue(error);

    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(loadCommercialStructureCoverageTree()).rejects.toThrow("Master offline");
    expect(mocks.compareShadow).not.toHaveBeenCalled();
    expect(mocks.mapCoverageTree).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();

    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("keeps the UI return intact when the shadow comparison fails", async () => {
    const masterTree = {
      segments: [],
      products: [],
    };
    const coverageTree = {
      segments: [],
      products: [],
    };

    mocks.getCatalogTree.mockResolvedValue(masterTree);
    mocks.mapCoverageTree.mockReturnValue(coverageTree);
    mocks.compareShadow.mockImplementation(() => {
      throw new Error("Shadow failure");
    });

    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await loadCommercialStructureCoverageTree();

    expect(result).toBe(coverageTree);
    expect(mocks.getCatalogTree).toHaveBeenCalledWith({ status: "ACTIVE" });
    expect(mocks.mapCoverageTree).toHaveBeenCalledWith(masterTree);
    expect(mocks.compareShadow).toHaveBeenCalledWith(masterTree, creditPfCatalog);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();

    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});

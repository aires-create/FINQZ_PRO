import { describe, expect, it } from "vitest";
import type { MasterCatalogTreeDto } from "../../api/modules/master-catalog.api";
import { masterCatalogTreeToCoverageTree } from "./commercialStructureCoverage.mapper";

describe("commercialStructureCoverage mapper", () => {
  it("maps Master Catalog tree to Commercial Structure Coverage tree", () => {
    const tree: MasterCatalogTreeDto = {
      segments: [
        {
          id: "segment-1",
          code: "INSS",
          name: "INSS",
          status: "ACTIVE",
          displayOrder: 1,
        },
      ],
      products: [
        {
          id: "product-1",
          code: "CREDIT",
          name: "Crédito",
          status: "ACTIVE",
          displayOrder: 1,
          subproducts: [
            {
              id: "subproduct-1",
              code: "PAYROLL",
              name: "Consignado",
              status: "ACTIVE",
              displayOrder: 1,
              modalities: [
                {
                  id: "modality-1",
                  code: "NEW_LOAN",
                  name: "Novo Empréstimo",
                  status: "ACTIVE",
                  displayOrder: 1,
                },
              ],
            },
          ],
        },
      ],
    };

    const coverageTree = masterCatalogTreeToCoverageTree(tree);

    expect(coverageTree.segments[0]).toEqual({
      id: "segment-1",
      code: "INSS",
      name: "INSS",
      status: "ACTIVE",
      displayOrder: 1,
    });

    expect(coverageTree.products[0]?.subproducts[0]).toMatchObject({
      id: "subproduct-1",
      productId: "product-1",
      code: "PAYROLL",
      status: "ACTIVE",
    });

    expect(
      coverageTree.products[0]?.subproducts[0]?.modalities[0],
    ).toMatchObject({
      id: "modality-1",
      subproductId: "subproduct-1",
      code: "NEW_LOAN",
      status: "ACTIVE",
    });
  });

  it("maps non-active catalog statuses to coverage statuses", () => {
    const tree: MasterCatalogTreeDto = {
      segments: [
        {
          id: "segment-inactive",
          code: "INACTIVE_SEGMENT",
          name: "Inactive Segment",
          status: "INACTIVE",
          displayOrder: 1,
        },
      ],
      products: [
        {
          id: "product-archived",
          code: "ARCHIVED_PRODUCT",
          name: "Archived Product",
          status: "ARCHIVED",
          displayOrder: 1,
          subproducts: [],
        },
      ],
    };

    const coverageTree = masterCatalogTreeToCoverageTree(tree);

    expect(coverageTree.segments[0]?.status).toBe("INACTIVE");
    expect(coverageTree.products[0]?.status).toBe("SUSPENDED");
  });
});

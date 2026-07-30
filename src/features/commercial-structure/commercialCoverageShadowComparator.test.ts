import { describe, expect, it } from "vitest";
import type { MasterCatalogTreeDto } from "../../api/modules/master-catalog.api";
import type { CreditProduct } from "../../data/creditPfCatalog";
import { compareCommercialCoverageShadow } from "./commercialCoverageShadowComparator";

const buildMasterTree = (): MasterCatalogTreeDto => ({
  segments: [
    {
      id: "segment-ignored",
      code: "SEG-IGNORED",
      name: "Segmento Ignorado",
      status: "ACTIVE",
      displayOrder: 99,
    },
  ],
  products: [
    {
      id: "product-consignado",
      code: "CONSIGNADO",
      name: "Consignado",
      status: "ACTIVE",
      displayOrder: 1,
      subproducts: [
        {
          id: "subproduct-inss",
          code: "INSS",
          name: "INSS",
          status: "ACTIVE",
          displayOrder: 1,
          modalities: [],
        },
      ],
    },
    {
      id: "product-credito",
      code: "CREDITO_PESSOAL_CDC",
      name: "Crédito Pessoal CDC",
      status: "ACTIVE",
      displayOrder: 2,
      subproducts: [],
    },
  ],
});

describe("commercialCoverageShadowComparator", () => {
  it("compares equivalent structures without mutating inputs", () => {
    const masterTree = buildMasterTree();
    const compatibilityCatalog = [
      {
        id: "compatibility-consignado",
        code: "CONSIGNADO",
        name: "Consignado",
        groupCode: "CREDITO_PF",
        groupName: "Crédito PF",
        version: 1,
        active: true,
        providers: ["DEFAULT"],
        pipelineId: "pipeline-consignado",
        pipelineCode: "PIPELINE_CONSIGNADO",
        pipelineName: "Pipeline - Consignado",
        automationEvents: [],
        subproducts: [
          {
            id: "compatibility-inss",
            code: "INSS",
            name: "INSS",
            active: true,
            modalities: [],
            rules: {},
          },
        ],
      },
      {
        id: "compatibility-credito",
        code: "CREDITO_PESSOAL_CDC",
        name: "Crédito Pessoal CDC",
        groupCode: "CREDITO_PF",
        groupName: "Crédito PF",
        version: 1,
        active: true,
        providers: ["DEFAULT"],
        pipelineId: "pipeline-credito-pessoal-cdc",
        pipelineCode: "PIPELINE_CREDITO_PESSOAL_CDC",
        pipelineName: "Pipeline - Crédito Pessoal",
        automationEvents: [],
        subproducts: [],
      },
    ];
    const masterSnapshot = JSON.stringify(masterTree);
    const compatibilitySnapshot = JSON.stringify(compatibilityCatalog);

    const result = compareCommercialCoverageShadow(masterTree, compatibilityCatalog);

    expect(result.consumer).toBe("CommercialCoveragePage");
    expect(result.comparisonStatus).toBe("MATCH");
    expect(result.matchedProductCodes).toEqual([
      "CONSIGNADO",
      "CREDITO_PESSOAL_CDC",
    ]);
    expect(result.matchedSubproductCodes).toEqual(["CONSIGNADO::INSS"]);
    expect(result.missingInMaster).toEqual([]);
    expect(result.missingInCompatibility).toEqual([]);
    expect(masterTree).toEqual(JSON.parse(masterSnapshot));
    expect(compatibilityCatalog).toEqual(JSON.parse(compatibilitySnapshot));
  });

  it("reports missing products, missing subproducts and divergent names", () => {
    const masterTree: MasterCatalogTreeDto = {
      segments: [],
      products: [
        {
          id: "product-consignado",
          code: "CONSIGNADO",
          name: "Consignado Master",
          status: "ACTIVE",
          displayOrder: 1,
          subproducts: [
            {
              id: "subproduct-inss",
              code: "INSS",
              name: "INSS Master",
              status: "ACTIVE",
              displayOrder: 1,
              modalities: [],
            },
            {
              id: "subproduct-federal",
              code: "FEDERAL",
              name: "Federal Master",
              status: "ACTIVE",
              displayOrder: 2,
              modalities: [],
            },
          ],
        },
      ],
    };

    const compatibilityCatalog = [
      {
        id: "compatibility-consignado",
        code: "CONSIGNADO",
        name: "Consignado Compatibilidade",
        groupCode: "CREDITO_PF",
        groupName: "Crédito PF",
        version: 1,
        active: true,
        providers: ["DEFAULT"],
        pipelineId: "pipeline-consignado",
        pipelineCode: "PIPELINE_CONSIGNADO",
        pipelineName: "Pipeline - Consignado",
        automationEvents: [],
        subproducts: [
          {
            id: "compatibility-inss",
            code: "INSS",
            name: "INSS Compatibilidade",
            active: true,
            modalities: [],
            rules: {},
          },
        ],
      },
      {
        id: "compatibility-novo",
        code: "NOVO_PRODUTO",
        name: "Novo Produto",
        groupCode: "CREDITO_PF",
        groupName: "Crédito PF",
        version: 1,
        active: true,
        providers: ["DEFAULT"],
        pipelineId: "pipeline-novo",
        pipelineCode: "PIPELINE_NOVO",
        pipelineName: "Pipeline - Novo",
        automationEvents: [],
        subproducts: [],
      },
    ];

    const result = compareCommercialCoverageShadow(masterTree, compatibilityCatalog);

    expect(result.comparisonStatus).toBe("DIVERGENT");
    expect(result.missingInMaster).toEqual(["NOVO_PRODUTO"]);
    expect(result.missingInCompatibility).toEqual([]);
    expect(result.missingSubproductInCompatibility).toEqual(["CONSIGNADO::FEDERAL"]);
    expect(result.missingSubproductInMaster).toEqual([]);
    expect(result.divergentNames).toEqual([
      "product::CONSIGNADO",
      "subproduct::CONSIGNADO::INSS",
    ]);
  });

  it("ignores segments, ids, slugs and keeps deterministic output", () => {
    const masterTree: MasterCatalogTreeDto = {
      segments: [
        {
          id: "segment-1",
          code: "SEGMENTO-1",
          name: "Segmento 1",
          status: "ACTIVE",
          displayOrder: 9,
        },
      ],
      products: [
        {
          id: "product-1",
          code: "CONSIGNADO",
          name: "Consignado",
          status: "ACTIVE",
          displayOrder: 3,
          subproducts: [
            {
              id: "subproduct-1",
              code: "INSS",
              name: "INSS",
              status: "ACTIVE",
              displayOrder: 2,
              modalities: [],
            },
          ],
        },
      ],
    };

    const compatibilityCatalog = [
      {
        id: "compatibility-consignado",
        code: "CONSIGNADO",
        name: "Consignado",
        groupCode: "CREDITO_PF",
        groupName: "Crédito PF",
        version: 1,
        active: true,
        providers: ["DEFAULT"],
        pipelineId: "pipeline-consignado",
        pipelineCode: "PIPELINE_CONSIGNADO",
        pipelineName: "Pipeline - Consignado",
        automationEvents: [],
        slug: "compatibility-slug-ignored",
        subproducts: [
          {
            id: "compatibility-subproduct-id-ignored",
            code: "INSS",
            name: "INSS",
            active: true,
            modalities: [],
            rules: {},
            slug: "compatibility-subproduct-slug-ignored",
          },
        ],
      },
    ] as unknown as CreditProduct[];

    const firstResult = compareCommercialCoverageShadow(masterTree, compatibilityCatalog);
    const secondResult = compareCommercialCoverageShadow(masterTree, compatibilityCatalog);

    expect(firstResult.comparisonStatus).toBe("MATCH");
    expect(firstResult).toEqual({
      ...secondResult,
      comparedAt: firstResult.comparedAt,
    });
    expect(firstResult.matchedProductCodes).toEqual(["CONSIGNADO"]);
    expect(firstResult.matchedSubproductCodes).toEqual(["CONSIGNADO::INSS"]);
  });

  it("treats invalid codes safely and reports duplicate codes", () => {
    const masterTree: MasterCatalogTreeDto = {
      segments: [],
      products: [
        {
          id: "product-valid",
          code: "VALIDO",
          name: "Válido",
          status: "ACTIVE",
          displayOrder: 1,
          subproducts: [],
        },
        {
          id: "product-duplicate-1",
          code: "DUPLICADO",
          name: "Duplicado 1",
          status: "ACTIVE",
          displayOrder: 2,
          subproducts: [],
        },
        {
          id: "product-duplicate-2",
          code: "DUPLICADO",
          name: "Duplicado 2",
          status: "ACTIVE",
          displayOrder: 3,
          subproducts: [],
        },
        {
          id: "product-invalid",
          code: "   ",
          name: "Inválido",
          status: "ACTIVE",
          displayOrder: 4,
          subproducts: [],
        },
      ],
    };

    const compatibilityCatalog = [
      {
        id: "shadow-valid",
        code: "VALIDO",
        name: "Válido",
        active: true,
        groupCode: "G",
        groupName: "G",
        version: 1,
        providers: [],
        pipelineId: "pipeline",
        pipelineCode: "PIPELINE",
        pipelineName: "Pipeline",
        automationEvents: [],
        subproducts: [],
      },
      {
        id: "shadow-duplicate-1",
        code: "DUPLICADO",
        name: "Duplicado 1",
        active: true,
        groupCode: "G",
        groupName: "G",
        version: 1,
        providers: [],
        pipelineId: "pipeline",
        pipelineCode: "PIPELINE",
        pipelineName: "Pipeline",
        automationEvents: [],
        subproducts: [],
      },
      {
        id: "shadow-duplicate-2",
        code: "DUPLICADO",
        name: "Duplicado 2",
        active: true,
        groupCode: "G",
        groupName: "G",
        version: 1,
        providers: [],
        pipelineId: "pipeline",
        pipelineCode: "PIPELINE",
        pipelineName: "Pipeline",
        automationEvents: [],
        subproducts: [],
      },
      {
        id: "shadow-invalid",
        code: "",
        name: "Inválido",
        active: true,
        groupCode: "G",
        groupName: "G",
        version: 1,
        providers: [],
        pipelineId: "pipeline",
        pipelineCode: "PIPELINE",
        pipelineName: "Pipeline",
        automationEvents: [],
        subproducts: [],
      },
    ];

    const result = compareCommercialCoverageShadow(masterTree, compatibilityCatalog);

    expect(result.comparisonStatus).toBe("DIVERGENT");
    expect(result.duplicateCodes).toEqual(["DUPLICADO"]);
    expect(result.invalidProductCodes.master).toEqual(["Inválido"]);
    expect(result.invalidProductCodes.compatibility).toEqual(["Inválido"]);
  });

  it("returns EMPTY for empty inputs", () => {
    const result = compareCommercialCoverageShadow({ segments: [], products: [] }, []);

    expect(result.comparisonStatus).toBe("EMPTY");
    expect(result.productCounts).toEqual({
      primary: 0,
      shadow: 0,
      matched: 0,
      missingInPrimary: 0,
      missingInShadow: 0,
    });
    expect(result.subproductCounts).toEqual({
      primary: 0,
      shadow: 0,
      matched: 0,
      missingInPrimary: 0,
      missingInShadow: 0,
    });
  });
});

import { describe, expect, it } from "vitest";
import { masterCatalogToEstruturaComercial } from "./masterCatalogToEstruturaComercial.mapper";
import type { MasterCatalogTreeDto } from "../../api/modules/master-catalog.api";

const sampleTree: MasterCatalogTreeDto = {
  segments: [
    {
      id: "segment-clt",
      code: "CLT",
      name: "CLT",
      status: "ACTIVE",
      displayOrder: 2,
    },
    {
      id: "segment-inss",
      code: "INSS",
      name: "INSS",
      status: "ARCHIVED",
      displayOrder: 1,
    },
  ],
  products: [
    {
      id: "product-energia",
      code: "ENERGIA_POR_ASSINATURA",
      name: "Energia por Assinatura",
      status: "INACTIVE",
      displayOrder: 2,
      subproducts: [],
    },
    {
      id: "product-consignado",
      code: "CONSIGNADO",
      name: "Consignado",
      status: "ACTIVE",
      displayOrder: 1,
      subproducts: [
        {
          id: "subproduct-cartao-rmc",
          code: "CARTAO_RMC",
          name: "Cartão RMC",
          status: "ACTIVE",
          displayOrder: 2,
          modalities: [
            {
              id: "modality-cartao-saque",
              code: "CARTAO_SAQUE",
              name: "Cartão + Saque",
              status: "ACTIVE",
              displayOrder: 2,
            },
            {
              id: "modality-cartao",
              code: "CARTAO",
              name: "Cartão",
              status: "INACTIVE",
              displayOrder: 1,
            },
          ],
        },
      ],
    },
  ],
};

describe("masterCatalogToEstruturaComercial", () => {
  it("creates vertical, product, subproduct and modality nodes with stable order", () => {
    const result = masterCatalogToEstruturaComercial(sampleTree);

    expect(result).toEqual([
      expect.objectContaining({
        id: 1,
        nivel: "vertical",
        nome: "INSS",
        codigo: "INSS",
        ativo: 0,
        parent_id: undefined,
        ordem: 1,
        sync_status: "synced",
        automation_enabled: false,
        automation_status: "disabled",
      }),
      expect.objectContaining({
        id: 2,
        nivel: "vertical",
        nome: "CLT",
        codigo: "CLT",
        ativo: 1,
        parent_id: undefined,
        ordem: 2,
      }),
      expect.objectContaining({
        id: 3,
        nivel: "produto",
        nome: "Consignado",
        codigo: "CONSIGNADO",
        ativo: 1,
        parent_id: undefined,
        ordem: 1,
      }),
      expect.objectContaining({
        id: 4,
        nivel: "subproduto",
        nome: "Cartão RMC",
        codigo: "CARTAO_RMC",
        ativo: 1,
        parent_id: 3,
        ordem: 2,
      }),
      expect.objectContaining({
        id: 5,
        nivel: "tabela_plano_campanha",
        nome: "Cartão",
        codigo: "CARTAO",
        ativo: 0,
        parent_id: 4,
        ordem: 1,
      }),
      expect.objectContaining({
        id: 6,
        nivel: "tabela_plano_campanha",
        nome: "Cartão + Saque",
        codigo: "CARTAO_SAQUE",
        ativo: 1,
        parent_id: 4,
        ordem: 2,
      }),
      expect.objectContaining({
        id: 7,
        nivel: "produto",
        nome: "Energia por Assinatura",
        codigo: "ENERGIA_POR_ASSINATURA",
        ativo: 0,
        parent_id: undefined,
        ordem: 2,
      }),
    ]);
  });

  it("does not invent a segment-to-product relationship", () => {
    const result = masterCatalogToEstruturaComercial(sampleTree);

    const product = result.find((item) => item.nivel === "produto" && item.codigo === "CONSIGNADO");
    const segment = result.find((item) => item.nivel === "vertical" && item.codigo === "INSS");

    expect(segment?.parent_id).toBeUndefined();
    expect(product?.parent_id).toBeUndefined();
  });

  it("preserves the minimum presentation fields and keeps timestamps deterministic", () => {
    const result = masterCatalogToEstruturaComercial(sampleTree);

    for (const item of result) {
      expect(item).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          nivel: expect.any(String),
          nome: expect.any(String),
          ativo: expect.any(Number),
          created_at: 0,
          updated_at: 0,
          sync_status: "synced",
          automation_enabled: false,
          automation_status: "disabled",
        }),
      );
    }
  });
});

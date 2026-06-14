import type {
  MasterCatalogModalityDto,
  MasterCatalogProductDto,
  MasterCatalogSegmentDto,
  MasterCatalogSubproductDto,
  MasterCatalogTreeDto,
} from "../../api/modules/master-catalog.api";
import type { EstruturaComercial } from "../../types";

const ACTIVE_TO_ATIVO: Record<string, 0 | 1> = {
  ACTIVE: 1,
  INACTIVE: 0,
  ARCHIVED: 0,
};

type OrderedItem<T> = T & {
  displayOrder?: number;
  name: string;
};

const sortByDisplayOrderThenName = <T extends OrderedItem<T>>(items: T[]): T[] =>
  [...items].sort((left, right) => {
    const leftOrder = Number.isFinite(left.displayOrder) ? left.displayOrder ?? 0 : 0;
    const rightOrder = Number.isFinite(right.displayOrder) ? right.displayOrder ?? 0 : 0;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" });
  });

const buildNodeBase = (
  id: number,
  nivel: EstruturaComercial["nivel"],
  nome: string,
  codigo: string | undefined,
  descricao: string,
  ativo: 0 | 1,
  parent_id?: number | null,
  ordem?: number,
): EstruturaComercial => ({
  id,
  parent_id: parent_id ?? undefined,
  nivel,
  nome,
  codigo,
  descricao,
  ativo,
  ordem,
  created_at: 0,
  updated_at: 0,
  sync_status: "synced",
  automation_enabled: false,
  automation_status: "disabled",
});

const mapSegment = (
  segment: MasterCatalogSegmentDto,
  id: number,
): EstruturaComercial => {
  return buildNodeBase(
    id,
    "vertical",
    segment.name,
    segment.code,
    `Segmento comercial: ${segment.name}`,
    ACTIVE_TO_ATIVO[segment.status] ?? 0,
    null,
    segment.displayOrder,
  );
};

const mapProduct = (
  product: MasterCatalogProductDto,
  id: number,
): EstruturaComercial => {
  return buildNodeBase(
    id,
    "produto",
    product.name,
    product.code,
    `Produto comercial: ${product.name}`,
    ACTIVE_TO_ATIVO[product.status] ?? 0,
    null,
    product.displayOrder,
  );
};

const mapSubproduct = (
  subproduct: MasterCatalogSubproductDto,
  id: number,
  parentId: number,
): EstruturaComercial => {
  return buildNodeBase(
    id,
    "subproduto",
    subproduct.name,
    subproduct.code,
    `Subproduto comercial: ${subproduct.name}`,
    ACTIVE_TO_ATIVO[subproduct.status] ?? 0,
    parentId,
    subproduct.displayOrder,
  );
};

const mapModality = (
  modality: MasterCatalogModalityDto,
  id: number,
  parentId: number,
): EstruturaComercial => {
  return buildNodeBase(
    id,
    "tabela_plano_campanha",
    modality.name,
    modality.code,
    `Modalidade comercial: ${modality.name}`,
    ACTIVE_TO_ATIVO[modality.status] ?? 0,
    parentId,
    modality.displayOrder,
  );
};

export const masterCatalogToEstruturaComercial = (
  tree: MasterCatalogTreeDto,
): EstruturaComercial[] => {
  const result: EstruturaComercial[] = [];
  let nextId = 1;

  const segments = sortByDisplayOrderThenName([...(tree.segments ?? [])]);
  const products = sortByDisplayOrderThenName([...(tree.products ?? [])]);

  segments.forEach((segment) => {
    result.push(mapSegment(segment, nextId));
    nextId += 1;
  });

  products.forEach((product) => {
    const productId = nextId;
    result.push(mapProduct(product, productId));
    nextId += 1;

    const subproducts = sortByDisplayOrderThenName([...(product.subproducts ?? [])]);

    subproducts.forEach((subproduct) => {
      const subproductId = nextId;
      result.push(mapSubproduct(subproduct, subproductId, productId));
      nextId += 1;

      const modalities = sortByDisplayOrderThenName([...(subproduct.modalities ?? [])]);

      modalities.forEach((modality) => {
        result.push(mapModality(modality, nextId, subproductId));
        nextId += 1;
      });
    });
  });

  return result;
};

export const CATALOG_STATUSES = [
  'DRAFT',
  'ACTIVE',
  'INACTIVE',
  'ARCHIVED',
] as const;

export type CatalogStatus = (typeof CATALOG_STATUSES)[number];

export const CATALOG_SEGMENT_CODES = [
  'INSS',
  'SERVIDOR_PUBLICO',
  'FORCAS_ARMADAS',
  'CLT',
  'FGTS',
  'OUTROS_CONVENIOS',
] as const;

export type CatalogSegmentCode = (typeof CATALOG_SEGMENT_CODES)[number];

export interface MasterCatalogEntityBase {
  tenantId: string;
  id: string;
  code: string;
  name: string;
  status: CatalogStatus;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Segment representa o mercado/convênio.
 * Exemplos conceituais: INSS, Servidor Público, Forças Armadas, CLT, FGTS, Outros Convênios.
 */
export interface CatalogSegment extends MasterCatalogEntityBase {
}

/**
 * Product representa a oferta comercial.
 * Exemplos conceituais: Consignado, Antecipação FGTS, Energia por Assinatura, Seguro, Consórcio.
 */
export interface CatalogProduct extends MasterCatalogEntityBase {
}

/**
 * Subproduct pertence a Product.
 */
export interface CatalogSubproduct extends MasterCatalogEntityBase {
  productId: string;
}

/**
 * Modality pertence a Subproduct.
 */
export interface CatalogModality extends MasterCatalogEntityBase {
  subproductId: string;
}

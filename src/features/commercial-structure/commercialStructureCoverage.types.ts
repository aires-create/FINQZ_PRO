export type CommercialCoverageStatus = "ACTIVE" | "SUSPENDED" | "INACTIVE";

export interface CommercialStructureSegmentView {
  id: string;
  code: string;
  name: string;
  status: CommercialCoverageStatus;
  displayOrder: number;
}

export interface CommercialStructureProductView {
  id: string;
  code: string;
  name: string;
  status: CommercialCoverageStatus;
  displayOrder: number;
}

export interface CommercialStructureSubproductView {
  id: string;
  productId: string;
  code: string;
  name: string;
  status: CommercialCoverageStatus;
  displayOrder: number;
}

export interface CommercialStructureModalityView {
  id: string;
  subproductId: string;
  code: string;
  name: string;
  status: CommercialCoverageStatus;
  displayOrder: number;
}

export interface CommercialStructureCoverageTreeView {
  segments: CommercialStructureSegmentView[];
  products: Array<
    CommercialStructureProductView & {
      subproducts: Array<
        CommercialStructureSubproductView & {
          modalities: CommercialStructureModalityView[];
        }
      >;
    }
  >;
}

import type {
  FindMasterCatalogModalityByCodeInput,
  FindMasterCatalogProductByCodeInput,
  FindMasterCatalogSubproductByCodeInput,
  GetMasterCatalogTreeInput,
  ListMasterCatalogModalitiesBySubproductInput,
  ListMasterCatalogProductsInput,
  ListMasterCatalogSegmentsInput,
  ListMasterCatalogSubproductsByProductInput,
  MasterCatalogServiceContract,
} from '../services/master-catalog.service.contract.js';
import type {
  CatalogModalityDto,
  CatalogProductDto,
  CatalogSegmentDto,
  CatalogSubproductDto,
  MasterCatalogRuntimeMetadataDto,
  MasterCatalogTreeDto,
} from '../dto/master-catalog.dto.js';
import {
  createMasterCatalogRuntimeMetadata,
  toCatalogModalityDto,
  toCatalogProductDto,
  toCatalogSegmentDto,
  toCatalogSubproductDto,
  toMasterCatalogTreeDto,
} from '../dto/master-catalog.dto.js';
import type {
  CatalogModalityReadModel,
  CatalogProductReadModel,
  CatalogSegmentReadModel,
  CatalogSubproductReadModel,
} from '../domain/master-catalog.read-model.js';
import { masterCatalogService } from '../services/master-catalog.service.js';

export interface MasterCatalogRuntimeContract {
  readonly metadata: MasterCatalogRuntimeMetadataDto;

  listSegments(
    input: ListMasterCatalogSegmentsInput,
  ): Promise<CatalogSegmentDto[]>;

  listProducts(
    input: ListMasterCatalogProductsInput,
  ): Promise<CatalogProductDto[]>;

  listSubproductsByProduct(
    input: ListMasterCatalogSubproductsByProductInput,
  ): Promise<CatalogSubproductDto[]>;

  listModalitiesBySubproduct(
    input: ListMasterCatalogModalitiesBySubproductInput,
  ): Promise<CatalogModalityDto[]>;

  getCatalogTree(
    input: GetMasterCatalogTreeInput,
  ): Promise<MasterCatalogTreeDto>;

  findProductByCode(
    input: FindMasterCatalogProductByCodeInput,
  ): Promise<CatalogProductDto | null>;

  findSubproductByCode(
    input: FindMasterCatalogSubproductByCodeInput,
  ): Promise<CatalogSubproductDto | null>;

  findModalityByCode(
    input: FindMasterCatalogModalityByCodeInput,
  ): Promise<CatalogModalityDto | null>;
}

const mapSegmentList = (segments: CatalogSegmentReadModel[]) =>
  segments.map(toCatalogSegmentDto);

const mapProductList = (products: CatalogProductReadModel[]) =>
  products.map(toCatalogProductDto);

const mapSubproductList = (subproducts: CatalogSubproductReadModel[]) =>
  subproducts.map(toCatalogSubproductDto);

const mapModalityList = (modalities: CatalogModalityReadModel[]) =>
  modalities.map(toCatalogModalityDto);

export class MasterCatalogRuntime implements MasterCatalogRuntimeContract {
  public readonly metadata = createMasterCatalogRuntimeMetadata();

  constructor(
    private readonly service: MasterCatalogServiceContract = masterCatalogService,
  ) {}

  async listSegments(
    input: ListMasterCatalogSegmentsInput,
  ): Promise<CatalogSegmentDto[]> {
    return mapSegmentList(await this.service.listSegments(input));
  }

  async listProducts(
    input: ListMasterCatalogProductsInput,
  ): Promise<CatalogProductDto[]> {
    return mapProductList(await this.service.listProducts(input));
  }

  async listSubproductsByProduct(
    input: ListMasterCatalogSubproductsByProductInput,
  ): Promise<CatalogSubproductDto[]> {
    return mapSubproductList(
      await this.service.listSubproductsByProduct(input),
    );
  }

  async listModalitiesBySubproduct(
    input: ListMasterCatalogModalitiesBySubproductInput,
  ): Promise<CatalogModalityDto[]> {
    return mapModalityList(
      await this.service.listModalitiesBySubproduct(input),
    );
  }

  async getCatalogTree(
    input: GetMasterCatalogTreeInput,
  ): Promise<MasterCatalogTreeDto> {
    return toMasterCatalogTreeDto(await this.service.getCatalogTree(input));
  }

  async findProductByCode(
    input: FindMasterCatalogProductByCodeInput,
  ): Promise<CatalogProductDto | null> {
    const result = await this.service.findProductByCode(input);

    return result ? toCatalogProductDto(result) : null;
  }

  async findSubproductByCode(
    input: FindMasterCatalogSubproductByCodeInput,
  ): Promise<CatalogSubproductDto | null> {
    const result = await this.service.findSubproductByCode(input);

    return result ? toCatalogSubproductDto(result) : null;
  }

  async findModalityByCode(
    input: FindMasterCatalogModalityByCodeInput,
  ): Promise<CatalogModalityDto | null> {
    const result = await this.service.findModalityByCode(input);

    return result ? toCatalogModalityDto(result) : null;
  }
}

export const masterCatalogRuntime = new MasterCatalogRuntime();

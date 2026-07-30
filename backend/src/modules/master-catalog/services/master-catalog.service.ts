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
} from './master-catalog.service.contract.js';
import {
  masterCatalogPrismaRepository,
} from '../repositories/master-catalog.prisma.repository.js';
import type {
  CatalogModalityReadModel,
  CatalogProductReadModel,
  CatalogSegmentReadModel,
  CatalogSubproductReadModel,
  MasterCatalogTreeReadModel,
} from '../domain/master-catalog.read-model.js';
import type { MasterCatalogRepository } from '../domain/master-catalog-repository.contract.js';

const requireTenantContext = (tenantId?: string | null) => {
  if (!tenantId || !tenantId.trim()) {
    throw new Error('Missing tenant context');
  }

  return tenantId;
};

export class MasterCatalogService implements MasterCatalogServiceContract {
  constructor(
    private readonly repository: MasterCatalogRepository = masterCatalogPrismaRepository,
  ) {}

  async listSegments(
    input: ListMasterCatalogSegmentsInput,
  ): Promise<CatalogSegmentReadModel[]> {
    const tenantId = requireTenantContext(input.tenantId);

    return this.repository.listSegments({
      ...input,
      tenantId,
    });
  }

  async listProducts(
    input: ListMasterCatalogProductsInput,
  ): Promise<CatalogProductReadModel[]> {
    const tenantId = requireTenantContext(input.tenantId);

    return this.repository.listProducts({
      ...input,
      tenantId,
    });
  }

  async listSubproductsByProduct(
    input: ListMasterCatalogSubproductsByProductInput,
  ): Promise<CatalogSubproductReadModel[]> {
    const tenantId = requireTenantContext(input.tenantId);

    return this.repository.listSubproductsByProduct({
      ...input,
      tenantId,
    });
  }

  async listModalitiesBySubproduct(
    input: ListMasterCatalogModalitiesBySubproductInput,
  ): Promise<CatalogModalityReadModel[]> {
    const tenantId = requireTenantContext(input.tenantId);

    return this.repository.listModalitiesBySubproduct({
      ...input,
      tenantId,
    });
  }

  async getCatalogTree(
    input: GetMasterCatalogTreeInput,
  ): Promise<MasterCatalogTreeReadModel> {
    const tenantId = requireTenantContext(input.tenantId);

    return this.repository.getCatalogTree({
      ...input,
      tenantId,
    });
  }

  async findProductByCode(
    input: FindMasterCatalogProductByCodeInput,
  ): Promise<CatalogProductReadModel | null> {
    const tenantId = requireTenantContext(input.tenantId);

    return this.repository.findProductByCode({
      ...input,
      tenantId,
    });
  }

  async findSubproductByCode(
    input: FindMasterCatalogSubproductByCodeInput,
  ): Promise<CatalogSubproductReadModel | null> {
    const tenantId = requireTenantContext(input.tenantId);

    return this.repository.findSubproductByCode({
      ...input,
      tenantId,
    });
  }

  async findModalityByCode(
    input: FindMasterCatalogModalityByCodeInput,
  ): Promise<CatalogModalityReadModel | null> {
    const tenantId = requireTenantContext(input.tenantId);

    return this.repository.findModalityByCode({
      ...input,
      tenantId,
    });
  }
}

export const masterCatalogService = new MasterCatalogService();

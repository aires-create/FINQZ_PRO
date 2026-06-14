import { Prisma, type MasterCatalogModality, type MasterCatalogProduct, type MasterCatalogSegment, type MasterCatalogSubproduct } from '@prisma/client';

import { prisma } from '../../../core/prisma/client.js';
import { tenantFilter } from '../../../core/prisma/filters.js';
import type { CatalogStatus } from '../domain/master-catalog.contract.js';
import type {
  CatalogModalityReadModel,
  CatalogProductReadModel,
  CatalogSegmentReadModel,
  CatalogSubproductReadModel,
  MasterCatalogTreeReadModel,
} from '../domain/master-catalog.read-model.js';
import { normalizeMasterCatalogTree } from '../domain/master-catalog.mapper.js';
import type {
  FindCatalogModalityByCodeInput,
  FindCatalogProductByCodeInput,
  FindCatalogSubproductByCodeInput,
  GetMasterCatalogTreeInput,
  ListCatalogModalitiesBySubproductInput,
  ListCatalogProductsInput,
  ListCatalogSegmentsInput,
  ListCatalogSubproductsByProductInput,
  MasterCatalogRepository,
} from '../domain/master-catalog-repository.contract.js';

type MasterCatalogPrismaClient = typeof prisma | Prisma.TransactionClient;

const DEFAULT_STATUS: CatalogStatus = 'ACTIVE';

const trimSearch = (value?: string): string | undefined => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
};

const buildStatusWhere = (status?: CatalogStatus) => ({
  status: status ?? DEFAULT_STATUS,
});

const buildBaseWhere = (
  tenantId: string,
  status?: CatalogStatus,
): {
  tenantId: string;
  deletedAt: null;
  status: CatalogStatus;
} => ({
  ...tenantFilter(tenantId),
  deletedAt: null,
  ...buildStatusWhere(status),
});

const withSearchClause = <T extends object>(
  where: T,
  search?: string,
): T => {
  const normalized = trimSearch(search);

  if (!normalized) {
    return where;
  }

  return {
    ...where,
    OR: [
      {
        code: {
          contains: normalized,
          mode: 'insensitive',
        },
      },
      {
        name: {
          contains: normalized,
          mode: 'insensitive',
        },
      },
    ],
  } as T;
};

const sortByDisplayOrderAndName = [
  {
    displayOrder: 'asc' as const,
  },
  {
    name: 'asc' as const,
  },
];

const toSegmentReadModel = (
  segment: MasterCatalogSegment,
): CatalogSegmentReadModel => ({
  id: segment.id,
  code: segment.code,
  name: segment.name,
  status: segment.status,
  displayOrder: segment.displayOrder,
});

const toModalityReadModel = (
  modality: MasterCatalogModality,
): CatalogModalityReadModel => ({
  id: modality.id,
  code: modality.code,
  name: modality.name,
  status: modality.status,
  displayOrder: modality.displayOrder,
});

const toSubproductReadModel = (
  subproduct: MasterCatalogSubproduct & { modalities?: MasterCatalogModality[] },
): CatalogSubproductReadModel => ({
  id: subproduct.id,
  code: subproduct.code,
  name: subproduct.name,
  status: subproduct.status,
  displayOrder: subproduct.displayOrder,
  modalities: (subproduct.modalities ?? []).map(toModalityReadModel),
});

const toProductReadModel = (
  product: MasterCatalogProduct & {
    subproducts?: Array<MasterCatalogSubproduct & { modalities?: MasterCatalogModality[] }>;
  },
): CatalogProductReadModel => ({
  id: product.id,
  code: product.code,
  name: product.name,
  status: product.status,
  displayOrder: product.displayOrder,
  subproducts: (product.subproducts ?? []).map(toSubproductReadModel),
});

export class MasterCatalogPrismaRepository implements MasterCatalogRepository {
  constructor(private readonly client: MasterCatalogPrismaClient = prisma) {}

  async listSegments(
    input: ListCatalogSegmentsInput,
  ): Promise<CatalogSegmentReadModel[]> {
    const where = withSearchClause<Prisma.MasterCatalogSegmentWhereInput>(
      buildBaseWhere(input.tenantId, input.status) as Prisma.MasterCatalogSegmentWhereInput,
      input.search,
    );

    const segments = await this.client.masterCatalogSegment.findMany({
      where,
      orderBy: sortByDisplayOrderAndName,
    });

    return segments.map(toSegmentReadModel);
  }

  async listProducts(
    input: ListCatalogProductsInput,
  ): Promise<CatalogProductReadModel[]> {
    const where = withSearchClause<Prisma.MasterCatalogProductWhereInput>(
      buildBaseWhere(input.tenantId, input.status) as Prisma.MasterCatalogProductWhereInput,
      input.search,
    );

    const products = await this.client.masterCatalogProduct.findMany({
      where,
      include: {
        subproducts: {
          where: {
            ...(buildBaseWhere(input.tenantId, input.status) as Prisma.MasterCatalogSubproductWhereInput),
          },
          orderBy: sortByDisplayOrderAndName,
          include: {
            modalities: {
              where: {
                ...(buildBaseWhere(input.tenantId, input.status) as Prisma.MasterCatalogModalityWhereInput),
              },
              orderBy: sortByDisplayOrderAndName,
            },
          },
        },
      },
      orderBy: sortByDisplayOrderAndName,
    });

    return products.map(toProductReadModel);
  }

  async listSubproductsByProduct(
    input: ListCatalogSubproductsByProductInput,
  ): Promise<CatalogSubproductReadModel[]> {
    const where = withSearchClause<Prisma.MasterCatalogSubproductWhereInput>(
      {
        ...(buildBaseWhere(input.tenantId, input.status) as Prisma.MasterCatalogSubproductWhereInput),
        productId: input.productId,
      },
      input.search,
    );

    const subproducts = await this.client.masterCatalogSubproduct.findMany({
      where,
      include: {
        modalities: {
          where: {
            ...(buildBaseWhere(input.tenantId, input.status) as Prisma.MasterCatalogModalityWhereInput),
          },
          orderBy: sortByDisplayOrderAndName,
        },
      },
      orderBy: sortByDisplayOrderAndName,
    });

    return subproducts.map(toSubproductReadModel);
  }

  async listModalitiesBySubproduct(
    input: ListCatalogModalitiesBySubproductInput,
  ): Promise<CatalogModalityReadModel[]> {
    const where = withSearchClause<Prisma.MasterCatalogModalityWhereInput>(
      {
        ...(buildBaseWhere(input.tenantId, input.status) as Prisma.MasterCatalogModalityWhereInput),
        subproductId: input.subproductId,
      },
      input.search,
    );

    const modalities = await this.client.masterCatalogModality.findMany({
      where,
      orderBy: sortByDisplayOrderAndName,
    });

    return modalities.map(toModalityReadModel);
  }

  async getCatalogTree(
    input: GetMasterCatalogTreeInput,
  ): Promise<MasterCatalogTreeReadModel> {
    const segmentWhere = withSearchClause<Prisma.MasterCatalogSegmentWhereInput>(
      buildBaseWhere(input.tenantId, input.status) as Prisma.MasterCatalogSegmentWhereInput,
      input.search,
    );
    const productWhere = withSearchClause<Prisma.MasterCatalogProductWhereInput>(
      buildBaseWhere(input.tenantId, input.status) as Prisma.MasterCatalogProductWhereInput,
      input.search,
    );

    const [segments, products] = await Promise.all([
      this.client.masterCatalogSegment.findMany({
        where: segmentWhere,
        orderBy: sortByDisplayOrderAndName,
      }),
      this.client.masterCatalogProduct.findMany({
        where: productWhere,
        include: {
          subproducts: {
            where: {
              ...(buildBaseWhere(input.tenantId, input.status) as Prisma.MasterCatalogSubproductWhereInput),
            },
            orderBy: sortByDisplayOrderAndName,
            include: {
              modalities: {
                where: {
                  ...(buildBaseWhere(input.tenantId, input.status) as Prisma.MasterCatalogModalityWhereInput),
                },
                orderBy: sortByDisplayOrderAndName,
              },
            },
          },
        },
        orderBy: sortByDisplayOrderAndName,
      }),
    ]);

    return normalizeMasterCatalogTree({
      segments: segments.map(toSegmentReadModel),
      products: products.map(toProductReadModel),
    });
  }

  async findProductByCode(
    input: FindCatalogProductByCodeInput,
  ): Promise<CatalogProductReadModel | null> {
    const product = await this.client.masterCatalogProduct.findFirst({
      where: {
        ...(buildBaseWhere(input.tenantId, input.status) as Prisma.MasterCatalogProductWhereInput),
        code: input.code,
      },
      include: {
        subproducts: {
          where: {
            ...(buildBaseWhere(input.tenantId, input.status) as Prisma.MasterCatalogSubproductWhereInput),
          },
          orderBy: sortByDisplayOrderAndName,
          include: {
            modalities: {
              where: {
                ...(buildBaseWhere(input.tenantId, input.status) as Prisma.MasterCatalogModalityWhereInput),
              },
              orderBy: sortByDisplayOrderAndName,
            },
          },
        },
      },
    });

    return product ? toProductReadModel(product) : null;
  }

  async findSubproductByCode(
    input: FindCatalogSubproductByCodeInput,
  ): Promise<CatalogSubproductReadModel | null> {
    const subproduct = await this.client.masterCatalogSubproduct.findFirst({
      where: {
        ...(buildBaseWhere(input.tenantId, input.status) as Prisma.MasterCatalogSubproductWhereInput),
        productId: input.productId,
        code: input.code,
      },
      include: {
        modalities: {
          where: {
            ...(buildBaseWhere(input.tenantId, input.status) as Prisma.MasterCatalogModalityWhereInput),
          },
          orderBy: sortByDisplayOrderAndName,
        },
      },
    });

    return subproduct ? toSubproductReadModel(subproduct) : null;
  }

  async findModalityByCode(
    input: FindCatalogModalityByCodeInput,
  ): Promise<CatalogModalityReadModel | null> {
    const modality = await this.client.masterCatalogModality.findFirst({
      where: {
        ...(buildBaseWhere(input.tenantId, input.status) as Prisma.MasterCatalogModalityWhereInput),
        subproductId: input.subproductId,
        code: input.code,
      },
    });

    return modality ? toModalityReadModel(modality) : null;
  }
}

export const masterCatalogPrismaRepository = new MasterCatalogPrismaRepository();

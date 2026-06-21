import type { Partner, Prisma } from '@prisma/client';

export interface PartnerRepositoryFindByIdInput {
  tenantId: string;
  partnerId: string;
}

export interface PartnerRepositoryFindByCodeInput {
  tenantId: string;
  code: string;
}

export interface PartnerRepositoryListInput {
  tenantId: string;
  page?: number;
  limit?: number;
  status?: string;
  parentId?: string | null;
  search?: string;
}

export interface PartnerRepositoryListResult {
  data: Partner[];
  total: number;
  page: number;
  limit: number;
}

export interface PartnerRepositoryCreateInput {
  tenantId: string;
  code: string;
  name: string;
  type: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string;
  parentId?: string | null;
}

export interface PartnerRepositoryUpdateInput {
  tenantId: string;
  partnerId: string;
  data: {
    code?: string;
    name?: string;
    type?: string;
    document?: string | null;
    email?: string | null;
    phone?: string | null;
    status?: string;
    parentId?: string | null;
  };
}

export interface PartnerRepositorySoftDeleteInput {
  tenantId: string;
  partnerId: string;
}

export interface PartnerRepositoryCountActiveChildrenInput {
  tenantId: string;
  parentId: string;
}

export interface PartnerRepositoryContract {
  findById(
    input: PartnerRepositoryFindByIdInput,
  ): Promise<Partner | null>;
  findByCode(
    input: PartnerRepositoryFindByCodeInput,
  ): Promise<Partner | null>;
  listByTenant(
    input: PartnerRepositoryListInput,
  ): Promise<PartnerRepositoryListResult>;
  create(input: PartnerRepositoryCreateInput): Promise<Partner>;
  update(input: PartnerRepositoryUpdateInput): Promise<Prisma.BatchPayload>;
  softDelete(input: PartnerRepositorySoftDeleteInput): Promise<Prisma.BatchPayload>;
  countActiveChildren(
    input: PartnerRepositoryCountActiveChildrenInput,
  ): Promise<number>;
}

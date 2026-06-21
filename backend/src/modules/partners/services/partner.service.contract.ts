import type { Partner } from '@prisma/client';

import type {
  PartnerRepositoryListInput,
  PartnerRepositoryListResult,
} from '../repositories/partner.repository.contract.js';

export type PartnerStatus =
  | 'prospect'
  | 'contato'
  | 'negociacao'
  | 'ativo'
  | 'inativo';

export type PartnerType = 'COMPANY' | 'FRANQUIA' | 'FRANQUEADO';

export interface PartnerServiceListInput extends PartnerRepositoryListInput {
  tenantId: string;
}

export interface PartnerServiceGetByIdInput {
  tenantId: string;
  partnerId: string;
}

export interface PartnerServiceGetByCodeInput {
  tenantId: string;
  code: string;
}

export interface PartnerServiceCreateInput {
  tenantId: string;
  actorUserId?: string | null;
  correlationId?: string | null;
  code: string;
  name: string;
  type: PartnerType;
  status: PartnerStatus;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  parentId?: string | null;
}

export interface PartnerServiceUpdateInput {
  tenantId: string;
  actorUserId?: string | null;
  correlationId?: string | null;
  partnerId: string;
  code?: string;
  name?: string;
  type?: PartnerType;
  status?: PartnerStatus;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  parentId?: string | null;
}

export interface PartnerServiceSoftDeleteInput {
  tenantId: string;
  actorUserId?: string | null;
  correlationId?: string | null;
  partnerId: string;
}

export interface PartnerServiceContract {
  listPartners(
    input: PartnerServiceListInput,
  ): Promise<PartnerRepositoryListResult>;
  getPartnerById(input: PartnerServiceGetByIdInput): Promise<Partner>;
  getPartnerByCode(input: PartnerServiceGetByCodeInput): Promise<Partner>;
  createPartner(input: PartnerServiceCreateInput): Promise<Partner>;
  updatePartner(input: PartnerServiceUpdateInput): Promise<Partner>;
  softDeletePartner(input: PartnerServiceSoftDeleteInput): Promise<void>;
}

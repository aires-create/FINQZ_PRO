import type { Partner } from '@prisma/client';

import { PartnerPrismaRepository } from '../repositories/partner.prisma.repository.js';
import { PartnerNotFoundError } from './partner.errors.js';

export type GetPartnerByIdInput = {
  tenantId: string;
  partnerId: string;
};

export type GetPartnerByCodeInput = {
  tenantId: string;
  code: string;
};

export type CreatePartnerInput = {
  tenantId: string;
  actorUserId: string;
  correlationId: string;
  code: string;
  name: string;
  type: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string;
};

export class PartnerService {
  constructor(private readonly repository: PartnerPrismaRepository) {}

  async getPartnerById(input: GetPartnerByIdInput): Promise<Partner> {
    const partner = await this.repository.findPartnerById(input);

    if (!partner) {
      throw new PartnerNotFoundError(input.partnerId);
    }

    return partner;
  }

  async getPartnerByCode(input: GetPartnerByCodeInput): Promise<Partner> {
    const partner = await this.repository.findPartnerByCode(input);

    if (!partner) {
      throw new PartnerNotFoundError(input.code);
    }

    return partner;
  }

  async createPartner(input: CreatePartnerInput): Promise<Partner> {
    return this.repository.createPartner({
      tenantId: input.tenantId,
      code: input.code,
      name: input.name,
      type: input.type,
      document: input.document ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      status: input.status ?? 'active',
    });
  }
}

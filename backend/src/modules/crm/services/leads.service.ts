import { leadsRepository } from '../repositories/leads.repository';
import type { Prisma } from '@prisma/client';
import type { CreateLeadBody } from '../dto/leads.dto';

const normalizeText = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const normalizeEmail = (email?: string | null) => {
  const normalized = normalizeText(email);
  return normalized ? normalized.toLowerCase() : null;
};

const normalizeDate = (value?: string | Date | null) => {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
};

const normalizeNumber = (value?: number | string | null) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return Number(value);
};

export class LeadsService {
  async getAllLeads(tenantId: string) {
    if (!tenantId) {
      throw new Error('Missing tenant context');
    }

    return leadsRepository.findAll(tenantId);
  }

  async getLeadById(id: string, tenantId: string) {
    if (!tenantId) {
      throw new Error('Missing tenant context');
    }

    const lead = await leadsRepository.findById(id, tenantId);

    if (!lead) {
      throw new Error('Lead not found');
    }

    return lead;
  }

  async createLead(tenantId: string, createdById: string, body: CreateLeadBody) {
    if (!tenantId) {
      throw new Error('Missing tenant context');
    }

    if (!createdById) {
      throw new Error('Missing user context');
    }

    const email = normalizeText(body.email);

    const data: Prisma.LeadUncheckedCreateInput = {
      tenantId,
      createdById,
      firstName: body.firstName!.trim(),
      lastName: body.lastName!.trim(),
      email,
      emailNormalized: normalizeEmail(email),
      phone: normalizeText(body.phone),
      cpf: normalizeText(body.cpf),
      birthDate: normalizeDate(body.birthDate),
      address: body.address,
      income: normalizeNumber(body.income),
      source: normalizeText(body.source),
      notes: normalizeText(body.notes),
      tags: body.tags,
      partnerId: normalizeText(body.partnerId),
      ownerId: normalizeText(body.ownerId),
    };

    return leadsRepository.create(data);
  }

  async updateLead(
    id: string,
    tenantId: string,
    data: Prisma.LeadUpdateInput
  ) {
    if (!tenantId) {
      throw new Error('Missing tenant context');
    }

    const existingLead = await leadsRepository.findById(id, tenantId);

    if (!existingLead) {
      throw new Error('Lead not found');
    }

    return leadsRepository.update(id, tenantId, data);
  }

  async deleteLead(id: string, tenantId: string) {
    if (!tenantId) {
      throw new Error('Missing tenant context');
    }

    const existingLead = await leadsRepository.findById(id, tenantId);

    if (!existingLead) {
      throw new Error('Lead not found');
    }

    await leadsRepository.softDelete(id, tenantId);

    return {
      success: true,
      deleted: true,
      id,
    };
  }
}

export const leadsService = new LeadsService();
import { Prisma } from '@prisma/client';
import { leadsRepository } from '../repositories/leads.repository';
import type { CreateLeadBody, UpdateLeadBody } from '../dto/leads.dto';

const normalizeText = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const normalizeEmail = (email?: string | null) => {
  const normalized = normalizeText(email);
  return normalized ? normalized.toLowerCase() : null;
};

const normalizeDate = (value?: string | Date | null) => {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
};

const normalizeNumber = (value?: number | string | null) => {
  if (value === undefined || value === null || value === '') return null;
  return Number(value);
};

const normalizeJson = (value: unknown) => {
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
};

const buildLeadUpdateData = (body: UpdateLeadBody): Prisma.LeadUpdateInput => {
  const data: Prisma.LeadUpdateInput = {};

  if (body.firstName !== undefined) data.firstName = body.firstName.trim();
  if (body.lastName !== undefined) data.lastName = body.lastName.trim();

  if (body.email !== undefined) {
    const email = normalizeText(body.email);
    data.email = email;
    data.emailNormalized = normalizeEmail(email);
  }

  if (body.phone !== undefined) data.phone = normalizeText(body.phone);
  if (body.cpf !== undefined) data.cpf = normalizeText(body.cpf);
  if (body.birthDate !== undefined) data.birthDate = normalizeDate(body.birthDate);
  if (body.address !== undefined) data.address = normalizeJson(body.address);
  if (body.income !== undefined) data.income = normalizeNumber(body.income);
  if (body.status !== undefined) data.status = body.status;
  if (body.source !== undefined) data.source = normalizeText(body.source);
  if (body.notes !== undefined) data.notes = normalizeText(body.notes);
  if (body.tags !== undefined) data.tags = normalizeJson(body.tags);
   
  return data;
};

export class LeadsService {
  async getAllLeads(tenantId: string) {
    if (!tenantId) throw new Error('Missing tenant context');
    return leadsRepository.findAll(tenantId);
  }

  async getLeadById(id: string, tenantId: string) {
    if (!tenantId) throw new Error('Missing tenant context');

    const lead = await leadsRepository.findById(id, tenantId);
    if (!lead) throw new Error('Lead not found');

    return lead;
  }

  async createLead(tenantId: string, createdById: string, body: CreateLeadBody) {
    if (!tenantId) throw new Error('Missing tenant context');
    if (!createdById) throw new Error('Missing user context');

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
      income: normalizeNumber(body.income),
      source: normalizeText(body.source),
      notes: normalizeText(body.notes),
      partnerId: normalizeText(body.partnerId),
      ownerId: normalizeText(body.ownerId),
      ...(body.address !== undefined ? { address: normalizeJson(body.address) } : {}),
      ...(body.tags !== undefined ? { tags: normalizeJson(body.tags) } : {}),
    };

    return leadsRepository.create(data);
  }

  async updateLead(id: string, tenantId: string, body: UpdateLeadBody) {
    if (!tenantId) throw new Error('Missing tenant context');

    const existingLead = await leadsRepository.findById(id, tenantId);
    if (!existingLead) throw new Error('Lead not found');

    const data = buildLeadUpdateData(body);

    return leadsRepository.update(id, tenantId, data);
  }

  async deleteLead(id: string, tenantId: string) {
    if (!tenantId) throw new Error('Missing tenant context');

    const existingLead = await leadsRepository.findById(id, tenantId);
    if (!existingLead) throw new Error('Lead not found');

    await leadsRepository.softDelete(id, tenantId);

    return {
      success: true,
      deleted: true,
      id,
    };
  }
}

export const leadsService = new LeadsService();
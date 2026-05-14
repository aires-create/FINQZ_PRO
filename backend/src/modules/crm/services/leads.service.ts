import { Prisma } from '@prisma/client';
import { leadsRepository } from '../repositories/leads.repository';
import type { CreateLeadBody, UpdateLeadBody } from '../dto/leads.dto';
import { registerAuditLog } from '../../audit/services/audit.service';

export type ListLeadsParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  source?: string;
  ownerId?: string;
  partnerId?: string;
};

const AuditActions = {
  LEAD_CREATED: 'LEAD_CREATED',
  LEAD_UPDATED: 'LEAD_UPDATED',
  LEAD_DELETED: 'LEAD_DELETED',
} as const;

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

const normalizePositiveInteger = (
  value: number | undefined,
  fallback: number,
) => {
  if (!value || Number.isNaN(value) || value < 1) {
    return fallback;
  }

  return Math.floor(value);
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

const getChangedFields = (
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[],
) => {
  return fields.filter((field) => {
    return JSON.stringify(before[field]) !== JSON.stringify(after[field]);
  });
};

export class LeadsService {
  async getAllLeads(tenantId: string, params: ListLeadsParams = {}) {
    if (!tenantId) throw new Error('Missing tenant context');

    const page = normalizePositiveInteger(params.page, 1);
    const limit = Math.min(normalizePositiveInteger(params.limit, 20), 100);

    const repositoryParams = {
      tenantId,
      page,
      limit,
      ...(normalizeText(params.search)
        ? { search: normalizeText(params.search)! }
        : {}),
      ...(normalizeText(params.status)
        ? { status: normalizeText(params.status)! }
        : {}),
      ...(normalizeText(params.source)
        ? { source: normalizeText(params.source)! }
        : {}),
      ...(normalizeText(params.ownerId)
        ? { ownerId: normalizeText(params.ownerId)! }
        : {}),
      ...(normalizeText(params.partnerId)
        ? { partnerId: normalizeText(params.partnerId)! }
        : {}),
    };

    const { data, total } = await leadsRepository.findAll(repositoryParams);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
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

    const lead = await leadsRepository.create(data);

    await registerAuditLog({
      tenantId,
      userId: createdById,
      action: AuditActions.LEAD_CREATED,
      entity: 'Lead',
      entityId: lead.id,
      metadata: {
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        status: lead.status,
        source: lead.source,
        ownerId: lead.ownerId,
        partnerId: lead.partnerId,
      },
    });

    return lead;
  }

  async updateLead(
    id: string,
    tenantId: string,
    body: UpdateLeadBody,
    actorId?: string | null,
  ) {
    if (!tenantId) throw new Error('Missing tenant context');

    const existingLead = await leadsRepository.findById(id, tenantId);
    if (!existingLead) throw new Error('Lead not found');

    const data = buildLeadUpdateData(body);

    await leadsRepository.update(id, tenantId, data);

    const updatedLead = await leadsRepository.findById(id, tenantId);
    if (!updatedLead) throw new Error('Lead not found');

    const auditFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'cpf',
      'birthDate',
      'address',
      'income',
      'status',
      'source',
      'notes',
      'tags',
      'ownerId',
      'partnerId',
    ];

    const changedFields = getChangedFields(
      existingLead as unknown as Record<string, unknown>,
      updatedLead as unknown as Record<string, unknown>,
      auditFields,
    );

    await registerAuditLog({
      tenantId,
      userId: actorId ?? null,
      action: AuditActions.LEAD_UPDATED,
      entity: 'Lead',
      entityId: updatedLead.id,
      metadata: {
        changedFields,
      },
    });

    return updatedLead;
  }

    async deleteLead(id: string, tenantId: string, actorId?: string | null) {
    if (!tenantId) throw new Error('Missing tenant context');

    const existingLead = await leadsRepository.findById(id, tenantId);
    if (!existingLead) throw new Error('Lead not found');

    await leadsRepository.softDelete(id, tenantId);

        await registerAuditLog({
      tenantId,
      userId: actorId ?? null,
      action: AuditActions.LEAD_DELETED,
      entity: 'Lead',
      entityId: existingLead.id,
      metadata: {
        previousStatus: existingLead.status,
        firstName: existingLead.firstName,
        lastName: existingLead.lastName,
        email: existingLead.email,
        ownerId: existingLead.ownerId,
        partnerId: existingLead.partnerId,
        deletedAt: new Date().toISOString(),
      },
    });

    return existingLead;
  }
}

export const leadsService = new LeadsService();
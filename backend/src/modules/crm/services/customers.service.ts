import { Prisma } from '@prisma/client';
import { customersRepository } from '../repositories/customers.repository.js';
import type {
  CreateCustomerBody,
  UpdateCustomerBody,
} from '../dto/customers.dto.js';
import { registerAuditLog } from '../../audit/services/audit.service.js';

export type ListCustomersParams = {
  page?: number;
  limit?: number;
  search?: string;
};

const AuditActions = {
  CUSTOMER_CREATED: 'CUSTOMER_CREATED',
  CUSTOMER_UPDATED: 'CUSTOMER_UPDATED',
  CUSTOMER_DELETED: 'CUSTOMER_DELETED',
} as const;

const normalizeText = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
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

const parseOptionalDate = (value?: string | Date | null) => {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
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

const buildCustomerUpdateData = (
  body: UpdateCustomerBody,
): Prisma.CustomerUpdateInput => {
  const data: Prisma.CustomerUpdateInput = {};

  if (body.firstName !== undefined) data.firstName = body.firstName.trim();
  if (body.lastName !== undefined) data.lastName = body.lastName.trim();

  if (body.email !== undefined) {
    const email = normalizeText(body.email);

    if (email) {
      data.email = email;
      data.emailNormalized = email.toLowerCase();
    }
  }

  if (body.cpf !== undefined) {
    const cpf = normalizeText(body.cpf);

    if (cpf) {
      data.cpf = cpf;
    }
  }
  if (body.phone !== undefined) data.phone = normalizeText(body.phone);

  if (body.birthDate !== undefined) {
    data.birthDate = body.birthDate ? new Date(body.birthDate) : null;
  }

  if (body.monthlyIncome !== undefined) {
    data.monthlyIncome =
      body.monthlyIncome === null || body.monthlyIncome === ''
        ? null
        : Number(body.monthlyIncome);
  }

  if (body.annualIncome !== undefined) {
    data.annualIncome =
      body.annualIncome === null || body.annualIncome === ''
        ? null
        : Number(body.annualIncome);
  }

  if (body.profession !== undefined) {
    data.profession = normalizeText(body.profession);
  }

  if (body.maritalStatus !== undefined) {
    data.maritalStatus = normalizeText(body.maritalStatus);
  }

  if (body.gender !== undefined) {
    data.gender = normalizeText(body.gender);
  }

  if (body.documentType !== undefined) {
    data.documentType = normalizeText(body.documentType);
  }

  if (body.address !== undefined) {
    data.address = body.address ?? Prisma.JsonNull;
  }

  if (body.bankData !== undefined) {
    data.bankData = body.bankData ?? Prisma.JsonNull;
  }

  if (body.notes !== undefined) {
    data.notes = normalizeText(body.notes);
  }

  if (body.rdStatus !== undefined) {
    data.rdStatus = normalizeText(body.rdStatus);
  }

  if (body.rdConsultedAt !== undefined) {
    data.rdConsultedAt = parseOptionalDate(body.rdConsultedAt);
  }

  if (body.rdNotes !== undefined) {
    data.rdNotes = normalizeText(body.rdNotes);
  }

  if (body.doNotCallStatus !== undefined) {
    data.doNotCallStatus = normalizeText(body.doNotCallStatus);
  }

  if (body.doNotCallConsultedAt !== undefined) {
    data.doNotCallConsultedAt = parseOptionalDate(body.doNotCallConsultedAt);
  }

  if (body.isActive !== undefined) data.isActive = body.isActive ?? true;

  return data;
};

export class CustomersService {
  async getAllCustomers(tenantId: string, params: ListCustomersParams = {}) {
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
    };

    const { data, total } = await customersRepository.findAll(repositoryParams);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getCustomerById(tenantId: string, customerId: string) {
    if (!tenantId) throw new Error('Missing tenant context');

    const normalizedCustomerId = normalizeText(customerId);

    if (!normalizedCustomerId) {
      throw new Error('Missing customer id');
    }

    return customersRepository.findById(tenantId, normalizedCustomerId);
  }

  async createCustomer(
    tenantId: string,
    body: CreateCustomerBody,
    actorId?: string | null,
  ) {
    if (!tenantId) throw new Error('Missing tenant context');

    const firstName = normalizeText(body.firstName);
    const lastName = normalizeText(body.lastName);
    const email = normalizeText(body.email);
    const cpf = normalizeText(body.cpf);

    if (!firstName) throw new Error('First name is required');
    if (!lastName) throw new Error('Last name is required');
    if (!email) throw new Error('Email is required');
    if (!cpf) throw new Error('CPF is required');

    const parseOptionalNumber = (value?: number | string | null) => {
      if (value === undefined || value === null || value === '') {
        return null;
      }

      const parsed = Number(value);

      if (Number.isNaN(parsed)) {
        return null;
      }

      return parsed;
    };

    const parseOptionalDate = (value?: string | Date | null) => {
      if (!value) {
        return null;
      }

      const parsed = value instanceof Date ? value : new Date(value);

      if (Number.isNaN(parsed.getTime())) {
        return null;
      }

      return parsed;
    };

    const customerCode = `CUST-${Date.now()}`;
    const emailNormalized = email.toLowerCase();

    const customer = await customersRepository.create({
      tenantId,
      customerCode,
      firstName,
      lastName,
      email,
      emailNormalized,
      cpf,
      phone: normalizeText(body.phone),
      birthDate: parseOptionalDate(body.birthDate),
      monthlyIncome: parseOptionalNumber(body.monthlyIncome),
      annualIncome: parseOptionalNumber(body.annualIncome),
      profession: normalizeText(body.profession),
      maritalStatus: normalizeText(body.maritalStatus),
      gender: normalizeText(body.gender),
      documentType: normalizeText(body.documentType),
      address: body.address ?? Prisma.JsonNull,
      bankData: body.bankData ?? Prisma.JsonNull,
      notes: normalizeText(body.notes),
      rdStatus: normalizeText(body.rdStatus),
      rdConsultedAt: parseOptionalDate(body.rdConsultedAt),
      rdNotes: normalizeText(body.rdNotes),
      doNotCallStatus: normalizeText(body.doNotCallStatus),
      doNotCallConsultedAt: parseOptionalDate(body.doNotCallConsultedAt),
      isActive: body.isActive ?? true,
      partnerId: normalizeText(body.partnerId),
      leadId: normalizeText(body.leadId),
      parentCustomerId: normalizeText(body.parentCustomerId),
    });

    await registerAuditLog({
      tenantId,
      userId: actorId ?? null,
      action: AuditActions.CUSTOMER_CREATED,
      entity: 'Customer',
      entityId: customer.id,
      metadata: {
        customerId: customer.id,
        customerCode: customer.customerCode,
      },
    });

    return customer;
  }

  async updateCustomer(
    tenantId: string,
    customerId: string,
    body: UpdateCustomerBody,
    actorId?: string | null,
  ) {
    if (!tenantId) throw new Error('Missing tenant context');

    const normalizedCustomerId = normalizeText(customerId);

    if (!normalizedCustomerId) {
      throw new Error('Missing customer id');
    }

    const existingCustomer = await customersRepository.findById(
      tenantId,
      normalizedCustomerId,
    );

    if (!existingCustomer) {
      throw new Error('Customer not found');
    }

    const data = buildCustomerUpdateData(body);

    await customersRepository.update(normalizedCustomerId, tenantId, data);

    const updatedCustomer = await customersRepository.findById(
      tenantId,
      normalizedCustomerId,
    );

    if (!updatedCustomer) {
      throw new Error('Customer not found');
    }

    const auditFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'cpf',
      'birthDate',
      'monthlyIncome',
      'annualIncome',
      'profession',
      'maritalStatus',
      'gender',
      'documentType',
      'address',
      'bankData',
      'notes',
      'rdStatus',
      'rdConsultedAt',
      'rdNotes',
      'doNotCallStatus',
      'doNotCallConsultedAt',
      'isActive',
      'partnerId',
      'leadId',
      'parentCustomerId',
    ];

    const changedFields = getChangedFields(
      existingCustomer as unknown as Record<string, unknown>,
      updatedCustomer as unknown as Record<string, unknown>,
      auditFields,
    );

    await registerAuditLog({
      tenantId,
      userId: actorId ?? null,
      action: AuditActions.CUSTOMER_UPDATED,
      entity: 'Customer',
      entityId: updatedCustomer.id,
      metadata: {
        changedFields,
      },
    });

    return updatedCustomer;
  }

  async deleteCustomer(
    tenantId: string,
    customerId: string,
    actorId?: string | null,
  ) {
    if (!tenantId) throw new Error('Missing tenant context');

    const normalizedCustomerId = normalizeText(customerId);

    if (!normalizedCustomerId) {
      throw new Error('Missing customer id');
    }

    const existingCustomer = await customersRepository.findById(
      tenantId,
      normalizedCustomerId,
    );

    if (!existingCustomer) {
      throw new Error('Customer not found');
    }

    await customersRepository.softDelete(normalizedCustomerId, tenantId);

    await registerAuditLog({
      tenantId,
      userId: actorId ?? null,
      action: AuditActions.CUSTOMER_DELETED,
      entity: 'Customer',
      entityId: existingCustomer.id,
      metadata: {
        customerId: existingCustomer.id,
        customerCode: existingCustomer.customerCode,
        deletedAt: new Date().toISOString(),
      },
    });

    return {
      id: normalizedCustomerId,
      deleted: true,
    };
  }
}

export const customersService = new CustomersService();

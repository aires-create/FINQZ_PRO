import type { Prisma } from '@prisma/client';

import { prisma } from '../../../core/prisma/client.js';

export type FindAllCustomersParams = {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
};

export type CreateCustomerRepositoryInput = {
  tenantId: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  email: string;
  emailNormalized: string;
  cpf: string;
  phone?: string | null;
  birthDate?: Date | null;
  monthlyIncome?: number | null;
  annualIncome?: number | null;
  profession?: string | null;
  maritalStatus?: string | null;
  gender?: string | null;
  documentType?: string | null;
  address?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  bankData?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  notes?: string | null;
  rdStatus?: string | null;
  rdConsultedAt?: Date | null;
  rdNotes?: string | null;
  doNotCallStatus?: string | null;
  doNotCallConsultedAt?: Date | null;
  isActive?: boolean;
  partnerId?: string | null;
  leadId?: string | null;
  parentCustomerId?: string | null;
};

export class CustomersRepository {
  private getClient(client?: Prisma.TransactionClient) {
    return client ?? prisma;
  }

  async findAll(params: FindAllCustomersParams) {
    const { tenantId, page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        {
          firstName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          cpf: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [data, total] = await prisma.$transaction([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.customer.count({
        where,
      }),
    ]);

    return {
      data,
      total,
    };
  }

  async findById(
    tenantId: string,
    customerId: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).customer.findFirst({
      where: {
        id: customerId,
        tenantId,
        deletedAt: null,
      },
    });
  }

  async findByCpf(
    tenantId: string,
    cpf: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).customer.findFirst({
      where: {
        tenantId,
        cpf,
        deletedAt: null,
      },
    });
  }

  async findByEmailNormalized(
    tenantId: string,
    emailNormalized: string,
    client?: Prisma.TransactionClient,
  ) {
    return this.getClient(client).customer.findFirst({
      where: {
        tenantId,
        emailNormalized,
        deletedAt: null,
      },
    });
  }

  async create(data: CreateCustomerRepositoryInput) {
    return prisma.customer.create({
      data,
    });
  }

  async update(
    id: string,
    tenantId: string,
    data: Prisma.CustomerUpdateInput,
  ) {
    return prisma.customer.updateMany({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      data,
    });
  }

  async softDelete(id: string, tenantId: string) {
    return prisma.customer.updateMany({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }
}

export const customersRepository = new CustomersRepository();

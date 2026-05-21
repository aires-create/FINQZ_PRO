import { beforeEach, describe, expect, it, vi } from 'vitest';

const transactionMock = vi.hoisted(() => ({
  commercialTable: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    updateMany: vi.fn(),
  },
  commercialCondition: {
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
}));

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(
    async (
      callback: (transaction: typeof transactionMock) => Promise<unknown>,
    ) => callback(transactionMock),
  ),
  commercialTable: transactionMock.commercialTable,
  commercialCondition: transactionMock.commercialCondition,
}));

vi.mock('../../core/prisma/client.js', () => ({
  prisma: prismaMock,
}));

import type { CreateCommercialTableDto } from '../../modules/commercial/index.js';
import { commercialService } from '../../modules/commercial/services/commercial.service.js';

const now = new Date('2026-05-20T12:00:00.000Z');

const baseCondition = {
  id: 'condition-1',
  commercialTableId: 'table-1',
  tenantId: 'tenant-1',
  minTerm: 12,
  maxTerm: 12,
  term: 12,
  monthlyRate: 1.25,
  cetRate: 1.55,
  coefficient: 0.123456,
  flatCommission: 5,
  bonusCommission: 1,
  advanceCommission: 0.5,
  totalCommission: 999,
  commissionRate: 5,
  minAmount: 1000,
  maxAmount: 10000,
  minAge: 18,
  maxAge: 75,
  minConsumption: null,
  maxConsumption: null,
  tariffKwh: null,
  savingsPercent: null,
  estimatedValue: null,
  contractTerm: null,
  earlyTerminationFee: null,
  campaignName: null,
  notes: null,
  active: true,
  deletedAt: null,
  createdAt: now,
  updatedAt: now,
};

const baseTable = {
  id: 'table-1',
  tenantId: 'tenant-1',
  providerId: 'provider-1',
  providerCode: 'PAN',
  providerName: 'Banco PAN',
  providerType: 'BANK',
  productId: 'product-1',
  productCode: 'CONSIGNADO',
  productName: 'Consignado',
  subproductId: 'subproduct-1',
  subproductCode: 'INSS',
  subproductName: 'INSS',
  modality: 'NOVO',
  modalityLabel: 'Novo',
  name: 'PAN INSS NOVO',
  code: 'PAN-INSS-NOVO',
  active: true,
  startDate: null,
  endDate: null,
  energyType: null,
  customerType: null,
  distributionCompany: null,
  region: null,
  deletedAt: null,
  createdAt: now,
  updatedAt: now,
};

const tableWithConditions = {
  ...baseTable,
  conditions: [baseCondition],
};

const createPayload: CreateCommercialTableDto = {
  providerId: 'provider-1',
  providerCode: 'PAN',
  providerName: 'Banco PAN',
  providerType: 'BANK',
  productId: 'product-1',
  productCode: 'CONSIGNADO',
  productName: 'Consignado',
  subproductId: 'subproduct-1',
  subproductCode: 'INSS',
  subproductName: 'INSS',
  modality: 'NOVO',
  modalityLabel: 'Novo',
  name: 'PAN INSS NOVO',
  code: 'PAN-INSS-NOVO',
  conditions: [
    {
      minTerm: 12,
      maxTerm: 12,
      term: 12,
      monthlyRate: 1.25,
      cetRate: 1.55,
      coefficient: 0.123456,
      flatCommission: 5,
      bonusCommission: 1,
      advanceCommission: 0.5,
      totalCommission: 999,
      commissionRate: 5,
      minAmount: 1000,
      maxAmount: 10000,
      minAge: 18,
      maxAge: 75,
      active: true,
    },
  ],
};

describe('commercialService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(
      async (
        callback: (transaction: typeof transactionMock) => Promise<unknown>,
      ) => callback(transactionMock),
    );
  });

  it('creates a commercial table and conditions in one transaction', async () => {
    transactionMock.commercialTable.create.mockResolvedValueOnce(baseTable);
    transactionMock.commercialCondition.createMany.mockResolvedValueOnce({
      count: 1,
    });
    transactionMock.commercialTable.findFirst.mockResolvedValueOnce(
      tableWithConditions,
    );

    const result = await commercialService.createTable('tenant-1', {
      ...createPayload,
      tenantId: 'tenant-from-frontend',
    } as unknown as CreateCommercialTableDto);

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(transactionMock.commercialTable.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        code: 'PAN-INSS-NOVO',
      }),
    });
    expect(transactionMock.commercialCondition.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          tenantId: 'tenant-1',
          commercialTableId: 'table-1',
          flatCommission: 5,
          bonusCommission: 1,
          advanceCommission: 0.5,
          totalCommission: 6.5,
        }),
      ],
    });
    expect(result.conditions[0]?.totalCommission).toBe(6.5);
  });

  it('replaces conditions transactionally and recalculates totals', async () => {
    transactionMock.commercialTable.findFirst
      .mockResolvedValueOnce(tableWithConditions)
      .mockResolvedValueOnce({
        ...baseTable,
        conditions: [
          {
            ...baseCondition,
            id: 'condition-2',
            flatCommission: 7,
            bonusCommission: 2,
            advanceCommission: 1,
            totalCommission: 999,
          },
        ],
      });
    transactionMock.commercialCondition.updateMany.mockResolvedValueOnce({
      count: 1,
    });
    transactionMock.commercialCondition.createMany.mockResolvedValueOnce({
      count: 1,
    });

    const result = await commercialService.replaceConditions('tenant-1', 'table-1', {
      conditions: [
        {
          ...createPayload.conditions![0],
          flatCommission: 7,
          bonusCommission: 2,
          advanceCommission: 1,
          totalCommission: 999,
        },
      ],
    });

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(transactionMock.commercialCondition.updateMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        commercialTableId: 'table-1',
        deletedAt: null,
      },
      data: expect.objectContaining({
        active: false,
        deletedAt: expect.any(Date),
      }),
    });
    expect(transactionMock.commercialCondition.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          totalCommission: 10,
        }),
      ],
    });
    expect(result.conditions[0]?.totalCommission).toBe(10);
  });

  it('isolates table lookup by tenant', async () => {
    transactionMock.commercialTable.findFirst.mockResolvedValueOnce(null);

    await expect(
      commercialService.getTableDetails('tenant-2', 'table-1'),
    ).rejects.toThrow('Commercial table not found');

    expect(transactionMock.commercialTable.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'table-1',
          tenantId: 'tenant-2',
          deletedAt: null,
        }),
      }),
    );
  });
});

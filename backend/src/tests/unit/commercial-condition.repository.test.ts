import { describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  commercialCondition: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock('../../core/prisma/client.js', () => ({
  prisma: prismaMock,
}));

import {
  calculateOperationalCommissionTotal,
  commercialConditionRepository,
} from '../../modules/commercial/repositories/commercial-condition.repository.js';

const baseCreateDto = {
  tenantId: 'tenant-1',
  commercialTableId: 'table-1',
  minTerm: 12,
  maxTerm: 12,
  term: 12,
  monthlyRate: 1.25,
  cetRate: 1.55,
  coefficient: 0.123456,
  flatCommission: 5,
  bonusCommission: 1.25,
  advanceCommission: 0.5,
  totalCommission: 999,
  minAmount: 1000,
  maxAmount: 10000,
};

const currentCondition = {
  id: 'condition-1',
  commissionRate: 5,
  coefficient: 0.123456,
  flatCommission: 5,
  bonusCommission: 1,
  advanceCommission: 0.5,
  totalCommission: 6.5,
};

describe('commercialConditionRepository', () => {
  it('calculates the official operational commission total', () => {
    expect(calculateOperationalCommissionTotal(5, 1.25, 0.5)).toBe(6.75);
    expect(calculateOperationalCommissionTotal(1.111111, 2.222222, 3.333333)).toBe(
      6.666666,
    );
  });

  it('creates commercial conditions with calculated totalCommission', async () => {
    prismaMock.commercialCondition.create.mockResolvedValueOnce({
      id: 'condition-1',
    });

    await commercialConditionRepository.create(baseCreateDto);

    expect(prismaMock.commercialCondition.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        coefficient: 0.123456,
        flatCommission: 5,
        bonusCommission: 1.25,
        advanceCommission: 0.5,
        totalCommission: 6.75,
        commissionRate: 5,
      }),
    });
  });

  it('updates operational fields and ignores divergent totalCommission input', async () => {
    prismaMock.commercialCondition.findUnique.mockResolvedValueOnce(
      currentCondition,
    );
    prismaMock.commercialCondition.update.mockResolvedValueOnce({
      id: 'condition-1',
    });

    await commercialConditionRepository.update('condition-1', {
      bonusCommission: 2,
      totalCommission: 999,
    });

    expect(prismaMock.commercialCondition.update).toHaveBeenCalledWith({
      where: { id: 'condition-1' },
      data: expect.objectContaining({
        coefficient: 0.123456,
        flatCommission: 5,
        bonusCommission: 2,
        advanceCommission: 0.5,
        totalCommission: 7.5,
        commissionRate: 5,
      }),
    });
  });

  it('uses commissionRate only as a legacy fallback', async () => {
    prismaMock.commercialCondition.create.mockResolvedValueOnce({
      id: 'legacy-condition',
    });

    await commercialConditionRepository.create({
      ...baseCreateDto,
      coefficient: undefined,
      flatCommission: undefined,
      bonusCommission: undefined,
      advanceCommission: undefined,
      totalCommission: undefined,
      commissionRate: 4.25,
    } as unknown as Parameters<typeof commercialConditionRepository.create>[0]);

    expect(prismaMock.commercialCondition.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        coefficient: 0,
        flatCommission: 4.25,
        bonusCommission: 0,
        advanceCommission: 0,
        totalCommission: 4.25,
        commissionRate: 4.25,
      }),
    });
  });

  it('does not let a legacy commissionRate patch rewrite operational values', async () => {
    prismaMock.commercialCondition.findUnique.mockResolvedValueOnce(
      currentCondition,
    );
    prismaMock.commercialCondition.update.mockResolvedValueOnce({
      id: 'condition-1',
    });

    await commercialConditionRepository.update('condition-1', {
      commissionRate: 9,
    });

    expect(prismaMock.commercialCondition.update).toHaveBeenCalledWith({
      where: { id: 'condition-1' },
      data: {
        commissionRate: 9,
      },
    });
  });
});

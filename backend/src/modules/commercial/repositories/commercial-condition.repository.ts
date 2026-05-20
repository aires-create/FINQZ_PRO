import type { CommercialCondition, Prisma } from '@prisma/client';
import { prisma } from '../../../database/prisma.js';
import type {
  CreateCommercialConditionDto,
  OperationalCommissionFields,
  UpdateCommercialConditionDto,
} from '../dto/commercial-condition.dto.js';

type CommercialConditionEnergyFields = Pick<
  CreateCommercialConditionDto,
  'minConsumption' | 'maxConsumption' | 'tariffKwh'
>;

const hasEnergyFields = (data: CommercialConditionEnergyFields): boolean => {
  return (
    data.minConsumption !== undefined ||
    data.maxConsumption !== undefined ||
    data.tariffKwh !== undefined
  );
};

const hasOperationalCommissionFields = (
  data: OperationalCommissionFields,
): boolean => {
  return (
    data.coefficient !== undefined ||
    data.flatCommission !== undefined ||
    data.bonusCommission !== undefined ||
    data.advanceCommission !== undefined ||
    data.totalCommission !== undefined ||
    data.commissionRate !== undefined
  );
};

export const calculateOperationalCommissionTotal = (
  flatCommission: number,
  bonusCommission: number,
  advanceCommission: number,
): number => {
  return Number(
    (flatCommission + bonusCommission + advanceCommission).toFixed(6),
  );
};

const normalizeOperationalCommissions = (
  data: OperationalCommissionFields,
): Required<
  Pick<
    OperationalCommissionFields,
    'flatCommission' | 'bonusCommission' | 'advanceCommission' | 'totalCommission'
  >
> => {
  const flatCommission = data.flatCommission ?? data.commissionRate ?? 0;
  const bonusCommission = data.bonusCommission ?? 0;
  const advanceCommission = data.advanceCommission ?? 0;

  return {
    flatCommission,
    bonusCommission,
    advanceCommission,
    totalCommission: calculateOperationalCommissionTotal(
      flatCommission,
      bonusCommission,
      advanceCommission,
    ),
  };
};

const applyOptionalCreateFields = (
  target: Prisma.CommercialConditionUncheckedCreateInput,
  data: CreateCommercialConditionDto,
): void => {
  if (data.coefficient !== undefined) target.coefficient = data.coefficient;
  if (data.minAge !== undefined) target.minAge = data.minAge;
  if (data.maxAge !== undefined) target.maxAge = data.maxAge;
  if (data.minConsumption !== undefined) target.minConsumption = data.minConsumption;
  if (data.maxConsumption !== undefined) target.maxConsumption = data.maxConsumption;
  if (data.tariffKwh !== undefined) target.tariffKwh = data.tariffKwh;
  if (data.savingsPercent !== undefined) target.savingsPercent = data.savingsPercent;
  if (data.estimatedValue !== undefined) target.estimatedValue = data.estimatedValue;
  if (data.contractTerm !== undefined) target.contractTerm = data.contractTerm;
  if (data.earlyTerminationFee !== undefined) {
    target.earlyTerminationFee = data.earlyTerminationFee;
  }
  if (data.campaignName !== undefined) target.campaignName = data.campaignName;
  if (data.notes !== undefined) target.notes = data.notes;
  if (data.active !== undefined) target.active = data.active;
};

const buildCreateData = (
  data: CreateCommercialConditionDto,
): Prisma.CommercialConditionUncheckedCreateInput => {
  const createData: Prisma.CommercialConditionUncheckedCreateInput = {
    tenantId: data.tenantId,
    commercialTableId: data.commercialTableId,
    minTerm: data.minTerm,
    maxTerm: data.maxTerm,
    term: data.term,
    monthlyRate: data.monthlyRate,
    cetRate: data.cetRate,
    commissionRate: data.commissionRate ?? data.flatCommission ?? 0,
    minAmount: data.minAmount,
    maxAmount: data.maxAmount,
  };

  applyOptionalCreateFields(createData, data);

  if (!hasEnergyFields(data)) {
    const normalizedCommissions = normalizeOperationalCommissions(data);
    Object.assign(createData, normalizedCommissions);
    createData.commissionRate =
      data.commissionRate ?? normalizedCommissions.flatCommission;
  }

  return createData;
};

const applyOptionalUpdateFields = (
  target: Prisma.CommercialConditionUncheckedUpdateInput,
  data: UpdateCommercialConditionDto,
): void => {
  if (data.minTerm !== undefined) target.minTerm = data.minTerm;
  if (data.maxTerm !== undefined) target.maxTerm = data.maxTerm;
  if (data.term !== undefined) target.term = data.term;
  if (data.monthlyRate !== undefined) target.monthlyRate = data.monthlyRate;
  if (data.cetRate !== undefined) target.cetRate = data.cetRate;
  if (data.coefficient !== undefined) target.coefficient = data.coefficient;
  if (data.commissionRate !== undefined) target.commissionRate = data.commissionRate;
  if (data.minAmount !== undefined) target.minAmount = data.minAmount;
  if (data.maxAmount !== undefined) target.maxAmount = data.maxAmount;
  if (data.minAge !== undefined) target.minAge = data.minAge;
  if (data.maxAge !== undefined) target.maxAge = data.maxAge;
  if (data.minConsumption !== undefined) target.minConsumption = data.minConsumption;
  if (data.maxConsumption !== undefined) target.maxConsumption = data.maxConsumption;
  if (data.tariffKwh !== undefined) target.tariffKwh = data.tariffKwh;
  if (data.savingsPercent !== undefined) target.savingsPercent = data.savingsPercent;
  if (data.estimatedValue !== undefined) target.estimatedValue = data.estimatedValue;
  if (data.contractTerm !== undefined) target.contractTerm = data.contractTerm;
  if (data.earlyTerminationFee !== undefined) {
    target.earlyTerminationFee = data.earlyTerminationFee;
  }
  if (data.campaignName !== undefined) target.campaignName = data.campaignName;
  if (data.notes !== undefined) target.notes = data.notes;
  if (data.active !== undefined) target.active = data.active;
};

const mergeCommissionPatch = (
  current: CommercialCondition,
  patch: UpdateCommercialConditionDto,
): OperationalCommissionFields => {
  const merged: OperationalCommissionFields = {
    commissionRate: patch.commissionRate ?? current.commissionRate,
  };

  const coefficient = patch.coefficient ?? current.coefficient;
  const flatCommission =
    patch.flatCommission ?? patch.commissionRate ?? current.flatCommission;
  const bonusCommission = patch.bonusCommission ?? current.bonusCommission;
  const advanceCommission =
    patch.advanceCommission ?? current.advanceCommission;
  const totalCommission = patch.totalCommission ?? current.totalCommission;

  if (coefficient !== null && coefficient !== undefined) {
    merged.coefficient = coefficient;
  }
  if (flatCommission !== null && flatCommission !== undefined) {
    merged.flatCommission = flatCommission;
  }
  if (bonusCommission !== null && bonusCommission !== undefined) {
    merged.bonusCommission = bonusCommission;
  }
  if (advanceCommission !== null && advanceCommission !== undefined) {
    merged.advanceCommission = advanceCommission;
  }
  if (totalCommission !== null && totalCommission !== undefined) {
    merged.totalCommission = totalCommission;
  }

  return merged;
};

export const commercialConditionRepository = {
  create(data: CreateCommercialConditionDto): Promise<CommercialCondition> {
    return prisma.commercialCondition.create({
      data: buildCreateData(data),
    });
  },

  async update(
    id: string,
    data: UpdateCommercialConditionDto,
  ): Promise<CommercialCondition | null> {
    const current = await prisma.commercialCondition.findUnique({
      where: { id },
    });

    if (!current) return null;

    const updateData: Prisma.CommercialConditionUncheckedUpdateInput = {};
    applyOptionalUpdateFields(updateData, data);

    if (!hasEnergyFields(data) && hasOperationalCommissionFields(data)) {
      const normalizedCommissions = normalizeOperationalCommissions(
        mergeCommissionPatch(current, data),
      );
      Object.assign(updateData, normalizedCommissions);
      updateData.commissionRate =
        data.commissionRate ?? normalizedCommissions.flatCommission;
    }

    return prisma.commercialCondition.update({
      where: { id },
      data: updateData,
    });
  },

  listByTable(commercialTableId: string): Promise<CommercialCondition[]> {
    return prisma.commercialCondition.findMany({
      where: {
        commercialTableId,
        deletedAt: null,
      },
      orderBy: [{ term: 'asc' }, { createdAt: 'asc' }],
    });
  },
};

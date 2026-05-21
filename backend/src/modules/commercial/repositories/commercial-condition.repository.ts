import type { CommercialCondition, Prisma } from '@prisma/client';
import { prisma } from '../../../core/prisma/client.js';
import type {
  CommercialConditionPayload,
  CreateCommercialConditionDto,
  LegacyCommissionFallbackFields,
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

type OperationalCommissionInput = Partial<OperationalCommissionFields> &
  LegacyCommissionFallbackFields;

type CommercialConditionCreateInput = CommercialConditionPayload &
  Pick<CreateCommercialConditionDto, 'tenantId' | 'commercialTableId'>;

type CommercialPrismaClient = typeof prisma | Prisma.TransactionClient;

const hasOperationalCommissionFields = (
  data: Partial<OperationalCommissionFields>,
): boolean => {
  return (
    data.coefficient !== undefined ||
    data.flatCommission !== undefined ||
    data.bonusCommission !== undefined ||
    data.advanceCommission !== undefined ||
    data.totalCommission !== undefined
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
  data: OperationalCommissionInput,
): Required<
  Pick<
    OperationalCommissionFields,
    | 'coefficient'
    | 'flatCommission'
    | 'bonusCommission'
    | 'advanceCommission'
    | 'totalCommission'
  >
> => {
  const coefficient = data.coefficient ?? 0;
  const flatCommission = data.flatCommission ?? data.commissionRate ?? 0;
  const bonusCommission = data.bonusCommission ?? 0;
  const advanceCommission = data.advanceCommission ?? 0;

  return {
    coefficient,
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
  data: CommercialConditionCreateInput,
): void => {
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
  data: CommercialConditionCreateInput,
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
): OperationalCommissionInput => {
  const merged: OperationalCommissionInput = {
    commissionRate: patch.commissionRate ?? current.commissionRate,
  };

  const coefficient = patch.coefficient ?? current.coefficient ?? 0;
  const flatCommission =
    patch.flatCommission ??
    current.flatCommission ??
    patch.commissionRate ??
    current.commissionRate ??
    0;
  const bonusCommission = patch.bonusCommission ?? current.bonusCommission ?? 0;
  const advanceCommission =
    patch.advanceCommission ?? current.advanceCommission ?? 0;

  merged.coefficient = coefficient;
  merged.flatCommission = flatCommission;
  merged.bonusCommission = bonusCommission;
  merged.advanceCommission = advanceCommission;

  return merged;
};

export const commercialConditionRepository = {
  create(
    data: CreateCommercialConditionDto,
    client: CommercialPrismaClient = prisma,
  ): Promise<CommercialCondition> {
    return client.commercialCondition.create({
      data: buildCreateData(data),
    });
  },

  async createManyForTable(
    client: CommercialPrismaClient,
    tenantId: string,
    commercialTableId: string,
    conditions: CommercialConditionPayload[],
  ): Promise<void> {
    if (conditions.length === 0) return;

    await client.commercialCondition.createMany({
      data: conditions.map((condition) =>
        buildCreateData({
          ...condition,
          tenantId,
          commercialTableId,
        }),
      ),
    });
  },

  async update(
    id: string,
    data: UpdateCommercialConditionDto,
    tenantId?: string,
    client: CommercialPrismaClient = prisma,
  ): Promise<CommercialCondition | null> {
    const current = tenantId
      ? await client.commercialCondition.findFirst({
          where: { id, tenantId, deletedAt: null },
        })
      : await client.commercialCondition.findUnique({
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

    return client.commercialCondition.update({
      where: { id },
      data: updateData,
    });
  },

  listByTable(
    commercialTableId: string,
    tenantId?: string,
    client: CommercialPrismaClient = prisma,
  ): Promise<CommercialCondition[]> {
    return client.commercialCondition.findMany({
      where: {
        commercialTableId,
        ...(tenantId ? { tenantId } : {}),
        deletedAt: null,
      },
      orderBy: [{ term: 'asc' }, { createdAt: 'asc' }],
    });
  },

  async replaceByTable(
    client: CommercialPrismaClient,
    tenantId: string,
    commercialTableId: string,
    conditions: CommercialConditionPayload[],
  ): Promise<void> {
    await this.softDeleteByTable(client, tenantId, commercialTableId);
    await this.createManyForTable(client, tenantId, commercialTableId, conditions);
  },

  async softDeleteByTable(
    client: CommercialPrismaClient,
    tenantId: string,
    commercialTableId: string,
  ): Promise<void> {
    await client.commercialCondition.updateMany({
      where: {
        tenantId,
        commercialTableId,
        deletedAt: null,
      },
      data: {
        active: false,
        deletedAt: new Date(),
      },
    });
  },
};

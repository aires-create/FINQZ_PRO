import type { CommercialCondition } from '@prisma/client';
import { NotFoundError } from '../../../shared/errors/index.js';
import type {
  CommercialConditionResponseDto,
  CommercialTableFiltersDto,
  CommercialTableResponseDto,
  CreateCommercialTableDto,
  ReplaceCommercialConditionsDto,
  UpdateCommercialTableDto,
} from '../dto/commercial-table.dto.js';
import {
  calculateOperationalCommissionTotal,
  commercialConditionRepository,
} from '../repositories/commercial-condition.repository.js';
import {
  commercialTableRepository,
  runCommercialSerializableTransaction,
} from '../repositories/commercial-table.repository.js';

type CommercialTableWithConditions = NonNullable<
  Awaited<ReturnType<typeof commercialTableRepository.findById>>
>;

const normalizeRequiredText = (value: string) => value.trim();

const normalizeOptionalText = (value?: string | null) => {
  if (value === undefined) return undefined;

  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const normalizeDate = (value?: string | number | Date | null) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  return value instanceof Date ? value : new Date(value);
};

const buildCommercialTableCreateData = (
  tenantId: string,
  body: CreateCommercialTableDto,
): Parameters<typeof commercialTableRepository.create>[1] => {
  const data: Parameters<typeof commercialTableRepository.create>[1] = {
    tenantId,
    providerId: normalizeRequiredText(body.providerId),
    providerCode: normalizeRequiredText(body.providerCode),
    providerName: normalizeRequiredText(body.providerName),
    providerType: normalizeRequiredText(body.providerType),
    productId: normalizeRequiredText(body.productId),
    productCode: normalizeRequiredText(body.productCode),
    productName: normalizeRequiredText(body.productName),
    subproductId: normalizeRequiredText(body.subproductId),
    subproductCode: normalizeRequiredText(body.subproductCode),
    subproductName: normalizeRequiredText(body.subproductName),
    modality: normalizeRequiredText(body.modality),
    modalityLabel: normalizeRequiredText(body.modalityLabel),
    name: normalizeRequiredText(body.name),
    code: normalizeRequiredText(body.code),
    active: body.active ?? true,
  };

  const startDate = normalizeDate(body.startDate);
  const endDate = normalizeDate(body.endDate);
  const energyType = normalizeOptionalText(body.energyType);
  const customerType = normalizeOptionalText(body.customerType);
  const distributionCompany = normalizeOptionalText(body.distributionCompany);
  const region = normalizeOptionalText(body.region);

  if (startDate !== undefined) data.startDate = startDate;
  if (endDate !== undefined) data.endDate = endDate;
  if (energyType !== undefined) data.energyType = energyType;
  if (customerType !== undefined) data.customerType = customerType;
  if (distributionCompany !== undefined) {
    data.distributionCompany = distributionCompany;
  }
  if (region !== undefined) data.region = region;

  return data;
};

const applyTextUpdate = <T extends Record<string, unknown>>(
  target: T,
  key: keyof T,
  value: string | undefined,
) => {
  if (value !== undefined) {
    target[key] = normalizeRequiredText(value) as T[keyof T];
  }
};

const applyNullableTextUpdate = <T extends Record<string, unknown>>(
  target: T,
  key: keyof T,
  value: string | null | undefined,
) => {
  if (value !== undefined) {
    target[key] = normalizeOptionalText(value) as T[keyof T];
  }
};

const buildCommercialTableUpdateData = (
  body: UpdateCommercialTableDto,
): Parameters<typeof commercialTableRepository.update>[3] => {
  const data: Record<string, unknown> = {};

  applyTextUpdate(data, 'providerId', body.providerId);
  applyTextUpdate(data, 'providerCode', body.providerCode);
  applyTextUpdate(data, 'providerName', body.providerName);
  applyTextUpdate(data, 'providerType', body.providerType);
  applyTextUpdate(data, 'productId', body.productId);
  applyTextUpdate(data, 'productCode', body.productCode);
  applyTextUpdate(data, 'productName', body.productName);
  applyTextUpdate(data, 'subproductId', body.subproductId);
  applyTextUpdate(data, 'subproductCode', body.subproductCode);
  applyTextUpdate(data, 'subproductName', body.subproductName);
  applyTextUpdate(data, 'modality', body.modality);
  applyTextUpdate(data, 'modalityLabel', body.modalityLabel);
  applyTextUpdate(data, 'name', body.name);
  applyTextUpdate(data, 'code', body.code);
  applyNullableTextUpdate(data, 'energyType', body.energyType);
  applyNullableTextUpdate(data, 'customerType', body.customerType);
  applyNullableTextUpdate(data, 'distributionCompany', body.distributionCompany);
  applyNullableTextUpdate(data, 'region', body.region);

  if (body.active !== undefined) data.active = body.active;
  if (body.startDate !== undefined) data.startDate = normalizeDate(body.startDate);
  if (body.endDate !== undefined) data.endDate = normalizeDate(body.endDate);

  return data as Parameters<typeof commercialTableRepository.update>[3];
};

const toIsoString = (value: Date | null) => value?.toISOString() ?? null;

const mapConditionResponse = (
  condition: CommercialCondition,
): CommercialConditionResponseDto => ({
  id: condition.id,
  commercialTableId: condition.commercialTableId,
  minTerm: condition.minTerm,
  maxTerm: condition.maxTerm,
  term: condition.term,
  monthlyRate: condition.monthlyRate,
  cetRate: condition.cetRate,
  coefficient: condition.coefficient,
  flatCommission: condition.flatCommission,
  bonusCommission: condition.bonusCommission,
  advanceCommission: condition.advanceCommission,
  totalCommission: calculateOperationalCommissionTotal(
    condition.flatCommission,
    condition.bonusCommission,
    condition.advanceCommission,
  ),
  commissionRate: condition.commissionRate,
  minAmount: condition.minAmount,
  maxAmount: condition.maxAmount,
  minAge: condition.minAge,
  maxAge: condition.maxAge,
  minConsumption: condition.minConsumption,
  maxConsumption: condition.maxConsumption,
  tariffKwh: condition.tariffKwh,
  savingsPercent: condition.savingsPercent,
  estimatedValue: condition.estimatedValue,
  contractTerm: condition.contractTerm,
  earlyTerminationFee: condition.earlyTerminationFee,
  campaignName: condition.campaignName,
  notes: condition.notes,
  active: condition.active,
  createdAt: condition.createdAt.toISOString(),
  updatedAt: condition.updatedAt.toISOString(),
});

const mapTableResponse = (
  table: CommercialTableWithConditions,
): CommercialTableResponseDto => ({
  id: table.id,
  providerId: table.providerId,
  providerCode: table.providerCode,
  providerName: table.providerName,
  providerType: table.providerType,
  productId: table.productId,
  productCode: table.productCode,
  productName: table.productName,
  subproductId: table.subproductId,
  subproductCode: table.subproductCode,
  subproductName: table.subproductName,
  modality: table.modality,
  modalityLabel: table.modalityLabel,
  name: table.name,
  code: table.code,
  active: table.active,
  startDate: toIsoString(table.startDate),
  endDate: toIsoString(table.endDate),
  energyType: table.energyType,
  customerType: table.customerType,
  distributionCompany: table.distributionCompany,
  region: table.region,
  createdAt: table.createdAt.toISOString(),
  updatedAt: table.updatedAt.toISOString(),
  conditions: table.conditions.map(mapConditionResponse),
});

const assertTableFound = (
  table: CommercialTableWithConditions | null,
): CommercialTableWithConditions => {
  if (!table) {
    throw new NotFoundError('Commercial table not found');
  }

  return table;
};

export const commercialService = {
  async listTables(
    tenantId: string,
    filters: CommercialTableFiltersDto = {},
  ): Promise<CommercialTableResponseDto[]> {
    const tables = await commercialTableRepository.findAll(tenantId, filters);

    return tables.map(mapTableResponse);
  },

  async getTableDetails(
    tenantId: string,
    id: string,
  ): Promise<CommercialTableResponseDto> {
    const table = assertTableFound(
      await commercialTableRepository.findById(tenantId, id),
    );

    return mapTableResponse(table);
  },

  async createTable(
    tenantId: string,
    body: CreateCommercialTableDto,
  ): Promise<CommercialTableResponseDto> {
    return runCommercialSerializableTransaction(async (transaction) => {
      const table = await commercialTableRepository.create(
        transaction,
        buildCommercialTableCreateData(tenantId, body),
      );

      await commercialConditionRepository.createManyForTable(
        transaction,
        tenantId,
        table.id,
        body.conditions ?? [],
      );

      const created = assertTableFound(
        await commercialTableRepository.findById(tenantId, table.id, transaction),
      );

      return mapTableResponse(created);
    });
  },

  async updateTable(
    tenantId: string,
    id: string,
    body: UpdateCommercialTableDto,
  ): Promise<CommercialTableResponseDto> {
    return runCommercialSerializableTransaction(async (transaction) => {
      assertTableFound(
        await commercialTableRepository.findById(tenantId, id, transaction),
      );

      const updateData = buildCommercialTableUpdateData(body);

      if (Object.keys(updateData).length > 0) {
        await commercialTableRepository.update(
          transaction,
          tenantId,
          id,
          updateData,
        );
      }

      if (body.conditions !== undefined) {
        await commercialConditionRepository.replaceByTable(
          transaction,
          tenantId,
          id,
          body.conditions,
        );
      }

      const updated = assertTableFound(
        await commercialTableRepository.findById(tenantId, id, transaction),
      );

      return mapTableResponse(updated);
    });
  },

  async replaceConditions(
    tenantId: string,
    id: string,
    body: ReplaceCommercialConditionsDto,
  ): Promise<CommercialTableResponseDto> {
    return runCommercialSerializableTransaction(async (transaction) => {
      assertTableFound(
        await commercialTableRepository.findById(tenantId, id, transaction),
      );

      await commercialConditionRepository.replaceByTable(
        transaction,
        tenantId,
        id,
        body.conditions,
      );

      const updated = assertTableFound(
        await commercialTableRepository.findById(tenantId, id, transaction),
      );

      return mapTableResponse(updated);
    });
  },

  async deleteTable(tenantId: string, id: string): Promise<void> {
    await runCommercialSerializableTransaction(async (transaction) => {
      assertTableFound(
        await commercialTableRepository.findById(tenantId, id, transaction),
      );

      await commercialConditionRepository.softDeleteByTable(
        transaction,
        tenantId,
        id,
      );
      await commercialTableRepository.softDelete(transaction, tenantId, id);
    });
  },
};

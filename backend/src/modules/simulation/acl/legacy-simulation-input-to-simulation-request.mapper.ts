import type {
  SimulationAgreementContext,
  SimulationAsset,
  SimulationCollateral,
  SimulationContext,
  SimulationIncomeContext,
  SimulationMetadata,
  SimulationParticipant,
  SimulationParameters,
  SimulationProductContext,
  SimulationRequest,
  SimulationSubproductContext,
  SimulationTenantContext,
} from '../contracts/simulation.contract.js';
import type { LegacySimulationInput } from './legacy-simulation.types.js';
import {
  createSimulationBridgeContext,
  createSimulationBridgeVersioning,
  type SimulationBridgeContext,
} from './simulation-bridge-context.js';

const mapLegacyProductTypeLabel = (productType: LegacySimulationInput['productType']): string => {
  switch (productType) {
    case 'consigned_loan':
      return 'Consigned Loan';
    case 'fgts':
      return 'FGTS';
    case 'personal_credit':
      return 'Personal Credit';
    case 'vehicle_financing':
      return 'Vehicle Financing';
    case 'insurance':
      return 'Insurance';
    case 'credit_card':
      return 'Credit Card';
    default:
      return productType;
  }
};

const buildTenant = (
  input: LegacySimulationInput,
  context: SimulationBridgeContext,
): SimulationTenantContext => {
  const tenant: SimulationTenantContext = {
    id: context.tenantId || input.tenantId,
  };

  if (input.bankCode) {
    tenant.code = input.bankCode;
  }
  if (input.bankName) {
    tenant.name = input.bankName;
  }

  return tenant;
};

const buildProduct = (input: LegacySimulationInput): SimulationProductContext => ({
  id: input.productId ?? input.productCode ?? input.productType,
  code: input.productCode ?? input.productType,
  name: input.productName ?? mapLegacyProductTypeLabel(input.productType),
});

const buildSubproduct = (input: LegacySimulationInput): SimulationSubproductContext => ({
  id: input.subproductId ?? input.agreementCode ?? input.productCode ?? input.productType,
  productId: input.productId ?? input.productCode ?? input.productType,
  code: input.subproductCode ?? input.agreementCode ?? input.productType,
  name: input.subproductName ?? input.agreementName ?? mapLegacyProductTypeLabel(input.productType),
});

const buildCustomer = (input: LegacySimulationInput): SimulationParticipant => {
  const customer: SimulationParticipant = {
    role: 'customer',
    name: input.customerName ?? 'Cliente legado',
  };

  if (input.customerDocument) {
    customer.document = input.customerDocument;
  }
  if (input.customerEmail) {
    customer.email = input.customerEmail;
  }
  if (input.customerPhone) {
    customer.phone = input.customerPhone;
  }
  if (input.tenantId) {
    customer.tenantId = input.tenantId;
  }
  if (input.customerType) {
    customer.metadata = { customerType: input.customerType };
  }

  return customer;
};

const buildParticipants = (input: LegacySimulationInput, customer: SimulationParticipant): SimulationParticipant[] => {
  const participants =
    input.participants?.map((participant) => {
      const dto: SimulationParticipant = {
        role: participant.role ?? 'customer',
        name: participant.name,
      };

      if (participant.id) {
        dto.id = participant.id;
      }
      if (participant.document) {
        dto.document = participant.document;
      }
      if (participant.email) {
        dto.email = participant.email;
      }
      if (participant.phone) {
        dto.phone = participant.phone;
      }
      if (participant.tenantId) {
        dto.tenantId = participant.tenantId;
      }
      if (participant.metadata) {
        dto.metadata = { ...participant.metadata };
      }

      return dto;
    }) ?? [];

  if (participants.length === 0) {
    participants.push(customer);
  }

  return participants;
};

const buildAsset = (
  asset: LegacySimulationInput['vehicle'] | LegacySimulationInput['property'],
): SimulationAsset | undefined => {
  if (!asset) return undefined;

  const dto: SimulationAsset = {
    kind: asset.kind ?? 'other',
    label: asset.label ?? asset.model ?? 'Legacy asset',
  };

  if (asset.id) dto.id = asset.id;
  if (asset.value !== undefined) dto.value = asset.value;
  if (asset.brand) dto.brand = asset.brand;
  if (asset.model) dto.model = asset.model;
  if (asset.year !== undefined) dto.year = asset.year;
  if (asset.plate) dto.plate = asset.plate;
  if (asset.chassi) dto.chassi = asset.chassi;
  if (asset.metadata) dto.metadata = { ...asset.metadata };

  return dto;
};

const buildGuarantees = (input: LegacySimulationInput): SimulationCollateral[] => {
  if (input.guarantees && input.guarantees.length > 0) {
    return input.guarantees.map((guarantee, index) => {
      const collateral: SimulationCollateral = {
        kind: guarantee.kind ?? 'other',
        label: guarantee.label ?? `Guarantee ${index + 1}`,
      };

      if (guarantee.id) collateral.id = guarantee.id;
      if (guarantee.value !== undefined) collateral.value = guarantee.value;
      if (guarantee.priority !== undefined) collateral.priority = guarantee.priority;
      if (guarantee.asset) {
        const asset = buildAsset(guarantee.asset);
        if (asset) {
          collateral.asset = asset;
        }
      }
      if (guarantee.metadata) collateral.metadata = { ...guarantee.metadata };

      return collateral;
    });
  }

  const vehicle = buildAsset(input.vehicle);
  const property = buildAsset(input.property);

  const guarantees: SimulationCollateral[] = [];
  if (vehicle) {
    const collateral: SimulationCollateral = {
      kind: 'vehicle',
      label: input.vehicle?.label ?? vehicle.label,
    };
    if (input.vehicle?.id) collateral.id = input.vehicle.id;
    if (vehicle.value !== undefined) collateral.value = vehicle.value;
    collateral.asset = vehicle;
    if (input.vehicle?.metadata) collateral.metadata = { ...input.vehicle.metadata };
    guarantees.push(collateral);
  }
  if (property) {
    const collateral: SimulationCollateral = {
      kind: 'property',
      label: input.property?.label ?? property.label,
    };
    if (input.property?.id) collateral.id = input.property.id;
    if (property.value !== undefined) collateral.value = property.value;
    collateral.asset = property;
    if (input.property?.metadata) collateral.metadata = { ...input.property.metadata };
    guarantees.push(collateral);
  }

  return guarantees;
};

const buildIncome = (input: LegacySimulationInput): SimulationIncomeContext | undefined => {
  if (input.incomeMonthlyValue === undefined) return undefined;

  const income: SimulationIncomeContext = {
    monthlyValue: input.incomeMonthlyValue,
  };

  if (input.incomeCurrency) {
    income.currency = input.incomeCurrency;
  }
  if (input.incomeSource) {
    income.source = input.incomeSource;
  }

  return income;
};

const buildAgreement = (input: LegacySimulationInput): SimulationAgreementContext | undefined => {
  if (!input.agreementCode && !input.agreementName) return undefined;

  return {
    id: input.agreementCode ?? input.agreementName ?? 'legacy-agreement',
    code: input.agreementCode ?? input.agreementName ?? 'legacy-agreement',
    name: input.agreementName ?? input.agreementCode ?? 'Legacy agreement',
  };
};

const buildParameters = (input: LegacySimulationInput): SimulationParameters => ({
  requestedAmount: input.requestedAmount,
  term: input.term,
  monthlyRate: input.monthlyRate,
});

const buildMetadata = (
  input: LegacySimulationInput,
  context: SimulationBridgeContext,
): SimulationMetadata => {
  const metadata: SimulationMetadata = {
    compatibilityMode: context.compatibilityMode,
    origin: input.source ?? context.source,
    createdAt: input.createdAt ?? context.createdAt,
    engineVersion: context.engineVersion,
    catalogVersion: context.catalogVersion,
    policyVersion: context.policyVersion,
    strategyVersion: context.strategyVersion,
  };

  if (input.updatedAt) {
    metadata.updatedAt = input.updatedAt;
  }

  return metadata;
};

const buildContext = (
  input: LegacySimulationInput,
  context: SimulationBridgeContext,
): SimulationContext => {
  const customer = buildCustomer(input);
  const simulationContext: SimulationContext = {
    tenant: buildTenant(input, context),
    product: buildProduct(input),
    subproduct: buildSubproduct(input),
    customer,
    participants: buildParticipants(input, customer),
    guarantees: buildGuarantees(input),
    parameters: buildParameters(input),
  };

  const vehicle = buildAsset(input.vehicle);
  if (vehicle) {
    simulationContext.vehicle = vehicle;
  }

  const property = buildAsset(input.property);
  if (property) {
    simulationContext.property = property;
  }

  const income = buildIncome(input);
  if (income) {
    simulationContext.income = income;
  }

  const agreement = buildAgreement(input);
  if (agreement) {
    simulationContext.agreement = agreement;
  }

  const commercial: NonNullable<SimulationContext['commercial']> = {
    modality: input.operationType,
  };

  if (input.productId ?? input.productCode) {
    const productId = input.productId ?? input.productCode;
    if (productId) {
      commercial.productId = productId;
    }
  }
  if (input.productCode ?? input.productType) {
    const productCode = input.productCode ?? input.productType;
    if (productCode) {
      commercial.productCode = productCode;
    }
  }
  if (input.subproductId ?? input.agreementCode) {
    const subproductId = input.subproductId ?? input.agreementCode;
    if (subproductId) {
      commercial.subproductId = subproductId;
    }
  }
  if (input.subproductCode ?? input.agreementCode) {
    const subproductCode = input.subproductCode ?? input.agreementCode;
    if (subproductCode) {
      commercial.subproductCode = subproductCode;
    }
  }

  simulationContext.commercial = commercial;

  return simulationContext;
};

export const legacySimulationInputToSimulationRequestMapper = (
  input: LegacySimulationInput,
  contextInput: Partial<SimulationBridgeContext> = {},
): SimulationRequest => {
  const bridgeContext: Partial<SimulationBridgeContext> = {
    tenantId: contextInput.tenantId ?? input.tenantId,
  };

  const opportunityId = contextInput.opportunityId ?? input.opportunityId;
  if (opportunityId) bridgeContext.opportunityId = opportunityId;

  const simulationId = contextInput.simulationId ?? input.simulationId;
  if (simulationId) bridgeContext.simulationId = simulationId;

  const executionId = contextInput.executionId ?? input.executionId;
  if (executionId) bridgeContext.executionId = executionId;

  const correlationId = contextInput.correlationId ?? input.correlationId;
  if (correlationId) bridgeContext.correlationId = correlationId;

  const requestId = contextInput.requestId ?? input.requestId;
  if (requestId) bridgeContext.requestId = requestId;

  const source = contextInput.source ?? input.source;
  if (source) bridgeContext.source = source;

  const compatibilityMode = contextInput.compatibilityMode ?? input.compatibilityMode;
  if (compatibilityMode) bridgeContext.compatibilityMode = compatibilityMode;

  const createdAt = contextInput.createdAt ?? input.createdAt;
  if (createdAt) bridgeContext.createdAt = createdAt;

  if (contextInput.catalogVersion) bridgeContext.catalogVersion = contextInput.catalogVersion;
  if (contextInput.engineVersion) bridgeContext.engineVersion = contextInput.engineVersion;
  if (contextInput.policyVersion) bridgeContext.policyVersion = contextInput.policyVersion;
  if (contextInput.strategyVersion) bridgeContext.strategyVersion = contextInput.strategyVersion;

  const context = createSimulationBridgeContext(bridgeContext);

  const request: SimulationRequest = {
    ...buildContext(input, context),
    metadata: buildMetadata(input, context),
    versioning: createSimulationBridgeVersioning(
      input.version ?? context.engineVersion,
      input.revision,
    ),
  };

  if (context.executionId || context.correlationId || context.requestId) {
    const execution = {
      executionId: context.executionId,
      correlationId: context.correlationId,
    } as NonNullable<SimulationRequest['execution']>;

    if (context.requestId) execution.requestId = context.requestId;
    if (context.simulationId) execution.snapshotId = context.simulationId;
    if (context.tenantId) execution.tenantId = context.tenantId;
    if (context.createdBy) execution.performedBy = context.createdBy;
    if (context.createdAt) execution.performedAt = context.createdAt;

    request.execution = execution;
  }

  return request;
};

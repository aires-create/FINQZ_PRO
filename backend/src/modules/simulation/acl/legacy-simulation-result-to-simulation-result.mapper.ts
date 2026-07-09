import type {
  SimulationAuditReference,
  SimulationDecision,
  SimulationMetadata,
  SimulationParticipant,
  SimulationProposal,
  SimulationRanking,
  SimulationRequest,
  SimulationResult,
  SimulationSnapshotReference,
} from '../contracts/simulation.contract.js';
import type { LegacySimulationResult } from './legacy-simulation.types.js';
import type { SimulationBridgeContext } from './simulation-bridge-context.js';
import { createSimulationBridgeContext } from './simulation-bridge-context.js';

const mapLegacyStatusToDecisionStatus = (status: LegacySimulationResult['status']): SimulationDecision['status'] => {
  switch (status) {
    case 'valida':
      return 'APPROVED';
    case 'atencao':
      return 'NEEDS_REVIEW';
    case 'inviavel':
      return 'REJECTED';
    case 'incompleto':
    default:
      return 'PENDING';
  }
};

const createResultItem = (
  key: string,
  label: string,
  value: number,
  unit?: string,
): { key: string; label: string; value: number; unit?: string } => {
  const item: { key: string; label: string; value: number; unit?: string } = {
    key,
    label,
    value,
  };

  if (unit) {
    item.unit = unit;
  }

  return item;
};

const buildCustomer = (request: SimulationRequest): SimulationParticipant => request.customer;

const buildMetadata = (
  legacyResult: LegacySimulationResult,
  context: SimulationBridgeContext,
): SimulationMetadata => {
  const metadata: SimulationMetadata = {
    compatibilityMode: context.compatibilityMode,
    origin: context.source,
    createdAt: legacyResult.createdAt ?? context.createdAt,
    engineVersion: context.engineVersion,
    catalogVersion: context.catalogVersion,
    policyVersion: context.policyVersion,
    strategyVersion: context.strategyVersion,
  };

  if (legacyResult.updatedAt) {
    metadata.updatedAt = legacyResult.updatedAt;
  }

  return metadata;
};

const buildRanking = (): SimulationRanking => ({
  candidates: [],
});

const buildDecision = (
  legacyResult: LegacySimulationResult,
): SimulationDecision => ({
  status: mapLegacyStatusToDecisionStatus(legacyResult.status),
  reasons: legacyResult.message ? [legacyResult.message] : [],
  ...(legacyResult.message ? { message: legacyResult.message } : {}),
});

export const legacySimulationResultToSimulationResultMapper = (
  request: SimulationRequest,
  legacyResult: LegacySimulationResult,
  contextInput: Partial<SimulationBridgeContext> = {},
): SimulationResult => {
  const bridgeContext: Partial<SimulationBridgeContext> = {
    tenantId: contextInput.tenantId ?? legacyResult.tenantId ?? request.tenant.id,
  };

  const opportunityId = contextInput.opportunityId ?? legacyResult.opportunityId ?? request.opportunity?.id;
  if (opportunityId) bridgeContext.opportunityId = opportunityId;

  const simulationId = contextInput.simulationId ?? legacyResult.simulationId ?? request.execution?.snapshotId;
  if (simulationId) bridgeContext.simulationId = simulationId;

  const executionId = contextInput.executionId ?? request.execution?.executionId;
  if (executionId) bridgeContext.executionId = executionId;

  const correlationId = contextInput.correlationId ?? request.execution?.correlationId;
  if (correlationId) bridgeContext.correlationId = correlationId;

  const source = contextInput.source ?? request.metadata.origin;
  if (source) bridgeContext.source = source;

  const compatibilityMode = contextInput.compatibilityMode ?? request.metadata.compatibilityMode;
  if (compatibilityMode) bridgeContext.compatibilityMode = compatibilityMode;

  const createdAt = legacyResult.createdAt ?? request.metadata.createdAt;
  if (createdAt) bridgeContext.createdAt = createdAt;

  if (contextInput.catalogVersion) bridgeContext.catalogVersion = contextInput.catalogVersion;
  if (contextInput.engineVersion) bridgeContext.engineVersion = contextInput.engineVersion;
  if (contextInput.policyVersion) bridgeContext.policyVersion = contextInput.policyVersion;
  if (contextInput.strategyVersion) bridgeContext.strategyVersion = contextInput.strategyVersion;

  const context = createSimulationBridgeContext(bridgeContext);

  const canonicalResult: SimulationResult = {
    tenant: request.tenant,
    product: request.product,
    subproduct: request.subproduct,
    customer: buildCustomer(request),
    participants: request.participants,
    guarantees: request.guarantees,
    metadata: buildMetadata(legacyResult, context),
    result: [
      createResultItem('requestedAmount', 'Requested Amount', legacyResult.requestedAmount),
      createResultItem('term', 'Term', legacyResult.term),
      createResultItem('monthlyRate', 'Monthly Rate', legacyResult.monthlyRate, '%'),
      createResultItem('installmentAmount', 'Installment Amount', legacyResult.installmentAmount),
      createResultItem('totalAmount', 'Total Amount', legacyResult.totalAmount),
      createResultItem('coefficient', 'Coefficient', legacyResult.coefficient),
    ],
    proposals: [
      {
        id: `${context.simulationId}-proposal`,
        reference: `${context.simulationId}-proposal-ref`,
        status: 'DRAFT',
        amount: legacyResult.requestedAmount,
        term: legacyResult.term,
        monthlyRate: legacyResult.monthlyRate,
      },
    ],
    ranking: buildRanking(),
    decision: buildDecision(legacyResult),
    rejectionReasons: legacyResult.status === 'inviavel' ? [legacyResult.message ?? 'Legacy simulation rejected'] : [],
    alerts: [],
    warnings: [],
    snapshot: {
      snapshotId: context.simulationId,
      snapshotVersion: request.versioning.version,
      source: context.source,
      capturedAt: legacyResult.updatedAt ?? context.createdAt,
    },
    proposalReference: {
      proposalId: `${context.simulationId}-proposal`,
      ...(legacyResult.productCode ? { proposalCode: legacyResult.productCode } : {}),
      proposalVersion: request.versioning.version,
    },
    auditReference: {
      auditId: `${context.executionId}-audit`,
      auditCode: context.correlationId,
    },
    executionId: context.executionId,
    executionTimestamp: legacyResult.updatedAt ?? context.createdAt,
    engineVersion: context.engineVersion,
    catalogVersion: context.catalogVersion,
    policyVersion: context.policyVersion,
    strategyVersion: context.strategyVersion,
    versioning: request.versioning,
    status: 'CALCULATED',
  };

  if (legacyResult.productId || legacyResult.productCode || legacyResult.productName) {
    canonicalResult.product = {
      ...request.product,
      ...(legacyResult.productId ? { id: legacyResult.productId } : {}),
      ...(legacyResult.productCode ? { code: legacyResult.productCode } : {}),
      ...(legacyResult.productName ? { name: legacyResult.productName } : {}),
    };
  }

  if (legacyResult.subproductId || legacyResult.subproductCode || legacyResult.subproductName) {
    canonicalResult.subproduct = {
      ...request.subproduct,
      ...(legacyResult.subproductId ? { id: legacyResult.subproductId } : {}),
      ...(legacyResult.subproductCode ? { code: legacyResult.subproductCode } : {}),
      ...(legacyResult.subproductName ? { name: legacyResult.subproductName } : {}),
    };
  }

  if (request.vehicle) {
    canonicalResult.vehicle = request.vehicle;
  }
  if (request.property) {
    canonicalResult.property = request.property;
  }
  if (request.income) {
    canonicalResult.income = request.income;
  }
  if (request.agreement) {
    canonicalResult.agreement = request.agreement;
  }
  if (request.provider) {
    canonicalResult.provider = request.provider;
  }
  if (request.commercializadora) {
    canonicalResult.commercializadora = request.commercializadora;
  }
  if (request.bank) {
    canonicalResult.bank = request.bank;
  }
  if (request.corban) {
    canonicalResult.corban = request.corban;
  }
  if (request.channel) {
    canonicalResult.channel = request.channel;
  }
  if (request.pipeline) {
    canonicalResult.pipeline = request.pipeline;
  }
  if (request.opportunity) {
    canonicalResult.opportunity = request.opportunity;
  }
  if (request.commercial) {
    canonicalResult.commercial = request.commercial;
  }
  if (request.parameters) {
    canonicalResult.parameters = request.parameters;
  }
  if (request.execution) {
    canonicalResult.execution = request.execution;
  }
  if (request.versioning) {
    canonicalResult.versioning = request.versioning;
  }
  if (contextInput.opportunityId ?? legacyResult.opportunityId) {
    canonicalResult.opportunity = {
      ...(request.opportunity ?? {}),
      id: context.opportunityId,
    };
  }

  return canonicalResult;
};

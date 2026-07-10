import type {
  SimulationRuntimeAgreement,
  SimulationRuntimeAsset,
  SimulationRuntimeCanonicalEntity,
  SimulationRuntimeChannel,
  SimulationRuntimeCommercialContext,
  SimulationRuntimeExecution,
  SimulationRuntimeGuarantee,
  SimulationRuntimeIncome,
  SimulationRuntimeLegacyResult,
  SimulationRuntimeMetadata,
  SimulationRuntimeParticipant,
  SimulationRuntimeParameters,
  SimulationRuntimePipeline,
  SimulationRuntimeProvider,
  SimulationRuntimeRequestBody,
  SimulationRuntimeSnapshotCandidate,
  SimulationRuntimeSubproductEntity,
  SimulationRuntimeWorkspaceInput,
} from "../contracts/simulation-runtime.contract";

const LOAN_WITH_COLLATERAL_PRODUCT: SimulationRuntimeCanonicalEntity = {
  id: "product-emprestimo-com-garantia",
  code: "EMPRESTIMO_COM_GARANTIA",
  name: "Empréstimo com Garantia",
  slug: "emprestimo-com-garantia",
  category: "credito",
  type: "financiamento",
  order: 1,
};

const AUTO_EQUITY_SUBPRODUCT: SimulationRuntimeSubproductEntity = {
  id: "subproduct-auto-equity",
  productId: LOAN_WITH_COLLATERAL_PRODUCT.id,
  code: "AUTO_EQUITY",
  name: "Auto Equity",
  slug: "auto-equity",
  category: "garantia",
  simulationEngine: "auto-equity-engine",
  proposal: "proposal-enterprise",
  provider: "bank",
  workflow: "approval",
  status: "ACTIVE",
};

const DEFAULT_COMPATIBILITY_MODE: SimulationRuntimeMetadata["compatibilityMode"] = "CANONICAL";
const DEFAULT_ENGINE_VERSION = "3.2.0";
const DEFAULT_CATALOG_VERSION = "3.1.0";
const DEFAULT_POLICY_VERSION = "1.0.0";
const DEFAULT_STRATEGY_VERSION = "1.0.0";

const normalizeText = (value: unknown): string => {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
};

const getDefinedSnapshot = (
  workspace: SimulationRuntimeWorkspaceInput,
): SimulationRuntimeSnapshotCandidate | null => {
  return workspace.proposalSnapshot ?? workspace.acceptedSnapshot ?? workspace.simulationSnapshot ?? null;
};

const cloneParticipant = (participant: SimulationRuntimeParticipant): SimulationRuntimeParticipant => ({
  ...participant,
  metadata: participant.metadata ? { ...participant.metadata } : undefined,
});

const cloneAsset = (asset: SimulationRuntimeAsset | undefined): SimulationRuntimeAsset | undefined => {
  if (!asset) {
    return undefined;
  }

  return {
    ...asset,
    metadata: asset.metadata ? { ...asset.metadata } : undefined,
  };
};

const cloneProvider = (provider: SimulationRuntimeProvider | undefined): SimulationRuntimeProvider | undefined => {
  if (!provider) {
    return undefined;
  }

  return {
    ...provider,
    metadata: provider.metadata ? { ...provider.metadata } : undefined,
  };
};

const cloneGuarantee = (guarantee: SimulationRuntimeGuarantee): SimulationRuntimeGuarantee => ({
  ...guarantee,
  asset: cloneAsset(guarantee.asset),
  metadata: guarantee.metadata ? { ...guarantee.metadata } : undefined,
});

const resolveCanonicalRequest = (workspace: SimulationRuntimeWorkspaceInput): SimulationRuntimeRequestBody | null => {
  const snapshot = getDefinedSnapshot(workspace);
  if (snapshot?.product && snapshot?.subproduct) {
    return buildRequestFromSnapshot(workspace, snapshot);
  }

  const simulationType = normalizeText(workspace.simulationType);
  const isLoanWithCollateral =
    simulationType === "emprestimo-garantia" ||
    simulationType === "loan-with-collateral" ||
    simulationType.includes("auto equity");

  if (!isLoanWithCollateral) {
    return null;
  }

  return buildRequestFromWorkspace(workspace);
};

const buildExecution = (workspace: SimulationRuntimeWorkspaceInput, requestId: string, correlationId: string): SimulationRuntimeExecution => {
  const now = new Date().toISOString();

  return {
    executionId: requestId,
    correlationId,
    requestId,
    snapshotId: workspace.opportunity?.id ?? requestId,
    tenantId: workspace.tenantId ?? workspace.opportunity?.tenantId ?? undefined,
    performedBy: workspace.currentUserId ?? undefined,
    performedAt: now,
  };
};

const buildMetadata = (
  workspace: SimulationRuntimeWorkspaceInput,
): SimulationRuntimeMetadata => ({
  compatibilityMode: DEFAULT_COMPATIBILITY_MODE,
  origin: "workspace-shadow",
  createdAt: new Date().toISOString(),
  engineVersion: DEFAULT_ENGINE_VERSION,
  catalogVersion: DEFAULT_CATALOG_VERSION,
  policyVersion: DEFAULT_POLICY_VERSION,
  strategyVersion: DEFAULT_STRATEGY_VERSION,
});

const buildCustomer = (workspace: SimulationRuntimeWorkspaceInput): SimulationRuntimeParticipant => {
  const opportunity = workspace.opportunity;
  const baseName = opportunity?.cliente_nome ?? opportunity?.nome ?? "Cliente Workspace";

  return {
    id: opportunity?.id ? `${opportunity.id}-customer` : undefined,
    role: "customer",
    name: baseName,
    document: opportunity?.cpf_cnpj ?? opportunity?.document,
    email: opportunity?.email,
    phone: opportunity?.telefone,
    tenantId: workspace.tenantId ?? opportunity?.tenantId ?? undefined,
  };
};

const buildVehicle = (workspace: SimulationRuntimeWorkspaceInput): SimulationRuntimeAsset | undefined => {
  const fields = workspace.simulationFields;
  const requestedAmount = Number(fields?.valorVeiculo ?? 0);

  if (requestedAmount <= 0) {
    return undefined;
  }

  return {
    id: workspace.opportunity?.id ? `${workspace.opportunity.id}-vehicle` : undefined,
    kind: "vehicle",
    label: workspace.opportunity?.produto ?? workspace.selectedSubproduct?.name ?? "Veículo",
    value: requestedAmount,
    metadata: {
      source: "workspace",
    },
  };
};

const buildIncome = (workspace: SimulationRuntimeWorkspaceInput): SimulationRuntimeIncome | undefined => {
  const monthlyValue = Number(workspace.simulationFields?.rendaMensal ?? 0);
  if (monthlyValue <= 0) {
    return undefined;
  }

  return {
    monthlyValue,
    currency: "BRL",
    source: "workspace",
  };
};

const buildCommercialContext = (workspace: SimulationRuntimeWorkspaceInput): SimulationRuntimeCommercialContext => ({
  productId: LOAN_WITH_COLLATERAL_PRODUCT.id,
  productCode: LOAN_WITH_COLLATERAL_PRODUCT.code,
  subproductId: AUTO_EQUITY_SUBPRODUCT.id,
  subproductCode: AUTO_EQUITY_SUBPRODUCT.code,
  modality: "REFINANCIAMENTO",
  workflow: "approval",
  segmentCode: "CREDITO_PF",
});

const buildParameters = (workspace: SimulationRuntimeWorkspaceInput): SimulationRuntimeParameters => {
  const fields = workspace.simulationFields ?? {};
  const valorVeiculo = Number(fields.valorVeiculo ?? 0);
  const percentualFinanciavel = Number(fields.percentualFinanciavel ?? 0);
  const valorSolicitado = valorVeiculo > 0 && percentualFinanciavel > 0
    ? valorVeiculo * (percentualFinanciavel / 100)
    : 0;

  return {
    requestedAmount: valorSolicitado,
    term: Number(fields.prazo ?? 0) || undefined,
    monthlyRate: Number(fields.taxaMes ?? 0) || undefined,
    downPayment: 0,
    fees: 0,
    ltv: percentualFinanciavel || undefined,
  };
};

const buildGuarantees = (workspace: SimulationRuntimeWorkspaceInput): SimulationRuntimeGuarantee[] => {
  const vehicle = buildVehicle(workspace);
  if (!vehicle) {
    return [];
  }

  return [
    {
      id: vehicle.id,
      kind: "vehicle",
      label: vehicle.label,
      value: vehicle.value,
      asset: vehicle,
    },
  ];
};

const buildRequestFromSnapshot = (
  workspace: SimulationRuntimeWorkspaceInput,
  snapshot: SimulationRuntimeSnapshotCandidate,
): SimulationRuntimeRequestBody => {
  const requestId = workspace.requestId ?? workspace.opportunity?.id ?? `shadow-${Date.now()}`;
  const correlationId = workspace.correlationId ?? requestId;

  return {
    product: snapshot.product ?? LOAN_WITH_COLLATERAL_PRODUCT,
    subproduct: snapshot.subproduct ?? AUTO_EQUITY_SUBPRODUCT,
    customer: snapshot.customer ? cloneParticipant(snapshot.customer) : buildCustomer(workspace),
    participants: (snapshot.participants ?? [snapshot.customer ?? buildCustomer(workspace)]).map(cloneParticipant),
    guarantees: (snapshot.guarantees ?? buildGuarantees(workspace)).map(cloneGuarantee),
    vehicle: cloneAsset(snapshot.vehicle ?? buildVehicle(workspace)),
    property: cloneAsset(snapshot.property),
    income: snapshot.income ? { ...snapshot.income } : buildIncome(workspace),
    agreement: snapshot.agreement ? { ...snapshot.agreement } : { id: AUTO_EQUITY_SUBPRODUCT.id, code: AUTO_EQUITY_SUBPRODUCT.code, name: AUTO_EQUITY_SUBPRODUCT.name },
    provider: cloneProvider(snapshot.provider),
    commercializadora: cloneProvider(snapshot.commercializadora as SimulationRuntimeProvider | undefined),
    bank: cloneProvider(snapshot.bank),
    corban: cloneProvider(snapshot.corban),
    channel: snapshot.channel ? { ...snapshot.channel } : undefined,
    pipeline: snapshot.pipeline ? { ...snapshot.pipeline } : undefined,
    opportunity: snapshot.opportunity
      ? { ...snapshot.opportunity }
      : workspace.opportunity?.id
        ? {
            id: workspace.opportunity.id,
            code: workspace.opportunity.code,
            name: workspace.opportunity.nome ?? workspace.opportunity.cliente_nome ?? "Workspace",
            pipelineId: workspace.opportunity.pipelineId ?? workspace.opportunity.backendPipelineId,
            stageId: workspace.opportunity.etapa_id,
          }
        : undefined,
    commercial: {
      ...buildCommercialContext(workspace),
      ...(snapshot.commercial ?? {}),
    },
    parameters: {
      ...buildParameters(workspace),
      ...(snapshot.parameters ?? {}),
    },
    metadata: {
      ...buildMetadata(workspace),
      ...(snapshot.metadata ?? {}),
    },
    versioning: {
      version: snapshot.versioning?.version ?? "3.2.0",
      ...(snapshot.versioning ?? {}),
    },
    execution: {
      executionId: snapshot.execution?.executionId ?? requestId,
      correlationId: snapshot.execution?.correlationId ?? correlationId,
      requestId: snapshot.execution?.requestId ?? requestId,
      snapshotId: snapshot.execution?.snapshotId ?? workspace.opportunity?.id ?? requestId,
      tenantId: snapshot.execution?.tenantId ?? workspace.tenantId ?? workspace.opportunity?.tenantId ?? undefined,
      performedBy: snapshot.execution?.performedBy ?? workspace.currentUserId ?? undefined,
      performedAt: snapshot.execution?.performedAt ?? new Date().toISOString(),
    },
  };
};

const buildRequestFromWorkspace = (workspace: SimulationRuntimeWorkspaceInput): SimulationRuntimeRequestBody => {
  const requestId = workspace.requestId ?? workspace.opportunity?.id ?? `shadow-${Date.now()}`;
  const correlationId = workspace.correlationId ?? requestId;
  const customer = buildCustomer(workspace);

  return {
    product: LOAN_WITH_COLLATERAL_PRODUCT,
    subproduct: AUTO_EQUITY_SUBPRODUCT,
    customer,
    participants: [customer],
    guarantees: buildGuarantees(workspace),
    vehicle: buildVehicle(workspace),
    income: buildIncome(workspace),
    agreement: {
      id: AUTO_EQUITY_SUBPRODUCT.id,
      code: AUTO_EQUITY_SUBPRODUCT.code,
      name: AUTO_EQUITY_SUBPRODUCT.name,
    },
    commercial: buildCommercialContext(workspace),
    parameters: buildParameters(workspace),
    metadata: buildMetadata(workspace),
    versioning: {
      version: "3.2.0",
      revision: 1,
    },
    execution: buildExecution(workspace, requestId, correlationId),
  };
};

export const buildWorkspaceSimulationRuntimeRequest = (
  workspace: SimulationRuntimeWorkspaceInput,
): SimulationRuntimeRequestBody | null => {
  return resolveCanonicalRequest(workspace);
};

export const buildWorkspaceSimulationRuntimeRequestOrThrow = (
  workspace: SimulationRuntimeWorkspaceInput,
): SimulationRuntimeRequestBody => {
  const request = buildWorkspaceSimulationRuntimeRequest(workspace);

  if (!request) {
    throw new Error("Unsupported simulation runtime workspace scenario");
  }

  return request;
};

export const buildWorkspaceSimulationRuntimeLegacyResult = (
  legacyResult: SimulationRuntimeLegacyResult | null | undefined,
): SimulationRuntimeLegacyResult | null => {
  if (!legacyResult) {
    return null;
  }

  return {
    ...legacyResult,
  };
};

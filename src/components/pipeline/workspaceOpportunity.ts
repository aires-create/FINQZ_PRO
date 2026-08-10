import { formatCurrency, normalizeKey } from './pipelineUtils';
import { mapearProdutoLegadoParaPipeline } from '../../config/pipelines';
import type {
  CreateOpportunityIntakePayload,
  CreateOpportunityPayload,
  MoveOpportunityStagePayload,
  Opportunity,
  UpdateOpportunityPayload,
} from '../../api/modules/opportunities.api';

export type OpportunityWorkspaceSource =
  | 'backend'
  | 'session'
  | 'snapshot'
  | 'local'
  | 'seed'
  | 'adapter'
  | 'unknown';

export type OpportunityWorkspaceStageSource =
  | 'stageId'
  | 'stage_id'
  | 'etapa_id'
  | 'etapa'
  | 'missing';

export type OpportunityWorkspacePipelineSource =
  | 'pipelineId'
  | 'pipeline_id'
  | 'produto'
  | 'missing';

export type OpportunityWorkspaceDisplayIdSource =
  | 'displayId'
  | 'id'
  | 'missing';

export interface OpportunityWorkspaceStageDescriptor {
  id?: string;
  key?: string;
  label?: string;
  nome?: string;
}

export interface OpportunityWorkspaceContext {
  source?: OpportunityWorkspaceSource;
  pipelineLabel?: string | null;
  stageCatalog?: readonly OpportunityWorkspaceStageDescriptor[];
}

export interface OpportunityWorkspaceInput {
  source?: unknown;
  displayId?: unknown;
  id?: unknown;
  opportunityId?: unknown;
  leadId?: unknown;
  tenantId?: unknown;
  customerId?: unknown;
  cliente_id?: unknown;
  pipelineId?: unknown;
  pipeline_id?: unknown;
  pipelineNome?: unknown;
  pipelineName?: unknown;
  stageId?: unknown;
  stage_id?: unknown;
  etapa_id?: unknown;
  etapa?: unknown;
  stageNome?: unknown;
  stageName?: unknown;
  title?: unknown;
  nome?: unknown;
  cliente_nome?: unknown;
  amount?: unknown;
  valor?: unknown;
  productId?: unknown;
  product_id?: unknown;
  produto_id?: unknown;
  produto?: unknown;
  ownerId?: unknown;
  responsavel_id?: unknown;
  assignedTo?: unknown;
  responsavel_nome?: unknown;
  status?: unknown;
  description?: unknown;
  observacoes?: unknown;
  telefone?: unknown;
  email?: unknown;
  tags?: unknown;
  origem?: unknown;
  createdAt?: unknown;
  created_at?: unknown;
  updatedAt?: unknown;
  updated_at?: unknown;
}

export interface OpportunityWorkspaceIdentity {
  id: string;
  displayId: string;
  leadId: string | null;
  opportunityId: string | null;
  customerId: string | null;
  pipelineId: string | null;
  stageId: string | null;
}

export interface OpportunityWorkspacePersistedFields {
  clienteNome: string;
  produto: string;
  responsavelNome: string;
  valor: number;
  origem: string;
  status: string;
  observacoes: string;
  telefone: string;
  email: string;
  tags: string[];
  createdAt: string | number | null;
  updatedAt: string | number | null;
}

export interface OpportunityWorkspaceDerivedFields {
  stageLabel: string;
  pipelineLabel: string;
  formattedValue: string;
  displayName: string;
  initials: string;
}

export interface OpportunityWorkspaceResolution {
  stageId: string | null;
  stageSource: OpportunityWorkspaceStageSource;
  pipelineId: string | null;
  pipelineSource: OpportunityWorkspacePipelineSource;
  displayIdSource: OpportunityWorkspaceDisplayIdSource;
}

export interface OpportunityWorkspaceCanonicalFields {
  id: string;
  pipelineId: string | null;
  stageId: string | null;
  title: string;
  amount: number;
  customerId: string | null;
  productId: string | null;
  ownerId: string | null;
  status: string;
  description: string;
}

export interface OpportunityWorkspaceDerivedViewFields {
  displayId: string;
  stageLabel: string;
  pipelineLabel: string;
  formattedValue: string;
  displayName: string;
  initials: string;
}

export interface OpportunityWorkspaceCompatibilityFields {
  leadId: string | null;
  opportunityId: string | null;
  // Legacy compatibility aliases. Keep flat while the workspace still consumes them.
  pipeline_id: string | null;
  stage_id: string | null;
  etapa_id: string;
  etapa: string;
  nome: string;
  valor: number;
  cliente_id: string | null;
  cliente_nome: string;
  produto_id: string | null;
  produto: string;
  responsavel_id: string | null;
  responsavel_nome: string;
  observacoes: string;
}

export interface OpportunityWorkspaceViewModel
  extends OpportunityWorkspaceCanonicalFields,
    OpportunityWorkspaceDerivedViewFields,
    OpportunityWorkspaceCompatibilityFields {
  source: OpportunityWorkspaceSource;
  identity: OpportunityWorkspaceIdentity;
  persisted: OpportunityWorkspacePersistedFields;
  derived: OpportunityWorkspaceDerivedFields;
  resolution: OpportunityWorkspaceResolution;
  raw: Record<string, unknown>;
  origem: string;
  tags: string[];
  telefone: string;
  email: string;
  createdAt: string | number | null;
  updatedAt: string | number | null;
}

export interface OpportunityWorkspaceUpdatePayload {
  nome: string;
  cliente_nome: string;
  telefone: string;
  celular: string;
  email: string;
  cpf_cnpj: string;
  tipoPessoa: string;
  profissao: string;
  estado_civil: string;
  sexo: string;
  data_nascimento: string;
  data_abertura: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  produto: string;
  productId: string;
  productCode: string;
  subproductId: string;
  subproductCode: string;
  modality: string;
  pipelineId: string;
  pipelineCode: string;
  catalogVersion: number;
  valor: number;
  etapa_id: string;
  etapa: string;
  status: string;
  cliente_id: number | null;
  responsavel_id: string | null;
  responsavel_nome: string;
  observacoes: string;
  tags: string[];
  banco: string;
  agencia: string;
  conta: string;
  tipoConta: string;
  titular: string;
  documentoTitular: string;
  pixTipo: string;
  pixChave: string;
  rdStatus: string;
  rdConsultedAt: string;
  rdNotes: string;
  racionalCompany_id: number | null;
  franquia_id: number | null;
  franqueado_id: number | null;
  pendenciaMotivo: string;
  parceiroTipo: string;
  razaoSocial: string;
  cnpj: string;
  telefoneComercial: string;
  emailCorporativo: string;
  responsavelLegal: string;
  cpfResponsavel: string;
  cargoResponsavel: string;
  documentosEnviados: string[];
  vinculoTipo: string;
  cargo: string;
  departamento: string;
  salario: string;
  formacao: string;
  experienciaProfissional: string;
  disponibilidade: string[];
}

export interface OpportunityWorkspaceCatalogSelectionInput {
  productId?: unknown;
  subproductId?: unknown;
  modalityId?: unknown;
}

export interface OpportunityWorkspaceUpdateBuilderOptions {
  catalog?: OpportunityWorkspaceCatalogSelectionInput;
  overrides?: Partial<{
    title: unknown;
    amount: unknown;
    status: unknown;
    description: unknown;
    customerId: unknown;
    ownerId: unknown;
    leadId: unknown;
    productId: unknown;
    subproductId: unknown;
    modalityId: unknown;
    probability: unknown;
    expectedCloseDate: unknown;
  }>;
  include?: readonly (keyof UpdateOpportunityPayload)[];
}

export interface OpportunityWorkspaceCreateBuilderOptions {
  catalog?: OpportunityWorkspaceCatalogSelectionInput;
  overrides?: Partial<{
    title: unknown;
    amount: unknown;
    pipelineId: unknown;
    stageId: unknown;
    customerId: unknown;
    leadId: unknown;
    ownerId: unknown;
    description: unknown;
    productId: unknown;
    subproductId: unknown;
    modalityId: unknown;
    probability: unknown;
    currency: unknown;
    expectedCloseDate: unknown;
  }>;
}

export interface OpportunityWorkspaceMoveStageBuilderOptions {
  stageId?: unknown;
  pipelineId?: unknown;
  status?: unknown;
  reason?: unknown;
}

export interface OpportunityWorkspaceEnvelopeUpdateInput {
  envelopeId?: unknown;
  envelopeStatus?: unknown;
  envelopeUrl?: unknown;
  envelopeProvider?: unknown;
}

export interface OpportunityWorkspaceIntakeCustomerInput {
  id?: unknown;
  fullName?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  cpfCnpj?: unknown;
  phone?: unknown;
  birthDate?: unknown;
  documentType?: unknown;
  address?: Record<string, unknown> | null;
  bankData?: Record<string, unknown> | null;
  profession?: unknown;
  maritalStatus?: unknown;
  gender?: unknown;
}

export interface OpportunityWorkspaceCreateIntakeBuilderOptions
  extends OpportunityWorkspaceCreateBuilderOptions {
  customer: OpportunityWorkspaceIntakeCustomerInput;
  options?: {
    allowCreateCustomer?: boolean;
    updateExistingCustomer?: boolean;
  };
}

const SOURCE_RANK: Record<OpportunityWorkspaceSource, number> = {
  backend: 0,
  session: 1,
  snapshot: 2,
  local: 3,
  seed: 4,
  adapter: 5,
  unknown: 6,
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const toStringValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return '';
};

const toNullableString = (value: unknown): string | null => {
  const normalized = toStringValue(value).trim();
  return normalized ? normalized : null;
};

const toOptionalString = (value: unknown): string | undefined => {
  return toNullableString(value) ?? undefined;
};

const toOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = Number(value.replace(',', '.'));
    return Number.isFinite(normalized) ? normalized : undefined;
  }

  return undefined;
};

const pickFirstPresentValue = (...values: unknown[]): unknown => {
  for (const value of values) {
    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value === 'string' && value.trim() === '') {
      continue;
    }

    return value;
  }

  return undefined;
};

const pickFirstPresentString = (...values: unknown[]): string | null => {
  return toNullableString(pickFirstPresentValue(...values));
};

const omitUndefinedFields = <T extends Record<string, unknown>>(value: T): T => {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as T;
};

const hasOwnField = <T extends object>(
  value: T | undefined,
  key: PropertyKey,
): boolean => {
  return !!value && Object.prototype.hasOwnProperty.call(value, key);
};

const pickCatalogSelection = (
  viewModel: OpportunityWorkspaceViewModel,
  catalog: OpportunityWorkspaceCatalogSelectionInput = {},
): { productId: string | null; subproductId: string | null; modalityId: string | null } => {
  return {
    productId: pickFirstPresentString(catalog.productId, viewModel.productId) ?? null,
    subproductId: pickFirstPresentString(catalog.subproductId) ?? null,
    modalityId: pickFirstPresentString(catalog.modalityId) ?? null,
  };
};

const resolveFullNameParts = (
  customer: OpportunityWorkspaceIntakeCustomerInput,
): { firstName: string; lastName: string } => {
  const explicitFirstName = toOptionalString(customer.firstName);
  const explicitLastName = toOptionalString(customer.lastName);

  if (explicitFirstName || explicitLastName) {
    return {
      firstName: explicitFirstName ?? 'Cliente',
      lastName: explicitLastName ?? 'Não informado',
    };
  }

  const fullName = toOptionalString(customer.fullName) ?? '';
  const parts = fullName.split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? fullName ?? 'Cliente',
    lastName: parts.slice(1).join(' ') || 'Não informado',
  };
};

const joinDisplayName = (...parts: unknown[]): string => {
  return parts
    .map((part) => toStringValue(part).trim())
    .filter(Boolean)
    .join(' ');
};

const resolveProjectedCustomerName = (opportunity: Opportunity): string | undefined => {
  return (
    toOptionalString(opportunity.customer?.name) ??
    toOptionalString(opportunity.customer?.fullName) ??
    toOptionalString(
      joinDisplayName(opportunity.customer?.firstName, opportunity.customer?.lastName),
    ) ??
    undefined
  );
};

const resolveProjectedOwnerName = (opportunity: Opportunity): string | undefined => {
  return (
    toOptionalString(opportunity.owner?.name) ??
    toOptionalString(
      joinDisplayName(opportunity.owner?.firstName, opportunity.owner?.lastName),
    ) ??
    undefined
  );
};

const toArrayOfStrings = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toStringValue(item).trim())
    .filter((item) => item.length > 0);
};

const toNumberValue = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = Number(value.replace(',', '.'));
    if (Number.isFinite(normalized)) {
      return normalized;
    }
  }
  return 0;
};

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = Number(value.replace(',', '.'));
    return Number.isFinite(normalized) ? normalized : null;
  }

  return null;
};

const isUuidLike = (value: string): boolean => {
  return /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
};

const isMissingStageLabel = (value: string): boolean => {
  return normalizeKey(value) === normalizeKey('Etapa não identificada');
};

const isPositiveSafeIntegerString = (value: string): boolean => {
  return /^[1-9]\d*$/.test(value);
};

const parsePositiveSafeInteger = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!isPositiveSafeIntegerString(trimmed)) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
};

const getStageCandidates = (
  value: unknown,
  catalog: readonly OpportunityWorkspaceStageDescriptor[] = [],
): { id: string; label: string } | null => {
  const rawValue = toStringValue(value).trim();
  if (!rawValue) return null;

  const normalized = normalizeKey(rawValue);
  for (const stage of catalog) {
    const stageId = toStringValue(stage.id ?? stage.key ?? '').trim();
    const stageLabel = toStringValue(stage.label ?? stage.nome ?? stage.id ?? stage.key ?? '').trim();

    if (!stageId && !stageLabel) continue;

    const candidates = [stageId, stageLabel].filter(Boolean);
    const matches = candidates.some((candidate) => {
      const candidateText = candidate.toLowerCase();
      return candidateText === rawValue.toLowerCase() || normalizeKey(candidateText) === normalized;
    });

    if (matches) {
      return {
        id: stageId || normalizeKey(stageLabel),
        label: stageLabel || stageId,
      };
    }
  }

  return null;
};

const resolveDisplayId = (
  source: Record<string, unknown>,
  canonicalId: string,
): { value: string; source: OpportunityWorkspaceDisplayIdSource } => {
  const explicitDisplayId = toStringValue(source.displayId).trim();
  if (explicitDisplayId && !isUuidLike(explicitDisplayId)) {
    return { value: explicitDisplayId, source: 'displayId' };
  }

  if (canonicalId && !isUuidLike(canonicalId)) {
    return { value: canonicalId, source: 'id' };
  }

  return { value: 'Sem código', source: 'missing' };
};

const resolvePipeline = (
  source: OpportunityWorkspaceInput,
  context: OpportunityWorkspaceContext,
): { id: string | null; source: OpportunityWorkspacePipelineSource; label: string } => {
  const canonicalPipelineId = pickFirstPresentString(source.pipelineId);
  if (canonicalPipelineId) {
    return {
      id: canonicalPipelineId,
      source: 'pipelineId',
      label: context.pipelineLabel ?? toStringValue(source.pipelineNome ?? source.pipelineName ?? canonicalPipelineId),
    };
  }

  const compatPipelineId = pickFirstPresentString(source.pipeline_id);
  if (compatPipelineId) {
    return {
      id: compatPipelineId,
      source: 'pipeline_id',
      label: context.pipelineLabel ?? toStringValue(source.pipelineNome ?? source.pipelineName ?? compatPipelineId),
    };
  }

  const productLabel = pickFirstPresentString(source.produto);
  if (productLabel) {
    const mappedPipelineId = mapearProdutoLegadoParaPipeline(productLabel);
    if (mappedPipelineId) {
      return {
        id: mappedPipelineId,
        source: 'produto',
        label: context.pipelineLabel ?? productLabel,
      };
    }
  }

  return {
    id: null,
    source: 'missing',
    label: context.pipelineLabel ?? 'Pipeline não identificado',
  };
};

const resolveStage = (
  source: OpportunityWorkspaceInput,
  pipelineStages: readonly OpportunityWorkspaceStageDescriptor[] = [],
): { id: string | null; label: string; source: OpportunityWorkspaceStageSource } => {
  const projectedStageLabel = pickFirstPresentString(source.stageName, source.stageNome);

  const stageId = pickFirstPresentString(source.stageId);
  if (stageId) {
    const matched = getStageCandidates(stageId, pipelineStages);
    return {
      id: matched?.id ?? stageId,
      label: matched?.label ?? projectedStageLabel ?? 'Etapa não identificada',
      source: 'stageId',
    };
  }

  const stageIdCompat = pickFirstPresentString(source.stage_id);
  if (stageIdCompat) {
    const matched = getStageCandidates(stageIdCompat, pipelineStages);
    return {
      id: matched?.id ?? stageIdCompat,
      label: matched?.label ?? projectedStageLabel ?? 'Etapa não identificada',
      source: 'stage_id',
    };
  }

  const etapaId = pickFirstPresentString(source.etapa_id);
  if (etapaId) {
    const matched = getStageCandidates(etapaId, pipelineStages);
    return {
      id: matched?.id ?? etapaId,
      label: matched?.label ?? projectedStageLabel ?? 'Etapa não identificada',
      source: 'etapa_id',
    };
  }

  const etapaText = pickFirstPresentString(source.etapa);
  if (etapaText) {
    const matched = getStageCandidates(etapaText, pipelineStages);
    if (matched) {
      return {
        id: matched.id,
        label: matched.label,
        source: 'etapa',
      };
    }

    return {
      id: null,
      label: 'Etapa não identificada',
      source: 'etapa',
    };
  }

  return {
    id: null,
    label: 'Etapa não identificada',
    source: 'missing',
  };
};

const resolveSourceRank = (source: OpportunityWorkspaceSource): number => {
  return SOURCE_RANK[source] ?? SOURCE_RANK.unknown;
};

const toTimestamp = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  return 0;
};

const buildInitials = (name: string): string => {
  const compact = name.trim();
  if (!compact) return '--';

  const parts = compact.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const mapOpportunityApiToWorkspaceInput = (
  opportunity: Opportunity,
): OpportunityWorkspaceInput => {
  const projectedCustomerName = resolveProjectedCustomerName(opportunity);
  const projectedOwnerName = resolveProjectedOwnerName(opportunity);
  const legacyOpportunity = opportunity as Opportunity & Record<string, unknown>;
  const productName = pickFirstPresentString(
    opportunity.product?.name,
    legacyOpportunity.produto,
    legacyOpportunity.productName,
    legacyOpportunity.product_name,
  );

  return omitUndefinedFields({
    source: 'backend',
    id: opportunity.id,
    tenantId: opportunity.tenantId,
    leadId: opportunity.leadId ?? null,
    customerId: opportunity.customerId ?? opportunity.customer?.id ?? null,
    pipelineId: opportunity.pipelineId,
    pipelineName: opportunity.pipeline?.name,
    stageId: opportunity.stageId,
    stageName: opportunity.stage?.name,
    title: opportunity.title,
    amount: opportunity.amount,
    productId: opportunity.productId ?? opportunity.product?.id ?? null,
    ownerId: opportunity.ownerId ?? opportunity.owner?.id ?? null,
    status: opportunity.status,
    description: opportunity.description ?? null,
    cliente_nome: projectedCustomerName,
    produto: productName,
    responsavel_nome: projectedOwnerName,
    telefone: opportunity.customer?.phone ?? undefined,
    email: opportunity.customer?.email ?? undefined,
    createdAt: opportunity.createdAt,
    updatedAt: opportunity.updatedAt,
  });
};

export const normalizeOpportunityWorkspace = (
  input: unknown,
  context: OpportunityWorkspaceContext = {},
): OpportunityWorkspaceViewModel => {
  const source = (isRecord(input) ? input : {}) as OpportunityWorkspaceInput;
  const rawSource = (isRecord(input) ? input : {}) as Record<string, unknown>;
  const sourceKind = context.source ?? (toNullableString(source.source) as OpportunityWorkspaceSource | null) ?? 'unknown';

  const canonicalId = toStringValue(
    source.id ?? source.opportunityId ?? source.leadId ?? source.customerId,
  ).trim();
  const displayId = resolveDisplayId(source, canonicalId);
  const pipeline = resolvePipeline(source, context);
  const stage = resolveStage(source, context.stageCatalog ?? []);

  const title = pickFirstPresentString(source.title, source.nome) ?? '';
  const clienteNome = pickFirstPresentString(source.cliente_nome, source.nome) ?? 'Sem nome';
  const customerId = pickFirstPresentString(source.customerId, source.cliente_id);
  const productId = pickFirstPresentString(
    source.productId,
    source.product_id,
    source.produto_id,
  );
  const ownerId = pickFirstPresentString(
    source.ownerId,
    source.responsavel_id,
    source.assignedTo,
  );
  const produto = toStringValue(source.produto).trim();
  const responsavelNome = toStringValue(source.responsavel_nome).trim();
  const amount = toNumberValue(pickFirstPresentValue(source.amount, source.valor));
  const telefone = toStringValue(source.telefone).trim();
  const email = toStringValue(source.email).trim();
  const tags = toArrayOfStrings(source.tags);
  const status = toStringValue(source.status).trim() || 'ativo';
  const description = pickFirstPresentString(source.description, source.observacoes) ?? '';
  const observacoes = description;
  const origem = toStringValue(source.origem).trim();
  const createdAt = source.createdAt ?? source.created_at ?? null;
  const updatedAt = source.updatedAt ?? source.updated_at ?? null;
  const displayName = clienteNome || produto || displayId.value;
  const stageLabel = isMissingStageLabel(stage.label) ? 'Etapa não identificada' : stage.label;
  const legacyStageId = isMissingStageLabel(stage.label) ? '' : (stage.id ?? '');
  const legacyStageLabel = stageLabel;

  return {
    source: sourceKind,
    identity: {
      id: canonicalId,
      displayId: displayId.value,
      leadId: toNullableString(source.leadId),
      opportunityId: toNullableString(source.opportunityId),
      customerId,
      pipelineId: pipeline.id,
      stageId: stage.id,
    },
    persisted: {
      clienteNome,
      produto,
      responsavelNome,
      valor: amount,
      origem,
      status,
      observacoes,
      telefone,
      email,
      tags,
      createdAt,
      updatedAt,
    },
    derived: {
      stageLabel,
      pipelineLabel: pipeline.label,
      formattedValue: formatCurrency(amount),
      displayName,
      initials: buildInitials(displayName),
    },
    resolution: {
      stageId: stage.id,
      stageSource: stage.source,
      pipelineId: pipeline.id,
      pipelineSource: pipeline.source,
      displayIdSource: displayId.source,
    },
    raw: rawSource,
    id: canonicalId,
    displayId: displayId.value,
    leadId: toNullableString(source.leadId),
    opportunityId: toNullableString(source.opportunityId),
    customerId,
    productId,
    ownerId,
    pipelineId: pipeline.id,
    pipeline_id: pipeline.id,
    stageId: stage.id,
    stage_id: stage.id,
    etapa_id: legacyStageId,
    etapa: legacyStageLabel,
    cliente_id: customerId,
    cliente_nome: clienteNome,
    nome: clienteNome,
    title,
    produto_id: productId,
    produto,
    responsavel_id: ownerId,
    responsavel_nome: responsavelNome,
    description,
    amount,
    valor: amount,
    origem,
    status,
    observacoes,
    tags,
    telefone,
    email,
    createdAt: createdAt as string | number | null,
    updatedAt: updatedAt as string | number | null,
    stageLabel,
    pipelineLabel: pipeline.label,
    formattedValue: formatCurrency(amount),
    displayName,
    initials: buildInitials(displayName),
  };
};

export interface OpportunityWorkspaceReconciliationResult {
  list: unknown[];
  selectedLead: unknown;
  viewModel: OpportunityWorkspaceViewModel;
}

export const reconcileOpportunityWorkspace = (
  currentList: readonly unknown[],
  persistedOpportunity: Opportunity | null | undefined,
  selectedLead: unknown,
  stageCatalog: readonly OpportunityWorkspaceStageDescriptor[] = [],
): OpportunityWorkspaceReconciliationResult => {
  const normalizedPersisted = persistedOpportunity
    ? normalizeOpportunityWorkspace(
        mapOpportunityApiToWorkspaceInput(persistedOpportunity),
        {
          source: 'backend',
          stageCatalog,
        },
      )
    : normalizeOpportunityWorkspace({}, { source: 'backend', stageCatalog });

  const applyPersistedFields = (currentItem: Record<string, unknown>) => {
    const mergedItem = { ...currentItem } as Record<string, unknown>;

    Object.entries(normalizedPersisted).forEach(([key, value]) => {
      if (value !== undefined) {
        mergedItem[key] = value;
      }
    });

    return mergedItem;
  };

  const reconciledList = Array.isArray(currentList)
    ? currentList.map((currentItem) => {
        if (!isRecord(currentItem)) {
          return currentItem;
        }

        const currentId = String(
          currentItem.id ?? currentItem.opportunityId ?? currentItem.leadId ?? currentItem.customerId ?? '',
        ).trim();

        if (currentId && currentId === normalizedPersisted.id) {
          return applyPersistedFields(currentItem);
        }

        return currentItem;
      })
    : [];

  const reconciledSelectedLead = (() => {
    if (!selectedLead || !isRecord(selectedLead)) {
      return selectedLead;
    }

    const selectedLeadId = String(
      selectedLead.id ?? selectedLead.opportunityId ?? selectedLead.leadId ?? selectedLead.customerId ?? '',
    ).trim();

    if (!selectedLeadId || selectedLeadId !== normalizedPersisted.id) {
      return selectedLead;
    }

    return applyPersistedFields(selectedLead as Record<string, unknown>);
  })();

  return {
    list: reconciledList,
    selectedLead: reconciledSelectedLead,
    viewModel: normalizedPersisted,
  };
};

export const mergeOpportunityWorkspace = (
  current: unknown,
  candidate: unknown,
  context: OpportunityWorkspaceContext = {},
): OpportunityWorkspaceViewModel | null => {
  const currentVm = current ? normalizeOpportunityWorkspace(current, context) : null;
  const candidateVm = candidate ? normalizeOpportunityWorkspace(candidate, context) : null;

  if (!currentVm) return candidateVm;
  if (!candidateVm) return currentVm;

  const currentRank = resolveSourceRank(currentVm.source);
  const candidateRank = resolveSourceRank(candidateVm.source);
  if (currentRank !== candidateRank) {
    return currentRank <= candidateRank ? currentVm : candidateVm;
  }

  const currentTimestamp = Math.max(
    toTimestamp(currentVm.updatedAt),
    toTimestamp(currentVm.createdAt),
  );
  const candidateTimestamp = Math.max(
    toTimestamp(candidateVm.updatedAt),
    toTimestamp(candidateVm.createdAt),
  );

  return candidateTimestamp >= currentTimestamp ? candidateVm : currentVm;
};

export const resolveOpportunityWorkspaceMutationId = (
  input: unknown,
): number | null => {
  const normalized = normalizeOpportunityWorkspace(input);
  const candidates = [
    normalized.opportunityId,
    normalized.id,
  ];

  for (const candidate of candidates) {
    const numeric = parsePositiveSafeInteger(candidate);
    if (numeric !== null) {
      return numeric;
    }
  }

  return null;
};

export const resolveOpportunityWorkspaceApiMutationId = (
  input: unknown,
): number | null => {
  return parsePositiveSafeInteger(input);
};

export const buildCreateOpportunityPayload = (
  viewModel: OpportunityWorkspaceViewModel,
  options: OpportunityWorkspaceCreateBuilderOptions = {},
): CreateOpportunityPayload => {
  const catalogSelection = pickCatalogSelection(viewModel, options.catalog);
  const descriptionSource = hasOwnField(options.overrides, 'description')
    ? options.overrides?.description
    : viewModel.description;

  return omitUndefinedFields({
    title: toStringValue(
      pickFirstPresentValue(options.overrides?.title, viewModel.title),
    ).trim(),
    amount: toNumberValue(
      pickFirstPresentValue(options.overrides?.amount, viewModel.amount),
    ),
    pipelineId: toStringValue(
      pickFirstPresentValue(options.overrides?.pipelineId, viewModel.pipelineId),
    ).trim(),
    stageId: toStringValue(
      pickFirstPresentValue(options.overrides?.stageId, viewModel.stageId),
    ).trim(),
    productId: pickFirstPresentString(
      options.overrides?.productId,
      catalogSelection.productId,
    ) ?? null,
    subproductId: pickFirstPresentString(
      options.overrides?.subproductId,
      catalogSelection.subproductId,
    ) ?? null,
    modalityId: pickFirstPresentString(
      options.overrides?.modalityId,
      catalogSelection.modalityId,
    ) ?? null,
    customerId: pickFirstPresentString(
      options.overrides?.customerId,
      viewModel.customerId,
    ) ?? null,
    leadId: pickFirstPresentString(
      options.overrides?.leadId,
      viewModel.leadId,
    ) ?? null,
    ownerId: pickFirstPresentString(
      options.overrides?.ownerId,
      viewModel.ownerId,
    ) ?? null,
    description: descriptionSource === null
      ? null
      : toOptionalString(descriptionSource) ?? null,
    probability: toOptionalNumber(options.overrides?.probability),
    currency: toOptionalString(options.overrides?.currency),
    expectedCloseDate: options.overrides?.expectedCloseDate as string | Date | null | undefined,
  });
};

export const buildUpdateOpportunityPayload = (
  viewModel: OpportunityWorkspaceViewModel,
  options: OpportunityWorkspaceUpdateBuilderOptions = {},
): UpdateOpportunityPayload => {
  const catalogSelection = pickCatalogSelection(viewModel, options.catalog);
  const descriptionSource = hasOwnField(options.overrides, 'description')
    ? options.overrides?.description
    : viewModel.description;
  const productIdSource = hasOwnField(options.overrides, 'productId')
    ? options.overrides?.productId
    : catalogSelection.productId;
  const subproductIdSource = hasOwnField(options.overrides, 'subproductId')
    ? options.overrides?.subproductId
    : catalogSelection.subproductId;
  const modalityIdSource = hasOwnField(options.overrides, 'modalityId')
    ? options.overrides?.modalityId
    : catalogSelection.modalityId;
  const candidatePayload = omitUndefinedFields({
    title: toOptionalString(
      pickFirstPresentValue(options.overrides?.title, viewModel.title),
    ),
    description: descriptionSource === null
      ? undefined
      : toStringValue(descriptionSource),
    amount: toOptionalNumber(
      pickFirstPresentValue(options.overrides?.amount, viewModel.amount),
    ),
    probability: toOptionalNumber(options.overrides?.probability),
    status: toOptionalString(
      pickFirstPresentValue(options.overrides?.status, viewModel.status),
    ),
    expectedCloseDate: options.overrides?.expectedCloseDate as string | Date | null | undefined,
    ownerId: pickFirstPresentString(
      options.overrides?.ownerId,
      viewModel.ownerId,
    ) ?? undefined,
    customerId: pickFirstPresentString(
      options.overrides?.customerId,
      viewModel.customerId,
    ) ?? undefined,
    leadId: pickFirstPresentString(
      options.overrides?.leadId,
      viewModel.leadId,
    ) ?? undefined,
    productId: productIdSource === null
      ? null
      : pickFirstPresentString(productIdSource) ?? undefined,
    subproductId: subproductIdSource === null
      ? null
      : pickFirstPresentString(subproductIdSource) ?? undefined,
    modalityId: modalityIdSource === null
      ? null
      : pickFirstPresentString(modalityIdSource) ?? undefined,
  });

  if (!options.include || options.include.length === 0) {
    return candidatePayload;
  }

  return options.include.reduce<UpdateOpportunityPayload>((accumulator, field) => {
    const fieldValue = candidatePayload[field];
    if (fieldValue !== undefined) {
      accumulator[field] = fieldValue as never;
    }
    return accumulator;
  }, {});
};

export const buildMoveStagePayload = (
  viewModel: OpportunityWorkspaceViewModel,
  options: OpportunityWorkspaceMoveStageBuilderOptions,
): MoveOpportunityStagePayload => {
  return omitUndefinedFields({
    stageId: toStringValue(
      pickFirstPresentValue(options.stageId, viewModel.stageId),
    ).trim(),
    pipelineId: toOptionalString(
      pickFirstPresentValue(options.pipelineId, viewModel.pipelineId),
    ),
    status: toOptionalString(options.status),
    reason: pickFirstPresentString(options.reason) ?? undefined,
  });
};

export const buildOpportunityEnvelopeUpdatePayload = (
  input: OpportunityWorkspaceEnvelopeUpdateInput,
): Record<string, unknown> => {
  return omitUndefinedFields({
    envelopeId: toOptionalString(input.envelopeId),
    envelopeStatus: toOptionalString(input.envelopeStatus),
    envelopeUrl: toOptionalString(input.envelopeUrl),
    envelopeProvider: toOptionalString(input.envelopeProvider),
  });
};

export const buildCreateOpportunityIntakePayload = (
  viewModel: OpportunityWorkspaceViewModel,
  options: OpportunityWorkspaceCreateIntakeBuilderOptions,
): CreateOpportunityIntakePayload => {
  const { firstName, lastName } = resolveFullNameParts(options.customer);
  const opportunityPayload = buildCreateOpportunityPayload(viewModel, options);

  return {
    customer: omitUndefinedFields({
      id: pickFirstPresentString(options.customer.id) ?? null,
      firstName,
      lastName,
      email: toOptionalString(options.customer.email),
      cpfCnpj: toOptionalString(options.customer.cpfCnpj),
      phone: pickFirstPresentString(options.customer.phone) ?? null,
      birthDate: options.customer.birthDate as string | Date | null | undefined,
      documentType: toOptionalString(options.customer.documentType) ?? null,
      address: options.customer.address ?? null,
      bankData: options.customer.bankData ?? null,
      profession: toOptionalString(options.customer.profession) ?? null,
      maritalStatus: toOptionalString(options.customer.maritalStatus) ?? null,
      gender: toOptionalString(options.customer.gender) ?? null,
    }),
    opportunity: {
      title: opportunityPayload.title,
      amount: opportunityPayload.amount,
      pipelineId: opportunityPayload.pipelineId,
      stageId: opportunityPayload.stageId,
      productId: opportunityPayload.productId ?? null,
      subproductId: opportunityPayload.subproductId ?? null,
      modalityId: opportunityPayload.modalityId ?? null,
      ownerId: opportunityPayload.ownerId ?? undefined,
      description: opportunityPayload.description ?? undefined,
    },
    options: options.options,
  };
};

export interface OpportunityWorkspaceMutationCommitParams {
  mutationId: string | number | null;
  payload: Record<string, unknown>;
  updateRemote: (id: number, payload: Record<string, unknown>) => Promise<unknown>;
  onSuccess: () => void;
}

export const persistOpportunityWorkspaceMutation = async ({
  mutationId,
  payload,
  updateRemote,
  onSuccess,
}: OpportunityWorkspaceMutationCommitParams): Promise<'backend' | 'failed'> => {
  const resolvedMutationId = resolveOpportunityWorkspaceApiMutationId(mutationId);
  if (resolvedMutationId === null) {
    return 'failed';
  }

  try {
    await updateRemote(resolvedMutationId, payload);
    onSuccess();
    return 'backend';
  } catch {
    return 'failed';
  }
};

const getDraftValue = <T>(draft: Record<string, unknown>, key: string, fallback: T): T => {
  const value = draft[key];
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return value as T;
};

export const buildOpportunityWorkspaceUpdatePayload = (
  draft: Record<string, unknown>,
  overrides: {
    etapaId?: string;
    status?: string;
  } = {},
): OpportunityWorkspaceUpdatePayload => {
  const tags = toArrayOfStrings(getDraftValue(draft, 'tags', []));
  const documentosEnviados = toArrayOfStrings(getDraftValue(draft, 'documentosEnviados', []));
  const disponibilidade = toArrayOfStrings(getDraftValue(draft, 'disponibilidade', []));

  const etapaIdCandidate = toStringValue(draft.etapa_id ?? draft.etapa).trim();
  const etapaId = overrides.etapaId ?? (etapaIdCandidate || 'novo_lead');
  const statusCandidate = toStringValue(draft.status).trim();
  const status = overrides.status ?? (statusCandidate || 'ativo');

  return {
    nome: toStringValue(getDraftValue(draft, 'nome', '')).trim() || 'Sem nome',
    cliente_nome: toStringValue(getDraftValue(draft, 'cliente_nome', getDraftValue(draft, 'nome', 'Sem nome'))).trim() || 'Sem nome',
    telefone: toStringValue(getDraftValue(draft, 'telefone', '')).replace(/\D/g, ''),
    celular: toStringValue(getDraftValue(draft, 'celular', getDraftValue(draft, 'telefone', ''))).replace(/\D/g, ''),
    email: toStringValue(getDraftValue(draft, 'email', '')).trim(),
    cpf_cnpj: toStringValue(getDraftValue(draft, 'cpf_cnpj', '')).trim(),
    tipoPessoa: toStringValue(getDraftValue(draft, 'tipoPessoa', 'CPF')).trim() || 'CPF',
    profissao: toStringValue(getDraftValue(draft, 'profissao', '')).trim(),
    estado_civil: toStringValue(getDraftValue(draft, 'estado_civil', '')).trim(),
    sexo: toStringValue(getDraftValue(draft, 'sexo', '')).trim(),
    data_nascimento: toStringValue(getDraftValue(draft, 'data_nascimento', '')).trim(),
    data_abertura: toStringValue(getDraftValue(draft, 'data_abertura', '')).trim(),
    cep: toStringValue(getDraftValue(draft, 'cep', '')).trim(),
    rua: toStringValue(getDraftValue(draft, 'rua', '')).trim(),
    numero: toStringValue(getDraftValue(draft, 'numero', '')).trim(),
    complemento: toStringValue(getDraftValue(draft, 'complemento', '')).trim(),
    bairro: toStringValue(getDraftValue(draft, 'bairro', '')).trim(),
    cidade: toStringValue(getDraftValue(draft, 'cidade', '')).trim(),
    estado: toStringValue(getDraftValue(draft, 'estado', '')).trim(),
    produto: toStringValue(getDraftValue(draft, 'produto', '')).trim(),
    productId: toStringValue(getDraftValue(draft, 'productId', '')).trim(),
    productCode: toStringValue(getDraftValue(draft, 'productCode', '')).trim(),
    subproductId: toStringValue(getDraftValue(draft, 'subproductId', '')).trim(),
    subproductCode: toStringValue(getDraftValue(draft, 'subproductCode', '')).trim(),
    modality: toStringValue(getDraftValue(draft, 'modality', '')).trim(),
    pipelineId: toStringValue(getDraftValue(draft, 'pipelineId', getDraftValue(draft, 'pipeline_id', ''))).trim(),
    pipelineCode: toStringValue(getDraftValue(draft, 'pipelineCode', '')).trim(),
    catalogVersion: Number(getDraftValue(draft, 'catalogVersion', 1)) || 1,
    valor: toNumberValue(getDraftValue(draft, 'valor', 0)),
    etapa_id: etapaId,
    etapa: etapaId,
    status,
    cliente_id: toNullableNumber(getDraftValue(draft, 'cliente_id', null)),
    responsavel_id: toStringValue(getDraftValue(draft, 'responsavel_id', '')).trim() || null,
    responsavel_nome: toStringValue(getDraftValue(draft, 'responsavel_nome', '')).trim(),
    observacoes: toStringValue(getDraftValue(draft, 'observacoes', '')).trim(),
    tags,
    banco: toStringValue(getDraftValue(draft, 'banco', '')).trim(),
    agencia: toStringValue(getDraftValue(draft, 'agencia', '')).trim(),
    conta: toStringValue(getDraftValue(draft, 'conta', '')).trim(),
    tipoConta: toStringValue(getDraftValue(draft, 'tipoConta', '')).trim(),
    titular: toStringValue(getDraftValue(draft, 'titular', '')).trim(),
    documentoTitular: toStringValue(getDraftValue(draft, 'documentoTitular', '')).trim(),
    pixTipo: toStringValue(getDraftValue(draft, 'pixTipo', '')).trim(),
    pixChave: toStringValue(getDraftValue(draft, 'pixChave', '')).trim(),
    rdStatus: toStringValue(getDraftValue(draft, 'rdStatus', 'nao_consultado')).trim() || 'nao_consultado',
    rdConsultedAt: toStringValue(getDraftValue(draft, 'rdConsultedAt', '')).trim(),
    rdNotes: toStringValue(getDraftValue(draft, 'rdNotes', '')).trim(),
    racionalCompany_id: toNullableNumber(getDraftValue(draft, 'racionalCompany_id', null)),
    franquia_id: toNullableNumber(getDraftValue(draft, 'franquia_id', null)),
    franqueado_id: toNullableNumber(getDraftValue(draft, 'franqueado_id', null)),
    pendenciaMotivo: etapaId === 'pendencia'
      ? toStringValue(getDraftValue(draft, 'pendenciaMotivo', '')).trim()
      : '',
    parceiroTipo: toStringValue(getDraftValue(draft, 'parceiroTipo', '')).trim(),
    razaoSocial: toStringValue(getDraftValue(draft, 'razaoSocial', '')).trim(),
    cnpj: toStringValue(getDraftValue(draft, 'cnpj', '')).trim(),
    telefoneComercial: toStringValue(getDraftValue(draft, 'telefoneComercial', '')).trim(),
    emailCorporativo: toStringValue(getDraftValue(draft, 'emailCorporativo', '')).trim(),
    responsavelLegal: toStringValue(getDraftValue(draft, 'responsavelLegal', '')).trim(),
    cpfResponsavel: toStringValue(getDraftValue(draft, 'cpfResponsavel', '')).trim(),
    cargoResponsavel: toStringValue(getDraftValue(draft, 'cargoResponsavel', '')).trim(),
    documentosEnviados,
    vinculoTipo: toStringValue(getDraftValue(draft, 'vinculoTipo', '')).trim(),
    cargo: toStringValue(getDraftValue(draft, 'cargo', '')).trim(),
    departamento: toStringValue(getDraftValue(draft, 'departamento', '')).trim(),
    salario: toStringValue(getDraftValue(draft, 'salario', '')).trim(),
    formacao: toStringValue(getDraftValue(draft, 'formacao', '')).trim(),
    experienciaProfissional: toStringValue(getDraftValue(draft, 'experienciaProfissional', '')).trim(),
    disponibilidade,
  };
};

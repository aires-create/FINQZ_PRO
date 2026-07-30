import { formatCurrency, normalizeKey } from './pipelineUtils';
import { mapearProdutoLegadoParaPipeline } from '../../config/pipelines';

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

export interface OpportunityWorkspaceViewModel {
  source: OpportunityWorkspaceSource;
  identity: OpportunityWorkspaceIdentity;
  persisted: OpportunityWorkspacePersistedFields;
  derived: OpportunityWorkspaceDerivedFields;
  resolution: OpportunityWorkspaceResolution;
  raw: Record<string, unknown>;
  id: string;
  displayId: string;
  leadId: string | null;
  opportunityId: string | null;
  customerId: string | null;
  pipelineId: string | null;
  pipeline_id: string | null;
  stageId: string | null;
  stage_id: string | null;
  etapa_id: string;
  etapa: string;
  cliente_nome: string;
  nome: string;
  produto: string;
  responsavel_nome: string;
  valor: number;
  origem: string;
  status: string;
  observacoes: string;
  tags: string[];
  telefone: string;
  email: string;
  createdAt: string | number | null;
  updatedAt: string | number | null;
  stageLabel: string;
  pipelineLabel: string;
  formattedValue: string;
  displayName: string;
  initials: string;
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
  source: Record<string, unknown>,
  context: OpportunityWorkspaceContext,
): { id: string | null; source: OpportunityWorkspacePipelineSource; label: string } => {
  const pipelineId = toNullableString(source.pipelineId) ?? toNullableString(source.pipeline_id);
  if (pipelineId) {
    return {
      id: pipelineId,
      source: source.pipelineId ? 'pipelineId' : 'pipeline_id',
      label: context.pipelineLabel ?? toStringValue(source.pipelineNome ?? source.pipelineName ?? pipelineId),
    };
  }

  const productLabel = toNullableString(source.produto);
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
  source: Record<string, unknown>,
  pipelineStages: readonly OpportunityWorkspaceStageDescriptor[] = [],
): { id: string | null; label: string; source: OpportunityWorkspaceStageSource } => {
  const stageId = toNullableString(source.stageId);
  if (stageId) {
    const matched = getStageCandidates(stageId, pipelineStages);
    return {
      id: matched?.id ?? stageId,
      label: matched?.label ?? 'Etapa não identificada',
      source: 'stageId',
    };
  }

  const stageIdCompat = toNullableString(source.stage_id);
  if (stageIdCompat) {
    const matched = getStageCandidates(stageIdCompat, pipelineStages);
    return {
      id: matched?.id ?? stageIdCompat,
      label: matched?.label ?? 'Etapa não identificada',
      source: 'stage_id',
    };
  }

  const etapaId = toNullableString(source.etapa_id);
  if (etapaId) {
    const matched = getStageCandidates(etapaId, pipelineStages);
    return {
      id: matched?.id ?? etapaId,
      label: matched?.label ?? 'Etapa não identificada',
      source: 'etapa_id',
    };
  }

  const etapaText = toNullableString(source.etapa);
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

export const normalizeOpportunityWorkspace = (
  input: unknown,
  context: OpportunityWorkspaceContext = {},
): OpportunityWorkspaceViewModel => {
  const source = isRecord(input) ? input : {};
  const sourceKind = context.source ?? (toNullableString(source.source) as OpportunityWorkspaceSource | null) ?? 'unknown';

  const canonicalId = toStringValue(
    source.id ?? source.opportunityId ?? source.leadId ?? source.customerId,
  ).trim();
  const displayId = resolveDisplayId(source, canonicalId);
  const pipeline = resolvePipeline(source, context);
  const stage = resolveStage(source, context.stageCatalog ?? []);

  const clienteNome = toStringValue(source.cliente_nome ?? source.nome).trim() || 'Sem nome';
  const produto = toStringValue(source.produto).trim();
  const responsavelNome = toStringValue(source.responsavel_nome).trim();
  const valor = toNumberValue(source.valor);
  const telefone = toStringValue(source.telefone).trim();
  const email = toStringValue(source.email).trim();
  const tags = toArrayOfStrings(source.tags);
  const status = toStringValue(source.status).trim() || 'ativo';
  const observacoes = toStringValue(source.observacoes).trim();
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
      customerId: toNullableString(source.customerId),
      pipelineId: pipeline.id,
      stageId: stage.id,
    },
    persisted: {
      clienteNome,
      produto,
      responsavelNome,
      valor,
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
      formattedValue: formatCurrency(valor),
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
    raw: source,
    id: canonicalId,
    displayId: displayId.value,
    leadId: toNullableString(source.leadId),
    opportunityId: toNullableString(source.opportunityId),
    customerId: toNullableString(source.customerId),
    pipelineId: pipeline.id,
    pipeline_id: pipeline.id,
    stageId: stage.id,
    stage_id: stage.id,
    etapa_id: legacyStageId,
    etapa: legacyStageLabel,
    cliente_nome: clienteNome,
    nome: clienteNome,
    produto,
    responsavel_nome: responsavelNome,
    valor,
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
    formattedValue: formatCurrency(valor),
    displayName,
    initials: buildInitials(displayName),
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

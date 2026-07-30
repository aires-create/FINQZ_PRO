export type SimulationRuntimeCompatibilityMode = "CANONICAL" | "COMPATIBILITY" | "LEGACY" | "TRANSIENT";

export interface SimulationRuntimeCanonicalEntity {
  id: string;
  code: string;
  name: string;
  slug?: string;
  category?: string;
  type?: string;
  order?: number;
}

export interface SimulationRuntimeSubproductEntity extends SimulationRuntimeCanonicalEntity {
  productId?: string;
  simulationEngine?: string;
  proposal?: string;
  provider?: string;
  workflow?: string;
  status?: string;
}

export interface SimulationRuntimeParticipant {
  id?: string;
  role: string;
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  tenantId?: string;
  metadata?: Record<string, unknown>;
}

export interface SimulationRuntimeAsset {
  id?: string;
  kind: string;
  label: string;
  value?: number;
  brand?: string;
  model?: string;
  year?: number;
  plate?: string;
  chassi?: string;
  metadata?: Record<string, unknown>;
}

export interface SimulationRuntimeGuarantee {
  id?: string;
  kind: string;
  label: string;
  value?: number;
  priority?: number;
  asset?: SimulationRuntimeAsset;
  metadata?: Record<string, unknown>;
}

export interface SimulationRuntimeIncome {
  monthlyValue: number;
  currency?: string;
  source?: string;
}

export interface SimulationRuntimeAgreement {
  id?: string;
  code?: string;
  name?: string;
}

export interface SimulationRuntimeProvider {
  id?: string;
  key?: string;
  code?: string;
  name?: string;
  type?: string;
  channel?: string;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface SimulationRuntimeChannel {
  id?: string;
  code?: string;
  name?: string;
  type?: string;
}

export interface SimulationRuntimePipeline {
  id?: string;
  code?: string;
  name?: string;
  stageCode?: string;
  stageName?: string;
}

export interface SimulationRuntimeOpportunity {
  id?: string;
  code?: string;
  name?: string;
  pipelineId?: string;
  stageId?: string;
}

export interface SimulationRuntimeCommercialContext {
  productId?: string;
  productCode?: string;
  subproductId?: string;
  subproductCode?: string;
  modality?: string;
  pipelineId?: string;
  pipelineCode?: string;
  commercialTableId?: string;
  commercialTableCode?: string;
  workflow?: string;
  segmentCode?: string;
}

export interface SimulationRuntimeParameters {
  requestedAmount?: number;
  term?: number;
  monthlyRate?: number;
  downPayment?: number;
  fees?: number;
  ltv?: number;
  rentCompromise?: number;
  [key: string]: unknown;
}

export interface SimulationRuntimeMetadata {
  compatibilityMode: SimulationRuntimeCompatibilityMode;
  origin?: string;
  createdAt: string;
  updatedAt?: string;
  engineVersion: string;
  catalogVersion: string;
  policyVersion: string;
  strategyVersion: string;
}

export interface SimulationRuntimeVersioning {
  version: string;
  revision?: number;
}

export interface SimulationRuntimeExecution {
  executionId?: string;
  correlationId?: string;
  requestId?: string;
  snapshotId?: string;
  tenantId?: string;
  performedBy?: string;
  performedAt?: string;
}

export interface SimulationRuntimeRequestBody {
  product: SimulationRuntimeCanonicalEntity;
  subproduct: SimulationRuntimeSubproductEntity;
  customer: SimulationRuntimeParticipant;
  participants: SimulationRuntimeParticipant[];
  guarantees: SimulationRuntimeGuarantee[];
  vehicle?: SimulationRuntimeAsset;
  property?: SimulationRuntimeAsset;
  income?: SimulationRuntimeIncome;
  agreement?: SimulationRuntimeAgreement;
  provider?: SimulationRuntimeProvider;
  commercializadora?: SimulationRuntimeProvider;
  bank?: SimulationRuntimeProvider;
  corban?: SimulationRuntimeProvider;
  channel?: SimulationRuntimeChannel;
  pipeline?: SimulationRuntimePipeline;
  opportunity?: SimulationRuntimeOpportunity;
  commercial?: SimulationRuntimeCommercialContext;
  parameters: SimulationRuntimeParameters;
  metadata: SimulationRuntimeMetadata;
  versioning: SimulationRuntimeVersioning;
  execution?: SimulationRuntimeExecution;
}

export interface SimulationRuntimeResultItem {
  key: string;
  label: string;
  value: number | string | boolean | null;
  unit?: string;
  reference?: string;
}

export interface SimulationRuntimeDecision {
  status: string;
  reasons: string[];
  message?: string;
}

export interface SimulationRuntimeRankingCandidate {
  [key: string]: unknown;
}

export interface SimulationRuntimeRanking {
  candidates: SimulationRuntimeRankingCandidate[];
  selected?: SimulationRuntimeProvider;
  selectedIndex?: number;
}

export interface SimulationRuntimeProposal {
  id: string;
  reference: string;
  status: string;
  provider?: SimulationRuntimeProvider;
  amount?: number;
  term?: number;
  monthlyRate?: number;
  payload?: Record<string, unknown>;
}

export interface SimulationRuntimeSnapshotReference {
  snapshotId: string;
  snapshotVersion: string;
  checksum?: string;
  source?: string;
  capturedAt?: string;
}

export interface SimulationRuntimeAuditReference {
  auditId: string;
  auditCode?: string;
}

export interface SimulationRuntimeResponseData {
  requestId?: string | null;
  executionId: string;
  correlationId: string;
  tenant: SimulationRuntimeCanonicalEntity | Record<string, unknown>;
  product: SimulationRuntimeCanonicalEntity;
  subproduct: SimulationRuntimeSubproductEntity;
  status: string;
  decision: SimulationRuntimeDecision;
  result: SimulationRuntimeResultItem[];
  proposals: SimulationRuntimeProposal[];
  ranking: SimulationRuntimeRanking;
  warnings: string[];
  rejectionReasons: string[];
  snapshotReference: SimulationRuntimeSnapshotReference;
  auditReference: SimulationRuntimeAuditReference;
  engineVersion: string;
  catalogVersion: string;
  policyVersion: string;
  strategyVersion: string;
  executionTimestamp: string;
  compatibilityMode: SimulationRuntimeCompatibilityMode;
}

export interface SimulationRuntimeSuccessResponse {
  success: true;
  data: SimulationRuntimeResponseData;
}

export interface SimulationRuntimeErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode?: number;
    details?: Record<string, unknown> | null;
  };
}

export interface SimulationRuntimeLegacyResult {
  valorBruto?: number;
  parcela?: number;
  valorLiberado?: number;
  custoTotal?: number;
  cetEstimado?: number;
  taxaMes?: number;
  prazo?: number;
  comprometimento?: number;
  status?: "valida" | "atencao" | "inviavel" | "incompleto";
  mensagem?: string;
}

export interface SimulationRuntimeWorkspaceProductOption {
  id: string;
  code: string;
  name: string;
}

export interface SimulationRuntimeWorkspaceSubproductOption extends SimulationRuntimeWorkspaceProductOption {
  productId?: string;
}

export interface SimulationRuntimeWorkspaceSimulationFields {
  valorVeiculo?: number;
  veiculoQuitado?: boolean;
  saldoDevedor?: number;
  percentualFinanciavel?: number;
  taxaMes?: number;
  prazo?: number;
  rendaMensal?: number;
}

export interface SimulationRuntimeWorkspaceOpportunityLike {
  id?: string;
  code?: string;
  nome?: string;
  cliente_nome?: string;
  produto?: string;
  produto_id?: string;
  productId?: string;
  productCode?: string;
  subproduto?: string;
  subproduto_id?: string;
  subproductId?: string;
  subproductCode?: string;
  pipeline_id?: string;
  pipelineId?: string;
  backendPipelineId?: string;
  etapa_id?: string;
  etapa?: string;
  tenantId?: string | null;
  email?: string;
  telefone?: string;
  cpf_cnpj?: string;
  document?: string;
  valor?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SimulationRuntimeWorkspaceSnapshotCandidate {
  product?: SimulationRuntimeCanonicalEntity;
  subproduct?: SimulationRuntimeSubproductEntity;
  commercial?: Partial<SimulationRuntimeCommercialContext>;
  parameters?: Partial<SimulationRuntimeParameters>;
  vehicle?: SimulationRuntimeAsset;
  property?: SimulationRuntimeAsset;
  income?: SimulationRuntimeIncome;
  provider?: SimulationRuntimeProvider;
  commercializadora?: SimulationRuntimeProvider;
  bank?: SimulationRuntimeProvider;
  corban?: SimulationRuntimeProvider;
  channel?: SimulationRuntimeChannel;
  pipeline?: SimulationRuntimePipeline;
  opportunity?: SimulationRuntimeOpportunity;
  agreement?: SimulationRuntimeAgreement;
  participants?: SimulationRuntimeParticipant[];
  guarantees?: SimulationRuntimeGuarantee[];
  customer?: SimulationRuntimeParticipant;
  metadata?: Partial<SimulationRuntimeMetadata>;
  versioning?: Partial<SimulationRuntimeVersioning>;
  execution?: Partial<SimulationRuntimeExecution>;
}

export interface SimulationRuntimeWorkspaceInput {
  opportunity?: SimulationRuntimeWorkspaceOpportunityLike | null;
  simulationType?: string | null;
  simulationFields?: SimulationRuntimeWorkspaceSimulationFields | null;
  selectedProduct?: SimulationRuntimeWorkspaceProductOption | null;
  selectedSubproduct?: SimulationRuntimeWorkspaceSubproductOption | null;
  acceptedSnapshot?: SimulationRuntimeWorkspaceSnapshotCandidate | null;
  simulationSnapshot?: SimulationRuntimeWorkspaceSnapshotCandidate | null;
  proposalSnapshot?: SimulationRuntimeWorkspaceSnapshotCandidate | null;
  tenantId?: string | null;
  currentUserId?: string | null;
  currentUserName?: string | null;
  requestId?: string | null;
  correlationId?: string | null;
}

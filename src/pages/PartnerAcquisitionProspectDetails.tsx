import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, UserPlus2 } from "lucide-react";
import { Badge, Card, EmptyState, LoadingState } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import {
  partnerAcquisitionApi,
  type PartnerProspectRecord,
} from "../api/modules";

const formatDateTime = (value?: string | null): string => {
  if (!value) return "-";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsedDate);
};

const getStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    NEW: "Novo",
    ENRICHED: "Enriquecido",
    CONTACTED: "Contatado",
    QUALIFIED: "Qualificado",
    NEGOTIATING: "Negociação",
    DOCUMENTATION: "Documentação",
    CONTRACT_PENDING: "Contrato pendente",
    AWAITING_SIGNATURE: "Aguardando assinatura",
    SIGNED: "Assinado",
    CONVERSION_PENDING: "Conversão pendente",
    CONVERTED: "Convertido",
    LOST: "Perdido",
    ARCHIVED: "Arquivado",
    REJECTED: "Rejeitado",
  };

  return statusLabels[status] ?? status;
};

const getSourceLabel = (source: string): string => {
  const sourceLabels: Record<string, string> = {
    MANUAL: "Manual",
    HUB: "Hub",
    CAMPAIGN: "Campanha",
    IMPORT: "Importação",
    REFERRAL: "Indicação",
    OTHER: "Outro",
  };

  return sourceLabels[source] ?? source;
};

const createIdempotencyKey = (action: string, prospectId: string): string => {
  const randomValue =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `partner-acquisition:${action}:${prospectId}:${randomValue}`;
};

const BackButton: React.FC<{ label: string }> = ({ label }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate("/app/operacoes/partner-acquisition/prospects")}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface-hover)]"
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
};

const FieldRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="space-y-1">
    <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
      {label}
    </div>
    <div className="break-words text-sm text-[var(--text-primary)]">{value ?? "-"}</div>
  </div>
);

const ProspectFieldRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <FieldRow label={label} value={value} />
);

type ProspectActionKey =
  | "qualify"
  | "disqualify"
  | "negotiation"
  | "documentation_requested"
  | "documentation_received"
  | "contract_requested"
  | "contract_signed"
  | "approve_conversion"
  | "reject_conversion"
  | "convert";

type ProspectActionState = ProspectActionKey | null;

type ProspectActionDefinition = {
  key: ProspectActionKey;
  label: string;
  handler: () => Promise<void>;
};

const PartnerAcquisitionProspectDetailsPage: React.FC = () => {
  const { prospectId } = useParams<{ prospectId: string }>();
  const [prospect, setProspect] = useState<PartnerProspectRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ProspectActionState>(null);

  const refreshProspect = async (): Promise<void> => {
    if (!prospectId) return;

    const response = await partnerAcquisitionApi.getProspectById(prospectId);
    setProspect(response.data ?? null);
  };

  useEffect(() => {
    let isMounted = true;

    const loadProspect = async (): Promise<void> => {
      if (!prospectId) {
        if (isMounted) {
          setIsLoading(false);
          setError("Identificador do prospect ausente.");
        }
        return;
      }

      if (isMounted) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const response = await partnerAcquisitionApi.getProspectById(prospectId);
        if (!isMounted) return;

        setProspect(response.data ?? null);
      } catch (caughtError) {
        if (!isMounted) return;

        setProspect(null);
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Não foi possível carregar o prospect.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProspect();

    return () => {
      isMounted = false;
    };
  }, [prospectId]);

  const sourceLabel = useMemo(() => (prospect ? getSourceLabel(prospect.source) : "-"), [prospect]);
  const prospectActions = useMemo<ProspectActionDefinition[]>(() => {
    if (!prospect) return [];

    const runAction = async (
      key: ProspectActionKey,
      message: string,
      request: () => Promise<unknown>,
    ): Promise<void> => {
      if (!prospectId) return;

      setActiveAction(key);
      setActionError(null);
      setActionSuccess(null);

      try {
        await request();
        await refreshProspect();
        setActionSuccess(message);
      } catch (caughtError) {
        setActionError(
          caughtError instanceof Error
            ? caughtError.message
            : "Não foi possível executar a ação solicitada.",
        );
      } finally {
        setActiveAction(null);
      }
    };

    const actionFactories: Record<string, ProspectActionDefinition[]> = {
      NEW: [
        {
          key: "qualify",
          label: "Qualificar",
          handler: () =>
            runAction(
              "qualify",
              "Prospect qualificado com sucesso.",
              () =>
                partnerAcquisitionApi.qualifyProspect(
                  prospect.prospectId,
                  createIdempotencyKey("qualify", prospect.prospectId),
                ),
            ),
        },
        {
          key: "disqualify",
          label: "Desqualificar",
          handler: () =>
            runAction(
              "disqualify",
              "Prospect desqualificado com sucesso.",
              () =>
                partnerAcquisitionApi.disqualifyProspect(
                  prospect.prospectId,
                  createIdempotencyKey("disqualify", prospect.prospectId),
                ),
            ),
        },
      ],
      CONTACTED: [
        {
          key: "qualify",
          label: "Qualificar",
          handler: () =>
            runAction(
              "qualify",
              "Prospect qualificado com sucesso.",
              () =>
                partnerAcquisitionApi.qualifyProspect(
                  prospect.prospectId,
                  createIdempotencyKey("qualify", prospect.prospectId),
                ),
            ),
        },
        {
          key: "negotiation",
          label: "Mover para negociação",
          handler: () =>
            runAction(
              "negotiation",
              "Prospect movido para negociação com sucesso.",
              () =>
                partnerAcquisitionApi.moveProspectToNegotiation(
                  prospect.prospectId,
                  createIdempotencyKey("negotiation", prospect.prospectId),
                ),
            ),
        },
        {
          key: "disqualify",
          label: "Desqualificar",
          handler: () =>
            runAction(
              "disqualify",
              "Prospect desqualificado com sucesso.",
              () =>
                partnerAcquisitionApi.disqualifyProspect(
                  prospect.prospectId,
                  createIdempotencyKey("disqualify", prospect.prospectId),
                ),
            ),
        },
      ],
      QUALIFIED: [
        {
          key: "negotiation",
          label: "Mover para negociação",
          handler: () =>
            runAction(
              "negotiation",
              "Prospect movido para negociação com sucesso.",
              () =>
                partnerAcquisitionApi.moveProspectToNegotiation(
                  prospect.prospectId,
                  createIdempotencyKey("negotiation", prospect.prospectId),
                ),
            ),
        },
        {
          key: "documentation_requested",
          label: "Solicitar documentação",
          handler: () =>
            runAction(
              "documentation-request",
              "Documentação solicitada com sucesso.",
              () =>
                partnerAcquisitionApi.requestProspectDocumentation(
                  prospect.prospectId,
                  createIdempotencyKey("documentation-request", prospect.prospectId),
                ),
            ),
        },
        {
          key: "disqualify",
          label: "Desqualificar",
          handler: () =>
            runAction(
              "disqualify",
              "Prospect desqualificado com sucesso.",
              () =>
                partnerAcquisitionApi.disqualifyProspect(
                  prospect.prospectId,
                  createIdempotencyKey("disqualify", prospect.prospectId),
                ),
            ),
        },
      ],
      NEGOTIATING: [
        {
          key: "documentation_requested",
          label: "Solicitar documentação",
          handler: () =>
            runAction(
              "documentation-request",
              "Documentação solicitada com sucesso.",
              () =>
                partnerAcquisitionApi.requestProspectDocumentation(
                  prospect.prospectId,
                  createIdempotencyKey("documentation-request", prospect.prospectId),
                ),
            ),
        },
        {
          key: "contract_requested",
          label: "Solicitar contrato",
          handler: () =>
            runAction(
              "contract-request",
              "Contrato solicitado com sucesso.",
              () =>
                partnerAcquisitionApi.requestProspectContract(
                  prospect.prospectId,
                  createIdempotencyKey("contract-request", prospect.prospectId),
                ),
            ),
        },
        {
          key: "disqualify",
          label: "Desqualificar",
          handler: () =>
            runAction(
              "disqualify",
              "Prospect desqualificado com sucesso.",
              () =>
                partnerAcquisitionApi.disqualifyProspect(
                  prospect.prospectId,
                  createIdempotencyKey("disqualify", prospect.prospectId),
                ),
            ),
        },
      ],
      DOCUMENTATION: [
        {
          key: "documentation_received",
          label: "Confirmar documentação recebida",
          handler: () =>
            runAction(
              "documentation-received",
              "Documentação recebida confirmada com sucesso.",
              () =>
                partnerAcquisitionApi.markProspectDocumentationReceived(
                  prospect.prospectId,
                  createIdempotencyKey("documentation-received", prospect.prospectId),
                ),
            ),
        },
        {
          key: "contract_requested",
          label: "Solicitar contrato",
          handler: () =>
            runAction(
              "contract-request",
              "Contrato solicitado com sucesso.",
              () =>
                partnerAcquisitionApi.requestProspectContract(
                  prospect.prospectId,
                  createIdempotencyKey("contract-request", prospect.prospectId),
                ),
            ),
        },
        {
          key: "disqualify",
          label: "Desqualificar",
          handler: () =>
            runAction(
              "disqualify",
              "Prospect desqualificado com sucesso.",
              () =>
                partnerAcquisitionApi.disqualifyProspect(
                  prospect.prospectId,
                  createIdempotencyKey("disqualify", prospect.prospectId),
                ),
            ),
        },
      ],
      CONTRACT_PENDING: [
        {
          key: "contract_signed",
          label: "Confirmar contrato assinado",
          handler: () =>
            runAction(
              "contract-signed",
              "Contrato assinado confirmado com sucesso.",
              () =>
                partnerAcquisitionApi.markProspectContractSigned(
                  prospect.prospectId,
                  createIdempotencyKey("contract-signed", prospect.prospectId),
                ),
            ),
        },
        {
          key: "disqualify",
          label: "Desqualificar",
          handler: () =>
            runAction(
              "disqualify",
              "Prospect desqualificado com sucesso.",
              () =>
                partnerAcquisitionApi.disqualifyProspect(
                  prospect.prospectId,
                  createIdempotencyKey("disqualify", prospect.prospectId),
                ),
            ),
        },
      ],
      AWAITING_SIGNATURE: [
        {
          key: "contract_signed",
          label: "Confirmar contrato assinado",
          handler: () =>
            runAction(
              "contract-signed",
              "Contrato assinado confirmado com sucesso.",
              () =>
                partnerAcquisitionApi.markProspectContractSigned(
                  prospect.prospectId,
                  createIdempotencyKey("contract-signed", prospect.prospectId),
                ),
            ),
        },
        {
          key: "disqualify",
          label: "Desqualificar",
          handler: () =>
            runAction(
              "disqualify",
              "Prospect desqualificado com sucesso.",
              () =>
                partnerAcquisitionApi.disqualifyProspect(
                  prospect.prospectId,
                  createIdempotencyKey("disqualify", prospect.prospectId),
                ),
            ),
        },
      ],
      SIGNED: [
        {
          key: "approve_conversion",
          label: "Aprovar conversão",
          handler: () =>
            runAction(
              "conversion-approve",
              "Conversão aprovada com sucesso.",
              () =>
                partnerAcquisitionApi.approveProspectConversion(
                  prospect.prospectId,
                  createIdempotencyKey("conversion-approve", prospect.prospectId),
                ),
            ),
        },
        {
          key: "reject_conversion",
          label: "Rejeitar conversão",
          handler: () =>
            runAction(
              "conversion-reject",
              "Conversão rejeitada com sucesso.",
              () =>
                partnerAcquisitionApi.rejectProspectConversion(
                  prospect.prospectId,
                  createIdempotencyKey("conversion-reject", prospect.prospectId),
                ),
            ),
        },
        {
          key: "disqualify",
          label: "Desqualificar",
          handler: () =>
            runAction(
              "disqualify",
              "Prospect desqualificado com sucesso.",
              () =>
                partnerAcquisitionApi.disqualifyProspect(
                  prospect.prospectId,
                  createIdempotencyKey("disqualify", prospect.prospectId),
                ),
            ),
        },
      ],
      CONVERSION_PENDING: [
        {
          key: "convert",
          label: "Converter Prospect",
          handler: () =>
            runAction(
              "convert",
              "Prospect convertido com sucesso.",
              () =>
                partnerAcquisitionApi.convertProspect(
                  prospect.prospectId,
                  createIdempotencyKey("convert", prospect.prospectId),
                ),
            ),
        },
        {
          key: "reject_conversion",
          label: "Rejeitar conversão",
          handler: () =>
            runAction(
              "conversion-reject",
              "Conversão rejeitada com sucesso.",
              () =>
                partnerAcquisitionApi.rejectProspectConversion(
                  prospect.prospectId,
                  createIdempotencyKey("conversion-reject", prospect.prospectId),
                ),
            ),
        },
      ],
    };

    return actionFactories[prospect.status] ?? [];
  }, [prospect, prospectId]);

  const isActionRunning = activeAction !== null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Detalhe do Prospect"
          subtitle="Aquisição de Parceiros"
          icon={UserPlus2}
          showSearch={false}
          showFilter={false}
          actions={<BackButton label="Voltar" />}
        />
        <LoadingState text="Carregando prospect" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Detalhe do Prospect"
          subtitle="Aquisição de Parceiros"
          icon={UserPlus2}
          showSearch={false}
          showFilter={false}
          actions={<BackButton label="Voltar" />}
        />
        <Card>
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Não foi possível carregar o prospect.
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">{error}</p>
            <div>
              <BackButton label="Voltar para a lista" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Detalhe do Prospect"
          subtitle="Aquisição de Parceiros"
          icon={UserPlus2}
          showSearch={false}
          showFilter={false}
          actions={<BackButton label="Voltar" />}
        />
        <EmptyState
          title="Prospect não encontrado"
          description="Não foi possível localizar o prospect solicitado na esteira de aquisição."
          icon={<UserPlus2 size={20} />}
        />
        <div>
          <BackButton label="Voltar para a lista" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={prospect.fullName}
        subtitle={`Aquisição de Parceiros / Prospect ${prospect.prospectCode}`}
        icon={UserPlus2}
        showSearch={false}
        showFilter={false}
        actions={<BackButton label="Voltar" />}
      />

      {(actionError || actionSuccess) && (
        <Card
          className={`border ${
            actionError
              ? "border-red-500/30 bg-red-500/5"
              : "border-emerald-500/30 bg-emerald-500/5"
          } p-4`}
        >
          <div
            className={`text-sm font-medium ${
              actionError ? "text-red-600" : "text-emerald-700"
            }`}
          >
            {actionError ?? actionSuccess}
          </div>
        </Card>
      )}

      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Ações de workflow</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Somente ações oficiais compatíveis com o status atual do Prospect.
              </p>
            </div>
            {isActionRunning ? (
              <span className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <Loader2 size={16} className="animate-spin" />
                Processando
              </span>
            ) : null}
          </div>

          {prospectActions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface-hover)] p-4 text-sm text-[var(--text-secondary)]">
              Sem ações disponíveis para o status atual.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {prospectActions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => void action.handler()}
                  disabled={isActionRunning}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isActionRunning && activeAction === action.key ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : null}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border-default)] pb-4">
            <div>
              <div className="text-sm text-[var(--text-muted)]">Status</div>
              <div className="mt-2">
                <Badge>{getStatusLabel(prospect.status)}</Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-[var(--text-muted)]">Origem</div>
              <div className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                {sourceLabel}
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                {prospect.sourceName || "-"}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <ProspectFieldRow label="Nome" value={prospect.fullName} />
            <ProspectFieldRow label="Código" value={prospect.prospectCode} />
            <ProspectFieldRow label="Lead origem" value={prospect.leadId || "-"} />
            <ProspectFieldRow label="Email" value={prospect.email || "-"} />
            <ProspectFieldRow label="Telefone" value={prospect.phone || "-"} />
            <ProspectFieldRow label="Empresa" value={prospect.companyName || "-"} />
            <ProspectFieldRow label="Documento" value={prospect.document || "-"} />
            <ProspectFieldRow label="Referência da origem" value={prospect.sourceReference || "-"} />
            <ProspectFieldRow label="Nome da origem" value={prospect.sourceName || "-"} />
            <ProspectFieldRow label="Campanha" value={prospect.campaignId || "-"} />
            <ProspectFieldRow label="Contexto Hub" value={prospect.hubContextId || "-"} />
            <ProspectFieldRow label="Agente SDR" value={prospect.sdrAgentId || "-"} />
            <ProspectFieldRow label="Score" value={prospect.score ?? "-"} />
            <ProspectFieldRow label="Motivo de qualificação" value={prospect.qualificationReason || "-"} />
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Identificador
              </div>
              <div className="mt-2 break-all text-sm text-[var(--text-primary)]">
                {prospect.prospectId}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Datas
              </div>
              <div className="mt-3 space-y-3">
                <ProspectFieldRow label="Criado em" value={formatDateTime(prospect.createdAt)} />
                <ProspectFieldRow label="Atualizado em" value={formatDateTime(prospect.updatedAt)} />
                <ProspectFieldRow label="Próxima ação" value={formatDateTime(prospect.nextActionAt)} />
                <ProspectFieldRow label="Assinado em" value={formatDateTime(prospect.signedAt)} />
                <ProspectFieldRow label="Convertido em" value={formatDateTime(prospect.convertedAt)} />
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Tenant
              </div>
              <div className="mt-2 break-all text-sm text-[var(--text-primary)]">
                {prospect.tenantId}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Pipeline / Stage
              </div>
              <div className="mt-3 space-y-3">
                <ProspectFieldRow label="Pipeline ID" value={prospect.pipelineId || "-"} />
                <ProspectFieldRow label="Pipeline code" value={prospect.pipelineCode || "-"} />
                <ProspectFieldRow label="Stage ID" value={prospect.stageId || "-"} />
                <ProspectFieldRow label="Stage code" value={prospect.stageCode || "-"} />
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Responsável / Partner
              </div>
              <div className="mt-3 space-y-3">
                <ProspectFieldRow label="Responsável interno" value={prospect.assignedUserId || "-"} />
                <ProspectFieldRow label="Partner" value={prospect.partnerId || "-"} />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PartnerAcquisitionProspectDetailsPage;

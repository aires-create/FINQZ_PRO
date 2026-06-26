import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, UserPlus2 } from "lucide-react";
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

const PartnerAcquisitionProspectDetailsPage: React.FC = () => {
  const { prospectId } = useParams<{ prospectId: string }>();
  const [prospect, setProspect] = useState<PartnerProspectRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

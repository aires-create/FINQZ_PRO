import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, UserPlus2 } from "lucide-react";
import { Badge, Card, EmptyState, LoadingState } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { partnerAcquisitionApi, type PartnerAcquisitionLeadRecord } from "../api/modules";

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
    DISCARDED: "Descartado",
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

const FieldRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="space-y-1">
    <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
      {label}
    </div>
    <div className="break-words text-sm text-[var(--text-primary)]">
      {value ?? "-"}
    </div>
  </div>
);

const BackButton: React.FC<{ label: string }> = ({ label }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate("/app/operacoes/partner-acquisition/leads")}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface-hover)]"
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
};

const PartnerAcquisitionLeadDetailsPage: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const [lead, setLead] = useState<PartnerAcquisitionLeadRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadLead = async () => {
      if (!leadId) {
        if (isMounted) {
          setIsLoading(false);
          setError("Identificador do lead ausente.");
        }
        return;
      }

      if (isMounted) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const response = await partnerAcquisitionApi.getLeadById(leadId);
        if (!isMounted) return;

        setLead(response.data ?? null);
      } catch (caughtError) {
        if (!isMounted) return;

        setLead(null);
        setError(caughtError instanceof Error ? caughtError.message : "Não foi possível carregar o lead.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadLead();

    return () => {
      isMounted = false;
    };
  }, [leadId]);

  const sourceLabel = useMemo(() => (lead ? getSourceLabel(lead.source) : "-"), [lead]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Detalhe do Lead"
          subtitle="Aquisição de Parceiros"
          icon={UserPlus2}
          showSearch={false}
          showFilter={false}
          actions={<BackButton label="Voltar" />}
        />
        <LoadingState text="Carregando lead" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Detalhe do Lead"
          subtitle="Aquisição de Parceiros"
          icon={UserPlus2}
          showSearch={false}
          showFilter={false}
          actions={<BackButton label="Voltar" />}
        />
        <Card>
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Não foi possível carregar o lead.
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">{error}</p>
            <div>
              <div>
                <BackButton label="Voltar para a lista" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Detalhe do Lead"
          subtitle="Aquisição de Parceiros"
          icon={UserPlus2}
          showSearch={false}
          showFilter={false}
          actions={<BackButton label="Voltar" />}
        />
        <EmptyState
          title="Lead não encontrado"
          description="Não foi possível localizar o lead solicitado na esteira de aquisição."
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
        title={lead.fullName}
        subtitle={`Aquisição de Parceiros / Lead ${lead.leadCode}`}
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
                <Badge>{getStatusLabel(lead.status)}</Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-[var(--text-muted)]">Origem</div>
              <div className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                {sourceLabel}
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                {lead.sourceName || "-"}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <FieldRow label="Nome" value={lead.fullName} />
            <FieldRow label="Código" value={lead.leadCode} />
            <FieldRow label="Email" value={lead.email || "-"} />
            <FieldRow label="Telefone" value={lead.phone || "-"} />
            <FieldRow label="Empresa" value={lead.companyName || "-"} />
            <FieldRow label="Documento" value={lead.document || "-"} />
            <FieldRow label="Referência da origem" value={lead.sourceReference || "-"} />
            <FieldRow label="Nome da origem" value={lead.sourceName || "-"} />
            <FieldRow label="Campanha" value={lead.campaignId || "-"} />
            <FieldRow label="Contexto Hub" value={lead.hubContextId || "-"} />
            <FieldRow label="Score" value={lead.score ?? "-"} />
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Identificador
              </div>
              <div className="mt-2 break-all text-sm text-[var(--text-primary)]">
                {lead.leadId}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Datas
              </div>
              <div className="mt-3 space-y-3">
                <FieldRow label="Criado em" value={formatDateTime(lead.createdAt)} />
                <FieldRow label="Atualizado em" value={formatDateTime(lead.updatedAt)} />
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Tenant
              </div>
              <div className="mt-2 break-all text-sm text-[var(--text-primary)]">
                {lead.tenantId}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Responsável interno
              </div>
              <div className="mt-2 break-all text-sm text-[var(--text-primary)]">
                {lead.ownerUserId || "-"}
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface-hover)] p-4 text-sm text-[var(--text-secondary)]">
              Visualização somente leitura da esteira oficial de Aquisição de Parceiros. Alterações, conversão e workflows permanecem fora desta etapa.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PartnerAcquisitionLeadDetailsPage;

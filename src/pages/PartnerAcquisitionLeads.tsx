import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, UserPlus2 } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  KpiCard,
  LoadingState,
} from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import {
  partnerAcquisitionApi,
  type PartnerAcquisitionLeadRecord,
} from "../api/modules";

const formatDateTime = (value?: string | null): string => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    NEW: "Novo",
    CONTACTED: "Contatado",
    QUALIFIED: "Qualificado",
    DISQUALIFIED: "Desqualificado",
    CONVERTED: "Convertido",
    ARCHIVED: "Arquivado",
  };

  return labels[status] ?? status;
};

const getSourceLabel = (source: string): string => {
  const labels: Record<string, string> = {
    MANUAL: "Manual",
    HUB: "Hub",
    CAMPAIGN: "Campanha",
    IMPORT: "Importação",
    REFERRAL: "Indicação",
    OTHER: "Outro",
  };

  return labels[source] ?? source;
};

const PartnerAcquisitionLeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<PartnerAcquisitionLeadRecord[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = useCallback(async (options?: { refreshing?: boolean }) => {
    if (options?.refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      const response = await partnerAcquisitionApi.getLeads({
        page: 1,
        limit: 20,
        search: search.trim() || undefined,
      });

      setLeads(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar leads de aquisição.");
      setLeads([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  const summary = useMemo(() => {
    const total = leads.length;
    const newLeads = leads.filter((lead) => lead.status === "NEW").length;
    const converted = leads.filter((lead) => lead.status === "CONVERTED").length;

    return { total, newLeads, converted };
  }, [leads]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aquisição de Parceiros"
        subtitle="Leads somente leitura da esteira de aquisição"
        icon={<UserPlus2 size={20} />}
        onRefresh={() => void loadLeads({ refreshing: true })}
        onSearch={setSearch}
        showFilter={false}
        actions={
          isRefreshing ? (
            <span className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <RefreshCw size={16} className="animate-spin" />
              Atualizando
            </span>
          ) : null
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard title="Leads" value={summary.total} icon={<UserPlus2 size={20} />} />
        <KpiCard title="Novos" value={summary.newLeads} icon={<UserPlus2 size={20} />} />
        <KpiCard title="Convertidos" value={summary.converted} icon={<UserPlus2 size={20} />} />
      </div>

      {isLoading ? (
        <LoadingState title="Carregando leads" description="Buscando dados oficiais do Partner Acquisition." />
      ) : error ? (
        <Card className="p-6">
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Não foi possível carregar os leads.
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">{error}</p>
            <button
              type="button"
              onClick={() => void loadLeads({ refreshing: true })}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Tentar novamente
            </button>
          </div>
        </Card>
      ) : leads.length === 0 ? (
        <EmptyState
          title="Nenhum lead encontrado"
          description="Ainda não há leads de aquisição de parceiros para exibir."
          icon={<UserPlus2 size={20} />}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border-default)]">
              <thead className="bg-[var(--bg-elevated)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Lead
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Contato
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Origem
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Criado em
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)] bg-[var(--bg-surface)]">
                {leads.map((lead) => (
                  <tr key={lead.leadId} className="hover:bg-[var(--bg-surface-hover)]">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[var(--text-primary)]">{lead.fullName}</div>
                      <div className="text-xs text-[var(--text-muted)]">{lead.leadCode}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      <div>{lead.email || "-"}</div>
                      <div className="text-xs text-[var(--text-muted)]">{lead.phone || "-"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {lead.sourceName || getSourceLabel(lead.source)}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {lead.sourceReference || getSourceLabel(lead.source)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge>{getStatusLabel(lead.status)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {formatDateTime(lead.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PartnerAcquisitionLeadsPage;


import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, UserPlus2 } from "lucide-react";
import { Badge, Card, EmptyState, KpiCard, LoadingState } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import {
  partnerAcquisitionApi,
  type PartnerProspectRecord,
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

const PartnerAcquisitionProspectsPage: React.FC = () => {
  const [prospects, setProspects] = useState<PartnerProspectRecord[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProspects = useCallback(async (options?: { refreshing?: boolean }) => {
    if (options?.refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      const response = await partnerAcquisitionApi.getProspects({
        page: 1,
        limit: 20,
        search: search.trim() || undefined,
      });

      setProspects(Array.isArray(response.data) ? response.data : []);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erro ao carregar prospects.");
      setProspects([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    void loadProspects();
  }, [loadProspects]);

  const summary = useMemo(() => {
    const total = prospects.length;
    const qualified = prospects.filter((prospect) => prospect.status === "QUALIFIED").length;
    const converted = prospects.filter((prospect) => prospect.status === "CONVERTED").length;

    return { total, qualified, converted };
  }, [prospects]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prospects"
        subtitle="Leitura oficial da esteira de aquisição"
        icon={UserPlus2}
        onRefresh={() => void loadProspects({ refreshing: true })}
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
        <KpiCard label="Prospects" value={summary.total} icon={<UserPlus2 size={20} />} />
        <KpiCard label="Qualificados" value={summary.qualified} icon={<UserPlus2 size={20} />} />
        <KpiCard label="Convertidos" value={summary.converted} icon={<UserPlus2 size={20} />} />
      </div>

      {isLoading ? (
        <LoadingState title="Carregando prospects" description="Buscando dados oficiais do Partner Acquisition." />
      ) : error ? (
        <Card className="p-6">
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Não foi possível carregar os prospects.
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">{error}</p>
            <button
              type="button"
              onClick={() => void loadProspects({ refreshing: true })}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Tentar novamente
            </button>
          </div>
        </Card>
      ) : prospects.length === 0 ? (
        <EmptyState
          title="Nenhum prospect encontrado"
          description="Ainda não há prospects de aquisição para exibir."
          icon={<UserPlus2 size={20} />}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border-default)]">
              <thead className="bg-[var(--bg-elevated)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Prospect
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
                {prospects.map((prospect) => (
                  <tr key={prospect.prospectId} className="hover:bg-[var(--bg-surface-hover)]">
                    <td className="px-4 py-3">
                      <Link
                        to={`/app/operacoes/partner-acquisition/prospects/${prospect.prospectId}`}
                        className="font-semibold text-[var(--text-primary)] transition-colors hover:text-primary hover:underline"
                      >
                        {prospect.fullName}
                      </Link>
                      <div className="text-xs text-[var(--text-muted)]">{prospect.prospectCode}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      <div>{prospect.email || "-"}</div>
                      <div className="text-xs text-[var(--text-muted)]">{prospect.phone || "-"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {prospect.sourceName || getSourceLabel(prospect.source)}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {prospect.sourceReference || getSourceLabel(prospect.source)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge>{getStatusLabel(prospect.status)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {formatDateTime(prospect.createdAt)}
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

export default PartnerAcquisitionProspectsPage;

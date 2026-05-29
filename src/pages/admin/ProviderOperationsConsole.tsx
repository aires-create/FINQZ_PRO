import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Badge, Card as DSCard, Button } from "../../components/ui";
import { PageHeader } from "../../components/layout/PageHeader";
import {
  providerOperationsApi,
  type ProviderOperationsConsole,
} from "../../api/modules/provider-operations.api";

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("pt-BR");
};

const statusVariant = (status: string): "success" | "warning" | "danger" | "outline" => {
  if (status === "ok") return "success";
  if (status === "degraded") return "warning";
  if (status === "down") return "danger";
  return "outline";
};

const ProviderOperationsConsolePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<ProviderOperationsConsole | null>(null);

  const loadSnapshot = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await providerOperationsApi.getConsoleSnapshot();
      setSnapshot(data);
    } catch {
      setError("Nao foi possivel carregar o Provider Operations Console.");
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshot();
  }, []);

  const providers = snapshot?.providers ?? [];
  const issues = snapshot?.issues ?? [];
  const summary = snapshot?.summary;

  const totalCapabilities = useMemo(() => {
    if (!snapshot) return 0;
    return Object.values(snapshot.capabilities).reduce((acc, capabilityMap) => {
      return acc + Object.values(capabilityMap).filter((value) => value === true).length;
    }, 0);
  }, [snapshot]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Provider Operations Console"
        subtitle="Visao consolidada do runtime operacional de providers"
        onRefresh={loadSnapshot}
        actions={
          <Button variant="outline" size="sm" onClick={loadSnapshot} disabled={loading}>
            Atualizar
          </Button>
        }
      />

      {loading && (
        <DSCard className="p-6 text-sm text-slate-500">
          Carregando snapshot operacional...
        </DSCard>
      )}

      {!loading && error && (
        <DSCard className="p-6">
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <ShieldAlert size={16} />
            {error}
          </div>
        </DSCard>
      )}

      {!loading && !error && !snapshot && (
        <DSCard className="p-6 text-sm text-slate-500">
          Nenhum dado operacional disponivel.
        </DSCard>
      )}

      {!loading && !error && snapshot && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <DSCard className="p-4">
              <p className="text-xs text-slate-500">Runtime Status</p>
              <div className="mt-2">
                <Badge variant={statusVariant(snapshot.runtimeStatus)}>
                  {snapshot.runtimeStatus}
                </Badge>
              </div>
            </DSCard>

            <DSCard className="p-4">
              <p className="text-xs text-slate-500">Gerado em</p>
              <p className="mt-2 text-sm text-white">{formatDateTime(snapshot.generatedAt)}</p>
            </DSCard>

            <DSCard className="p-4">
              <p className="text-xs text-slate-500">Issues</p>
              <p className="mt-2 text-sm text-white">{issues.length}</p>
            </DSCard>

            <DSCard className="p-4">
              <p className="text-xs text-slate-500">Capabilities Ativas</p>
              <p className="mt-2 text-sm text-white">{totalCapabilities}</p>
            </DSCard>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <DSCard className="p-4">
              <p className="text-xs text-slate-500">Degraded</p>
              <p className="mt-2 text-lg text-amber-400">{snapshot.counts.degraded}</p>
            </DSCard>
            <DSCard className="p-4">
              <p className="text-xs text-slate-500">Down</p>
              <p className="mt-2 text-lg text-red-400">{snapshot.counts.down}</p>
            </DSCard>
            <DSCard className="p-4">
              <p className="text-xs text-slate-500">Disabled</p>
              <p className="mt-2 text-lg text-slate-300">{snapshot.counts.disabled}</p>
            </DSCard>
          </div>

          {summary && (
            <DSCard className="p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Summary</h3>
              <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6 text-sm">
                <div>Total: {summary.totalProviders}</div>
                <div>Healthy: {summary.healthy}</div>
                <div>Degraded: {summary.degraded}</div>
                <div>Down: {summary.down}</div>
                <div>Disabled: {summary.disabled}</div>
                <div>Avg latency: {summary.averageLatencyMs ?? "-"} ms</div>
              </div>
            </DSCard>
          )}

          <DSCard className="p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Providers</h3>
            {providers.length === 0 ? (
              <p className="text-sm text-slate-500">Sem providers com snapshot operacional no momento.</p>
            ) : (
              <div className="space-y-3">
                {providers.map((provider) => (
                  <div key={provider.providerKey} className="rounded-lg border border-[#1f2937] p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{provider.providerKey}</span>
                      <Badge variant={statusVariant(provider.status)}>{provider.status}</Badge>
                      <Badge variant={statusVariant(provider.connectivityStatus)}>
                        connectivity: {provider.connectivityStatus}
                      </Badge>
                      <Badge variant={statusVariant(provider.authStatus === "failed" ? "down" : provider.authStatus)}>
                        auth: {provider.authStatus}
                      </Badge>
                    </div>
                    <div className="mt-2 grid gap-2 md:grid-cols-2 lg:grid-cols-4 text-xs text-slate-300">
                      <div>Last latency: {provider.lastLatencyMs ?? "-"} ms</div>
                      <div>Last success: {formatDateTime(provider.lastSuccessAt)}</div>
                      <div>Last failure: {formatDateTime(provider.lastFailureAt)}</div>
                      <div>Last error: {provider.lastErrorCode ?? "-"}</div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {provider.capabilities &&
                        Object.entries(provider.capabilities).map(([capability, value]) => (
                          <Badge key={`${provider.providerKey}-${capability}`} variant="outline">
                            {capability}:{String(value)}
                          </Badge>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DSCard>

          <DSCard className="p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Issues</h3>
            {issues.length === 0 ? (
              <p className="text-sm text-slate-500">Sem issues degraded/down.</p>
            ) : (
              <div className="space-y-2">
                {issues.map((issue, index) => (
                  <div
                    key={`${issue.providerKey}-${issue.capability}-${index}`}
                    className="flex items-start gap-2 rounded-lg border border-[#1f2937] p-3 text-sm"
                  >
                    <AlertTriangle size={16} className="text-amber-400 mt-0.5" />
                    <div>
                      <div className="text-white">
                        {issue.providerKey} / {issue.capability} - {issue.status}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        code: {issue.sanitizedErrorCode ?? "-"} | latency: {issue.latencyMs ?? "-"} ms | lastFailure:{" "}
                        {formatDateTime(issue.lastFailureAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DSCard>
        </>
      )}
    </div>
  );
};

export default ProviderOperationsConsolePage;

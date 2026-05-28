// FINQZ PRO - Integrações Page
import React, { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "../../components/ui";
import { PageHeader } from "../../components/layout/PageHeader";
import { finqzClient } from "../../api/finqzClient";
import {
  getProviderPayloadDiagnostics,
  type ProviderPayloadDiagnostics,
} from "../../api/modules/integrations.api";

type CapabilitySupport = boolean | "planned";

type ProviderCapabilities = {
  initialSimulation: CapabilitySupport;
  marginInquiry: CapabilitySupport;
  rateTables: CapabilitySupport;
  proposalPipeline: CapabilitySupport;
  commissions: CapabilitySupport;
  commissionPayout: CapabilitySupport;
  dataEnrichment: CapabilitySupport;
  messageSender: CapabilitySupport;
  bulkMessaging: CapabilitySupport;
  webhooks: CapabilitySupport;
};

type ProviderCapabilityItem = {
  providerKey: string;
  displayName: string;
  category: string;
  status: "active" | "planned" | "legacy" | "experimental";
  capabilities: ProviderCapabilities;
};

export const IntegracoesPage: React.FC = () => {
  const [providers, setProviders] = useState<ProviderCapabilityItem[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [diagnosticsByProvider, setDiagnosticsByProvider] = useState<Record<string, ProviderPayloadDiagnostics>>({});
  const [diagnosticsLoadingByProvider, setDiagnosticsLoadingByProvider] = useState<Record<string, boolean>>({});
  const [diagnosticsErrorByProvider, setDiagnosticsErrorByProvider] = useState<Record<string, string | null>>({});

  const loadCapabilities = async () => {
    setLoadingProviders(true);
    setProvidersError(null);
    try {
      const response = await finqzClient.get<ProviderCapabilityItem[]>('/api/v1/integrations/providers/capabilities');
      const data = Array.isArray(response?.data) ? response.data : [];
      setProviders(data);
    } catch (error) {
      setProvidersError('Erro ao carregar capabilities de integrações.');
      setProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  useEffect(() => {
    loadCapabilities();
  }, []);

  const loadPayloadDiagnostics = async (providerKey: string) => {
    setDiagnosticsLoadingByProvider((prev) => ({ ...prev, [providerKey]: true }));
    setDiagnosticsErrorByProvider((prev) => ({ ...prev, [providerKey]: null }));

    try {
      const diagnostics = await getProviderPayloadDiagnostics(providerKey);
      setDiagnosticsByProvider((prev) => ({ ...prev, [providerKey]: diagnostics }));
    } catch {
      setDiagnosticsErrorByProvider((prev) => ({
        ...prev,
        [providerKey]: "Não foi possível carregar o diagnóstico de payload.",
      }));
    } finally {
      setDiagnosticsLoadingByProvider((prev) => ({ ...prev, [providerKey]: false }));
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(providers, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `integracoes_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const renderCapabilityBadge = (key: string, value: CapabilitySupport) => {
    const label = value === true ? 'Suportado' : value === 'planned' ? 'Planejado' : 'Não suportado';
    const colorClass = value === true
      ? 'bg-green-100 text-green-700'
      : value === 'planned'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-gray-100 text-slate-600';

    return (
      <span
        key={key}
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${colorClass}`}
      >
        {key}: {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrações"
        subtitle="Gerencie integrações com serviços externos"
        onRefresh={loadCapabilities}
        onImport={() => alert('Funcionalidade de importação em desenvolvimento')}
        importLabel="Importar"
        onExport={handleExport}
        exportLabel="Exportar"
        exportData={providers}
        exportColumns={[{ key: 'displayName', label: 'Nome' }, { key: 'status', label: 'Status' }]}
        exportFilename="integracoes"
      />
      
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Configurações de Integrações</h3>

          {/* Lista de Integrações */}
          <div className="grid gap-4">
            {loadingProviders && (
              <div className="border border-[#1f2937] rounded-xl p-4 text-slate-500 text-sm">
                Carregando providers e capabilities...
              </div>
            )}

            {!loadingProviders && providersError && (
              <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-4 text-red-500 text-sm">
                {providersError}
              </div>
            )}

            {!loadingProviders && !providersError && providers.length === 0 && (
              <div className="border border-[#1f2937] rounded-xl p-4 text-slate-500 text-sm">
                Nenhum provider encontrado.
              </div>
            )}

            {!loadingProviders && !providersError && providers.map((provider) => (
              <div key={provider.providerKey} className="border border-[#1f2937] rounded-xl p-4">
                {(() => {
                  const diagnostics = diagnosticsByProvider[provider.providerKey];
                  const diagnosticsLoading = diagnosticsLoadingByProvider[provider.providerKey] === true;
                  const diagnosticsError = diagnosticsErrorByProvider[provider.providerKey];
                  const issuesBySeverity = diagnostics?.issues?.reduce<Record<string, number>>((acc, issue) => {
                    acc[issue.severity] = (acc[issue.severity] ?? 0) + 1;
                    return acc;
                  }, {}) ?? {};

                  return (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white">{provider.displayName}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        provider.status === 'active' ? 'bg-green-100 text-green-700' :
                        provider.status === 'legacy' ? 'bg-orange-100 text-orange-700' :
                        provider.status === 'experimental' ? 'bg-purple-100 text-purple-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {provider.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      <span className="font-mono">{provider.providerKey}</span> • {provider.category}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(provider.capabilities).map(([key, value]) =>
                        renderCapabilityBadge(key, value),
                      )}
                    </div>

                    {provider.providerKey === "nova-promotora" && (
                      <div className="mt-4 space-y-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadPayloadDiagnostics(provider.providerKey)}
                          disabled={diagnosticsLoading}
                        >
                          {diagnosticsLoading ? "Carregando diagnóstico..." : "Ver diagnóstico do payload"}
                        </Button>

                        {diagnosticsError && (
                          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400">
                            {diagnosticsError}
                          </div>
                        )}

                        {diagnostics && (
                          <div className="rounded-lg border border-[#374151] bg-[#0f172a] p-3 text-xs text-slate-200 space-y-2">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <div>Total: <span className="font-semibold">{diagnostics.totalRecords}</span></div>
                              <div>Válidos: <span className="font-semibold">{diagnostics.validRecords}</span></div>
                              <div>Inválidos: <span className="font-semibold">{diagnostics.invalidRecords}</span></div>
                              <div>Status desconhecidos: <span className="font-semibold">{diagnostics.unknownStatuses.length}</span></div>
                            </div>

                            {diagnostics.unknownStatuses.length > 0 && (
                              <div>
                                <span className="text-slate-400">Unknown statuses:</span>{" "}
                                {diagnostics.unknownStatuses.join(", ")}
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full bg-slate-700 px-2 py-0.5">
                                info: {issuesBySeverity.info ?? 0}
                              </span>
                              <span className="rounded-full bg-amber-700/40 px-2 py-0.5">
                                warning: {issuesBySeverity.warning ?? 0}
                              </span>
                              <span className="rounded-full bg-red-700/40 px-2 py-0.5">
                                error: {issuesBySeverity.error ?? 0}
                              </span>
                            </div>

                            {diagnostics.issues.length > 0 && (
                              <ul className="space-y-1 text-slate-300">
                                {diagnostics.issues.map((issue, index) => (
                                  <li key={`${issue.code}-${index}`}>
                                    [{issue.severity}] {issue.code}: {issue.message}
                                    {issue.path ? ` (${issue.path})` : ""}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" disabled>
                      Catálogo
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ExternalLink size={16} />
                    </Button>
                  </div>
                </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegracoesPage;

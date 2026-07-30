// FINQZ PRO - Integrações Page
import React, { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "../../components/ui";
import { PageHeader } from "../../components/layout/PageHeader";
import { finqzClient } from "../../api/finqzClient";

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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegracoesPage;

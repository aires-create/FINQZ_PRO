// FINQZ PRO - Automações Page
import React, { useState } from "react";
import { Zap, Play, Pause, Edit, Trash2, Plus } from "lucide-react";
import { AUTOMAÇÕES_BASE, getConfigPipeline, toggleAutomacaoPipeline, getPipelinesComAutomacao } from "../../config/configAutomacoes";
import { pipelines as initialPipelines } from "../../config/pipelines";
import { Button, Input } from "../../components/ui";
import { PageHeader } from "../../components/layout/PageHeader";

export const AutomacoesPage: React.FC = () => {
  const [automacoes, setAutomacoes] = useState(AUTOMAÇÕES_BASE);
  const [pipelinesComAutomacao, setPipelinesComAutomacao] = useState(getPipelinesComAutomacao());

  const toggleAutomacao = (id: string) => {
    setAutomacoes(automacoes.map(a => 
      a.id === id ? { ...a, ativa: !a.ativa } : a
    ));
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(automacoes, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `automacoes_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automações"
        subtitle="Configure automações para otimizar seus processos"
        onRefresh={() => {}}
        onImport={() => alert('Funcionalidade de importação em desenvolvimento')}
        importLabel="Importar"
        onExport={handleExport}
        exportLabel="Exportar"
        exportData={automacoes}
        exportColumns={[{ key: 'nome', label: 'Nome' }, { key: 'ativa', label: 'Ativa' }]}
        exportFilename="automacoes"
      />
      
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Automações Disponíveis</h3>
          
          {/* Lista de Automações */}
          <div className="space-y-3">
            {automacoes.map((automacao) => (
              <div key={automacao.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Zap size={18} className="text-[#000dff]" />
                      <h4 className="font-semibold text-gray-900">{automacao.nome}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        automacao.ativa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {automacao.ativa ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{automacao.descricao}</p>
                    {automacao.pipelineId && (
                      <p className="text-xs text-gray-400 mt-2">
                        Pipeline: {initialPipelines.find(p => p.id === automacao.pipelineId)?.nome || automacao.pipelineId}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleAutomacao(automacao.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        automacao.ativa 
                          ? 'text-orange-500 hover:bg-orange-50' 
                          : 'text-green-500 hover:bg-green-50'
                      }`}
                      title={automacao.ativa ? 'Pausar' : 'Ativar'}
                    >
                      {automacao.ativa ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button className="p-2 text-gray-500 hover:text-[#000dff] hover:bg-gray-100 rounded-lg">
                      <Edit size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Botão adicionar automação */}
          <button
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={18} />
            Nova Automação
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutomacoesPage;

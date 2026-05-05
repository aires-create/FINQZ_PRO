// FINQZ PRO - Pipelines Page (Admin)
// Página de administração de pipelines usando catálogo PF Credit

import React, { useState, useEffect } from "react";
import { Edit, Trash2, Plus, GripVertical, Save, X, RotateCcw } from "lucide-react";
import { 
  getPipelineOptions, 
  loadPipelineSettings, 
  savePipelineSettings, 
  getDefaultPipelineSettings,
  PipelineSettings,
  defaultPipelineStages
} from "../../data/catalogRepository";
import { Button, Input } from "../../components/ui";
import { PageHeader } from "../../components/layout/PageHeader";

export const PipelinesPage: React.FC = () => {
  // Carrega configurações do localStorage ou gera padrão
  const [pipelineSettings, setPipelineSettings] = useState<Record<string, PipelineSettings>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PipelineSettings | null>(null);
  const [draggedStage, setDraggedStage] = useState<{ pipelineId: string; stageIndex: number } | null>(null);
  const [dragOverStage, setDragOverStage] = useState<{ pipelineId: string; stageIndex: number } | null>(null);

  // Carrega configurações ao iniciar
  useEffect(() => {
    const settings = loadPipelineSettings();
    setPipelineSettings(settings);
  }, []);

  // Gera pipeline options a partir do catálogo
  const pipelineOptions = getPipelineOptions().filter(opt => 
    opt.id && opt.code && opt.name && 
    !['FINQZ Auto', 'FINQZ Consignado', 'FGTS'].includes(opt.name)
  );

  // Garante unicidade por pipelineId
  const uniquePipelines = pipelineOptions.filter((opt, index, arr) => 
    arr.findIndex(x => x.id === opt.id) === index
  );

  const handleEdit = (pipelineId: string) => {
    const setting = pipelineSettings[pipelineId];
    if (setting) {
      setEditingId(pipelineId);
      setEditForm({ ...setting, stages: [...setting.stages] });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveEdit = () => {
    if (!editForm) return;

    const updated = {
      ...pipelineSettings,
      [editForm.pipelineId]: {
        ...editForm,
        updatedAt: new Date().toISOString()
      }
    };

    savePipelineSettings(updated);
    setPipelineSettings(updated);
    setEditingId(null);
    setEditForm(null);
  };

  const handleToggleAtivo = (pipelineId: string) => {
    const setting = pipelineSettings[pipelineId];
    if (!setting) return;

    const updated = {
      ...pipelineSettings,
      [pipelineId]: {
        ...setting,
        active: !setting.active,
        updatedAt: new Date().toISOString()
      }
    };

    savePipelineSettings(updated);
    setPipelineSettings(updated);
  };

  const handleAddStage = () => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      stages: [...editForm.stages, `Etapa ${editForm.stages.length + 1}`]
    });
  };

  const handleRemoveStage = (index: number) => {
    if (!editForm || editForm.stages.length <= 1) return;
    const newStages = editForm.stages.filter((_, i) => i !== index);
    setEditForm({ ...editForm, stages: newStages });
  };

  const handleUpdateStageName = (index: number, newName: string) => {
    if (!editForm) return;
    const newStages = [...editForm.stages];
    newStages[index] = newName;
    setEditForm({ ...editForm, stages: newStages });
  };

  // Drag and drop handlers
  const handleDragStart = (pipelineId: string, stageIndex: number) => {
    setDraggedStage({ pipelineId, stageIndex });
  };

  const handleDragOver = (e: React.DragEvent, pipelineId: string, stageIndex: number) => {
    e.preventDefault();
    setDragOverStage({ pipelineId, stageIndex });
  };

  const handleDrop = (e: React.DragEvent, targetPipelineId: string, targetStageIndex: number) => {
    e.preventDefault();
    if (!draggedStage || draggedStage.pipelineId !== targetPipelineId) {
      setDraggedStage(null);
      setDragOverStage(null);
      return;
    }

    const sourceIndex = draggedStage.stageIndex;
    if (sourceIndex === targetStageIndex) {
      setDraggedStage(null);
      setDragOverStage(null);
      return;
    }

    const setting = pipelineSettings[targetPipelineId];
    if (!setting) return;

    const stages = [...setting.stages];
    const [removed] = stages.splice(sourceIndex, 1);
    stages.splice(targetStageIndex, 0, removed);

    const updated = {
      ...pipelineSettings,
      [targetPipelineId]: {
        ...setting,
        stages,
        updatedAt: new Date().toISOString()
      }
    };

    savePipelineSettings(updated);
    setPipelineSettings(updated);
    setDraggedStage(null);
    setDragOverStage(null);
  };

  const handleResetToDefault = () => {
    const defaults = getDefaultPipelineSettings();
    savePipelineSettings(defaults);
    setPipelineSettings(defaults);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(pipelineSettings, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pipelines_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipelines"
        subtitle="Configure os pipelines e etapas do seu funil de vendas PF Credit"
        onRefresh={() => setPipelineSettings(loadPipelineSettings())}
        onImport={() => alert('Funcionalidade de importação em desenvolvimento')}
        importLabel="Importar"
        onExport={handleExport}
        exportLabel="Exportar"
        exportData={Object.values(pipelineSettings)}
        exportColumns={[
          { key: 'pipelineName', label: 'Nome' },
          { key: 'pipelineId', label: 'ID' },
          { key: 'active', label: 'Ativo' }
        ]}
        exportFilename="pipelines"
        extra={
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetToDefault}
            className="flex items-center gap-1"
          >
            <RotateCcw size={14} />
            Restaurar Padrão
          </Button>
        }
      />
      
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-white">Gerenciar Pipelines PF Credit</h3>
              <p className="text-sm text-gray-500">
                Configure os 8 pipelines de crédito PF: Consignado, CDC, Empréstimo com Garantia, Financiamento, Cartão, Antecipação, Seguro e Consórcio
              </p>
            </div>
          </div>
          
          {/* Lista de Pipelines */}
          <div className="space-y-4">
            {uniquePipelines.map((option) => {
              const setting = pipelineSettings[option.id] || {
                pipelineId: option.id,
                pipelineCode: option.code,
                pipelineName: option.name,
                active: true,
                stages: defaultPipelineStages[option.id] || ["Novo Lead", "Contato", "Análise", "Aprovação", "Encerrado"],
                updatedAt: new Date().toISOString()
              };

              const isEditing = editingId === option.id;

              return (
                <div key={option.id} className="border border-[#1f2937] rounded-xl p-4">
                  {/* Header do Pipeline */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-white">{setting.pipelineName}</h4>
                      <p className="text-sm text-gray-500">ID: {setting.pipelineId} | Code: {setting.pipelineCode}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        setting.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {setting.active ? 'Ativo' : 'Inativo'}
                      </span>
                      {!isEditing && (
                        <>
                          <button 
                            onClick={() => handleEdit(option.id)}
                            className="p-2 text-gray-500 hover:text-[#000dff] hover:bg-gray-100 rounded-lg"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleToggleAtivo(option.id)}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-lg"
                            title={setting.active ? "Desativar" : "Ativar"}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Modo Visualização - Etapas */}
                  {!isEditing && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-300 mb-2">
                        Etapas ({setting.stages.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {setting.stages.map((stage, index) => (
                          <div 
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-300 rounded-full text-sm flex items-center gap-1"
                          >
                            <span className="w-5 h-5 rounded-full bg-gray-300 text-xs flex items-center justify-center">
                              {index + 1}
                            </span>
                            {stage}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Modo Edição - Formulário */}
                  {isEditing && editForm && (
                    <div className="mt-4 space-y-4">
                      {/* Nome do Pipeline (apenas visual, não editável) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Nome do Pipeline
                        </label>
                        <Input
                          value={editForm.pipelineName}
                          disabled
                          className="bg-gray-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          O nome é definido pelo catálogo e não pode ser alterado.
                        </p>
                      </div>

                      {/* Status Ativo */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`active-${editForm.pipelineId}`}
                          checked={editForm.active}
                          onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                          className="w-4 h-4 text-[#000dff] rounded"
                        />
                        <label htmlFor={`active-${editForm.pipelineId}`} className="text-sm text-gray-300">
                          Pipeline Ativo
                        </label>
                      </div>

                      {/* Etapas */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium text-gray-300">
                            Etapas (arraste para reordenar):
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddStage}
                            className="flex items-center gap-1"
                          >
                            <Plus size={14} />
                            Adicionar Etapa
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {editForm.stages.map((stage, index) => (
                            <div
                              key={index}
                              draggable
                              onDragStart={() => handleDragStart(editForm.pipelineId, index)}
                              onDragOver={(e) => handleDragOver(e, editForm.pipelineId, index)}
                              onDrop={(e) => handleDrop(e, editForm.pipelineId, index)}
                              className={`flex items-center gap-2 p-2 rounded-lg border ${
                                dragOverStage?.pipelineId === editForm.pipelineId && 
                                dragOverStage?.stageIndex === index
                                  ? 'border-[#000dff] bg-blue-50'
                                  : 'border-[#1f2937] bg-[#111827]'
                              }`}
                            >
                              <GripVertical size={16} className="text-gray-400 cursor-grab" />
                              <span className="w-6 h-6 rounded-full bg-gray-200 text-xs flex items-center justify-center text-gray-600">
                                {index + 1}
                              </span>
                              <Input
                                value={stage}
                                onChange={(e) => handleUpdateStageName(index, e.target.value)}
                                className="flex-1"
                              />
                              <button
                                onClick={() => handleRemoveStage(index)}
                                disabled={editForm.stages.length <= 1}
                                className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="flex items-center gap-1"
                        >
                          <X size={14} />
                          Cancelar
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleSaveEdit}
                          className="flex items-center gap-1"
                        >
                          <Save size={14} />
                          Salvar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Resumo */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-white mb-2">Resumo dos Pipelines</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total de Pipelines:</span>
                <span className="ml-2 font-medium">{uniquePipelines.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Ativos:</span>
                <span className="ml-2 font-medium text-green-600">
                  {Object.values(pipelineSettings).filter(s => s.active).length}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Inativos:</span>
                <span className="ml-2 font-medium text-gray-600">
                  {Object.values(pipelineSettings).filter(s => !s.active).length}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Última Atualização:</span>
                <span className="ml-2 font-medium text-gray-600">
                  {new Date().toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelinesPage;

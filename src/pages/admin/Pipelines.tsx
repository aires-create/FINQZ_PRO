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
  defaultPipelineStages,
  createDefaultStageColors,
  isValidPipelineStageColor
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

  const displayedPipelines = [
    ...uniquePipelines,
    ...Object.values(pipelineSettings)
      .filter(setting => !uniquePipelines.some(option => option.id === setting.pipelineId))
      .map(setting => ({
        id: setting.pipelineId,
        code: setting.pipelineCode,
        name: setting.pipelineName,
      }))
  ];

  const handleEdit = (pipelineId: string) => {
    const setting = pipelineSettings[pipelineId];
    if (setting) {
      setEditingId(pipelineId);
      setEditForm({ ...setting, stages: [...setting.stages], stageColors: [...setting.stageColors] });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    const defaultColors = createDefaultStageColors(editForm.stages.length);
    const stageColors = editForm.stages.map((_, index) => {
      const color = editForm.stageColors[index];
      return isValidPipelineStageColor(color) ? color : defaultColors[index];
    });

    const updated = {
      ...pipelineSettings,
      [editForm.pipelineId]: {
        ...editForm,
        stageColors,
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
      stages: [...editForm.stages, `Etapa ${editForm.stages.length + 1}`],
      stageColors: [
        ...editForm.stageColors,
        createDefaultStageColors(editForm.stages.length + 1)[editForm.stages.length]
      ]
    });
  };

  const handleRemoveStage = (index: number) => {
    if (!editForm || editForm.stages.length <= 1) return;
    const newStages = editForm.stages.filter((_, i) => i !== index);
    const newStageColors = editForm.stageColors.filter((_, i) => i !== index);
    setEditForm({ ...editForm, stages: newStages, stageColors: newStageColors });
  };

  const handleUpdateStageName = (index: number, newName: string) => {
    if (!editForm) return;
    const newStages = [...editForm.stages];
    newStages[index] = newName;
    setEditForm({ ...editForm, stages: newStages });
  };

  const handleUpdateStageColor = (index: number, newColor: string) => {
    if (!editForm || !isValidPipelineStageColor(newColor)) return;
    const newStageColors = [...editForm.stageColors];
    newStageColors[index] = newColor;
    setEditForm({ ...editForm, stageColors: newStageColors });
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

    const setting = editForm?.pipelineId === targetPipelineId ? editForm : pipelineSettings[targetPipelineId];
    if (!setting) return;

    const stages = [...setting.stages];
    const [removed] = stages.splice(sourceIndex, 1);
    stages.splice(targetStageIndex, 0, removed);

    const stageColors = [...setting.stageColors];
    const [removedColor] = stageColors.splice(sourceIndex, 1);
    stageColors.splice(targetStageIndex, 0, removedColor || createDefaultStageColors(stages.length)[targetStageIndex]);

    const nextSetting = {
      ...setting,
      stages,
      stageColors,
      updatedAt: new Date().toISOString()
    };

    if (editForm?.pipelineId === targetPipelineId) {
      setEditForm(nextSetting);
      setDraggedStage(null);
      setDragOverStage(null);
      return;
    }

    const updated = {
      ...pipelineSettings,
      [targetPipelineId]: nextSetting
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

  const handleCreatePipeline = () => {
    const suffix = String(Date.now()).slice(-5);
    const pipelineId = `custom-${suffix}`;
    const newPipeline: PipelineSettings = {
      pipelineId,
      pipelineCode: `CUSTOM-${suffix}`,
      pipelineName: "Novo Pipeline",
      active: true,
      stages: ["Entrada", "Análise", "Aprovação", "Encerrado"],
      stageColors: createDefaultStageColors(4),
      updatedAt: new Date().toISOString()
    };

    const updated = {
      ...pipelineSettings,
      [pipelineId]: newPipeline
    };

    savePipelineSettings(updated);
    setPipelineSettings(updated);
    setEditingId(pipelineId);
    setEditForm({ ...newPipeline, stages: [...newPipeline.stages], stageColors: [...newPipeline.stageColors] });
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
        onRefresh={() => setPipelineSettings(loadPipelineSettings())}
        onCreate={handleCreatePipeline}
        createLabel="Novo Pipeline"
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
      
      <div className="finqz-card p-4 sm:p-5">
        <div className="space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Pipelines cadastrados</h3>
            </div>
          </div>
          
          {/* Lista de Pipelines */}
          <div className="space-y-4">
            {displayedPipelines.map((option) => {
              const setting = pipelineSettings[option.id] || {
                pipelineId: option.id,
                pipelineCode: option.code,
                pipelineName: option.name,
                active: true,
                stages: defaultPipelineStages[option.id] || ["Novo Lead", "Contato", "Análise", "Aprovação", "Encerrado"],
                stageColors: createDefaultStageColors((defaultPipelineStages[option.id] || ["Novo Lead", "Contato", "Análise", "Aprovação", "Encerrado"]).length),
                updatedAt: new Date().toISOString()
              };

              const isEditing = editingId === option.id;

              return (
                <div key={option.id} className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] p-4">
                  {/* Header do Pipeline */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-[var(--text-primary)]">{setting.pipelineName}</h4>
                      <p className="text-sm text-[var(--text-muted)]">ID: {setting.pipelineId} | Code: {setting.pipelineCode}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        setting.active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                      }`}>
                        {setting.active ? 'Ativo' : 'Inativo'}
                      </span>
                      {!isEditing && (
                        <>
                          <button 
                            onClick={() => handleEdit(option.id)}
                            className="p-2 text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-surface-hover)] rounded-lg"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleToggleAtivo(option.id)}
                            className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg"
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
                      <p className="text-sm font-medium text-slate-300 mb-2">
                        Etapas ({setting.stages.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {setting.stages.map((stage, index) => {
                          const color = setting.stageColors[index] || createDefaultStageColors(setting.stages.length)[index];
                          return (
                          <div 
                            key={index}
                            className="px-3 py-1 rounded-full text-sm flex items-center gap-2 border"
                            style={{
                              backgroundColor: `${color}18`,
                              borderColor: `${color}55`,
                              color
                            }}
                          >
                            <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center text-white" style={{ backgroundColor: color }}>
                              {index + 1}
                            </span>
                            {stage}
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Modo Edição - Formulário */}
                  {isEditing && editForm && (
                    <div className="mt-4 space-y-4">
                      {/* Nome do Pipeline (apenas visual, não editável) */}
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                          Nome do Pipeline
                        </label>
                        <Input
                          value={editForm.pipelineName}
                          disabled
                          className="bg-[var(--bg-elevated)]"
                        />
                        <p className="text-xs text-slate-500 mt-1">
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
                        <label htmlFor={`active-${editForm.pipelineId}`} className="text-sm text-[var(--text-secondary)]">
                          Pipeline Ativo
                        </label>
                      </div>

                      {/* Etapas */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium text-[var(--text-secondary)]">
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
                                  ? 'border-primary bg-primary/10'
                                  : 'border-[var(--border-muted)] bg-[var(--bg-elevated)]'
                              }`}
                            >
                              <GripVertical size={16} className="text-slate-400 cursor-grab" />
                              <span className="w-6 h-6 rounded-full bg-gray-200 text-xs flex items-center justify-center text-slate-600">
                                {index + 1}
                              </span>
                              <Input
                                value={stage}
                                onChange={(e) => handleUpdateStageName(index, e.target.value)}
                                className="flex-1"
                              />
                              <label className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-secondary)]">
                                <span
                                  className="h-5 w-5 rounded-full border border-white/20"
                                  style={{ backgroundColor: editForm.stageColors[index] }}
                                />
                                <input
                                  type="color"
                                  value={editForm.stageColors[index] || createDefaultStageColors(editForm.stages.length)[index]}
                                  onChange={(e) => handleUpdateStageColor(index, e.target.value)}
                                  className="h-7 w-8 cursor-pointer border-0 bg-transparent p-0"
                                  aria-label={`Cor da etapa ${stage}`}
                                />
                              </label>
                              <button
                                onClick={() => handleRemoveStage(index)}
                                disabled={editForm.stages.length <= 1}
                                className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-30"
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
          <div className="mt-6 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] p-4">
            <h4 className="font-medium text-[var(--text-primary)] mb-2">Visão geral</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-[var(--text-muted)]">Total:</span>
                <span className="ml-2 font-medium">{displayedPipelines.length}</span>
              </div>
              <div>
                <span className="text-slate-500">Ativos:</span>
                <span className="ml-2 font-medium text-green-600">
                  {Object.values(pipelineSettings).filter(s => s.active).length}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Inativos:</span>
                <span className="ml-2 font-medium text-slate-600">
                  {Object.values(pipelineSettings).filter(s => !s.active).length}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Última Atualização:</span>
                <span className="ml-2 font-medium text-slate-600">
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

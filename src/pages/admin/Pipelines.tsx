// FINQZ PRO - Pipelines Page (Admin)
// Fase read-only baseada no contrato oficial de Pipeline/Stage

import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button, Input, Modal, TextArea, Toggle } from '../../components/ui';
import { pipelinesApi } from '../../api/modules/pipelines.api';
import {
  type Pipeline as OfficialPipeline,
  type AdminPipelineViewModel,
  type AdminPipelineDraft,
  buildCreatePipelinePayload,
  mapOfficialPipelinesToAdminViewModels,
} from './pipelines.adapter';

type PipelineApiEnvelope = {
  data?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const extractOfficialPipelines = (response: unknown): unknown[] => {
  if (Array.isArray(response)) return response;
  if (!isRecord(response)) return [];

  const data = response.data;
  if (Array.isArray(data)) return data;
  if (isRecord(data) && Array.isArray(data.data)) return data.data;

  return [];
};

const buildExportRows = (pipelines: AdminPipelineViewModel[]) =>
  pipelines.map((pipeline) => ({
    pipelineId: pipeline.pipelineId,
    pipelineName: pipeline.pipelineName,
    active: pipeline.active,
    isDefault: pipeline.isDefault,
    stageCount: pipeline.stages.length,
    updatedAt: pipeline.updatedAt ?? '',
  }));

export const PipelinesPage: React.FC = () => {
  const [pipelines, setPipelines] = useState<AdminPipelineViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<AdminPipelineDraft>({
    pipelineName: '',
    description: '',
    isDefault: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadPipelines = async () => {
    setLoading(true);
    setError(null);

    try {
      const response: PipelineApiEnvelope = await pipelinesApi.getAll();
      const officialPipelines = extractOfficialPipelines(response);
      const mapped = mapOfficialPipelinesToAdminViewModels(officialPipelines as OfficialPipeline[]);
      setPipelines(mapped);
    } catch (loadError) {
      console.error('[admin-pipelines] Falha ao carregar pipelines oficiais:', loadError);
      setPipelines([]);
      setError('Nao foi possivel carregar os pipelines oficiais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPipelines();
  }, []);

  const resetCreateForm = () => {
    setFormData({
      pipelineName: '',
      description: '',
      isDefault: false,
    });
    setSubmitError(null);
  };

  const openCreateModal = () => {
    setSubmitError(null);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (submitting) return;
    setShowCreateModal(false);
    resetCreateForm();
  };

  const handleCreatePipeline = async () => {
    const normalizedName = (formData.pipelineName ?? '').trim();

    if (!normalizedName) {
      setSubmitError('O nome do pipeline é obrigatório.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = buildCreatePipelinePayload({
        ...formData,
        pipelineName: normalizedName,
      });

      await pipelinesApi.createPipeline(payload);
      setShowCreateModal(false);
      resetCreateForm();
      await loadPipelines();
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Erro inesperado ao criar pipeline.';
      const lowered = message.toLowerCase();

      if (lowered.includes('validation') || lowered.includes('nome') || lowered.includes('required')) {
        setSubmitError(message || 'Falha de validação.');
      } else if (lowered.includes('forbidden') || lowered.includes('unauthorized') || lowered.includes('acesso')) {
        setSubmitError('Você não tem permissão para criar pipeline.');
      } else {
        setSubmitError(message || 'Erro inesperado ao criar pipeline.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const summary = useMemo(() => {
    const active = pipelines.filter((pipeline) => pipeline.active).length;
    const inactive = pipelines.filter((pipeline) => !pipeline.active).length;

    return {
      total: pipelines.length,
      active,
      inactive,
    };
  }, [pipelines]);

  const exportRows = useMemo(() => buildExportRows(pipelines), [pipelines]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipelines"
        onCreate={openCreateModal}
        createLabel="Novo Pipeline"
        onRefresh={loadPipelines}
        exportData={exportRows}
        exportColumns={[
          { key: 'pipelineName', label: 'Nome' },
          { key: 'pipelineId', label: 'ID' },
          { key: 'active', label: 'Ativo' },
          { key: 'isDefault', label: 'Padrão' },
          { key: 'stageCount', label: 'Etapas' },
        ]}
        exportFilename="pipelines"
        extra={
          <div className="flex items-center gap-2 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            <RefreshCw size={14} />
            Leitura oficial
          </div>
        }
      />

      <div className="finqz-card p-4 sm:p-5">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Pipelines cadastrados</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Exibindo apenas a leitura oficial do backend de Pipeline.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] px-3 py-2 text-xs text-[var(--text-secondary)]">
              <TrendingUp size={14} />
              {loading ? 'Carregando...' : `${summary.total} pipelines`}
            </div>
          </div>

          {loading && (
            <div className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] p-4 text-sm text-[var(--text-muted)]">
              Carregando pipelines oficiais...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-300">
              {error}
            </div>
          )}

          {!loading && !error && pipelines.length === 0 && (
            <div className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] p-8 text-center">
              <p className="text-sm font-medium text-[var(--text-primary)]">Nenhum pipeline oficial encontrado</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                O backend oficial respondeu com sucesso, mas nao retornou pipelines ativos.
              </p>
            </div>
          )}

          {!loading && !error && pipelines.length > 0 && (
            <div className="space-y-4">
              {pipelines.map((pipeline) => (
                <div
                  key={pipeline.pipelineId}
                  className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="truncate font-semibold text-[var(--text-primary)]">
                        {pipeline.pipelineName}
                      </h4>
                      <p className="text-sm text-[var(--text-muted)]">
                        ID: {pipeline.pipelineId} | Code: {pipeline.pipelineId}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          pipeline.active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                            : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                        }`}
                      >
                        {pipeline.active ? 'Ativo' : 'Inativo'}
                      </span>
                      {pipeline.isDefault && (
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          Padrão
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
                      Etapas ({pipeline.stages.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {pipeline.stages.map((stage, index) => {
                        const color = stage.color || pipeline.stageColors[index] || '#64748b';

                        return (
                          <div
                            key={stage.stageId}
                            className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
                            style={{
                              backgroundColor: `${color}18`,
                              borderColor: `${color}55`,
                              color,
                            }}
                          >
                            <span
                              className="flex h-5 w-5 items-center justify-center rounded-full text-xs text-white"
                              style={{ backgroundColor: color }}
                            >
                              {stage.order}
                            </span>
                            <span>{stage.name}</span>
                            {stage.isWon && (
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                                GANHO
                              </span>
                            )}
                            {stage.isLost && (
                              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                                PERDIDO
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] p-4">
            <h4 className="font-medium text-[var(--text-primary)] mb-2">Visão geral</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-[var(--text-muted)]">Total:</span>
                <span className="ml-2 font-medium">{summary.total}</span>
              </div>
              <div>
                <span className="text-slate-500">Ativos:</span>
                <span className="ml-2 font-medium text-green-600">{summary.active}</span>
              </div>
              <div>
                <span className="text-slate-500">Inativos:</span>
                <span className="ml-2 font-medium text-slate-600">{summary.inactive}</span>
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

      <Modal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        title="Novo Pipeline"
        size="md"
      >
        <div className="space-y-4">
          {submitError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
              {submitError}
            </div>
          )}

          <Input
            label="Nome"
            value={formData.pipelineName ?? ''}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, pipelineName: e.target.value }))
            }
            placeholder="Ex.: Pipeline Comercial"
            required
            disabled={submitting}
          />

          <TextArea
            label="Descrição"
            value={formData.description ?? ''}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Descrição opcional do pipeline"
            disabled={submitting}
          />

          <div className="flex items-center justify-between rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Pipeline padrão</p>
              <p className="text-xs text-[var(--text-muted)]">
                Marca este pipeline como padrão para o tenant atual.
              </p>
            </div>
            <Toggle
              checked={Boolean(formData.isDefault)}
              onChange={(checked) =>
                setFormData((prev) => ({ ...prev, isDefault: checked }))
              }
              disabled={submitting}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeCreateModal} disabled={submitting}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreatePipeline} disabled={submitting}>
              {submitting ? 'Criando...' : 'Criar Pipeline'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PipelinesPage;

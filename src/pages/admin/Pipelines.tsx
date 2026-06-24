// FINQZ PRO - Pipelines Page (Admin)
// Wave 1 do admin enterprise para update/inactivate de Pipeline via contrato oficial

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Pencil, RefreshCw, Trash2, TrendingUp } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button, Input, Modal, TextArea, Toggle } from '../../components/ui';
import { ApiException } from '../../api/http';
import { pipelinesApi } from '../../api/modules/pipelines.api';
import {
  type Pipeline as OfficialPipeline,
  type AdminPipelineViewModel,
  type AdminPipelineDraft,
  type AdminStageDraft,
  buildCreatePipelinePayload,
  buildUpdatePipelinePayload,
  buildCreateStagePayload,
  mapOfficialPipelinesToAdminViewModels,
} from './pipelines.adapter';

type PipelineApiEnvelope = {
  data?: unknown;
};

type ApiErrorLike = {
  status?: number;
  code?: string;
  message?: string;
  body?: unknown;
  responseBody?: unknown;
  details?: unknown;
};

type ApiExceptionWithBody = ApiException & {
  body?: unknown;
  responseBody?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isApiExceptionLike = (error: unknown): error is ApiExceptionWithBody | ApiErrorLike => (
  error instanceof ApiException ||
  (isRecord(error) && 'status' in error && typeof error.status === 'number')
);

const extractErrorBody = (error: unknown): unknown => {
  if (!isApiExceptionLike(error)) return undefined;
  if ('body' in error && error.body !== undefined) return error.body;
  if ('responseBody' in error && error.responseBody !== undefined) return error.responseBody;
  return undefined;
};

const extractErrorStatus = (error: unknown): number | undefined => {
  if (!isApiExceptionLike(error)) return undefined;
  return typeof error.status === 'number' ? error.status : undefined;
};

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  const body = extractErrorBody(error);
  if (isRecord(body)) {
    const nestedError = isRecord(body.error) ? body.error : null;
    const nestedMessage = nestedError && typeof nestedError.message === 'string' ? nestedError.message : null;
    if (nestedMessage) return nestedMessage;

    if (typeof body.message === 'string' && body.message.trim().length > 0) {
      return body.message;
    }

    if (typeof body.error === 'string' && body.error.trim().length > 0) {
      return body.error;
    }
  }

  return 'Erro inesperado.';
};

const getPipelineActionErrorMessage = (
  error: unknown,
  operation: 'create' | 'update' | 'delete',
): string => {
  const status = extractErrorStatus(error);
  const message = extractErrorMessage(error);

  if (status === 403) {
    if (operation === 'delete') {
      return 'Você não tem permissão para inativar pipeline.';
    }

    if (operation === 'create') {
      return 'Você não tem permissão para criar pipeline.';
    }

    return 'Você não tem permissão para editar pipeline.';
  }

  if (status === 409) {
    return operation === 'delete'
      ? 'Este pipeline possui oportunidades vinculadas e não pode ser inativado.'
      : 'Conflito de domínio ao salvar pipeline. Verifique se ele pode ser atualizado neste momento.';
  }

  if (status === 400 || status === 422) {
    return message || 'Falha de validação ao salvar pipeline.';
  }

  return operation === 'delete'
    ? 'Não foi possível inativar o pipeline.'
    : operation === 'create'
      ? 'Não foi possível criar o pipeline.'
      : 'Não foi possível salvar o pipeline.';
};

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<AdminPipelineViewModel | null>(null);
  const [editFormData, setEditFormData] = useState<AdminPipelineDraft>({
    pipelineName: '',
    description: '',
    isDefault: false,
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPipeline, setDeletingPipeline] = useState<AdminPipelineViewModel | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showCreateStageModal, setShowCreateStageModal] = useState(false);
  const [stageTargetPipeline, setStageTargetPipeline] = useState<{
    pipelineId: string;
    pipelineName: string;
  } | null>(null);
  const [stageFormData, setStageFormData] = useState<AdminStageDraft>({
    name: '',
    order: 1,
    isWon: false,
    isLost: false,
  });
  const [stageSubmitting, setStageSubmitting] = useState(false);
  const [stageSubmitError, setStageSubmitError] = useState<string | null>(null);

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
      setSubmitError(getPipelineActionErrorMessage(createError, 'create'));
    } finally {
      setSubmitting(false);
    }
  };

  const resetEditForm = () => {
    setEditingPipeline(null);
    setEditFormData({
      pipelineName: '',
      description: '',
      isDefault: false,
    });
    setEditError(null);
  };

  const openEditModal = (pipeline: AdminPipelineViewModel) => {
    setEditingPipeline(pipeline);
    setEditFormData({
      pipelineName: pipeline.pipelineName,
      description: pipeline.description ?? '',
      isDefault: pipeline.isDefault,
    });
    setEditError(null);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    if (editSubmitting) return;
    setShowEditModal(false);
    resetEditForm();
  };

  const handleUpdatePipeline = async () => {
    if (!editingPipeline) {
      setEditError('Pipeline selecionado nao encontrado.');
      return;
    }

    const normalizedName = (editFormData.pipelineName ?? '').trim();
    if (!normalizedName) {
      setEditError('O nome do pipeline é obrigatório.');
      return;
    }

    setEditSubmitting(true);
    setEditError(null);

    try {
      const payload = buildUpdatePipelinePayload({
        ...editFormData,
        pipelineName: normalizedName,
      });

      await pipelinesApi.updatePipeline(editingPipeline.pipelineId, payload);
      setShowEditModal(false);
      resetEditForm();
      await loadPipelines();
    } catch (updateError) {
      setEditError(getPipelineActionErrorMessage(updateError, 'update'));
    } finally {
      setEditSubmitting(false);
    }
  };

  const resetDeleteState = () => {
    setDeletingPipeline(null);
    setDeleteError(null);
  };

  const openDeleteModal = (pipeline: AdminPipelineViewModel) => {
    setDeletingPipeline(pipeline);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (deleteSubmitting) return;
    setShowDeleteModal(false);
    resetDeleteState();
  };

  const handleDeletePipeline = async () => {
    if (!deletingPipeline) {
      setDeleteError('Pipeline selecionado nao encontrado.');
      return;
    }

    setDeleteSubmitting(true);
    setDeleteError(null);

    try {
      await pipelinesApi.deletePipeline(deletingPipeline.pipelineId);
      setShowDeleteModal(false);
      resetDeleteState();
      await loadPipelines();
    } catch (deleteError) {
      setDeleteError(getPipelineActionErrorMessage(deleteError, 'delete'));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const resetCreateStageForm = () => {
    setStageFormData({
      name: '',
      order: 1,
      isWon: false,
      isLost: false,
    });
    setStageSubmitError(null);
    setStageTargetPipeline(null);
  };

  const openCreateStageModal = (pipeline: AdminPipelineViewModel) => {
    setStageTargetPipeline({
      pipelineId: pipeline.pipelineId,
      pipelineName: pipeline.pipelineName,
    });
    setStageFormData({
      name: '',
      order: pipeline.stages.length + 1,
      isWon: false,
      isLost: false,
    });
    setStageSubmitError(null);
    setShowCreateStageModal(true);
  };

  const closeCreateStageModal = () => {
    if (stageSubmitting) return;
    setShowCreateStageModal(false);
    resetCreateStageForm();
  };

  const handleCreateStage = async () => {
    if (!stageTargetPipeline) {
      setStageSubmitError('Pipeline de destino nao encontrado.');
      return;
    }

    const normalizedName = (stageFormData.name ?? '').trim();

    if (!normalizedName) {
      setStageSubmitError('O nome da etapa é obrigatório.');
      return;
    }

    const normalizedOrder = Number(stageFormData.order);
    if (!Number.isFinite(normalizedOrder) || normalizedOrder < 1) {
      setStageSubmitError('A ordem da etapa deve ser maior ou igual a 1.');
      return;
    }

    if (stageFormData.isWon && stageFormData.isLost) {
      setStageSubmitError('Uma etapa não pode ser ganho e perdido ao mesmo tempo.');
      return;
    }

    setStageSubmitting(true);
    setStageSubmitError(null);

    try {
      const payload = buildCreateStagePayload({
        ...stageFormData,
        name: normalizedName,
        order: normalizedOrder,
      });

      await pipelinesApi.createStage(stageTargetPipeline.pipelineId, payload);
      setShowCreateStageModal(false);
      resetCreateStageForm();
      await loadPipelines();
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Erro inesperado ao criar etapa.';
      const lowered = message.toLowerCase();

      if (lowered.includes('validation') || lowered.includes('nome') || lowered.includes('required') || lowered.includes('order')) {
        setStageSubmitError(message || 'Falha de validação.');
      } else if (lowered.includes('forbidden') || lowered.includes('unauthorized') || lowered.includes('acesso')) {
        setStageSubmitError('Você não tem permissão para criar etapa.');
      } else {
        setStageSubmitError(message || 'Erro inesperado ao criar etapa.');
      }
    } finally {
      setStageSubmitting(false);
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
                      <Button
                        variant="outline"
                        icon={<Pencil size={14} />}
                        onClick={() => openEditModal(pipeline)}
                        disabled={loading}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => openCreateStageModal(pipeline)}
                        disabled={loading}
                      >
                        Adicionar etapa
                      </Button>
                      <Button
                        variant="danger"
                        icon={<Trash2 size={14} />}
                        onClick={() => openDeleteModal(pipeline)}
                        disabled={loading || !pipeline.active}
                        title={pipeline.active ? 'Inativar pipeline' : 'Pipeline já está inativo'}
                      >
                        {pipeline.active ? 'Inativar' : 'Inativo'}
                      </Button>
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

      <Modal
        isOpen={showEditModal}
        onClose={closeEditModal}
        title="Editar Pipeline"
        size="md"
      >
        <div className="space-y-4">
          {editError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)]">Pipeline selecionado</p>
            <p className="mt-1">{editingPipeline?.pipelineName ?? 'Pipeline oficial'}</p>
          </div>

          <Input
            label="Nome"
            value={editFormData.pipelineName ?? ''}
            onChange={(e) =>
              setEditFormData((prev) => ({ ...prev, pipelineName: e.target.value }))
            }
            placeholder="Ex.: Pipeline Comercial"
            required
            disabled={editSubmitting}
          />

          <TextArea
            label="Descrição"
            value={editFormData.description ?? ''}
            onChange={(e) =>
              setEditFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Descrição opcional do pipeline"
            disabled={editSubmitting}
          />

          <div className="flex items-center justify-between rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Pipeline padrão</p>
              <p className="text-xs text-[var(--text-muted)]">
                Marca este pipeline como padrão para o tenant atual.
              </p>
            </div>
            <Toggle
              checked={Boolean(editFormData.isDefault)}
              onChange={(checked) =>
                setEditFormData((prev) => ({ ...prev, isDefault: checked }))
              }
              disabled={editSubmitting}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeEditModal} disabled={editSubmitting}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleUpdatePipeline} disabled={editSubmitting}>
              {editSubmitting ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        title="Inativar Pipeline"
        size="md"
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" size={18} />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Confirme a inativação de {deletingPipeline?.pipelineName ?? 'este pipeline'}.
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Esta ação usa a API oficial e pode ser bloqueada se houver oportunidades vinculadas.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)]">Efeito da ação</p>
            <p className="mt-1">
              O pipeline será marcado como inativo no backend e a lista oficial será recarregada em seguida.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeDeleteModal} disabled={deleteSubmitting}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeletePipeline} disabled={deleteSubmitting}>
              {deleteSubmitting ? 'Inativando...' : 'Confirmar inativação'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCreateStageModal}
        onClose={closeCreateStageModal}
        title="Nova Etapa"
        size="md"
      >
        <div className="space-y-4">
          {stageSubmitError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
              {stageSubmitError}
            </div>
          )}

          <div className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)]">Pipeline selecionado</p>
            <p className="mt-1">{stageTargetPipeline?.pipelineName ?? 'Pipeline oficial'}</p>
          </div>

          <Input
            label="Nome"
            value={stageFormData.name ?? ''}
            onChange={(e) =>
              setStageFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Ex.: Qualificação"
            required
            disabled={stageSubmitting}
          />

          <Input
            label="Ordem"
            type="number"
            min={1}
            value={stageFormData.order ?? 1}
            onChange={(e) =>
              setStageFormData((prev) => ({
                ...prev,
                order: Number(e.target.value),
              }))
            }
            disabled={stageSubmitting}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Etapa ganho</p>
                <p className="text-xs text-[var(--text-muted)]">Marca esta etapa como finalizada com sucesso.</p>
              </div>
              <Toggle
                checked={Boolean(stageFormData.isWon)}
                onChange={(checked) =>
                  setStageFormData((prev) => ({
                    ...prev,
                    isWon: checked,
                    isLost: checked ? false : prev.isLost,
                  }))
                }
                disabled={stageSubmitting}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Etapa perdida</p>
                <p className="text-xs text-[var(--text-muted)]">Marca esta etapa como encerramento perdido.</p>
              </div>
              <Toggle
                checked={Boolean(stageFormData.isLost)}
                onChange={(checked) =>
                  setStageFormData((prev) => ({
                    ...prev,
                    isLost: checked,
                    isWon: checked ? false : prev.isWon,
                  }))
                }
                disabled={stageSubmitting}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeCreateStageModal} disabled={stageSubmitting}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreateStage} disabled={stageSubmitting}>
              {stageSubmitting ? 'Criando...' : 'Criar Etapa'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PipelinesPage;

// FINQZ PRO - Pipelines Page (Admin)
// Wave 1 do admin enterprise para update/inactivate de Pipeline via contrato oficial

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, GripVertical, Pencil, RefreshCw, Trash2, TrendingUp } from 'lucide-react';
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCenter, type DragEndEvent, type DragStartEvent, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge, Button, Input, Modal, TextArea, Toggle } from '../../components/ui';
import { ApiException } from '../../api/http';
import { pipelinesApi } from '../../api/modules/pipelines.api';
import {
  type Pipeline as OfficialPipeline,
  type AdminPipelineViewModel,
  type AdminPipelineDraft,
  type AdminStageDraft,
  buildCreatePipelinePayload,
  buildReorderStagesPayload,
  buildUpdatePipelinePayload,
  buildCreateStagePayload,
  buildUpdateStagePayload,
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

const extractSafeErrorMessage = (error: unknown): string | undefined => {
  if (error instanceof ApiException && error.message.trim().length > 0) {
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

  return undefined;
};

const getStageActionErrorMessage = (error: unknown): string => {
  const status = extractErrorStatus(error);
  const message = extractSafeErrorMessage(error);

  if (status === 403) {
    return 'Você não tem permissão para arquivar etapa.';
  }

  if (status === 409) {
    return message || 'Não foi possível arquivar a etapa.';
  }

  if (status === 400 || status === 422) {
    return message || 'Falha de validação ao arquivar etapa.';
  }

  return message || 'Não foi possível arquivar a etapa.';
};

export const getPipelineActionErrorMessage = (
  error: unknown,
  operation: 'create' | 'update' | 'inactivate' | 'reactivate' | 'archive',
): string => {
  const status = extractErrorStatus(error);
  const message = extractSafeErrorMessage(error);

  if (status === 403) {
    if (operation === 'archive') {
      return 'Você não tem permissão para arquivar pipeline.';
    }

    if (operation === 'inactivate' || operation === 'reactivate') {
      return 'Você não tem permissão para alterar o status do pipeline.';
    }

    if (operation === 'create') {
      return 'Você não tem permissão para criar pipeline.';
    }

    return 'Você não tem permissão para editar pipeline.';
  }

  if (status === 409) {
    return message || (
      operation === 'archive'
        ? 'Não foi possível arquivar o pipeline.'
        : 'Não foi possível alterar o status do pipeline.'
    );
  }

  if (status === 400 || status === 422) {
    return message || (
      operation === 'create'
        ? 'Falha de validação ao criar pipeline.'
        : operation === 'archive'
          ? 'Falha de validação ao arquivar pipeline.'
          : 'Falha de validação ao salvar pipeline.'
    );
  }

  if (message) {
    return message;
  }

  return operation === 'archive'
    ? 'Não foi possível arquivar o pipeline.'
    : operation === 'inactivate' || operation === 'reactivate'
      ? 'Não foi possível alterar o status do pipeline.'
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

const cloneStages = (
  stages: AdminPipelineViewModel['stages'],
): AdminPipelineViewModel['stages'] => stages.map((stage) => ({ ...stage }));

const normalizeReorderDraftStages = (
  stages: AdminPipelineViewModel['stages'],
): AdminPipelineViewModel['stages'] =>
  stages.map((stage, index) => ({
    ...stage,
    order: index + 1,
  }));

const areStageOrdersEqual = (
  left: AdminPipelineViewModel['stages'],
  right: AdminPipelineViewModel['stages'],
): boolean => left.length === right.length && left.every((stage, index) => stage.stageId === right[index]?.stageId);

const getReorderStagesErrorMessage = (error: unknown): string => {
  const status = extractErrorStatus(error);
  const message = extractSafeErrorMessage(error);

  if (status === 403) {
    return 'Você não tem permissão para reordenar etapas.';
  }

  if (status === 409) {
    return message || 'Não foi possível reordenar as etapas.';
  }

  if (status === 400 || status === 422) {
    return message || 'Falha de validação ao reordenar etapas.';
  }

  return message || 'Não foi possível reordenar as etapas.';
};

type SortableStageRowProps = {
  stage: AdminPipelineViewModel['stages'][number];
  color: string;
  index: number;
  total: number;
  reorderSubmitting: boolean;
  onMoveStage: (stageId: string, direction: -1 | 1) => void;
  isDragging?: boolean;
  dragOverlay?: boolean;
  handleAttributes?: Record<string, unknown>;
  handleListeners?: Record<string, unknown>;
};

const StageRowCard: React.FC<SortableStageRowProps> = ({
  stage,
  color,
  index,
  total,
  reorderSubmitting,
  onMoveStage,
  isDragging = false,
  dragOverlay = false,
  handleAttributes,
  handleListeners,
}) => {
  return (
    <div
      data-testid={`reorder-stage-row-${stage.stageId}`}
      className={`group flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-all duration-200 ease-out motion-reduce:transition-none ${
        dragOverlay
          ? 'cursor-grabbing scale-[1.02] shadow-[0_18px_40px_-12px_rgba(15,23,42,0.28)] ring-2 ring-primary/20'
          : isDragging
            ? 'cursor-grabbing scale-[1.01] opacity-60 shadow-lg ring-2 ring-primary/30'
            : 'cursor-grab shadow-sm hover:shadow-md'
      }`}
      style={{
        transform: dragOverlay ? 'scale(1.02)' : undefined,
        opacity: dragOverlay ? 0.98 : undefined,
        pointerEvents: dragOverlay ? 'none' : undefined,
        backgroundColor: `${color}14`,
        borderColor: `${color}55`,
        color,
      }}
    >
      {handleAttributes && handleListeners ? (
        <button
          type="button"
          className="inline-flex h-9 w-9 cursor-grab items-center justify-center rounded-full border border-current/20 bg-white/20 text-current shadow-sm transition duration-200 hover:bg-white/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30 active:cursor-grabbing"
          aria-label={`Arrastar etapa ${stage.name}`}
          title={`Arrastar etapa ${stage.name}`}
          disabled={reorderSubmitting}
          {...handleAttributes}
          {...handleListeners}
        >
          <GripVertical size={16} aria-hidden="true" />
        </button>
      ) : (
        <div
          aria-hidden="true"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-current/20 bg-white/20 text-current shadow-sm"
        >
          <GripVertical size={16} aria-hidden="true" />
        </div>
      )}

      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs text-white"
        style={{ backgroundColor: color }}
      >
        {stage.order}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{stage.name}</span>
          <Badge
            variant={stage.isActive ? 'success' : 'warning'}
            size="sm"
            className="uppercase tracking-wide"
          >
            {stage.isActive ? 'Ativa' : 'Inativa'}
          </Badge>
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
        <p className="text-xs text-[var(--text-muted)]">
          {index + 1} de {total}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 opacity-80 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="border-transparent bg-transparent px-2 text-[11px] font-medium text-[var(--text-secondary)] opacity-75 hover:opacity-100 focus-visible:opacity-100"
          onClick={() => onMoveStage(stage.stageId, -1)}
          disabled={index === 0 || reorderSubmitting}
          aria-label={`Mover etapa ${stage.name} para cima`}
        >
          Subir
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="border-transparent bg-transparent px-2 text-[11px] font-medium text-[var(--text-secondary)] opacity-75 hover:opacity-100 focus-visible:opacity-100"
          onClick={() => onMoveStage(stage.stageId, 1)}
          disabled={index === total - 1 || reorderSubmitting}
          aria-label={`Mover etapa ${stage.name} para baixo`}
        >
          Descer
        </Button>
      </div>
    </div>
  );
};

const SortableStageRow: React.FC<SortableStageRowProps> = (props) => {
  const {
    stage,
    reorderSubmitting,
  } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.stageId, disabled: reorderSubmitting });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition
          ? `${transition}, box-shadow 180ms ease, opacity 180ms ease, border-color 180ms ease, background-color 180ms ease`
          : 'box-shadow 180ms ease, opacity 180ms ease, border-color 180ms ease, background-color 180ms ease',
      }}
    >
      <StageRowCard
        {...props}
        isDragging={isDragging}
        handleAttributes={attributes}
        handleListeners={listeners}
      />
    </div>
  );
};

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
  const [showLifecycleModal, setShowLifecycleModal] = useState(false);
  const [lifecycleAction, setLifecycleAction] = useState<'inactivate' | 'reactivate' | null>(null);
  const [lifecyclePipeline, setLifecyclePipeline] = useState<AdminPipelineViewModel | null>(null);
  const [lifecycleSubmitting, setLifecycleSubmitting] = useState(false);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archivingPipeline, setArchivingPipeline] = useState<AdminPipelineViewModel | null>(null);
  const [archiveSubmitting, setArchiveSubmitting] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
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
  const [showEditStageModal, setShowEditStageModal] = useState(false);
  const [editingStage, setEditingStage] = useState<{
    pipelineId: string;
    pipelineName: string;
    stageId: string;
    stageName: string;
  } | null>(null);
  const [editStageFormData, setEditStageFormData] = useState<AdminStageDraft>({
    name: '',
    order: 1,
    isWon: false,
    isLost: false,
    isActive: true,
  });
  const [editStageSubmitting, setEditStageSubmitting] = useState(false);
  const [editStageSubmitError, setEditStageSubmitError] = useState<string | null>(null);
  const [showArchiveStageModal, setShowArchiveStageModal] = useState(false);
  const [archivingStage, setArchivingStage] = useState<{
    pipelineId: string;
    pipelineName: string;
    stageId: string;
    stageName: string;
  } | null>(null);
  const [archiveStageSubmitting, setArchiveStageSubmitting] = useState(false);
  const [archiveStageError, setArchiveStageError] = useState<string | null>(null);
  const [reorderPipelineId, setReorderPipelineId] = useState<string | null>(null);
  const [reorderDraftStages, setReorderDraftStages] = useState<AdminPipelineViewModel['stages']>([]);
  const [reorderSnapshotStages, setReorderSnapshotStages] = useState<AdminPipelineViewModel['stages']>([]);
  const [reorderSubmitting, setReorderSubmitting] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [activeReorderStageId, setActiveReorderStageId] = useState<string | null>(null);
  const reorderSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const loadPipelines = async () => {
    setLoading(true);
    setError(null);

    try {
      const response: PipelineApiEnvelope = await pipelinesApi.getAll({ includeInactive: true });
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

  const openLifecycleModal = (
    pipeline: AdminPipelineViewModel,
    action: 'inactivate' | 'reactivate',
  ) => {
    setLifecyclePipeline(pipeline);
    setLifecycleAction(action);
    setLifecycleError(null);
    setShowLifecycleModal(true);
  };

  const closeLifecycleModal = () => {
    if (lifecycleSubmitting) return;
    setShowLifecycleModal(false);
    setLifecyclePipeline(null);
    setLifecycleAction(null);
    setLifecycleError(null);
  };

  const handleLifecycleUpdate = async () => {
    if (!lifecyclePipeline || !lifecycleAction) {
      setLifecycleError('Pipeline selecionado nao encontrado.');
      return;
    }

    setLifecycleSubmitting(true);
    setLifecycleError(null);

    try {
      await pipelinesApi.updatePipeline(
        lifecyclePipeline.pipelineId,
        {
          isActive: lifecycleAction === 'inactivate' ? false : true,
        } as any,
      );

      setShowLifecycleModal(false);
      setLifecyclePipeline(null);
      setLifecycleAction(null);
      await loadPipelines();
    } catch (actionError) {
      setLifecycleError(
        getPipelineActionErrorMessage(
          actionError,
          lifecycleAction,
        ),
      );
    } finally {
      setLifecycleSubmitting(false);
    }
  };

  const openArchiveModal = (pipeline: AdminPipelineViewModel) => {
    setArchivingPipeline(pipeline);
    setArchiveError(null);
    setShowArchiveModal(true);
  };

  const closeArchiveModal = () => {
    if (archiveSubmitting) return;
    setShowArchiveModal(false);
    setArchivingPipeline(null);
    setArchiveError(null);
  };

  const handleArchivePipeline = async () => {
    if (!archivingPipeline) {
      setArchiveError('Pipeline selecionado nao encontrado.');
      return;
    }

    setArchiveSubmitting(true);
    setArchiveError(null);

    try {
      await pipelinesApi.deletePipeline(archivingPipeline.pipelineId);
      setShowArchiveModal(false);
      setArchivingPipeline(null);
      await loadPipelines();
    } catch (deleteError) {
      setArchiveError(getPipelineActionErrorMessage(deleteError, 'archive'));
    } finally {
      setArchiveSubmitting(false);
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

  const resetEditStageForm = () => {
    setEditingStage(null);
    setEditStageFormData({
      name: '',
      order: 1,
      isWon: false,
      isLost: false,
      isActive: true,
    });
    setEditStageSubmitError(null);
  };

  const openEditStageModal = (
    pipeline: AdminPipelineViewModel,
    stage: AdminPipelineViewModel['stages'][number],
  ) => {
    setEditingStage({
      pipelineId: pipeline.pipelineId,
      pipelineName: pipeline.pipelineName,
      stageId: stage.stageId,
      stageName: stage.name,
    });
    setEditStageFormData({
      name: stage.name,
      order: stage.order,
      isWon: stage.isWon,
      isLost: stage.isLost,
      isActive: stage.isActive,
    });
    setEditStageSubmitError(null);
    setShowEditStageModal(true);
  };

  const closeEditStageModal = () => {
    if (editStageSubmitting) return;
    setShowEditStageModal(false);
    resetEditStageForm();
  };

  const handleUpdateStage = async () => {
    if (!editingStage) {
      setEditStageSubmitError('Etapa selecionada nao encontrada.');
      return;
    }

    const normalizedName = (editStageFormData.name ?? '').trim();
    if (!normalizedName) {
      setEditStageSubmitError('O nome da etapa é obrigatório.');
      return;
    }

    const normalizedOrder = Number(editStageFormData.order);
    if (!Number.isFinite(normalizedOrder) || normalizedOrder < 1) {
      setEditStageSubmitError('A ordem da etapa deve ser maior ou igual a 1.');
      return;
    }

    if (editStageFormData.isWon && editStageFormData.isLost) {
      setEditStageSubmitError('Uma etapa não pode ser ganho e perdido ao mesmo tempo.');
      return;
    }

    setEditStageSubmitting(true);
    setEditStageSubmitError(null);

    try {
      const payload = buildUpdateStagePayload({
        ...editStageFormData,
        name: normalizedName,
        order: normalizedOrder,
        isActive: editStageFormData.isActive,
      });

      await pipelinesApi.updateStage(editingStage.stageId, payload);
      setShowEditStageModal(false);
      resetEditStageForm();
      await loadPipelines();
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Erro inesperado ao atualizar etapa.';
      const lowered = message.toLowerCase();

      if (lowered.includes('validation') || lowered.includes('nome') || lowered.includes('required') || lowered.includes('order')) {
        setEditStageSubmitError(message || 'Falha de validação.');
      } else if (lowered.includes('forbidden') || lowered.includes('unauthorized') || lowered.includes('acesso')) {
        setEditStageSubmitError('Você não tem permissão para editar etapa.');
      } else {
        setEditStageSubmitError(message || 'Erro inesperado ao atualizar etapa.');
      }
    } finally {
      setEditStageSubmitting(false);
    }
  };

  const openArchiveStageModal = (
    pipeline: AdminPipelineViewModel,
    stage: AdminPipelineViewModel['stages'][number],
  ) => {
    setArchivingStage({
      pipelineId: pipeline.pipelineId,
      pipelineName: pipeline.pipelineName,
      stageId: stage.stageId,
      stageName: stage.name,
    });
    setArchiveStageError(null);
    setShowArchiveStageModal(true);
  };

  const closeArchiveStageModal = () => {
    if (archiveStageSubmitting) return;
    setShowArchiveStageModal(false);
    setArchivingStage(null);
    setArchiveStageError(null);
  };

  const handleArchiveStage = async () => {
    if (!archivingStage) {
      setArchiveStageError('Etapa selecionada nao encontrada.');
      return;
    }

    setArchiveStageSubmitting(true);
    setArchiveStageError(null);

    try {
      await pipelinesApi.deleteStage(archivingStage.stageId);
      setShowArchiveStageModal(false);
      setArchivingStage(null);
      await loadPipelines();
    } catch (archiveError) {
      setArchiveStageError(getStageActionErrorMessage(archiveError));
    } finally {
      setArchiveStageSubmitting(false);
    }
  };

  const closeReorderMode = () => {
    if (reorderSubmitting) return;
    setReorderPipelineId(null);
    setReorderDraftStages([]);
    setReorderSnapshotStages([]);
    setReorderError(null);
    setActiveReorderStageId(null);
  };

  const openReorderMode = (pipeline: AdminPipelineViewModel) => {
    if (reorderSubmitting) return;

    setReorderPipelineId(pipeline.pipelineId);
    setReorderSnapshotStages(cloneStages(pipeline.stages));
    setReorderDraftStages(normalizeReorderDraftStages(cloneStages(pipeline.stages)));
    setReorderError(null);
    setActiveReorderStageId(null);
  };

  const moveReorderStage = (stageId: string, direction: -1 | 1) => {
    if (!reorderPipelineId || reorderSubmitting) return;

    setReorderDraftStages((currentStages) => {
      const currentIndex = currentStages.findIndex((stage) => stage.stageId === stageId);
      const targetIndex = currentIndex + direction;

      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= currentStages.length) {
        return currentStages;
      }

      const nextStages = [...currentStages];
      const [movedStage] = nextStages.splice(currentIndex, 1);
      nextStages.splice(targetIndex, 0, movedStage);

      return normalizeReorderDraftStages(nextStages);
    });
  };

  const cancelReorderChanges = () => {
    if (reorderSubmitting) return;
    closeReorderMode();
  };

  const saveReorderChanges = async () => {
    if (!reorderPipelineId) {
      setReorderError('Pipeline selecionado nao encontrado.');
      return;
    }

    const targetPipeline = pipelines.find((pipeline) => pipeline.pipelineId === reorderPipelineId);
    if (!targetPipeline) {
      setReorderError('Pipeline selecionado nao encontrado.');
      return;
    }

    setReorderSubmitting(true);
    setReorderError(null);

    try {
      const payload = buildReorderStagesPayload(
        normalizeReorderDraftStages(cloneStages(reorderDraftStages)).map((stage) => ({
          stageId: stage.stageId,
          order: stage.order,
        })),
      );

      await pipelinesApi.reorderStages(targetPipeline.pipelineId, payload);
      setReorderPipelineId(null);
      setReorderDraftStages([]);
      setReorderSnapshotStages([]);
      await loadPipelines();
    } catch (saveError) {
      setReorderError(getReorderStagesErrorMessage(saveError));
    } finally {
      setReorderSubmitting(false);
    }
  };

  const handleReorderDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || reorderSubmitting) {
      setActiveReorderStageId(null);
      return;
    }

    setReorderDraftStages((currentStages) => {
      const oldIndex = currentStages.findIndex((stage) => stage.stageId === active.id);
      const newIndex = currentStages.findIndex((stage) => stage.stageId === over.id);

      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
        return currentStages;
      }

      return normalizeReorderDraftStages(
        arrayMove(currentStages, oldIndex, newIndex),
      );
    });
    setActiveReorderStageId(null);
  };

  const handleReorderDragStart = (event: DragStartEvent) => {
    setActiveReorderStageId(String(event.active.id));
  };

  const handleReorderDragCancel = () => {
    setActiveReorderStageId(null);
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
  const isAnyReorderActive = reorderPipelineId !== null;
  const activeReorderStage = activeReorderStageId
    ? reorderDraftStages.find((stage) => stage.stageId === activeReorderStageId) ?? null
    : null;

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
              {pipelines.map((pipeline) => {
                const isReorderingPipeline = reorderPipelineId === pipeline.pipelineId;
                const visibleStages = isReorderingPipeline ? reorderDraftStages : pipeline.stages;
                const hasPendingReorder = isReorderingPipeline &&
                  !areStageOrdersEqual(reorderDraftStages, reorderSnapshotStages);

                return (
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
                        {isReorderingPipeline ? (
                          <>
                            <Button
                              variant="primary"
                              onClick={saveReorderChanges}
                              disabled={reorderSubmitting || !hasPendingReorder}
                            >
                              {reorderSubmitting ? 'Salvando...' : 'Salvar ordem'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={cancelReorderChanges}
                              disabled={reorderSubmitting}
                            >
                              Cancelar
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => openReorderMode(pipeline)}
                            disabled={loading || pipeline.stages.length < 2 || isAnyReorderActive}
                          >
                            Reordenar etapas
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          icon={<Pencil size={14} />}
                          onClick={() => openEditModal(pipeline)}
                          disabled={loading || isAnyReorderActive}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => openCreateStageModal(pipeline)}
                          disabled={loading || isAnyReorderActive}
                        >
                          Adicionar etapa
                        </Button>
                        <Button
                          variant={pipeline.active ? 'outline' : 'primary'}
                          icon={pipeline.active ? <Trash2 size={14} /> : <RefreshCw size={14} />}
                          onClick={() =>
                            openLifecycleModal(
                              pipeline,
                              pipeline.active ? 'inactivate' : 'reactivate',
                            )
                          }
                          disabled={loading || isAnyReorderActive}
                          title={pipeline.active ? 'Inativar pipeline' : 'Reativar pipeline'}
                        >
                          {pipeline.active ? 'Inativar' : 'Reativar'}
                        </Button>
                        <Button
                          variant="danger"
                          icon={<Trash2 size={14} />}
                          onClick={() => openArchiveModal(pipeline)}
                          disabled={loading || isAnyReorderActive}
                          title="Arquivar pipeline"
                        >
                          Arquivar
                        </Button>
                      </div>
                    </div>

                    {isReorderingPipeline && (
                      <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-[var(--text-secondary)]">
                        <p className="font-medium text-[var(--text-primary)]">
                          Reordenação local ativa
                        </p>
                        <p className="mt-1">
                          Ajuste a ordem com os controles da lista. Salvar envia a lista completa ao backend.
                          Cancelar restaura a ordem original.
                        </p>
                        {reorderError && (
                          <div className="mt-3 rounded-md border border-red-500/20 bg-red-500/10 p-2 text-sm text-red-600 dark:text-red-300">
                            {reorderError}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-4">
                      <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
                        Etapas ({visibleStages.length}){hasPendingReorder ? ' - alterações pendentes' : ''}:
                      </p>
                      {isReorderingPipeline ? (
                        <DndContext
                          sensors={reorderSensors}
                          collisionDetection={closestCenter}
                          onDragStart={handleReorderDragStart}
                          onDragEnd={handleReorderDragEnd}
                          onDragCancel={handleReorderDragCancel}
                        >
                          <SortableContext
                            items={visibleStages.map((stage) => stage.stageId)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-2">
                              {visibleStages.map((stage, index) => {
                                const color = stage.color || pipeline.stageColors[index] || '#64748b';

                                return (
                                  <SortableStageRow
                                    key={stage.stageId}
                                    stage={stage}
                                    color={color}
                                    index={index}
                                    total={visibleStages.length}
                                    reorderSubmitting={reorderSubmitting}
                                    onMoveStage={moveReorderStage}
                                    isDragging={activeReorderStageId === stage.stageId}
                                  />
                                );
                              })}
                            </div>
                          </SortableContext>
                          <DragOverlay>
                            {activeReorderStage ? (
                              <StageRowCard
                                stage={activeReorderStage}
                                color={
                                  activeReorderStage.color ||
                                  pipeline.stageColors[
                                    reorderDraftStages.findIndex(
                                      (stage) => stage.stageId === activeReorderStage.stageId,
                                    )
                                  ] ||
                                  '#64748b'
                                }
                                index={
                                  reorderDraftStages.findIndex(
                                    (stage) => stage.stageId === activeReorderStage.stageId,
                                  )
                                }
                                total={visibleStages.length}
                                reorderSubmitting={reorderSubmitting}
                                onMoveStage={moveReorderStage}
                                dragOverlay
                              />
                            ) : null}
                          </DragOverlay>
                        </DndContext>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {visibleStages.map((stage, index) => {
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
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  icon={<Pencil size={12} />}
                                  onClick={() => openEditStageModal(pipeline, stage)}
                                  title={`Editar etapa ${stage.name}`}
                                  aria-label={`Editar etapa ${stage.name}`}
                                  disabled={isAnyReorderActive}
                                >
                                  Editar
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  icon={<Trash2 size={12} />}
                                  onClick={() => openArchiveStageModal(pipeline, stage)}
                                  title={`Arquivar etapa ${stage.name}`}
                                  aria-label={`Arquivar etapa ${stage.name}`}
                                  disabled={isAnyReorderActive}
                                >
                                  Arquivar
                                </Button>
                                <Badge
                                  variant={stage.isActive ? 'success' : 'warning'}
                                  size="sm"
                                  className="uppercase tracking-wide"
                                >
                                  {stage.isActive ? 'Ativa' : 'Inativa'}
                                </Badge>
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
                      )}
                    </div>
                  </div>
                );
              })}
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
        isOpen={showLifecycleModal}
        onClose={closeLifecycleModal}
        title={lifecycleAction === 'reactivate' ? 'Reativar Pipeline' : 'Inativar Pipeline'}
        size="md"
      >
        <div className="space-y-4">
          {lifecycleError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{lifecycleError}</span>
            </div>
          )}

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" size={18} />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {lifecycleAction === 'reactivate'
                    ? `Confirme a reativação de ${lifecyclePipeline?.pipelineName ?? 'este pipeline'}.`
                    : `Confirme a inativação de ${lifecyclePipeline?.pipelineName ?? 'este pipeline'}.`}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {lifecycleAction === 'reactivate'
                    ? 'Esta ação vai definir isActive=true no backend e recarregar a lista oficial.'
                    : 'Esta ação vai definir isActive=false no backend e recarregar a lista oficial.'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)]">Efeito da ação</p>
            <p className="mt-1">
              {lifecycleAction === 'reactivate'
                ? 'O pipeline voltará a ficar ativo no backend após confirmação.'
                : 'O pipeline deixará de ficar ativo no backend após confirmação.'}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeLifecycleModal} disabled={lifecycleSubmitting}>
              Cancelar
            </Button>
            <Button variant={lifecycleAction === 'reactivate' ? 'primary' : 'danger'} onClick={handleLifecycleUpdate} disabled={lifecycleSubmitting}>
              {lifecycleSubmitting
                ? lifecycleAction === 'reactivate'
                  ? 'Reativando...'
                  : 'Inativando...'
                : lifecycleAction === 'reactivate'
                  ? 'Confirmar reativação'
                  : 'Confirmar inativação'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showArchiveModal}
        onClose={closeArchiveModal}
        title="Arquivar Pipeline"
        size="md"
      >
        <div className="space-y-4">
          {archiveError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{archiveError}</span>
            </div>
          )}

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" size={18} />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Confirme o arquivamento de {archivingPipeline?.pipelineName ?? 'este pipeline'}.
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Esta ação usa DELETE e pode ser bloqueada pelo backend conforme as regras de domínio.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)]">Efeito da ação</p>
            <p className="mt-1">
              O pipeline será arquivado no backend e a lista oficial será recarregada em seguida.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeArchiveModal} disabled={archiveSubmitting}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleArchivePipeline} disabled={archiveSubmitting}>
              {archiveSubmitting ? 'Arquivando...' : 'Confirmar arquivamento'}
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

      <Modal
        isOpen={showEditStageModal}
        onClose={closeEditStageModal}
        title="Editar Etapa"
        size="md"
      >
        <div className="space-y-4">
          {editStageSubmitError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
              {editStageSubmitError}
            </div>
          )}

          <div className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)]">Pipeline selecionado</p>
            <p className="mt-1">{editingStage?.pipelineName ?? 'Pipeline oficial'}</p>
            <p className="mt-2 font-medium text-[var(--text-primary)]">Etapa selecionada</p>
            <p className="mt-1">{editingStage?.stageName ?? 'Etapa oficial'}</p>
          </div>

          <Input
            label="Nome"
            value={editStageFormData.name ?? ''}
            onChange={(e) =>
              setEditStageFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Ex.: Qualificação"
            required
            disabled={editStageSubmitting}
          />

          <Input
            label="Ordem"
            type="number"
            min={1}
            value={editStageFormData.order ?? 1}
            onChange={(e) =>
              setEditStageFormData((prev) => ({
                ...prev,
                order: Number(e.target.value),
              }))
            }
            disabled={editStageSubmitting}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Etapa ganho</p>
                <p className="text-xs text-[var(--text-muted)]">Marca esta etapa como finalizada com sucesso.</p>
              </div>
              <Toggle
                checked={Boolean(editStageFormData.isWon)}
                onChange={(checked) =>
                  setEditStageFormData((prev) => ({
                    ...prev,
                    isWon: checked,
                    isLost: checked ? false : prev.isLost,
                  }))
                }
                disabled={editStageSubmitting}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Etapa perdida</p>
                <p className="text-xs text-[var(--text-muted)]">Marca esta etapa como encerramento perdido.</p>
              </div>
              <Toggle
                checked={Boolean(editStageFormData.isLost)}
                onChange={(checked) =>
                  setEditStageFormData((prev) => ({
                    ...prev,
                    isLost: checked,
                    isWon: checked ? false : prev.isWon,
                  }))
                }
                disabled={editStageSubmitting}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] px-4 py-3 sm:col-span-2">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Status da etapa</p>
                <p className="text-xs text-[var(--text-muted)]">Ativa ou inativa no backend.</p>
              </div>
              <Toggle
                checked={Boolean(editStageFormData.isActive)}
                onChange={(checked) =>
                  setEditStageFormData((prev) => ({
                    ...prev,
                    isActive: checked,
                  }))
                }
                disabled={editStageSubmitting}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeEditStageModal} disabled={editStageSubmitting}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleUpdateStage} disabled={editStageSubmitting}>
              {editStageSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showArchiveStageModal}
        onClose={closeArchiveStageModal}
        title="Arquivar Etapa"
        size="md"
      >
        <div className="space-y-4">
          {archiveStageError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
              {archiveStageError}
            </div>
          )}

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" size={18} />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Arquivar esta etapa?
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Esta operação removerá a etapa do fluxo operacional.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-soft)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)]">Etapa selecionada</p>
            <p className="mt-1">{archivingStage?.stageName ?? 'Etapa oficial'}</p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Caso existam Opportunities vinculadas ou esta seja a última Stage ativa, a operação será bloqueada pelo backend.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeArchiveStageModal} disabled={archiveStageSubmitting}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleArchiveStage} disabled={archiveStageSubmitting}>
              {archiveStageSubmitting ? 'Arquivando...' : 'Confirmar arquivamento'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PipelinesPage;

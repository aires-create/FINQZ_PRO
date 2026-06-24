import type {
  CreatePipelinePayload,
  CreateStagePayload,
  Pipeline as OfficialPipeline,
  PipelineStage as OfficialStage,
  ReorderStagesPayload,
  UpdatePipelinePayload,
  UpdateStagePayload,
} from '../../api/modules/pipelines.api';

const ADMIN_STAGE_COLORS = [
  '#2563eb',
  '#0ea5e9',
  '#7c3aed',
  '#f59e0b',
  '#f97316',
  '#10b981',
  '#14b8a6',
  '#64748b',
  '#ef4444',
];

export interface AdminPipelineStageViewModel {
  stageId: string;
  pipelineId: string;
  name: string;
  order: number;
  isWon: boolean;
  isLost: boolean;
  color: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminPipelineViewModel {
  pipelineId: string;
  pipelineName: string;
  description?: string | null;
  active: boolean;
  isDefault: boolean;
  stages: AdminPipelineStageViewModel[];
  stageColors: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminPipelineDraft {
  pipelineName?: string;
  description?: string | null;
  active?: boolean;
  isDefault?: boolean;
  stages?: AdminPipelineStageViewModel[];
  stageColors?: string[];
}

export interface AdminStageDraft {
  name?: string;
  order?: number;
  isWon?: boolean;
  isLost?: boolean;
}

const trimText = (value: string): string => value.trim();

const trimOptionalText = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined || value === null) return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeNullableText = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizePipelineStages = (stages: OfficialStage[] | undefined): OfficialStage[] => {
  if (!Array.isArray(stages)) return [];

  return [...stages].sort((left, right) => {
    if (left.order !== right.order) return left.order - right.order;
    return left.name.localeCompare(right.name, 'pt-BR');
  });
};

const pickColor = (index: number): string =>
  ADMIN_STAGE_COLORS[index % ADMIN_STAGE_COLORS.length];

const normalizeColor = (value: string | undefined, fallback: string): string => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

export const resolveAdminStageColors = (
  stages: Array<{ stageId?: string; order: number; name: string }>,
  existingColors?: string[],
): string[] => {
  const sortedStages = [...stages].sort((left, right) => {
    if (left.order !== right.order) return left.order - right.order;
    return left.name.localeCompare(right.name, 'pt-BR');
  });

  return sortedStages.map((stage, index) =>
    normalizeColor(existingColors?.[index], pickColor(index)),
  );
};

export const mapOfficialStageToAdminViewModel = (
  stage: OfficialStage,
  color?: string,
): AdminPipelineStageViewModel => ({
  stageId: stage.id,
  pipelineId: stage.pipelineId,
  name: trimText(stage.name),
  order: stage.order,
  isWon: stage.isWon,
  isLost: stage.isLost,
  color: normalizeColor(color, pickColor(stage.order - 1 >= 0 ? stage.order - 1 : 0)),
  createdAt: stage.createdAt,
  updatedAt: stage.updatedAt,
});

export const mapOfficialStagesToAdminViewModels = (
  stages: OfficialStage[] | undefined,
  existingColors?: string[],
): AdminPipelineStageViewModel[] => {
  const normalizedStages = normalizePipelineStages(stages);
  const colors = resolveAdminStageColors(
    normalizedStages.map((stage) => ({
      stageId: stage.id,
      order: stage.order,
      name: stage.name,
    })),
    existingColors,
  );

  return normalizedStages.map((stage, index) =>
    mapOfficialStageToAdminViewModel(stage, colors[index]),
  );
};

export const mapOfficialPipelineToAdminViewModel = (
  pipeline: OfficialPipeline,
  existingColors?: string[],
): AdminPipelineViewModel => {
  const stages = mapOfficialStagesToAdminViewModels(pipeline.stages, existingColors);

  return {
    pipelineId: pipeline.id,
    pipelineName: trimText(pipeline.name),
    description: trimOptionalText(pipeline.description),
    active: pipeline.isActive,
    isDefault: pipeline.isDefault,
    stages,
    stageColors: stages.map((stage) => stage.color),
    createdAt: pipeline.createdAt,
    updatedAt: pipeline.updatedAt,
  };
};

export const mapOfficialPipelinesToAdminViewModels = (
  pipelines: OfficialPipeline[] | undefined,
  existingColorsByPipelineId?: Record<string, string[]>,
): AdminPipelineViewModel[] => {
  if (!Array.isArray(pipelines)) return [];

  return pipelines.map((pipeline) =>
    mapOfficialPipelineToAdminViewModel(
      pipeline,
      existingColorsByPipelineId?.[pipeline.id],
    ),
  );
};

export const buildCreatePipelinePayload = (
  draft: AdminPipelineDraft,
): CreatePipelinePayload => {
  const payload: CreatePipelinePayload = {
    name: trimText(draft.pipelineName ?? ''),
  };

  const description = trimOptionalText(draft.description);
  if (description !== undefined) {
    payload.description = description;
  }

  if (draft.isDefault !== undefined) {
    payload.isDefault = draft.isDefault;
  }

  return payload;
};

export const buildUpdatePipelinePayload = (
  draft: AdminPipelineDraft,
): UpdatePipelinePayload => {
  const payload: UpdatePipelinePayload = {};

  if (draft.pipelineName !== undefined) {
    const name = trimText(draft.pipelineName);
    if (name.length > 0) payload.name = name;
  }

  const description = normalizeNullableText(draft.description);
  if (description !== undefined) {
    payload.description = description;
  }

  if (draft.isDefault !== undefined) {
    payload.isDefault = draft.isDefault;
  }

  return payload;
};

export const buildCreateStagePayload = (
  stageDraft: AdminStageDraft,
): CreateStagePayload => {
  const payload: CreateStagePayload = {
    name: trimText(stageDraft.name ?? ''),
    order: stageDraft.order ?? 1,
    isWon: stageDraft.isWon ?? false,
    isLost: stageDraft.isLost ?? false,
  };

  return payload;
};

export const buildUpdateStagePayload = (
  stageDraft: AdminStageDraft,
): UpdateStagePayload => {
  const payload: UpdateStagePayload = {};

  if (stageDraft.name !== undefined) {
    const name = trimText(stageDraft.name);
    if (name.length > 0) payload.name = name;
  }

  if (stageDraft.order !== undefined) {
    payload.order = stageDraft.order;
  }

  if (stageDraft.isWon !== undefined) {
    payload.isWon = stageDraft.isWon;
  }

  if (stageDraft.isLost !== undefined) {
    payload.isLost = stageDraft.isLost;
  }

  return payload;
};

export const buildReorderStagesPayload = (
  stages: Array<Pick<AdminPipelineStageViewModel, 'stageId' | 'order'>>,
): ReorderStagesPayload => {
  return {
    stages: [...stages]
      .sort((left, right) => {
        if (left.order !== right.order) return left.order - right.order;
        return left.stageId.localeCompare(right.stageId);
      })
      .map((stage) => ({
        stageId: stage.stageId,
        order: stage.order,
      })),
  };
};

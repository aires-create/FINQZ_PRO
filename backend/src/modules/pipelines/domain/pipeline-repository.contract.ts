import type {
  CreatePipelineInput,
  CreateStageInput,
  PipelineContract,
  ReorderStagesInput,
  UpdatePipelineInput,
  UpdateStageInput,
  UUID,
} from './pipeline.contract.js';

export interface ListActivePipelinesInput {
  tenantId: UUID;
}

export interface FindPipelineByIdInput {
  tenantId: UUID;
  pipelineId: UUID;
}

export interface FindStageByIdInput {
  tenantId: UUID;
  stageId: UUID;
}

export interface CreatePipelineRepositoryInput extends CreatePipelineInput {}

export interface UpdatePipelineRepositoryInput extends UpdatePipelineInput {}

export interface SoftDeletePipelineRepositoryInput {
  tenantId: UUID;
  pipelineId: UUID;
}

export interface CreateStageRepositoryInput extends CreateStageInput {}

export interface UpdateStageRepositoryInput extends UpdateStageInput {}

export interface SoftDeleteStageRepositoryInput {
  tenantId: UUID;
  stageId: UUID;
}

export interface ReorderStagesRepositoryInput extends ReorderStagesInput {}

export interface PipelineRepositoryContract {
  listActivePipelines(input: ListActivePipelinesInput): Promise<PipelineContract[]>;
  findPipelineById(input: FindPipelineByIdInput): Promise<PipelineContract | null>;
  findStageById(input: FindStageByIdInput): Promise<PipelineContract['stages'][number] | null>;
  createPipeline(input: CreatePipelineRepositoryInput): Promise<PipelineContract>;
  updatePipeline(input: UpdatePipelineRepositoryInput): Promise<PipelineContract>;
  softDeletePipeline(input: SoftDeletePipelineRepositoryInput): Promise<void>;
  createStage(input: CreateStageRepositoryInput): Promise<PipelineContract['stages'][number]>;
  updateStage(input: UpdateStageRepositoryInput): Promise<PipelineContract['stages'][number]>;
  softDeleteStage(input: SoftDeleteStageRepositoryInput): Promise<void>;
  reorderStages(input: ReorderStagesRepositoryInput): Promise<PipelineContract['stages']>;
}

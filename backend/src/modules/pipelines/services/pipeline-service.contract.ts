import type {
  CreatePipelineInput,
  CreateStageInput,
  ReorderStagesInput,
  UpdatePipelineInput,
  UpdateStageInput,
  UUID,
} from '../domain/pipeline.contract.js';
import type { PipelineContract } from '../domain/pipeline.contract.js';

export interface ListActivePipelinesServiceInput {
  tenantId: UUID;
}

export interface CreatePipelineServiceInput extends CreatePipelineInput {
  actorUserId: UUID;
}

export interface UpdatePipelineServiceInput extends UpdatePipelineInput {
  actorUserId: UUID;
}

export interface DeactivatePipelineServiceInput {
  tenantId: UUID;
  pipelineId: UUID;
  actorUserId: UUID;
}

export interface CreateStageServiceInput extends CreateStageInput {
  actorUserId: UUID;
}

export interface UpdateStageServiceInput extends UpdateStageInput {
  actorUserId: UUID;
}

export interface DeactivateStageServiceInput {
  tenantId: UUID;
  stageId: UUID;
  actorUserId: UUID;
}

export interface ReorderStagesServiceInput extends ReorderStagesInput {
  actorUserId: UUID;
}

export interface PipelineServiceContract {
  listActivePipelines(input: ListActivePipelinesServiceInput): Promise<PipelineContract[]>;
  createPipeline(input: CreatePipelineServiceInput): Promise<PipelineContract>;
  updatePipeline(input: UpdatePipelineServiceInput): Promise<PipelineContract>;
  deactivatePipeline(input: DeactivatePipelineServiceInput): Promise<void>;
  createStage(input: CreateStageServiceInput): Promise<PipelineContract['stages'][number]>;
  updateStage(input: UpdateStageServiceInput): Promise<PipelineContract['stages'][number]>;
  deactivateStage(input: DeactivateStageServiceInput): Promise<void>;
  reorderStages(input: ReorderStagesServiceInput): Promise<PipelineContract['stages']>;
}

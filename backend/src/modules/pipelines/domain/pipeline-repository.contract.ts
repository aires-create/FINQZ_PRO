import type {
  CreatePipelineInput,
  CreateStageInput,
  PipelineContract,
  UUID,
} from './pipeline.contract.js';

export interface ListActivePipelinesInput {
  tenantId: UUID;
}

export interface FindByIdInput {
  tenantId: UUID;
  pipelineId: UUID;
}

export interface FindStageByIdInput {
  tenantId: UUID;
  stageId: UUID;
}

export interface HasLinkedOpportunitiesForPipelineInput {
  tenantId: UUID;
  pipelineId: UUID;
}

export interface HasLinkedOpportunitiesForStageInput {
  tenantId: UUID;
  stageId: UUID;
}

export interface CreatePipelineRepositoryInput extends CreatePipelineInput {}

export interface UpdatePipelineRepositoryInput {
  tenantId: UUID;
  pipelineId: UUID;
  name?: string;
  description?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface SoftDeletePipelineRepositoryInput {
  tenantId: UUID;
  pipelineId: UUID;
  actorUserId?: UUID;
}

export interface CreateStageRepositoryInput extends CreateStageInput {}

export interface UpdateStageRepositoryInput {
  tenantId: UUID;
  stageId: UUID;
  name?: string;
  order?: number;
  isWon?: boolean;
  isLost?: boolean;
}

export interface SoftDeleteStageRepositoryInput {
  tenantId: UUID;
  stageId: UUID;
  actorUserId?: UUID;
}

export interface ReorderStagesRepositoryInput {
  tenantId: UUID;
  pipelineId: UUID;
  stages: Array<{
    stageId: UUID;
    order: number;
  }>;
}

export interface PipelineRepositoryContract {
  listActiveByTenant(tenantId: UUID): Promise<PipelineContract[]>;
  findActiveByTenant?(tenantId: UUID): Promise<PipelineContract[]>;
  findById(input: FindByIdInput): Promise<PipelineContract | null>;
  findStageById(input: FindStageByIdInput): Promise<PipelineContract['stages'][number] | null>;
  hasLinkedOpportunitiesForPipeline(
    input: HasLinkedOpportunitiesForPipelineInput,
  ): Promise<boolean>;
  hasLinkedOpportunitiesForStage(
    input: HasLinkedOpportunitiesForStageInput,
  ): Promise<boolean>;
  createPipeline(input: CreatePipelineRepositoryInput): Promise<PipelineContract>;
  updatePipeline(input: UpdatePipelineRepositoryInput): Promise<void>;
  softDeletePipeline(input: SoftDeletePipelineRepositoryInput): Promise<void>;
  createStage(input: CreateStageRepositoryInput): Promise<PipelineContract['stages'][number]>;
  updateStage(input: UpdateStageRepositoryInput): Promise<void>;
  softDeleteStage(input: SoftDeleteStageRepositoryInput): Promise<void>;
  reorderStages(input: ReorderStagesRepositoryInput): Promise<void>;
}

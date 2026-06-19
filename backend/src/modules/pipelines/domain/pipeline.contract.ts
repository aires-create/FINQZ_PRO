export type UUID = string;

export interface PipelineStageContract {
  id: UUID;
  tenantId: UUID;
  pipelineId: UUID;
  name: string;
  order: number;
  isWon: boolean;
  isLost: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface PipelineContract {
  id: UUID;
  tenantId: UUID;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  stages: PipelineStageContract[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateStageInput {
  tenantId: UUID;
  pipelineId: UUID;
  name: string;
  order: number;
  isWon: boolean;
  isLost: boolean;
}

export interface UpdateStageInput {
  id: UUID;
  tenantId: UUID;
  pipelineId: UUID;
  name?: string;
  order?: number;
  isWon?: boolean;
  isLost?: boolean;
}

export interface ReorderStagesInput {
  tenantId: UUID;
  pipelineId: UUID;
  stages: Array<{
    id: UUID;
    order: number;
  }>;
}

export interface CreatePipelineInput {
  tenantId: UUID;
  name: string;
  description?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
  stages?: CreateStageInput[];
}

export interface UpdatePipelineInput {
  id: UUID;
  tenantId: UUID;
  name?: string;
  description?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
  stages?: UpdateStageInput[];
}

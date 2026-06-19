import type {
  CreatePipelineBody,
  CreateStageBody,
  PipelineIdParams,
  ReorderStagesBody,
  StageIdParams,
  UpdatePipelineBody,
  UpdateStageBody,
} from '../../validators/pipeline.http.schema.js';

export type PipelineHttpPermissionMap = {
  createPipeline: 'pipeline:create';
  updatePipeline: 'pipeline:update';
  deletePipeline: 'pipeline:delete';
  createStage: 'stage:create';
  updateStage: 'stage:update';
  deleteStage: 'stage:delete';
  reorderStages: 'stage:update';
};

export type PipelineHttpRouteContract =
  | {
      method: 'POST';
      path: '/api/v1/pipelines';
      permission: PipelineHttpPermissionMap['createPipeline'];
      bodySchema: CreatePipelineBody;
    }
  | {
      method: 'PUT';
      path: '/api/v1/pipelines/:pipelineId';
      permission: PipelineHttpPermissionMap['updatePipeline'];
      paramsSchema: PipelineIdParams;
      bodySchema: UpdatePipelineBody;
    }
  | {
      method: 'DELETE';
      path: '/api/v1/pipelines/:pipelineId';
      permission: PipelineHttpPermissionMap['deletePipeline'];
      paramsSchema: PipelineIdParams;
    }
  | {
      method: 'POST';
      path: '/api/v1/pipelines/:pipelineId/stages';
      permission: PipelineHttpPermissionMap['createStage'];
      paramsSchema: PipelineIdParams;
      bodySchema: CreateStageBody;
    }
  | {
      method: 'PUT';
      path: '/api/v1/stages/:stageId';
      permission: PipelineHttpPermissionMap['updateStage'];
      paramsSchema: StageIdParams;
      bodySchema: UpdateStageBody;
    }
  | {
      method: 'DELETE';
      path: '/api/v1/stages/:stageId';
      permission: PipelineHttpPermissionMap['deleteStage'];
      paramsSchema: StageIdParams;
    }
  | {
      method: 'PATCH';
      path: '/api/v1/pipelines/:pipelineId/stages/reorder';
      permission: PipelineHttpPermissionMap['reorderStages'];
      paramsSchema: PipelineIdParams;
      bodySchema: ReorderStagesBody;
    };

export const createPipelineHttpContract = {
  method: 'POST',
  path: '/api/v1/pipelines',
  permission: 'pipeline:create',
} as const satisfies Pick<
  PipelineHttpRouteContract,
  'method' | 'path' | 'permission'
>;

export const updatePipelineHttpContract = {
  method: 'PUT',
  path: '/api/v1/pipelines/:pipelineId',
  permission: 'pipeline:update',
} as const satisfies Pick<
  PipelineHttpRouteContract,
  'method' | 'path' | 'permission'
>;

export const deletePipelineHttpContract = {
  method: 'DELETE',
  path: '/api/v1/pipelines/:pipelineId',
  permission: 'pipeline:delete',
} as const satisfies Pick<
  PipelineHttpRouteContract,
  'method' | 'path' | 'permission'
>;

export const createStageHttpContract = {
  method: 'POST',
  path: '/api/v1/pipelines/:pipelineId/stages',
  permission: 'stage:create',
} as const satisfies Pick<
  PipelineHttpRouteContract,
  'method' | 'path' | 'permission'
>;

export const updateStageHttpContract = {
  method: 'PUT',
  path: '/api/v1/stages/:stageId',
  permission: 'stage:update',
} as const satisfies Pick<
  PipelineHttpRouteContract,
  'method' | 'path' | 'permission'
>;

export const deleteStageHttpContract = {
  method: 'DELETE',
  path: '/api/v1/stages/:stageId',
  permission: 'stage:delete',
} as const satisfies Pick<
  PipelineHttpRouteContract,
  'method' | 'path' | 'permission'
>;

export const reorderStagesHttpContract = {
  method: 'PATCH',
  path: '/api/v1/pipelines/:pipelineId/stages/reorder',
  permission: 'stage:update',
} as const satisfies Pick<
  PipelineHttpRouteContract,
  'method' | 'path' | 'permission'
>;

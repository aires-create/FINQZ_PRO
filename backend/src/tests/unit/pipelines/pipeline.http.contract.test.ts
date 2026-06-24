import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  createPipelineBodySchema,
  createStageBodySchema,
  listPipelinesQuerySchema,
  pipelineIdParamsSchema,
  reorderStagesBodySchema,
  stageIdParamsSchema,
  updatePipelineBodySchema,
  updateStageBodySchema,
} from '../../../modules/pipelines/validators/pipeline.http.schema.js';
import {
  createPipelineHttpContract,
  createStageHttpContract,
  deletePipelineHttpContract,
  deleteStageHttpContract,
  reorderStagesHttpContract,
  updatePipelineHttpContract,
  updateStageHttpContract,
} from '../../../modules/pipelines/presentation/http/pipeline.http.contract.js';

const contractSource = readFileSync(
  resolve(process.cwd(), 'src/modules/pipelines/presentation/http/pipeline.http.contract.ts'),
  'utf8',
);

describe('pipeline.http.contract', () => {
  it('createPipelineBodySchema rejects empty name', () => {
    expect(() => createPipelineBodySchema.parse({ name: '   ' })).toThrow();
  });

  it('updatePipelineBodySchema accepts partial payloads', () => {
    expect(
      updatePipelineBodySchema.parse({
        description: 'Updated description',
      }),
    ).toEqual({
      description: 'Updated description',
    });
  });

  it('listPipelinesQuerySchema accepts includeInactive=true', () => {
    expect(
      listPipelinesQuerySchema.parse({
        includeInactive: 'true',
      }),
    ).toEqual({
      includeInactive: true,
    });
  });

  it('listPipelinesQuerySchema accepts includeInactive=false or omitted', () => {
    expect(
      listPipelinesQuerySchema.parse({
        includeInactive: 'false',
      }),
    ).toEqual({
      includeInactive: false,
    });

    expect(listPipelinesQuerySchema.parse({})).toEqual({});
  });

  it('updatePipelineBodySchema accepts isActive=false', () => {
    expect(
      updatePipelineBodySchema.parse({
        isActive: false,
      }),
    ).toEqual({
      isActive: false,
    });
  });

  it('updatePipelineBodySchema accepts isActive=true', () => {
    expect(
      updatePipelineBodySchema.parse({
        isActive: true,
      }),
    ).toEqual({
      isActive: true,
    });
  });

  it('updateStageBodySchema accepts isActive flags', () => {
    expect(
      updateStageBodySchema.parse({
        isActive: true,
      }),
    ).toEqual({
      isActive: true,
    });

    expect(
      updateStageBodySchema.parse({
        isActive: false,
      }),
    ).toEqual({
      isActive: false,
    });
  });

  it('createStageBodySchema does not require isActive', () => {
    expect(
      createStageBodySchema.parse({
        name: 'Novo Lead',
        order: 1,
        isWon: false,
        isLost: false,
      }),
    ).toEqual({
      name: 'Novo Lead',
      order: 1,
      isWon: false,
      isLost: false,
    });
  });

  it('createStageBodySchema rejects won and lost together', () => {
    expect(() =>
      createStageBodySchema.parse({
        name: 'Novo Lead',
        order: 1,
        isWon: true,
        isLost: true,
      }),
    ).toThrow();
  });

  it('createStageBodySchema rejects order lower than 1', () => {
    expect(() =>
      createStageBodySchema.parse({
        name: 'Novo Lead',
        order: 0,
        isWon: false,
        isLost: false,
      }),
    ).toThrow();
  });

  it('reorderStagesBodySchema rejects empty array', () => {
    expect(() => reorderStagesBodySchema.parse({ stages: [] })).toThrow();
  });

  it('pipelineIdParamsSchema rejects invalid uuid', () => {
    expect(() => pipelineIdParamsSchema.parse({ pipelineId: 'not-a-uuid' })).toThrow();
  });

  it('stageIdParamsSchema rejects invalid uuid', () => {
    expect(() => stageIdParamsSchema.parse({ stageId: 'not-a-uuid' })).toThrow();
  });

  it('contracts use correct permissions', () => {
    expect(createPipelineHttpContract.permission).toBe('pipeline:create');
    expect(updatePipelineHttpContract.permission).toBe('pipeline:update');
    expect(deletePipelineHttpContract.permission).toBe('pipeline:delete');
    expect(createStageHttpContract.permission).toBe('stage:create');
    expect(updateStageHttpContract.permission).toBe('stage:update');
    expect(deleteStageHttpContract.permission).toBe('stage:delete');
    expect(reorderStagesHttpContract.permission).toBe('stage:update');
  });

  it('stage contracts use the pipeline-prefixed paths', () => {
    expect(updateStageHttpContract.path).toBe('/api/v1/pipelines/stages/:stageId');
    expect(deleteStageHttpContract.path).toBe('/api/v1/pipelines/stages/:stageId');
  });

  it('contracts do not include code', () => {
    expect(contractSource).not.toContain('code');
  });
});

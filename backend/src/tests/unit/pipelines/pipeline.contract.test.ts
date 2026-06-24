import { describe, expect, it } from 'vitest';

import type {
  PipelineContract,
  PipelineStageContract,
} from '../../../modules/pipelines/domain/pipeline.contract.js';
import {
  isValidStageOrder,
  isValidWonLostFlags,
  validatePipelineName,
  validateStageName,
  validateStageOrder,
  validateWonLostFlags,
} from '../../../modules/pipelines/validators/pipeline.validator.js';

describe('pipeline.contract', () => {
  it('PipelineContract accepts official fields without code', () => {
    const pipeline = {
      id: '11111111-1111-1111-1111-111111111111',
      tenantId: '22222222-2222-2222-2222-222222222222',
      name: 'Main Pipeline',
      description: null,
      isDefault: true,
      isActive: true,
      stages: [],
      createdAt: new Date('2026-06-19T00:00:00.000Z'),
      updatedAt: new Date('2026-06-19T00:00:00.000Z'),
      deletedAt: null,
    } satisfies PipelineContract;

    expect(pipeline).toMatchObject({
      id: '11111111-1111-1111-1111-111111111111',
      tenantId: '22222222-2222-2222-2222-222222222222',
      name: 'Main Pipeline',
      description: null,
      isDefault: true,
      isActive: true,
      stages: [],
    });
    expect('code' in pipeline).toBe(false);
  });

  it('StageContract accepts official fields without code', () => {
    const stage = {
      id: '33333333-3333-3333-3333-333333333333',
      tenantId: '22222222-2222-2222-2222-222222222222',
      pipelineId: '11111111-1111-1111-1111-111111111111',
      name: 'Novo Lead',
      order: 1,
      isWon: false,
      isLost: false,
      isActive: true,
      createdAt: new Date('2026-06-19T00:00:00.000Z'),
      updatedAt: new Date('2026-06-19T00:00:00.000Z'),
      deletedAt: null,
    } satisfies PipelineStageContract;

    expect(stage).toMatchObject({
      id: '33333333-3333-3333-3333-333333333333',
      tenantId: '22222222-2222-2222-2222-222222222222',
      pipelineId: '11111111-1111-1111-1111-111111111111',
      name: 'Novo Lead',
      order: 1,
      isWon: false,
      isLost: false,
      isActive: true,
    });
    expect('code' in stage).toBe(false);
  });

  it('validateWonLostFlags rejects isWon=true and isLost=true', () => {
    expect(isValidWonLostFlags({ isWon: true, isLost: true })).toBe(false);
    expect(() => validateWonLostFlags({ isWon: true, isLost: true })).toThrow();
  });

  it('validateStageOrder rejects order lower than 1', () => {
    expect(isValidStageOrder(0)).toBe(false);
    expect(() => validateStageOrder(0)).toThrow();
  });

  it('validatePipelineName rejects empty string', () => {
    expect(() => validatePipelineName('')).toThrow();
  });

  it('validateStageName rejects empty string', () => {
    expect(() => validateStageName('')).toThrow();
  });
});

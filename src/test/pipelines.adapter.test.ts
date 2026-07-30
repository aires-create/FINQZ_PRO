import { describe, expect, it } from 'vitest';

import { mapOfficialStageToAdminViewModel } from '../pages/admin/pipelines.adapter';

describe('pipelines.adapter stage lifecycle mapping', () => {
  it('preserves isActive when present', () => {
    const mapped = mapOfficialStageToAdminViewModel({
      id: 'stage-1',
      tenantId: 'tenant-1',
      pipelineId: 'pipeline-1',
      name: 'Qualificação',
      order: 1,
      isWon: false,
      isLost: false,
      isActive: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      deletedAt: null,
    });

    expect(mapped.isActive).toBe(false);
  });

  it('defaults isActive to true for older payloads', () => {
    const mapped = mapOfficialStageToAdminViewModel({
      id: 'stage-2',
      tenantId: 'tenant-1',
      pipelineId: 'pipeline-1',
      name: 'Proposta',
      order: 2,
      isWon: false,
      isLost: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      deletedAt: null,
    } as never);

    expect(mapped.isActive).toBe(true);
  });
});

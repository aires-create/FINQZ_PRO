import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiCallMock = vi.hoisted(() => vi.fn());

vi.mock('../api/modules/base', () => ({
  apiCall: apiCallMock,
}));

import { pipelinesApi } from '../api/modules/pipelines.api';

describe('pipelinesApi.getAll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps default behavior without query', async () => {
    apiCallMock.mockResolvedValueOnce([]);

    await pipelinesApi.getAll();

    expect(apiCallMock).toHaveBeenCalledWith('/api/v1/pipelines');
  });

  it('adds includeInactive=true when requested', async () => {
    apiCallMock.mockResolvedValueOnce([]);

    await pipelinesApi.getAll({ includeInactive: true });

    expect(apiCallMock).toHaveBeenCalledWith('/api/v1/pipelines?includeInactive=true');
  });
});

import { describe, expect, it } from 'vitest';

import { ApiException } from '../api/http';
import { getPipelineActionErrorMessage } from '../pages/admin/Pipelines';

describe('admin pipelines error mapping', () => {
  it('preserves backend 409 message for archive operations', () => {
    const error = new ApiException('Default pipeline cannot be archived', 409, 'CONFLICT');

    expect(getPipelineActionErrorMessage(error, 'archive')).toBe(
      'Default pipeline cannot be archived',
    );
  });

  it('preserves backend 409 message for lifecycle updates', () => {
    const error = new ApiException('Default pipeline cannot be inactivated', 409, 'CONFLICT');

    expect(getPipelineActionErrorMessage(error, 'inactivate')).toBe(
      'Default pipeline cannot be inactivated',
    );
  });

  it('does not turn generic 409 into the old fixed opportunities message', () => {
    const error = new Error('boom');

    expect(getPipelineActionErrorMessage(error, 'archive')).toBe(
      'Não foi possível arquivar o pipeline.',
    );
  });
});

import { ProviderHealthTracker } from '../../../modules/integrations/application/provider-health-tracker.js';

describe('ProviderHealthTracker', () => {
  it('keeps compatibility for set/get/list', () => {
    const tracker = new ProviderHealthTracker();
    const now = new Date('2026-05-27T10:00:00.000Z');

    tracker.set('bluepay', 'commission_payout', {
      status: 'degraded',
      lastFailureAt: now,
      latencyMs: 1200,
      sanitizedErrorCode: 'PROVIDER_TIMEOUT_ERROR',
    });

    expect(tracker.get('bluepay', 'commission_payout')).toEqual({
      status: 'degraded',
      lastFailureAt: now,
      latencyMs: 1200,
      lastLatencyMs: 1200,
      sanitizedErrorCode: 'PROVIDER_TIMEOUT_ERROR',
      failureCount: 1,
      updatedAt: expect.any(Date),
    });
    expect(tracker.list()).toHaveLength(1);
  });

  it('auto sets updatedAt and increments success/failure counters', () => {
    const tracker = new ProviderHealthTracker();

    tracker.set('sos-bolso', 'margin_inquiry', { status: 'ok', latencyMs: 100 });
    tracker.set('sos-bolso', 'margin_inquiry', { status: 'ok', latencyMs: 120 });
    tracker.set('sos-bolso', 'margin_inquiry', { status: 'degraded' });
    tracker.set('sos-bolso', 'margin_inquiry', { status: 'down' });

    const snapshot = tracker.get('sos-bolso', 'margin_inquiry');
    expect(snapshot?.updatedAt).toBeInstanceOf(Date);
    expect(snapshot?.successCount).toBe(2);
    expect(snapshot?.failureCount).toBe(2);
    expect(snapshot?.lastLatencyMs).toBe(120);
  });

  it('returns aggregated runtime snapshot', () => {
    const tracker = new ProviderHealthTracker();

    tracker.set('sos-bolso', 'margin_inquiry', { status: 'ok' });
    tracker.set('nova-promotora', 'healthCheck', { status: 'degraded' });
    tracker.set('bluepay', 'commission_payout', { status: 'down' });

    const runtime = tracker.snapshot();

    expect(runtime.generatedAt).toBeInstanceOf(Date);
    expect(runtime.total).toBe(3);
    expect(runtime.byStatus).toEqual({
      ok: 1,
      degraded: 1,
      down: 1,
      disabled: 0,
    });
    expect(runtime.providers).toHaveLength(3);
  });

  it('clears in-memory state', () => {
    const tracker = new ProviderHealthTracker();

    tracker.set('sos-bolso', 'margin_inquiry', { status: 'ok' });
    expect(tracker.list()).toHaveLength(1);

    tracker.clear();

    expect(tracker.list()).toHaveLength(0);
    expect(tracker.snapshot().total).toBe(0);
  });
});

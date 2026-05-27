import { ProviderHealthTracker } from '../../../modules/integrations/application/provider-health-tracker.js';
import { ProviderRuntimeDiagnosticsService } from '../../../modules/integrations/application/provider-runtime-diagnostics.service.js';

describe('ProviderRuntimeDiagnosticsService', () => {
  it('getSnapshot delegates to tracker.snapshot', () => {
    const tracker = new ProviderHealthTracker();
    const spy = vi.spyOn(tracker, 'snapshot');
    const service = new ProviderRuntimeDiagnosticsService(tracker);

    service.getSnapshot();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('getSummary calculates totals by status', () => {
    const tracker = new ProviderHealthTracker();
    tracker.set('a', 'health', { status: 'ok' });
    tracker.set('b', 'health', { status: 'degraded' });
    tracker.set('c', 'health', { status: 'down' });
    tracker.set('d', 'health', { status: 'disabled' });
    const service = new ProviderRuntimeDiagnosticsService(tracker);

    const summary = service.getSummary();

    expect(summary.totalProviders).toBe(4);
    expect(summary.healthy).toBe(1);
    expect(summary.degraded).toBe(1);
    expect(summary.down).toBe(1);
    expect(summary.disabled).toBe(1);
  });

  it('getSummary calculates averageLatencyMs when latency exists', () => {
    const tracker = new ProviderHealthTracker();
    tracker.set('a', 'health', { status: 'ok', latencyMs: 100 });
    tracker.set('b', 'health', { status: 'ok', latencyMs: 200 });
    const service = new ProviderRuntimeDiagnosticsService(tracker);

    const summary = service.getSummary();

    expect(summary.averageLatencyMs).toBe(150);
  });

  it('getSummary omits averageLatencyMs when no valid latency is present', () => {
    const tracker = new ProviderHealthTracker();
    tracker.set('a', 'health', { status: 'ok' });
    const service = new ProviderRuntimeDiagnosticsService(tracker);

    const summary = service.getSummary();

    expect('averageLatencyMs' in summary).toBe(false);
  });

  it('getIssues returns only degraded/down providers', () => {
    const tracker = new ProviderHealthTracker();
    const failureAt = new Date('2026-05-27T12:00:00.000Z');
    tracker.set('a', 'health', { status: 'ok', latencyMs: 10 });
    tracker.set('b', 'proposal', {
      status: 'degraded',
      lastFailureAt: failureAt,
      sanitizedErrorCode: 'PROVIDER_TIMEOUT_ERROR',
      latencyMs: 220,
    });
    tracker.set('c', 'margin', {
      status: 'down',
      sanitizedErrorCode: 'PROVIDER_CONNECTION_ERROR',
      latencyMs: 500,
    });
    const service = new ProviderRuntimeDiagnosticsService(tracker);

    const issues = service.getIssues();

    expect(issues).toHaveLength(2);
    expect(issues).toEqual(
      expect.arrayContaining([
        {
          providerKey: 'b',
          capability: 'proposal',
          status: 'degraded',
          sanitizedErrorCode: 'PROVIDER_TIMEOUT_ERROR',
          lastFailureAt: failureAt,
          latencyMs: 220,
        },
        {
          providerKey: 'c',
          capability: 'margin',
          status: 'down',
          sanitizedErrorCode: 'PROVIDER_CONNECTION_ERROR',
          latencyMs: 500,
        },
      ]),
    );
  });

  it('getProviderDiagnostics filters by providerKey', () => {
    const tracker = new ProviderHealthTracker();
    tracker.set('sos-bolso', 'marginInquiry', { status: 'ok' });
    tracker.set('sos-bolso', 'authentication', { status: 'degraded' });
    tracker.set('nova-promotora', 'healthCheck', { status: 'ok' });
    const service = new ProviderRuntimeDiagnosticsService(tracker);

    const diagnostics = service.getProviderDiagnostics('sos-bolso');

    expect(diagnostics).toHaveLength(2);
    expect(diagnostics.every((item) => item.providerKey === 'sos-bolso')).toBe(true);
  });
});

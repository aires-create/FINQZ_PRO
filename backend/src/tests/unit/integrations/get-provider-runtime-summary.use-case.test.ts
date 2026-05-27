import { GetProviderRuntimeSummaryUseCase } from '../../../modules/integrations/application/get-provider-runtime-summary.use-case.js';
import type { ProviderRuntimeDiagnosticsService } from '../../../modules/integrations/application/provider-runtime-diagnostics.service.js';

describe('GetProviderRuntimeSummaryUseCase', () => {
  it('delegates to diagnosticsService.getSummary()', () => {
    const getSummary = vi.fn(() => ({
      generatedAt: new Date('2026-05-27T12:00:00.000Z'),
      totalProviders: 2,
      healthy: 1,
      degraded: 1,
      down: 0,
      disabled: 0,
      averageLatencyMs: 120,
    }));
    const useCase = new GetProviderRuntimeSummaryUseCase({
      getSummary,
    } as unknown as ProviderRuntimeDiagnosticsService);

    const result = useCase.execute();

    expect(getSummary).toHaveBeenCalledTimes(1);
    expect(result.totalProviders).toBe(2);
  });
});

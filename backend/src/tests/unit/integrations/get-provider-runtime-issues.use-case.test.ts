import { GetProviderRuntimeIssuesUseCase } from '../../../modules/integrations/application/get-provider-runtime-issues.use-case.js';
import type { ProviderRuntimeDiagnosticsService } from '../../../modules/integrations/application/provider-runtime-diagnostics.service.js';

describe('GetProviderRuntimeIssuesUseCase', () => {
  it('delegates to diagnosticsService.getIssues()', () => {
    const getIssues = vi.fn(() => [
      {
        providerKey: 'sos-bolso',
        capability: 'marginInquiry',
        status: 'degraded' as const,
      },
    ]);
    const useCase = new GetProviderRuntimeIssuesUseCase({
      getIssues,
    } as unknown as ProviderRuntimeDiagnosticsService);

    const result = useCase.execute();

    expect(getIssues).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
  });
});

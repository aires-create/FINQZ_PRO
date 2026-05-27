import { GetProviderRuntimeDiagnosticsUseCase } from '../../../modules/integrations/application/get-provider-runtime-diagnostics.use-case.js';
import type { ProviderRuntimeDiagnosticsService } from '../../../modules/integrations/application/provider-runtime-diagnostics.service.js';

describe('GetProviderRuntimeDiagnosticsUseCase', () => {
  it('delegates to getSnapshot() when providerKey is not informed', () => {
    const getSnapshot = vi.fn(() => ({
      generatedAt: new Date('2026-05-27T12:00:00.000Z'),
      total: 1,
      byStatus: { ok: 1, degraded: 0, down: 0, disabled: 0 },
      providers: [],
    }));
    const getProviderDiagnostics = vi.fn();
    const useCase = new GetProviderRuntimeDiagnosticsUseCase({
      getSnapshot,
      getProviderDiagnostics,
    } as unknown as ProviderRuntimeDiagnosticsService);

    useCase.execute();

    expect(getSnapshot).toHaveBeenCalledTimes(1);
    expect(getProviderDiagnostics).not.toHaveBeenCalled();
  });

  it('delegates to getProviderDiagnostics(providerKey) when providerKey is informed', () => {
    const getSnapshot = vi.fn();
    const getProviderDiagnostics = vi.fn(() => []);
    const useCase = new GetProviderRuntimeDiagnosticsUseCase({
      getSnapshot,
      getProviderDiagnostics,
    } as unknown as ProviderRuntimeDiagnosticsService);

    useCase.execute('nova-promotora');

    expect(getProviderDiagnostics).toHaveBeenCalledWith('nova-promotora');
    expect(getSnapshot).not.toHaveBeenCalled();
  });
});

import { ProviderRuntimeDiagnosticsService } from './provider-runtime-diagnostics.service.js';

export class GetProviderRuntimeDiagnosticsUseCase {
  constructor(
    private readonly diagnosticsService: ProviderRuntimeDiagnosticsService,
  ) {}

  execute(providerKey?: string) {
    if (providerKey) {
      return this.diagnosticsService.getProviderDiagnostics(providerKey);
    }

    return this.diagnosticsService.getSnapshot();
  }
}

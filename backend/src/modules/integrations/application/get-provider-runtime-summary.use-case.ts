import { ProviderRuntimeDiagnosticsService } from './provider-runtime-diagnostics.service.js';

export class GetProviderRuntimeSummaryUseCase {
  constructor(
    private readonly diagnosticsService: ProviderRuntimeDiagnosticsService,
  ) {}

  execute() {
    return this.diagnosticsService.getSummary();
  }
}

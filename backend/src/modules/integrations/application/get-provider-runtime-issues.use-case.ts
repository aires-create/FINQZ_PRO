import { ProviderRuntimeDiagnosticsService } from './provider-runtime-diagnostics.service.js';

export class GetProviderRuntimeIssuesUseCase {
  constructor(
    private readonly diagnosticsService: ProviderRuntimeDiagnosticsService,
  ) {}

  execute() {
    return this.diagnosticsService.getIssues();
  }
}

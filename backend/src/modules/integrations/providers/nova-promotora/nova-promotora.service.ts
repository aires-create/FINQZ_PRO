import type { IntegrationProvider } from '../../domain/contracts/provider.contract.js';
import { testNovaPromotoraConnection } from './nova-promotora.client.js';
import type { NovaPromotoraConnectionStatus } from './nova-promotora.types.js';

export class NovaPromotoraService implements IntegrationProvider {
  async healthCheck(): Promise<boolean> {
    const result = await this.testConnection();

    return result.connected;
  }

  async testConnection(): Promise<NovaPromotoraConnectionStatus> {
    return testNovaPromotoraConnection();
  }
}

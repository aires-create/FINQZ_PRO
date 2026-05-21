import type { IntegrationProvider } from '../../../modules/integrations/domain/contracts/provider.contract.js';
import { NovaPromotoraService } from '../../../modules/integrations/providers/nova-promotora/nova-promotora.service.js';

describe('Provider contract compliance', () => {
  it('ensures nova-promotora implements IntegrationProvider', () => {
    const provider: IntegrationProvider = new NovaPromotoraService();

    expect(provider).toBeInstanceOf(NovaPromotoraService);
    expect(provider.healthCheck).toBeInstanceOf(Function);
    expect(provider.testConnection).toBeInstanceOf(Function);
  });
});

import type { IntegrationProvider } from '../../../modules/integrations/domain/contracts/provider.contract.js';
import type { CommissionPayoutProvider } from '../../../modules/integrations/domain/contracts/commission-payout.contract.js';
import { BluepayService } from '../../../modules/integrations/providers/bluepay/bluepay.service.js';
import { NovaPromotoraService } from '../../../modules/integrations/providers/nova-promotora/nova-promotora.service.js';
import { SosBolsoService } from '../../../modules/integrations/providers/sos-bolso/sos-bolso.service.js';

describe('Provider contract compliance', () => {
  it('ensures nova-promotora implements IntegrationProvider', () => {
    const provider: IntegrationProvider = new NovaPromotoraService();

    expect(provider).toBeInstanceOf(NovaPromotoraService);
    expect(provider.healthCheck).toBeInstanceOf(Function);
    expect(provider.listProposals).toBeInstanceOf(Function);
    expect(provider.testConnection).toBeInstanceOf(Function);
  });

  it('ensures sos-bolso implements IntegrationProvider', () => {
    const provider: IntegrationProvider = new SosBolsoService();

    expect(provider).toBeInstanceOf(SosBolsoService);
    expect(provider.healthCheck).toBeInstanceOf(Function);
    expect(provider.testConnection).toBeInstanceOf(Function);
  });

  it('ensures bluepay implements IntegrationProvider and CommissionPayoutProvider', () => {
    const provider: IntegrationProvider & CommissionPayoutProvider = new BluepayService();

    expect(provider).toBeInstanceOf(BluepayService);
    expect(provider.healthCheck).toBeInstanceOf(Function);
    expect(provider.testConnection).toBeInstanceOf(Function);
    expect(provider.createCommissionPayout).toBeInstanceOf(Function);
  });
});

import { TestIntegrationProviderMarginInquiryUseCase } from '../../../modules/integrations/application/test-integration-provider-margin-inquiry.use-case.js';
import type { ProviderEngine } from '../../../modules/integrations/application/provider-engine.js';
import type { ProviderRuntimeOptions } from '../../../modules/integrations/application/provider-engine.js';
import type { MarginInquiryProvider } from '../../../modules/integrations/domain/contracts/provider-capabilities.contract.js';

describe('TestIntegrationProviderMarginInquiryUseCase', () => {
  it('propagates execution context and preserves requestId when provided', async () => {
    const inquireMargin = vi.fn(async () => ({
      providerKey: 'sos-bolso',
      availableMargin: 1200,
      currency: 'BRL',
    }));
    const provider: MarginInquiryProvider = {
      inquireMargin,
    };
    const resolve = vi.fn((_providerName: string, runtime?: ProviderRuntimeOptions) => {
      expect(runtime?.context?.requestId).toBe('req-abc');
      expect(runtime?.context?.capability).toBe('marginInquiry');
      expect(runtime?.context?.operation).toBe('test_margin_inquiry');
      expect(runtime?.context?.tenantId).toBe('integration-test');
      expect(runtime?.healthTracker).toBeDefined();
      expect(runtime?.providerRetryPolicy).toBeDefined();
      return provider;
    });
    const useCase = new TestIntegrationProviderMarginInquiryUseCase({
      resolve,
    } as unknown as ProviderEngine);

    const result = await useCase.execute('sos-bolso', {
      document: '12345678901',
      metadata: {
        convenioCnpj: '12345678000190',
        enrollmentId: 'A1',
        requestId: 'req-abc',
      },
    });

    expect(result.providerKey).toBe('sos-bolso');
    expect(inquireMargin).toHaveBeenCalledWith({
      document: '12345678901',
      metadata: {
        convenioCnpj: '12345678000190',
        enrollmentId: 'A1',
        requestId: 'req-abc',
      },
    });
  });

  it('keeps backward compatibility when requestId is absent', async () => {
    const inquireMargin = vi.fn(async () => ({
      providerKey: 'sos-bolso',
      availableMargin: 500,
      currency: 'BRL',
    }));
    const provider: MarginInquiryProvider = {
      inquireMargin,
    };
    const resolve = vi.fn((_providerName: string, runtime?: ProviderRuntimeOptions) => {
      expect(runtime?.context?.requestId).toContain('margin-test-');
      return provider;
    });
    const useCase = new TestIntegrationProviderMarginInquiryUseCase({
      resolve,
    } as unknown as ProviderEngine);

    await useCase.execute('sos-bolso', {
      document: '12345678901',
      metadata: {
        convenioCnpj: '12345678000190',
        enrollmentId: 'A1',
      },
    });

    expect(inquireMargin).toHaveBeenCalledTimes(1);
  });
});

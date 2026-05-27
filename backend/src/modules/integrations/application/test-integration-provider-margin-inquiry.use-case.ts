import type { MarginInquiryResult } from '../domain/contracts/provider-capabilities.contract.js';
import { hasMarginInquiry } from '../domain/contracts/provider-capability.guards.js';
import { IntegrationError } from '../domain/errors/integration.error.js';
import { ProviderCapabilityNotSupportedError } from '../domain/errors/provider-capability-not-supported.error.js';
import { ProviderConnectionError } from '../domain/errors/provider-connection.error.js';
import type { ProviderEngine } from './provider-engine.js';
import { ProviderHealthTracker } from './provider-health-tracker.js';
import { ProviderRetryPolicy } from './provider-retry-policy.js';
import type { ProviderExecutionContext } from './provider-execution-context.js';

export type TestProviderMarginInquiryInput = {
  document: string;
  metadata: {
    convenioCnpj: string;
    enrollmentId: string;
    requestId?: string;
  };
};

export class TestIntegrationProviderMarginInquiryUseCase {
  constructor(private readonly providerEngine: ProviderEngine) {}

  async execute(
    providerName: string,
    input: TestProviderMarginInquiryInput,
  ): Promise<MarginInquiryResult> {
    const requestId = String(input.metadata.requestId ?? '').trim() || `margin-test-${Date.now()}`;
    const context: ProviderExecutionContext = {
      requestId,
      tenantId: 'integration-test',
      providerKey: providerName,
      capability: 'marginInquiry',
      operation: 'test_margin_inquiry',
      startedAt: new Date(),
      attempt: 1,
      metadata: {
        requestId,
      },
    };
    const healthTracker = new ProviderHealthTracker();
    const providerRetryPolicy = new ProviderRetryPolicy({
      baseDelayMs: 150,
      maxDelayMs: 750,
      jitterRatio: 0.1,
    });

    try {
      const provider = this.providerEngine.resolve(providerName, {
        context,
        healthTracker,
        providerRetryPolicy,
      });
      if (!hasMarginInquiry(provider)) {
        throw new ProviderCapabilityNotSupportedError(providerName, 'marginInquiry');
      }

      return await provider.inquireMargin({
        document: input.document,
        metadata: input.metadata,
      });
    } catch (error) {
      if (error instanceof IntegrationError) {
        throw error;
      }

      throw new ProviderConnectionError(providerName);
    }
  }
}

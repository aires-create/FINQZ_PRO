import type { CommissionPayoutProvider } from './commission-payout.contract.js';
import type { MarginInquiryProvider } from './margin-inquiry.contract.js';
import type { WebhookCapableProvider } from './webhook-capable.contract.js';

export const hasMarginInquiry = (provider: unknown): provider is MarginInquiryProvider => {
  return typeof provider === 'object' && provider !== null && 'inquireMargin' in provider;
};

export const hasCommissionPayout = (provider: unknown): provider is CommissionPayoutProvider => {
  return (
    typeof provider === 'object' &&
    provider !== null &&
    'createCommissionPayout' in provider
  );
};

export const hasWebhookCapability = (provider: unknown): provider is WebhookCapableProvider => {
  return (
    typeof provider === 'object' &&
    provider !== null &&
    'validateWebhook' in provider &&
    'parseWebhookEvent' in provider
  );
};

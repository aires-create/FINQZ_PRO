import {
  hasCommissionPayout,
  hasMarginInquiry,
  hasWebhookCapability,
} from '../../../modules/integrations/domain/contracts/provider-capability.guards.js';

describe('Provider capability guards', () => {
  it('detects margin inquiry capability', () => {
    expect(hasMarginInquiry({ inquireMargin: async () => ({}) })).toBe(true);
    expect(hasMarginInquiry({})).toBe(false);
  });

  it('detects commission payout capability', () => {
    expect(
      hasCommissionPayout({ createCommissionPayout: async () => ({}) }),
    ).toBe(true);
    expect(hasCommissionPayout(null)).toBe(false);
  });

  it('detects webhook capability', () => {
    expect(
      hasWebhookCapability({
        validateWebhook: async () => true,
        parseWebhookEvent: async () => ({
          eventType: 'x',
          providerKey: 'y',
          payload: {},
        }),
      }),
    ).toBe(true);
    expect(hasWebhookCapability({ validateWebhook: async () => true })).toBe(false);
  });
});

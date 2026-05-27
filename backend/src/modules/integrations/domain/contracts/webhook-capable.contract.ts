import type { ProviderMetadata } from './margin-inquiry.contract.js';

export type WebhookEvent = {
  eventId?: string;
  eventType: string;
  providerKey: string;
  occurredAt?: string;
  payload: unknown;
  metadata?: ProviderMetadata;
};

export type WebhookValidationInput = {
  headers: Record<string, string | string[] | undefined>;
  rawBody: string;
  metadata?: ProviderMetadata;
};

export interface WebhookCapableProvider {
  validateWebhook(input: WebhookValidationInput): Promise<boolean>;
  parseWebhookEvent(input: WebhookValidationInput): Promise<WebhookEvent>;
}

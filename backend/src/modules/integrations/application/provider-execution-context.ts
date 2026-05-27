export type ProviderExecutionContext = {
  requestId: string;
  tenantId: string;
  providerKey: string;
  capability: string;
  operation: string;
  startedAt: Date;
  attempt: number;
  metadata?: Record<string, unknown>;
};

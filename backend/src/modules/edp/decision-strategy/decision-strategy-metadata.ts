export interface DecisionStrategyMetadata {
  strategyId: string;
  tenantId: string | null;
  correlationId: string;
  requestId: string | null;
  source: string | null;
  version: string | null;
  attributes: Readonly<Record<string, unknown>>;
}


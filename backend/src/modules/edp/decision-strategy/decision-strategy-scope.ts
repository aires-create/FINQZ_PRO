export interface DecisionStrategyScope {
  tenantId: string;
  tenantScope: string | null;
  domain: string | null;
  channel: string | null;
  product: string | null;
  campaign: string | null;
  version: string | null;
}

import type { DecisionStrategy } from './decision-strategy.js';
import type { DecisionStrategyFactory, DecisionStrategyFactoryInput } from './decision-strategy.js';
import type { DecisionStrategyMetadata } from './decision-strategy-metadata.js';
import type { DecisionStrategyScope } from './decision-strategy-scope.js';
import type { DecisionStrategyState } from './decision-strategy-state.js';

const normalizeText = (value: string): string => value.trim();

const normalizeOptionalText = (value?: string | null): string | null => {
  if (value == null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizeMetadata = (metadata: DecisionStrategyMetadata): DecisionStrategyMetadata => ({
  strategyId: normalizeText(metadata.strategyId),
  tenantId: normalizeOptionalText(metadata.tenantId),
  correlationId: normalizeText(metadata.correlationId),
  requestId: normalizeOptionalText(metadata.requestId),
  source: normalizeOptionalText(metadata.source),
  version: normalizeOptionalText(metadata.version),
  attributes: {
    ...(metadata.attributes ?? {}),
  },
});

const normalizeScope = (scope: DecisionStrategyScope): DecisionStrategyScope => ({
  tenantId: normalizeText(scope.tenantId),
  tenantScope: normalizeOptionalText(scope.tenantScope),
  domain: normalizeOptionalText(scope.domain),
  channel: normalizeOptionalText(scope.channel),
  product: normalizeOptionalText(scope.product),
  campaign: normalizeOptionalText(scope.campaign),
  version: normalizeOptionalText(scope.version),
});

const normalizeState = (state: DecisionStrategyState): DecisionStrategyState => ({
  status: normalizeText(state.status),
  version: normalizeText(state.version),
  active: Boolean(state.active),
  label: normalizeOptionalText(state.label),
});

export const createDecisionStrategyFactory = (): DecisionStrategyFactory => ({
  create(input: DecisionStrategyFactoryInput): DecisionStrategy {
    return {
      strategyId: normalizeText(input.strategyId),
      scope: normalizeScope(input.scope),
      metadata: normalizeMetadata(input.metadata),
      state: normalizeState(input.state),
    };
  },
});


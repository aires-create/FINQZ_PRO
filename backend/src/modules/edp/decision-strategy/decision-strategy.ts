import type { DecisionStrategyMetadata } from './decision-strategy-metadata.js';
import type { DecisionStrategyScope } from './decision-strategy-scope.js';
import type { DecisionStrategyState } from './decision-strategy-state.js';

export interface DecisionStrategy {
  strategyId: string;
  scope: DecisionStrategyScope;
  metadata: DecisionStrategyMetadata;
  state: DecisionStrategyState;
}

export interface DecisionStrategyResult {
  strategy: DecisionStrategy;
  metadata: DecisionStrategyMetadata;
  state: DecisionStrategyState;
}

export interface DecisionStrategyFactoryInput {
  strategyId: string;
  scope: DecisionStrategyScope;
  metadata: DecisionStrategyMetadata;
  state: DecisionStrategyState;
}

export interface DecisionStrategyFactory {
  create(input: DecisionStrategyFactoryInput): DecisionStrategy;
}


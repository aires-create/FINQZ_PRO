import type { DecisionContext } from './decision-context.js';
import type { DecisionInputs } from './decision-inputs.js';

export interface DecisionModelMetadata {
  modelId: string;
  tenantId: string | null;
  correlationId: string;
  requestId: string | null;
  source: string | null;
}

export interface DecisionModelState {
  modelType: string;
  modelVersion: string;
  status: string;
}

export interface DecisionModel {
  context: DecisionContext;
  inputs: DecisionInputs;
  metadata: DecisionModelMetadata;
  state: DecisionModelState;
}

export interface DecisionModelFactoryInput {
  context: DecisionContext;
  inputs: DecisionInputs;
  metadata: DecisionModelMetadata;
  state: DecisionModelState;
}

export interface DecisionModelFactory {
  create(input: DecisionModelFactoryInput): DecisionModel;
}

const normalizeText = (value: string): string => value.trim();

const normalizeOptionalText = (value?: string | null): string | null => {
  if (value == null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizeMetadata = (metadata: DecisionModelMetadata): DecisionModelMetadata => ({
  modelId: normalizeText(metadata.modelId),
  tenantId: normalizeOptionalText(metadata.tenantId),
  correlationId: normalizeText(metadata.correlationId),
  requestId: normalizeOptionalText(metadata.requestId),
  source: normalizeOptionalText(metadata.source),
});

const normalizeState = (state: DecisionModelState): DecisionModelState => ({
  modelType: normalizeText(state.modelType),
  modelVersion: normalizeText(state.modelVersion),
  status: normalizeText(state.status),
});

export const createDecisionModelFactory = (): DecisionModelFactory => ({
  create(input: DecisionModelFactoryInput): DecisionModel {
    return {
      context: input.context,
      inputs: input.inputs,
      metadata: normalizeMetadata(input.metadata),
      state: normalizeState(input.state),
    };
  },
});

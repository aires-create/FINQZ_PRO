export interface DecisionInputSource {
  sourceId: string;
  sourceType: string;
  sourceName: string;
  sourceVersion: string | null;
  transport: string | null;
}

export interface DecisionInputMetadata {
  requestId: string | null;
  correlationId: string;
  causationId: string | null;
  idempotencyKey: string | null;
  tenantId: string | null;
  source: string | null;
  attributes: Readonly<Record<string, unknown>>;
}

export interface DecisionInputSet {
  tenantId: string;
  tenantScope: string | null;
  executionId: string | null;
  principalId: string;
  principalType: string;
  principalRole: string | null;
  permissions: readonly string[];
  aggregateId: string;
  aggregateType: string;
  aggregateVersion: number | null;
  commandId: string;
  commandName: string;
  schemaVersion: string;
  payload: Readonly<Record<string, unknown>>;
}

export interface DecisionInputs {
  source: DecisionInputSource;
  metadata: DecisionInputMetadata;
  set: DecisionInputSet;
}

export interface DecisionInputsFactoryInput {
  source: DecisionInputSource;
  metadata: Pick<DecisionInputMetadata, 'requestId' | 'correlationId' | 'causationId' | 'idempotencyKey' | 'tenantId' | 'source'> & {
    attributes?: Record<string, unknown> | null;
  };
  set: DecisionInputSet;
}

export interface DecisionInputsFactory {
  create(input: DecisionInputsFactoryInput): DecisionInputs;
}

const normalizeText = (value: string): string => value.trim();

const normalizeOptionalText = (value?: string | null): string | null => {
  if (value == null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizeSource = (source: DecisionInputSource): DecisionInputSource => ({
  sourceId: normalizeText(source.sourceId),
  sourceType: normalizeText(source.sourceType),
  sourceName: normalizeText(source.sourceName),
  sourceVersion: normalizeOptionalText(source.sourceVersion),
  transport: normalizeOptionalText(source.transport),
});

const normalizeMetadata = (metadata: DecisionInputsFactoryInput['metadata']): DecisionInputMetadata => ({
  requestId: normalizeOptionalText(metadata.requestId),
  correlationId: normalizeText(metadata.correlationId),
  causationId: normalizeOptionalText(metadata.causationId),
  idempotencyKey: normalizeOptionalText(metadata.idempotencyKey),
  tenantId: normalizeOptionalText(metadata.tenantId),
  source: normalizeOptionalText(metadata.source),
  attributes: {
    ...(metadata.attributes ?? {}),
  },
});

const normalizeSet = (set: DecisionInputSet): DecisionInputSet => ({
  tenantId: normalizeText(set.tenantId),
  tenantScope: normalizeOptionalText(set.tenantScope),
  executionId: normalizeOptionalText(set.executionId),
  principalId: normalizeText(set.principalId),
  principalType: normalizeText(set.principalType),
  principalRole: normalizeOptionalText(set.principalRole),
  permissions: [...set.permissions],
  aggregateId: normalizeText(set.aggregateId),
  aggregateType: normalizeText(set.aggregateType),
  aggregateVersion: set.aggregateVersion ?? null,
  commandId: normalizeText(set.commandId),
  commandName: normalizeText(set.commandName),
  schemaVersion: normalizeText(set.schemaVersion),
  payload: {
    ...(set.payload ?? {}),
  },
});

export const createDecisionInputsFactory = (): DecisionInputsFactory => ({
  create(input: DecisionInputsFactoryInput): DecisionInputs {
    const source = normalizeSource(input.source);
    const metadata = normalizeMetadata(input.metadata);
    const set = normalizeSet(input.set);

    return {
      source,
      metadata,
      set,
    };
  },
});

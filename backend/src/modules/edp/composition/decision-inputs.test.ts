import { describe, expect, it } from 'vitest';

import { createDecisionInputsFactory } from './decision-inputs.js';
import { createDecisionInputsFactory as createDecisionInputsFactoryFromPublicApi } from './index.js';

describe('decision inputs skeleton', () => {
  it('creates normalized decision inputs with the canonical structural fields', () => {
    const factory = createDecisionInputsFactory();

    const inputs = factory.create({
      source: {
        sourceId: ' src-1 ',
        sourceType: ' command ',
        sourceName: ' RecommendDecision ',
        sourceVersion: ' 1 ',
        transport: ' http ',
      },
      metadata: {
        requestId: ' req-1 ',
        correlationId: ' corr-1 ',
        causationId: ' caus-1 ',
        idempotencyKey: ' idem-1 ',
        tenantId: ' tenant-a ',
        source: ' api ',
        attributes: {
          purpose: 'skeleton',
        },
      },
      set: {
        tenantId: ' tenant-a ',
        tenantScope: ' operations ',
        executionId: ' exec-1 ',
        principalId: ' user-1 ',
        principalType: ' analyst ',
        principalRole: ' reviewer ',
        permissions: ['read', 'write'],
        aggregateId: ' agg-1 ',
        aggregateType: ' Decision Aggregate ',
        aggregateVersion: 7,
        commandId: ' cmd-1 ',
        commandName: ' RecommendDecision ',
        schemaVersion: ' 1 ',
        payload: {
          amount: 123,
        },
      },
    });

    expect(inputs.source).toEqual({
      sourceId: 'src-1',
      sourceType: 'command',
      sourceName: 'RecommendDecision',
      sourceVersion: '1',
      transport: 'http',
    });
    expect(inputs.metadata).toEqual({
      requestId: 'req-1',
      correlationId: 'corr-1',
      causationId: 'caus-1',
      idempotencyKey: 'idem-1',
      tenantId: 'tenant-a',
      source: 'api',
      attributes: {
        purpose: 'skeleton',
      },
    });
    expect(inputs.set).toEqual({
      tenantId: 'tenant-a',
      tenantScope: 'operations',
      executionId: 'exec-1',
      principalId: 'user-1',
      principalType: 'analyst',
      principalRole: 'reviewer',
      permissions: ['read', 'write'],
      aggregateId: 'agg-1',
      aggregateType: 'Decision Aggregate',
      aggregateVersion: 7,
      commandId: 'cmd-1',
      commandName: 'RecommendDecision',
      schemaVersion: '1',
      payload: {
        amount: 123,
      },
    });
  });

  it('preserves metadata while staying free of business, provider, and persistence behavior', () => {
    const inputs = createDecisionInputsFactory().create({
      source: {
        sourceId: 'src-1',
        sourceType: 'command',
        sourceName: 'RecommendDecision',
        sourceVersion: null,
        transport: null,
      },
      metadata: {
        requestId: null,
        correlationId: 'corr-1',
        causationId: null,
        idempotencyKey: null,
        tenantId: null,
        source: null,
        attributes: null,
      },
      set: {
        tenantId: 'tenant-a',
        tenantScope: null,
        executionId: null,
        principalId: 'user-1',
        principalType: 'user',
        principalRole: null,
        permissions: [],
        aggregateId: 'agg-1',
        aggregateType: 'Decision Aggregate',
        aggregateVersion: null,
        commandId: 'cmd-1',
        commandName: 'RecommendDecision',
        schemaVersion: '1',
        payload: {},
      },
    });

    expect(Object.keys(inputs).sort()).toEqual(['metadata', 'set', 'source']);
    expect(inputs.metadata.correlationId).toBe('corr-1');
    expect(inputs.metadata.attributes).toEqual({});
    expect('evaluate' in inputs).toBe(false);
    expect('resolveStrategy' in inputs).toBe(false);
    expect('recommend' in inputs).toBe(false);
    expect('persist' in inputs).toBe(false);
    expect('save' in inputs).toBe(false);
    expect('provider' in inputs).toBe(false);
  });

  it('is exported through the public composition index', () => {
    expect(createDecisionInputsFactoryFromPublicApi).toBe(createDecisionInputsFactory);
  });
});

import { describe, expect, it } from 'vitest';

import { createDecisionContextFactory } from './decision-context.js';
import { createDecisionInputsFactory } from './decision-inputs.js';
import { createDecisionModelFactory } from './decision-model.js';
import { createDecisionModelFactory as createDecisionModelFactoryFromPublicApi } from './index.js';

describe('decision model skeleton', () => {
  it('creates a decision model that composes DecisionContext and DecisionInputs', () => {
    const context = createDecisionContextFactory().create({
      tenant: {
        tenantId: ' tenant-a ',
        tenantScope: ' operations ',
        executionId: ' exec-1 ',
      },
      principal: {
        principalId: ' user-1 ',
        actorType: ' analyst ',
        role: ' reviewer ',
        permissions: ['read'],
        source: ' api ',
      },
      aggregate: {
        aggregateId: ' agg-1 ',
        aggregateType: ' Decision Aggregate ',
        aggregateVersion: 7,
      },
      command: {
        commandId: ' cmd-1 ',
        commandName: ' RecommendDecision ',
        schemaVersion: ' 1 ',
        source: ' http ',
      },
      correlationId: ' corr-1 ',
      causationId: ' caus-1 ',
      idempotencyKey: ' idem-1 ',
      audit: {
        requestId: ' req-1 ',
        actorId: ' actor-1 ',
        actorType: ' user ',
        source: ' ui ',
        tenantId: ' tenant-a ',
      },
      metadata: {
        purpose: 'context',
      },
    });

    const inputs = createDecisionInputsFactory().create({
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
          purpose: 'inputs',
        },
      },
      set: {
        tenantId: ' tenant-a ',
        tenantScope: ' operations ',
        executionId: ' exec-1 ',
        principalId: ' user-1 ',
        principalType: ' analyst ',
        principalRole: ' reviewer ',
        permissions: ['read'],
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

    const model = createDecisionModelFactory().create({
      context,
      inputs,
      metadata: {
        modelId: ' model-1 ',
        tenantId: ' tenant-a ',
        correlationId: ' corr-1 ',
        requestId: ' req-1 ',
        source: ' api ',
      },
      state: {
        modelType: ' decision ',
        modelVersion: ' 1 ',
        status: ' structured ',
      },
    });

    expect(model.context).toBe(context);
    expect(model.inputs).toBe(inputs);
    expect(model.metadata).toEqual({
      modelId: 'model-1',
      tenantId: 'tenant-a',
      correlationId: 'corr-1',
      requestId: 'req-1',
      source: 'api',
    });
    expect(model.state).toEqual({
      modelType: 'decision',
      modelVersion: '1',
      status: 'structured',
    });
  });

  it('keeps the model free of behavior, providers, persistence, and inferred decisions', () => {
    const model = createDecisionModelFactory().create({
      context: createDecisionContextFactory().create({
        tenant: {
          tenantId: 'tenant-a',
          tenantScope: null,
          executionId: null,
        },
        principal: {
          principalId: 'user-1',
          actorType: 'user',
          role: null,
          permissions: [],
          source: null,
        },
        aggregate: {
          aggregateId: 'agg-1',
          aggregateType: 'Decision Aggregate',
          aggregateVersion: null,
        },
        command: {
          commandId: 'cmd-1',
          commandName: 'RecommendDecision',
          schemaVersion: '1',
          source: 'http',
        },
        correlationId: 'corr-1',
        audit: {
          requestId: null,
          actorId: null,
          actorType: null,
          source: null,
          tenantId: null,
        },
      }),
      inputs: createDecisionInputsFactory().create({
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
      }),
      metadata: {
        modelId: 'model-1',
        tenantId: null,
        correlationId: 'corr-1',
        requestId: null,
        source: null,
      },
      state: {
        modelType: 'decision',
        modelVersion: '1',
        status: 'structured',
      },
    });

    expect(Object.keys(model).sort()).toEqual(['context', 'inputs', 'metadata', 'state']);
    expect('evaluate' in model).toBe(false);
    expect('resolveStrategy' in model).toBe(false);
    expect('recommend' in model).toBe(false);
    expect('persist' in model).toBe(false);
    expect('save' in model).toBe(false);
    expect('provider' in model).toBe(false);
  });

  it('is exported through the public composition index', () => {
    expect(createDecisionModelFactoryFromPublicApi).toBe(createDecisionModelFactory);
  });
});

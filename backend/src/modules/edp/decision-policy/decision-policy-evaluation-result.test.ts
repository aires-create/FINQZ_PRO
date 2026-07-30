import { describe, expect, it } from 'vitest';

import { createDecisionPolicyEvaluator } from './decision-policy-evaluator.js';
import { createDecisionPolicyFactory } from './decision-policy.js';
import { createDecisionModelFactory } from '../composition/decision-model.js';
import { createDecisionContextFactory } from '../composition/decision-context.js';
import { createDecisionInputsFactory } from '../composition/decision-inputs.js';

describe('decision policy evaluation result skeleton', () => {
  it('keeps result shape structural and read only in intent', () => {
    const context = createDecisionContextFactory().create({
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
    });

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

    const policy = createDecisionPolicyFactory().create({
      policyId: 'policy-1',
      scope: {
        tenantId: 'tenant-a',
        tenantScope: null,
        domain: null,
        commandName: null,
        modelType: null,
        version: null,
      },
      metadata: {
        policyId: 'policy-1',
        tenantId: null,
        correlationId: 'corr-1',
        requestId: null,
        source: null,
        version: null,
        attributes: null,
      },
      state: {
        status: 'active',
        version: '1',
        active: false,
        label: null,
      },
    });

    const model = createDecisionModelFactory().create({
      context,
      inputs,
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

    const result = createDecisionPolicyEvaluator().evaluate(model, policy);

    expect(Object.keys(result).sort()).toEqual(['evaluation', 'policyState', 'state']);
    expect(Object.keys(result.state).sort()).toEqual([
      'evaluationVersion',
      'modelVersion',
      'policyVersion',
      'status',
    ]);
    expect('persist' in result.state).toBe(false);
    expect('provider' in result.state).toBe(false);
    expect('decision' in result.state).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';

import { createDecisionContextFactory } from '../composition/decision-context.js';
import { createDecisionInputsFactory } from '../composition/decision-inputs.js';
import { createDecisionModelFactory } from '../composition/decision-model.js';
import { createDecisionPolicyFactory } from './decision-policy.js';
import { createDecisionPolicyEvaluationFactory } from './decision-policy-evaluation-factory.js';
import { createDecisionPolicyEvaluator } from './decision-policy-evaluator.js';
import { createDecisionPolicyEvaluator as createDecisionPolicyEvaluatorFromPublicApi } from './index.js';

describe('decision policy evaluation skeleton', () => {
  const buildDecisionModel = () => {
    const context = createDecisionContextFactory().create({
      tenant: {
        tenantId: 'tenant-a',
        tenantScope: 'operations',
        executionId: 'exec-1',
      },
      principal: {
        principalId: 'user-1',
        actorType: 'analyst',
        role: 'reviewer',
        permissions: ['read'],
        source: 'api',
      },
      aggregate: {
        aggregateId: 'agg-1',
        aggregateType: 'Decision Aggregate',
        aggregateVersion: 1,
      },
      command: {
        commandId: 'cmd-1',
        commandName: 'RecommendDecision',
        schemaVersion: '1',
        source: 'http',
      },
      correlationId: 'corr-1',
      causationId: 'caus-1',
      idempotencyKey: 'idem-1',
      audit: {
        requestId: 'req-1',
        actorId: 'actor-1',
        actorType: 'user',
        source: 'ui',
        tenantId: 'tenant-a',
      },
      metadata: {
        purpose: 'model',
      },
    });

    const inputs = createDecisionInputsFactory().create({
      source: {
        sourceId: 'src-1',
        sourceType: 'command',
        sourceName: 'RecommendDecision',
        sourceVersion: '1',
        transport: 'http',
      },
      metadata: {
        requestId: 'req-1',
        correlationId: 'corr-1',
        causationId: 'caus-1',
        idempotencyKey: 'idem-1',
        tenantId: 'tenant-a',
        source: 'api',
        attributes: {
          purpose: 'inputs',
        },
      },
      set: {
        tenantId: 'tenant-a',
        tenantScope: 'operations',
        executionId: 'exec-1',
        principalId: 'user-1',
        principalType: 'analyst',
        principalRole: 'reviewer',
        permissions: ['read'],
        aggregateId: 'agg-1',
        aggregateType: 'Decision Aggregate',
        aggregateVersion: 1,
        commandId: 'cmd-1',
        commandName: 'RecommendDecision',
        schemaVersion: '1',
        payload: {
          amount: 100,
        },
      },
    });

    return createDecisionModelFactory().create({
      context,
      inputs,
      metadata: {
        modelId: 'model-1',
        tenantId: 'tenant-a',
        correlationId: 'corr-1',
        requestId: 'req-1',
        source: 'api',
      },
      state: {
        modelType: 'decision',
        modelVersion: '1',
        status: 'structured',
      },
    });
  };

  const buildPolicy = () =>
    createDecisionPolicyFactory().create({
      policyId: 'policy-1',
      scope: {
        tenantId: 'tenant-a',
        tenantScope: 'operations',
        domain: 'decision',
        commandName: 'RecommendDecision',
        modelType: 'decision',
        version: '1',
      },
      metadata: {
        policyId: 'policy-1',
        tenantId: 'tenant-a',
        correlationId: 'corr-1',
        requestId: 'req-1',
        source: 'api',
        version: '1',
        attributes: {
          channel: 'manual',
        },
      },
      state: {
        status: 'active',
        version: '1',
        active: true,
        label: 'policy-a',
      },
    });

  it('creates an evaluation envelope from model and policy structures', () => {
    const evaluation = createDecisionPolicyEvaluationFactory().create({
      model: buildDecisionModel(),
      policy: buildPolicy(),
      metadata: {
        requestId: 'req-1',
        source: 'api',
        attributes: {
          channel: 'manual',
        },
      },
    });

    expect(evaluation.model.metadata.modelId).toBe('model-1');
    expect(evaluation.policy.policyId).toBe('policy-1');
    expect(evaluation.metadata.evaluationId).toBe('model-1:policy-1');
    expect(evaluation.metadata.policyId).toBe('policy-1');
    expect(evaluation.metadata.modelId).toBe('model-1');
  });

  it('evaluates without business logic, persistence, providers, or strategic decisions', () => {
    const result = createDecisionPolicyEvaluator().evaluate(buildDecisionModel(), buildPolicy());

    expect(result.evaluation.model.metadata.modelId).toBe('model-1');
    expect(result.evaluation.policy.policyId).toBe('policy-1');
    expect(result.state).toEqual({
      status: 'structured',
      evaluationVersion: '1',
      policyVersion: '1',
      modelVersion: '1',
    });
    expect(result.policyState).toEqual({
      status: 'active',
      version: '1',
      active: true,
      label: 'policy-a',
    });
    expect('recommend' in result).toBe(false);
    expect('persist' in result).toBe(false);
    expect('provider' in result).toBe(false);
    expect('resolveStrategy' in result).toBe(false);
  });

  it('is exported through the public decision-policy index', () => {
    expect(createDecisionPolicyEvaluatorFromPublicApi).toBe(createDecisionPolicyEvaluator);
  });
});


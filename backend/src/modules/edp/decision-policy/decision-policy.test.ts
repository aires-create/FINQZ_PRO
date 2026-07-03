import { describe, expect, it } from 'vitest';

import { createDecisionModelFactory } from '../composition/decision-model.js';
import { createDecisionInputsFactory } from '../composition/decision-inputs.js';
import { createDecisionPolicyFactory } from './decision-policy.js';
import { createDecisionPolicyFactory as createDecisionPolicyFactoryFromPublicApi } from './index.js';

describe('decision policy skeleton', () => {
  it('creates a normalized policy with canonical structural fields', () => {
    const policy = createDecisionPolicyFactory().create({
      policyId: ' policy-1 ',
      scope: {
        tenantId: ' tenant-a ',
        tenantScope: ' operations ',
        domain: ' decision ',
        commandName: ' RecommendDecision ',
        modelType: ' decision ',
        version: ' 1 ',
      },
      metadata: {
        policyId: ' policy-1 ',
        tenantId: ' tenant-a ',
        correlationId: ' corr-1 ',
        requestId: ' req-1 ',
        source: ' api ',
        version: ' 1 ',
        attributes: {
          channel: 'manual',
        },
      },
      state: {
        status: ' active ',
        version: ' 1 ',
        active: true,
        label: ' policy-a ',
      },
    });

    expect(policy.policyId).toBe('policy-1');
    expect(policy.scope).toEqual({
      tenantId: 'tenant-a',
      tenantScope: 'operations',
      domain: 'decision',
      commandName: 'RecommendDecision',
      modelType: 'decision',
      version: '1',
    });
    expect(policy.metadata).toEqual({
      policyId: 'policy-1',
      tenantId: 'tenant-a',
      correlationId: 'corr-1',
      requestId: 'req-1',
      source: 'api',
      version: '1',
      attributes: {
        channel: 'manual',
      },
    });
    expect(policy.state).toEqual({
      status: 'active',
      version: '1',
      active: true,
      label: 'policy-a',
    });
  });

  it('stays free of business logic, providers, persistence, and decision evaluation', () => {
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

    expect(Object.keys(policy).sort()).toEqual(['metadata', 'policyId', 'scope', 'state']);
    expect('evaluate' in policy).toBe(false);
    expect('persist' in policy).toBe(false);
    expect('provider' in policy).toBe(false);
    expect('strategy' in policy).toBe(false);
  });

  it('is exported through the public decision-policy index', () => {
    expect(createDecisionPolicyFactoryFromPublicApi).toBe(createDecisionPolicyFactory);
  });
});


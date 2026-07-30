import { describe, expect, it } from 'vitest';

import { createDecisionStrategyFactory } from '../../../modules/edp/decision-strategy/decision-strategy-factory.js';
import { createDecisionStrategyFactory as createDecisionStrategyFactoryFromPublicApi } from '../../../modules/edp/decision-strategy/index.js';
import type { DecisionStrategyDefinitionState } from '../../../modules/edp/index.js';

describe('decision strategy skeleton', () => {
  it('creates a normalized strategy with canonical structural fields', () => {
    const strategy = createDecisionStrategyFactory().create({
      strategyId: ' strategy-1 ',
      scope: {
        tenantId: ' tenant-a ',
        tenantScope: ' operations ',
        domain: ' decision ',
        channel: ' retail ',
        product: ' credit ',
        campaign: ' campaign-a ',
        version: ' 1 ',
      },
      metadata: {
        strategyId: ' strategy-1 ',
        tenantId: ' tenant-a ',
        correlationId: ' corr-1 ',
        requestId: ' req-1 ',
        source: ' api ',
        version: ' 1 ',
        attributes: {
          objective: 'conversion',
        },
      },
      state: {
        status: ' active ',
        version: ' 1 ',
        active: true,
        label: ' strategy-a ',
      },
    });

    const definitionState: DecisionStrategyDefinitionState = strategy.state;

    expect(strategy.strategyId).toBe('strategy-1');
    expect(strategy.scope).toEqual({
      tenantId: 'tenant-a',
      tenantScope: 'operations',
      domain: 'decision',
      channel: 'retail',
      product: 'credit',
      campaign: 'campaign-a',
      version: '1',
    });
    expect(strategy.metadata).toEqual({
      strategyId: 'strategy-1',
      tenantId: 'tenant-a',
      correlationId: 'corr-1',
      requestId: 'req-1',
      source: 'api',
      version: '1',
      attributes: {
        objective: 'conversion',
      },
    });
    expect(strategy.state).toEqual({
      status: 'active',
      version: '1',
      active: true,
      label: 'strategy-a',
    });
    expect(definitionState.status).toBe('active');
  });

  it('stays free of business logic, providers, persistence, and future runtime behavior', () => {
    const strategy = createDecisionStrategyFactory().create({
      strategyId: 'strategy-1',
      scope: {
        tenantId: 'tenant-a',
        tenantScope: null,
        domain: null,
        channel: null,
        product: null,
        campaign: null,
        version: null,
      },
      metadata: {
        strategyId: 'strategy-1',
        tenantId: null,
        correlationId: 'corr-1',
        requestId: null,
        source: null,
        version: null,
        attributes: {},
      },
      state: {
        status: 'draft',
        version: '1',
        active: false,
        label: null,
      },
    });

    expect(Object.keys(strategy).sort()).toEqual(['metadata', 'scope', 'state', 'strategyId']);
    expect('resolve' in strategy).toBe(false);
    expect('recommend' in strategy).toBe(false);
    expect('persist' in strategy).toBe(false);
    expect('provider' in strategy).toBe(false);
    expect('simulate' in strategy).toBe(false);
  });

  it('is exported through the public decision-strategy index', () => {
    expect(createDecisionStrategyFactoryFromPublicApi).toBe(createDecisionStrategyFactory);
  });
});

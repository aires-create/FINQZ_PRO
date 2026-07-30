import { describe, expect, it } from 'vitest';

import { createDecisionContextFactory } from './decision-context.js';
import { createDecisionContextFactory as createDecisionContextFactoryFromPublicApi } from './index.js';

describe('decision context skeleton', () => {
  it('creates a normalized decision context with the canonical entry fields', () => {
    const factory = createDecisionContextFactory();

    const context = factory.create({
      tenant: {
        tenantId: ' tenant-a ',
        tenantScope: ' operations ',
        executionId: ' exec-1 ',
      },
      principal: {
        principalId: ' user-1 ',
        actorType: ' analyst ',
        role: ' reviewer ',
        permissions: ['read', 'write'],
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
        purpose: 'skeleton',
      },
    });

    expect(context.tenant).toEqual({
      tenantId: 'tenant-a',
      tenantScope: 'operations',
      executionId: 'exec-1',
    });
    expect(context.principal).toEqual({
      principalId: 'user-1',
      actorType: 'analyst',
      role: 'reviewer',
      permissions: ['read', 'write'],
      source: 'api',
    });
    expect(context.correlationId).toBe('corr-1');
    expect(context.causationId).toBe('caus-1');
    expect(context.idempotencyKey).toBe('idem-1');
    expect(context.execution.correlationId).toBe('corr-1');
    expect(context.metadata.attributes).toEqual({ purpose: 'skeleton' });
  });

  it('keeps the context as a structural envelope without business, provider, or persistence behavior', () => {
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

    expect(Object.keys(context).sort()).toEqual(
      ['aggregate', 'audit', 'command', 'correlationId', 'causationId', 'execution', 'idempotencyKey', 'metadata', 'principal', 'tenant']
        .sort(),
    );
    expect('evaluate' in context).toBe(false);
    expect('resolveStrategy' in context).toBe(false);
    expect('recommend' in context).toBe(false);
    expect('persist' in context).toBe(false);
    expect('save' in context).toBe(false);
    expect('provider' in context).toBe(false);
  });

  it('is exported through the public composition index', () => {
    expect(createDecisionContextFactoryFromPublicApi).toBe(createDecisionContextFactory);
  });
});

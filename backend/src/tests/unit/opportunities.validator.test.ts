import { describe, expect, it } from 'vitest';

import {
  createOpportunityBodySchema,
  listOpportunitiesQuerySchema,
  moveOpportunityStageBodySchema,
  updateOpportunityBodySchema,
} from '../../modules/opportunities/validators/opportunities.validator.js';

describe('opportunities validators', () => {
  it('create válido', () => {
    const result = createOpportunityBodySchema.parse({
      title: 'Opportunity A',
      amount: 15000,
      pipelineId: '11111111-1111-1111-1111-111111111111',
      stageId: '22222222-2222-2222-2222-222222222222',
      customerId: '33333333-3333-3333-3333-333333333333',
    });

    expect(result.title).toBe('Opportunity A');
    expect(result.amount).toBe(15000);
  });

  it('create sem title falha', () => {
    expect(() =>
      createOpportunityBodySchema.parse({
        amount: 15000,
        pipelineId: '11111111-1111-1111-1111-111111111111',
        stageId: '22222222-2222-2222-2222-222222222222',
      }),
    ).toThrow();
  });

  it('create sem amount falha', () => {
    expect(() =>
      createOpportunityBodySchema.parse({
        title: 'Opportunity A',
        pipelineId: '11111111-1111-1111-1111-111111111111',
        stageId: '22222222-2222-2222-2222-222222222222',
      }),
    ).toThrow();
  });

  it('create com tenantId no body falha', () => {
    expect(() =>
      createOpportunityBodySchema.parse({
        title: 'Opportunity A',
        amount: 15000,
        pipelineId: '11111111-1111-1111-1111-111111111111',
        stageId: '22222222-2222-2222-2222-222222222222',
        tenantId: '44444444-4444-4444-4444-444444444444',
      }),
    ).toThrow();
  });

  it('update com campo proibido falha', () => {
    expect(() =>
      updateOpportunityBodySchema.parse({
        title: 'New title',
        deletedAt: '2026-06-01T12:00:00.000Z',
      }),
    ).toThrow();
  });

  it('move sem stageId falha', () => {
    expect(() =>
      moveOpportunityStageBodySchema.parse({
        reason: 'Need to move',
      }),
    ).toThrow();
  });

  it('move com campos obsoletos falha', () => {
    expect(() =>
      moveOpportunityStageBodySchema.parse({
        stageId: '22222222-2222-2222-2222-222222222222',
        status: 'won',
        reason: 'legacy field',
      }),
    ).toThrow();
  });

  it('query page/limit valida corretamente', () => {
    const result = listOpportunitiesQuerySchema.parse({
      page: '2',
      limit: '50',
    });

    expect(result.page).toBe(2);
    expect(result.limit).toBe(50);
  });
});

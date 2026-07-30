import { describe, expect, it } from 'vitest';

import { EDP_COMMAND_CATALOG } from '../contracts/commands.js';
import { EDP_EVENT_CATALOG } from '../contracts/events.js';
import { EDP_QUERY_CATALOG } from '../contracts/queries.js';
import { EDP_LIFECYCLES } from '../domain/lifecycles.js';

describe('EDP runtime foundation', () => {
  it('keeps the canonical command catalog intact', () => {
    expect(EDP_COMMAND_CATALOG).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'CreateDecisionStrategy' }),
        expect.objectContaining({ name: 'RollbackDecisionStrategy' }),
        expect.objectContaining({ name: 'CreateSimulation' }),
        expect.objectContaining({
          name: 'SelectOffer',
          owner: 'Ranking',
          primaryEvent: 'simulation.offer.selected',
        }),
      ]),
    );
  });

  it('keeps the canonical event catalog intact', () => {
    expect(EDP_EVENT_CATALOG).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'audit.event.recorded',
          domainOwner: 'Audit Center',
          aggregateOwner: 'Audit Timeline Aggregate',
        }),
        expect.objectContaining({ name: 'strategy.version.rollbacked' }),
        expect.objectContaining({ name: 'simulation.calculation.requested' }),
      ]),
    );
  });

  it('keeps the canonical query catalog intact', () => {
    expect(EDP_QUERY_CATALOG).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'GetAuditTimeline' }),
        expect.objectContaining({ name: 'GetDecisionStrategies' }),
      ]),
    );
  });

  it('exposes lifecycle state machines for the approved aggregates', () => {
    expect(EDP_LIFECYCLES.decision.initialState).toBe('drafted');
    expect(EDP_LIFECYCLES.decisionStrategy.transitions.created).toContain('approved');
    expect(EDP_LIFECYCLES.auditTimeline.terminalStates).toContain('purged_by_policy');
  });
});

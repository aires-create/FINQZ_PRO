import { describe, expect, it, vi } from 'vitest';

import type { EdpComposition } from '../../composition/edp.composition.js';
import { createEdpController } from './edp.controller.js';

const commandHandlerHandle = vi.fn();
const queryHandlerHandle = vi.fn();

vi.mock('../../application/command-handlers.js', () => ({
  edpCommandHandlers: {
    CreateDecisionStrategy: {
      handle: commandHandlerHandle,
    },
  },
}));

vi.mock('../../application/query-handlers.js', () => ({
  edpQueryHandlers: {
    GetAuditTimeline: {
      handle: queryHandlerHandle,
    },
  },
}));

const buildCommandRequest = (commandName: string) => ({
  params: { commandName },
  body: {
    commandId: 'cmd-1',
    correlationId: 'corr-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    actorType: 'user',
    source: 'test-suite',
    aggregateType: 'Simulation Aggregate',
    schemaVersion: '1',
    idempotencyKey: 'idem-1',
    timestamp: '2026-07-01T00:00:00.000Z',
  },
  id: 'request-1',
  currentTenant: { tenantId: 'tenant-1' },
  currentUser: { tenantId: 'tenant-1' },
  headers: {},
});

const buildQueryRequest = (queryName: string) => ({
  params: { queryName },
  body: {
    queryId: 'qry-1',
    correlationId: 'corr-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    actorType: 'user',
    source: 'test-suite',
    schemaVersion: '1',
    timestamp: '2026-07-01T00:00:00.000Z',
  },
  id: 'request-1',
  currentTenant: { tenantId: 'tenant-1' },
  currentUser: { tenantId: 'tenant-1' },
  headers: {},
});

describe('edp controller composition wiring', () => {
  it('uses composition use cases for covered commands', async () => {
    const execute = vi.fn().mockResolvedValue({
      responseId: 'response-1',
      correlationId: 'corr-1',
      tenantId: 'tenant-1',
      schemaVersion: '1',
      timestamp: '2026-07-01T00:00:00.000Z',
      success: true,
      data: { commandName: 'CreateSimulation' },
    });

    const composition = {
      repositoryRegistry: {} as never,
      unitOfWork: { run: vi.fn() } as never,
      useCases: {
        createSimulation: { execute },
        updateSimulationInput: { execute: vi.fn() },
        calculateSimulation: { execute: vi.fn() },
        generateProposal: { execute: vi.fn() },
        recommendDecision: { execute: vi.fn() },
        materializeOpportunity: { execute: vi.fn() },
        createOperationCandidate: { execute: vi.fn() },
        acceptProposal: { execute: vi.fn() },
        rejectProposal: { execute: vi.fn() },
      },
    } as unknown as EdpComposition;

    const controller = createEdpController({ composition });
    const reply = {
      send: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    await controller.handleCommand(buildCommandRequest('CreateSimulation') as never, reply as never);

    expect(execute).toHaveBeenCalledTimes(1);
    expect(commandHandlerHandle).not.toHaveBeenCalled();
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { commandName: 'CreateSimulation' },
        success: true,
      }),
    );
  });

  it('falls back to command handlers for unsupported commands', async () => {
    commandHandlerHandle.mockResolvedValueOnce({
      responseId: 'response-2',
      correlationId: 'corr-1',
      tenantId: 'tenant-1',
      schemaVersion: '1',
      timestamp: '2026-07-01T00:00:00.000Z',
      success: true,
      data: { commandName: 'CreateDecisionStrategy' },
    });

    const composition = {
      repositoryRegistry: {} as never,
      unitOfWork: { run: vi.fn() } as never,
      useCases: {
        createSimulation: { execute: vi.fn() },
        updateSimulationInput: { execute: vi.fn() },
        calculateSimulation: { execute: vi.fn() },
        generateProposal: { execute: vi.fn() },
        recommendDecision: { execute: vi.fn() },
        materializeOpportunity: { execute: vi.fn() },
        createOperationCandidate: { execute: vi.fn() },
        acceptProposal: { execute: vi.fn() },
        rejectProposal: { execute: vi.fn() },
      },
    } as unknown as EdpComposition;

    const controller = createEdpController({ composition });
    const reply = {
      send: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    await controller.handleCommand(buildCommandRequest('CreateDecisionStrategy') as never, reply as never);

    expect(commandHandlerHandle).toHaveBeenCalledTimes(1);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { commandName: 'CreateDecisionStrategy' },
        success: true,
      }),
    );
  });

  it('keeps query handling unchanged', async () => {
    queryHandlerHandle.mockResolvedValueOnce({
      responseId: 'response-3',
      correlationId: 'corr-1',
      tenantId: 'tenant-1',
      schemaVersion: '1',
      timestamp: '2026-07-01T00:00:00.000Z',
      success: true,
      data: { queryName: 'GetAuditTimeline' },
    });

    const composition = {
      repositoryRegistry: {} as never,
      unitOfWork: { run: vi.fn() } as never,
      useCases: {
        createSimulation: { execute: vi.fn() },
        updateSimulationInput: { execute: vi.fn() },
        calculateSimulation: { execute: vi.fn() },
        generateProposal: { execute: vi.fn() },
        recommendDecision: { execute: vi.fn() },
        materializeOpportunity: { execute: vi.fn() },
        createOperationCandidate: { execute: vi.fn() },
        acceptProposal: { execute: vi.fn() },
        rejectProposal: { execute: vi.fn() },
      },
    } as unknown as EdpComposition;

    const controller = createEdpController({ composition });
    const reply = {
      send: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    await controller.handleQuery(buildQueryRequest('GetAuditTimeline') as never, reply as never);

    expect(queryHandlerHandle).toHaveBeenCalledTimes(1);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { queryName: 'GetAuditTimeline' },
        success: true,
      }),
    );
  });
});


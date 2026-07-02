import { randomUUID } from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { generateAccessToken } from '../../utils/jwt.js';
import type { JWTPayload } from '../../types/index.js';

type FakeFailModes = {
  eventStoreAppend: boolean;
  outboxEnqueue: boolean;
  auditAppend: boolean;
  correlationUpsert: boolean;
  idempotencyRemember: boolean;
  idempotencyMarkProcessed: boolean;
};

type FakeState = {
  users: Map<string, Record<string, unknown>>;
  edpEventStore: Map<string, Record<string, unknown>>;
  edpOutboxMessage: Map<string, Record<string, unknown>>;
  edpAuditTimelineEvent: Map<string, Record<string, unknown>>;
  edpIdempotencyRecord: Map<string, Record<string, unknown>>;
  edpCorrelationRecord: Map<string, Record<string, unknown>>;
  securityEventLog: Array<Record<string, unknown>>;
  failModes: FakeFailModes;
};

type FakePrismaClient = {
  user: {
    findFirst: (args: { where: Record<string, unknown> }) => Promise<Record<string, unknown> | null>;
  };
  securityEventLog: {
    create: (args: { data: Record<string, unknown> }) => Promise<void>;
  };
  edpEventStore: {
    findFirst: (args: { where: Record<string, unknown> }) => Promise<Record<string, unknown> | null>;
    findMany: (args: { where: Record<string, unknown>; orderBy?: Record<string, unknown> }) => Promise<Record<string, unknown>[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  };
  edpOutboxMessage: {
    findFirst: (args: { where: Record<string, unknown> }) => Promise<Record<string, unknown> | null>;
    findMany: (args: { where: Record<string, unknown>; orderBy?: Record<string, unknown> }) => Promise<Record<string, unknown>[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  };
  edpAuditTimelineEvent: {
    findFirst: (args: { where: Record<string, unknown> }) => Promise<Record<string, unknown> | null>;
    findMany: (args: { where: Record<string, unknown>; orderBy?: Record<string, unknown> }) => Promise<Record<string, unknown>[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  };
  edpIdempotencyRecord: {
    findFirst: (args: { where: Record<string, unknown> }) => Promise<Record<string, unknown> | null>;
    upsert: (args: { where: Record<string, unknown>; create: Record<string, unknown>; update: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  };
  edpCorrelationRecord: {
    findFirst: (args: { where: Record<string, unknown> }) => Promise<Record<string, unknown> | null>;
    upsert: (args: { where: Record<string, unknown>; create: Record<string, unknown>; update: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  };
  $transaction: <T>(action: (transaction: FakePrismaClient) => Promise<T>) => Promise<T>;
  readonly __state: FakeState;
  __reset: () => void;
  __seedUser: (user: Record<string, unknown>) => void;
  __seedIdempotencyRecord: (record: Record<string, unknown>) => void;
  __setFailureModes: (modes: Partial<FakeFailModes>) => void;
};

const nowIso = '2026-07-01T00:00:00.000Z';
const tenantId = 'tenant-1';
const userId = 'user-1';
const commandName = 'CreateSimulation';
const queryName = 'GetAuditTimeline';
const commandPath = `/api/v1/edp/commands/${commandName}`;
const queryPath = `/api/v1/edp/queries/${queryName}`;
const runtimePath = '/api/v1/edp/runtime';

const baseJwtPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
  userId,
  tenantId,
  roleId: 'role-1',
  role: 'ROLE_ADMIN_SISTEMA',
  email: 'admin@finqz.com.br',
  permissions: ['edp:runtime'],
};

const buildTenantContextUser = () => ({
  id: userId,
  tenantId,
  deletedAt: null,
  isActive: true,
  organizationId: null,
  partnerId: null,
  userRoles: [
    {
      role: {
        id: 'role-1',
        name: 'Admin Sistema',
        slug: 'ROLE_ADMIN_SISTEMA',
        type: 'SYSTEM',
      },
    },
  ],
});

const matchesWhere = (row: Record<string, unknown>, where: Record<string, unknown>) =>
  Object.entries(where).every(([key, value]) => {
    if (value === undefined) {
      return true;
    }

    if (value === null) {
      return row[key] === null || row[key] === undefined;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return matchesWhere(
        (row[key] as Record<string, unknown> | undefined) ?? {},
        value as Record<string, unknown>,
      );
    }

    return row[key] === value;
  });

const cloneState = (state: FakeState): FakeState => structuredClone(state);

const buildInitialState = (): FakeState => ({
  users: new Map(),
  edpEventStore: new Map(),
  edpOutboxMessage: new Map(),
  edpAuditTimelineEvent: new Map(),
  edpIdempotencyRecord: new Map(),
  edpCorrelationRecord: new Map(),
  securityEventLog: [],
  failModes: {
    eventStoreAppend: false,
    outboxEnqueue: false,
    auditAppend: false,
    correlationUpsert: false,
    idempotencyRemember: false,
    idempotencyMarkProcessed: false,
  },
});

const createFakePrismaClient = (initialState?: Partial<FakeState>): FakePrismaClient => {
  let rootState: FakeState = {
    ...buildInitialState(),
    ...initialState,
    failModes: {
      ...buildInitialState().failModes,
      ...(initialState?.failModes ?? {}),
    },
  };

  const transactionStack: FakeState[] = [];
  const getState = () => transactionStack.at(-1) ?? rootState;

  let client: FakePrismaClient;

  const buildClient = (): FakePrismaClient => ({
    user: {
      findFirst: async ({ where }) => {
        const state = getState();
        const user = [...state.users.values()].find((row) => matchesWhere(row, where));
        return user ?? null;
      },
    },
    securityEventLog: {
      create: async ({ data }) => {
        getState().securityEventLog.push(data);
      },
    },
    edpEventStore: {
      findFirst: async ({ where }) =>
        [...getState().edpEventStore.values()].find((row) => matchesWhere(row, where)) ?? null,
      findMany: async ({ where, orderBy }) => {
        const rows = [...getState().edpEventStore.values()].filter((row) => matchesWhere(row, where));
        if (orderBy?.aggregateVersion === 'desc') {
          rows.sort((a, b) => Number(b.aggregateVersion ?? 0) - Number(a.aggregateVersion ?? 0));
        } else {
          rows.sort((a, b) => Number(a.aggregateVersion ?? 0) - Number(b.aggregateVersion ?? 0));
        }
        return rows;
      },
      create: async ({ data }) => {
        const state = getState();
        if (state.failModes.eventStoreAppend) {
          throw new Error('controlled event store failure');
        }

        const row = {
          ...data,
          eventId: data.eventId ?? randomUUID(),
          createdAt: data.createdAt ?? new Date(nowIso),
        };

        state.edpEventStore.set(String(row.eventId), row);
        return row;
      },
    },
    edpOutboxMessage: {
      findFirst: async ({ where }) =>
        [...getState().edpOutboxMessage.values()].find((row) => matchesWhere(row, where)) ?? null,
      findMany: async ({ where, orderBy }) => {
        const rows = [...getState().edpOutboxMessage.values()].filter((row) => matchesWhere(row, where));
        if (orderBy?.createdAt === 'asc') {
          rows.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
        }
        return rows;
      },
      create: async ({ data }) => {
        const state = getState();
        if (state.failModes.outboxEnqueue) {
          throw new Error('controlled outbox failure');
        }

        const row = {
          ...data,
          id: data.id ?? randomUUID(),
          createdAt: data.createdAt ?? new Date(nowIso),
          updatedAt: data.updatedAt ?? new Date(nowIso),
        };

        state.edpOutboxMessage.set(String(row.id), row);
        return row;
      },
      update: async ({ where, data }) => {
        const state = getState();
        const current = state.edpOutboxMessage.get(String(where.id));
        if (!current) {
          throw new Error('outbox row missing');
        }

        const row = {
          ...current,
          ...data,
          updatedAt: new Date(nowIso),
        };

        state.edpOutboxMessage.set(String(where.id), row);
        return row;
      },
    },
    edpAuditTimelineEvent: {
      findFirst: async ({ where }) =>
        [...getState().edpAuditTimelineEvent.values()].find((row) => matchesWhere(row, where)) ?? null,
      findMany: async ({ where, orderBy }) => {
        const rows = [...getState().edpAuditTimelineEvent.values()].filter((row) => matchesWhere(row, where));
        if (orderBy?.timestamp === 'asc') {
          rows.sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
        }
        return rows;
      },
      create: async ({ data }) => {
        const state = getState();
        if (state.failModes.auditAppend) {
          throw new Error('controlled audit failure');
        }

        const row = {
          ...data,
          id: data.id ?? randomUUID(),
          createdAt: data.createdAt ?? new Date(nowIso),
          updatedAt: data.updatedAt ?? new Date(nowIso),
        };

        state.edpAuditTimelineEvent.set(String(row.id), row);
        return row;
      },
    },
    edpIdempotencyRecord: {
      findFirst: async ({ where }) =>
        [...getState().edpIdempotencyRecord.values()].find((row) => matchesWhere(row, where)) ?? null,
      upsert: async ({ where, create, update }) => {
        const state = getState();
        if (state.failModes.idempotencyRemember) {
          throw new Error('controlled idempotency remember failure');
        }

        const key = `${String(where.tenantId_idempotencyKey.tenantId)}|${String(where.tenantId_idempotencyKey.idempotencyKey)}`;
        const existing = state.edpIdempotencyRecord.get(key);
        const row = existing
          ? { ...existing, ...update, updatedAt: new Date(nowIso) }
          : { ...create, createdAt: new Date(nowIso), updatedAt: new Date(nowIso) };

        state.edpIdempotencyRecord.set(key, row);
        return row;
      },
      update: async ({ where, data }) => {
        const state = getState();
        if (state.failModes.idempotencyMarkProcessed) {
          throw new Error('controlled idempotency markProcessed failure');
        }

        const current = [...state.edpIdempotencyRecord.values()].find((row) => row.id === where.id);
        if (!current) {
          throw new Error('idempotency row missing');
        }

        const updated = {
          ...current,
          ...data,
          updatedAt: new Date(nowIso),
        };

        state.edpIdempotencyRecord.set(`${String(updated.tenantId)}|${String(updated.idempotencyKey)}`, updated);
        return updated;
      },
    },
    edpCorrelationRecord: {
      findFirst: async ({ where }) =>
        [...getState().edpCorrelationRecord.values()].find((row) => matchesWhere(row, where)) ?? null,
      upsert: async ({ where, create, update }) => {
        const state = getState();
        if (state.failModes.correlationUpsert) {
          throw new Error('controlled correlation failure');
        }

        const key = `${String(where.tenantId_correlationId.tenantId)}|${String(where.tenantId_correlationId.correlationId)}`;
        const existing = state.edpCorrelationRecord.get(key);
        const row = existing
          ? { ...existing, ...update, updatedAt: new Date(nowIso) }
          : { ...create, createdAt: new Date(nowIso), updatedAt: new Date(nowIso) };

        state.edpCorrelationRecord.set(key, row);
        return row;
      },
    },
    $transaction: async <T>(action: (transaction: FakePrismaClient) => Promise<T>) => {
      const snapshot = cloneState(rootState);
      transactionStack.push(snapshot);
      try {
        const result = await action(client);
        rootState = snapshot;
        return result;
      } catch (error) {
        throw error;
      } finally {
        transactionStack.pop();
      }
    },
    get __state() {
      return rootState;
    },
    __reset: () => {
      rootState = buildInitialState();
      transactionStack.length = 0;
    },
    __seedUser: (user) => {
      rootState.users.set(String(user.id), user);
    },
    __seedIdempotencyRecord: (record) => {
      const key = `${String(record.tenantId)}|${String(record.idempotencyKey)}`;
      rootState.edpIdempotencyRecord.set(key, record);
    },
    __setFailureModes: (modes) => {
      rootState.failModes = {
        ...rootState.failModes,
        ...modes,
      };
    },
  });

  client = buildClient();
  return client;
};

function getPrismaMock() {
  return globalThis.__edpPrismaMock as FakePrismaClient;
}

declare global {
  // eslint-disable-next-line no-var
  var __edpPrismaMock: FakePrismaClient | undefined;
}

vi.mock('../../database/prisma.js', () => ({
  get prisma() {
    return getPrismaMock();
  },
}));

vi.mock('../../core/prisma/client.js', () => ({
  get prisma() {
    return getPrismaMock();
  },
}));

vi.mock('../../modules/security-events/index.js', () => ({
  hasRecordedSecurityEvent: vi.fn(() => false),
  recordRequestSecurityEvent: vi.fn(),
}));

let app: FastifyInstance | undefined;

const getApp = async () => {
  vi.resetModules();
  const { createApp } = await import('../../app.js');
  app = await createApp();
  await app.ready();

  return app;
};

const getToken = () =>
  generateAccessToken({
    ...baseJwtPayload,
  });

const commandEnvelope = (overrides: Partial<Record<string, unknown>> = {}) => ({
  commandId: 'cmd-1',
  correlationId: 'corr-1',
  causationId: 'cause-1',
  tenantId,
  userId,
  actorType: 'user',
  source: 'e2e-test-suite',
  aggregateId: 'sim-1',
  aggregateType: 'Simulation Aggregate',
  schemaVersion: '1',
  idempotencyKey: 'idem-1',
  timestamp: nowIso,
  metadata: { scenario: 'e2e' },
  securityContext: null,
  auditContext: null,
  ...overrides,
});

const queryEnvelope = (overrides: Partial<Record<string, unknown>> = {}) => ({
  queryId: 'qry-1',
  correlationId: 'corr-1',
  tenantId,
  userId,
  actorType: 'user',
  source: 'e2e-test-suite',
  schemaVersion: '1',
  timestamp: nowIso,
  metadata: { scenario: 'e2e' },
  securityContext: null,
  auditContext: null,
  ...overrides,
});

const stateCounts = () => {
  const prismaMock = getPrismaMock();
  return {
    eventStore: prismaMock.__state.edpEventStore.size,
    outbox: prismaMock.__state.edpOutboxMessage.size,
    audit: prismaMock.__state.edpAuditTimelineEvent.size,
    correlation: prismaMock.__state.edpCorrelationRecord.size,
    idempotency: prismaMock.__state.edpIdempotencyRecord.size,
  };
};

const expectNoOperationalWrites = () => {
  const counts = stateCounts();
  expect(stateCounts()).toEqual({
    ...counts,
    eventStore: 0,
    outbox: 0,
    audit: 0,
    correlation: 0,
  });
};

beforeEach(() => {
  globalThis.__edpPrismaMock = createFakePrismaClient();
  globalThis.__edpPrismaMock.__seedUser(buildTenantContextUser());
});

afterEach(async () => {
  if (app) {
    await app.close();
    app = undefined;
  }
});

describe('EDP end-to-end runtime validation', () => {
  it('keeps the runtime HTTP contract intact', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'GET',
      url: runtimePath,
      headers: {
        authorization: `Bearer ${getToken()}`,
      },
    });

    const payload = response.json();

    expect(response.statusCode).toBe(200);
    expect(payload).toEqual(
      expect.objectContaining({
        status: 'ready',
        service: 'EDP Runtime Foundation',
      }),
    );
    expect(payload.commands).toEqual(expect.arrayContaining(['CreateSimulation']));
    expect(payload.queries).toEqual(expect.arrayContaining(['GetAuditTimeline']));
  }, 30000);

  it('persists the command happy path across Event Store, Outbox, Audit Timeline, Correlation and Idempotency PROCESSED', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'POST',
      url: commandPath,
      headers: {
        authorization: `Bearer ${getToken()}`,
        'idempotency-key': 'idem-1',
        'x-correlation-id': 'corr-1',
      },
      payload: commandEnvelope(),
    });

    const payload = response.json();
    const prismaMock = getPrismaMock();
    const idempotencyRecord = [...prismaMock.__state.edpIdempotencyRecord.values()][0];

    expect(response.statusCode).toBe(200);
    expect(payload).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          commandName: 'CreateSimulation',
          accepted: true,
        }),
      }),
    );
    expect(stateCounts()).toEqual({
      eventStore: 1,
      outbox: 1,
      audit: 1,
      correlation: 1,
      idempotency: 1,
    });
    expect(idempotencyRecord).toMatchObject({
      idempotencyKey: 'idem-1',
      tenantId,
      commandName: 'CreateSimulation',
      status: 'PROCESSED',
      responseSnapshot: expect.objectContaining({
        responseId: expect.any(String),
      }),
    });
  }, 30000);

  it('returns 2xx for query HTTP without writing to the EDP persistence tables', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'POST',
      url: queryPath,
      headers: {
        authorization: `Bearer ${getToken()}`,
        'idempotency-key': 'query-idem-1',
      },
      payload: queryEnvelope(),
    });

    const payload = response.json();

    expect(response.statusCode).toBe(200);
    expect(payload).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          queryName: 'GetAuditTimeline',
          items: [],
        }),
      }),
    );
    expectNoOperationalWrites();
  }, 30000);

  it('blocks in-flight duplicates when idempotency is RECEIVED', async () => {
    globalThis.__edpPrismaMock.__seedIdempotencyRecord({
      id: 'idem-row-1',
      tenantId,
      idempotencyKey: 'idem-duplicate-received',
      commandName: 'CreateSimulation',
      commandHash: 'cmd-1',
      responseSnapshot: null,
      status: 'RECEIVED',
      expiresAt: new Date(nowIso),
      createdAt: new Date(nowIso),
      updatedAt: new Date(nowIso),
      deletedAt: null,
    });

    const server = await getApp();
    const response = await server.inject({
      method: 'POST',
      url: commandPath,
      headers: {
        authorization: `Bearer ${getToken()}`,
        'idempotency-key': 'idem-duplicate-received',
      },
      payload: commandEnvelope({
        commandId: 'cmd-duplicate-received',
        idempotencyKey: 'idem-duplicate-received',
        correlationId: 'corr-duplicate-received',
      }),
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual(
      expect.objectContaining({
        statusCode: 500,
        message: expect.stringContaining('Idempotency conflict'),
      }),
    );
    expect(stateCounts()).toEqual({
      eventStore: 0,
      outbox: 0,
      audit: 0,
      correlation: 0,
      idempotency: 1,
    });
  }, 30000);

  it('short-circuits processed duplicates safely without reexecuting persistence', async () => {
    globalThis.__edpPrismaMock.__seedIdempotencyRecord({
      id: 'idem-row-2',
      tenantId,
      idempotencyKey: 'idem-duplicate-processed',
      commandName: 'CreateSimulation',
      commandHash: 'cmd-1',
      responseSnapshot: { responseId: 'response-processed-1' },
      status: 'PROCESSED',
      expiresAt: new Date(nowIso),
      createdAt: new Date(nowIso),
      updatedAt: new Date(nowIso),
      deletedAt: null,
    });

    const server = await getApp();
    const response = await server.inject({
      method: 'POST',
      url: commandPath,
      headers: {
        authorization: `Bearer ${getToken()}`,
        'idempotency-key': 'idem-duplicate-processed',
      },
      payload: commandEnvelope({
        commandId: 'cmd-duplicate-processed',
        idempotencyKey: 'idem-duplicate-processed',
        correlationId: 'corr-duplicate-processed',
      }),
    });

    const payload = response.json();

    expect(response.statusCode).toBe(200);
    expect(payload).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          commandName: 'CreateSimulation',
          accepted: true,
          idempotent: true,
          replayed: true,
          responseId: 'response-processed-1',
        }),
      }),
    );
    expect(stateCounts()).toEqual({
      eventStore: 0,
      outbox: 0,
      audit: 0,
      correlation: 0,
      idempotency: 1,
    });
  }, 30000);

  it('rolls back all writes when a controlled failure happens inside the transaction', async () => {
    globalThis.__edpPrismaMock.__setFailureModes({
      auditAppend: true,
    });

    const server = await getApp();
    const response = await server.inject({
      method: 'POST',
      url: commandPath,
      headers: {
        authorization: `Bearer ${getToken()}`,
        'idempotency-key': 'idem-rollback',
      },
      payload: commandEnvelope({
        commandId: 'cmd-rollback',
        idempotencyKey: 'idem-rollback',
        correlationId: 'corr-rollback',
      }),
    });

    expect(response.statusCode).toBe(500);
    expectNoOperationalWrites();
  }, 30000);

  it('rejects invalid payloads before side effects occur', async () => {
    const server = await getApp();
    const response = await server.inject({
      method: 'POST',
      url: commandPath,
      headers: {
        authorization: `Bearer ${getToken()}`,
        'idempotency-key': 'idem-invalid-payload',
      },
      payload: {
        correlationId: 'corr-invalid',
        tenantId,
        userId,
        actorType: 'user',
        source: 'e2e-test-suite',
        aggregateType: 'Simulation Aggregate',
        schemaVersion: '1',
        timestamp: nowIso,
      },
    });

    expect(response.statusCode).toBe(400);
    expectNoOperationalWrites();
  }, 30000);
});

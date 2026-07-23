import { randomUUID } from 'node:crypto';

type RecordLike = Record<string, unknown>;

type FakeFailModes = {
  eventStoreAppend: boolean;
  outboxEnqueue: boolean;
  auditAppend: boolean;
  correlationUpsert: boolean;
  idempotencyRemember: boolean;
  idempotencyMarkProcessed: boolean;
};

type FakeState = {
  tenants: Map<string, RecordLike>;
  users: Map<string, RecordLike>;
  roles: Map<string, RecordLike>;
  userRoles: Map<string, RecordLike>;
  edpDecision: Map<string, RecordLike>;
  edpDecisionPolicy: Map<string, RecordLike>;
  edpDecisionStrategy: Map<string, RecordLike>;
  edpSimulation: Map<string, RecordLike>;
  edpRecommendation: Map<string, RecordLike>;
  edpProposal: Map<string, RecordLike>;
  edpProviderCapability: Map<string, RecordLike>;
  edpProviderExecution: Map<string, RecordLike>;
  edpOperationCandidate: Map<string, RecordLike>;
  edpAuditTimelineEvent: Map<string, RecordLike>;
  edpEventStore: Map<string, RecordLike>;
  edpOutboxMessage: Map<string, RecordLike>;
  edpIdempotencyRecord: Map<string, RecordLike>;
  edpCorrelationRecord: Map<string, RecordLike>;
  simulationRuntimeEvidence: Map<string, RecordLike>;
  failModes: FakeFailModes;
};

type FakeUserFindFirstArgs = {
  where: RecordLike;
};

type FakeTenantDeleteArgs = {
  where: {
    id: string;
  };
};

type FakeTenantCreateArgs = {
  data: RecordLike;
};

type FakeUserCreateArgs = {
  data: RecordLike;
};

type FakeTableFindArgs = {
  where: RecordLike;
  orderBy?: Record<string, unknown> | Array<Record<string, unknown>>;
};

type FakeTableCreateArgs = {
  data: RecordLike;
};

type FakeTableUpdateArgs = {
  where: RecordLike;
  data: RecordLike;
};

type FakeTableUpsertArgs = {
  where: RecordLike;
  create: RecordLike;
  update: RecordLike;
};

type FakeSimulationRuntimeEvidenceFindUniqueArgs = {
  where: {
    tenantId_campaignId_evidenceId: {
      tenantId: string;
      campaignId: string;
      evidenceId: string;
    };
  };
};

type FakeSimulationRuntimeEvidenceDeleteManyArgs = {
  where: {
    tenantId?: string;
  };
};

export type FakePrismaClient = {
  tenant: {
    create: (args: FakeTenantCreateArgs) => Promise<RecordLike>;
    delete: (args: FakeTenantDeleteArgs) => Promise<RecordLike>;
    findFirst: (args: FakeTableFindArgs) => Promise<RecordLike | null>;
  };
  user: {
    create: (args: FakeUserCreateArgs) => Promise<RecordLike>;
    findFirst: (args: FakeUserFindFirstArgs) => Promise<RecordLike | null>;
    findUnique: (args: FakeTableFindArgs) => Promise<RecordLike | null>;
  };
  role: {
    create: (args: FakeTableCreateArgs) => Promise<RecordLike>;
    findFirst: (args: FakeTableFindArgs) => Promise<RecordLike | null>;
  };
  userRole: {
    findFirst: (args: FakeTableFindArgs) => Promise<RecordLike | null>;
  };
  edpDecision: {
    findFirst: (args: FakeTableFindArgs) => Promise<RecordLike | null>;
    findMany: (args: FakeTableFindArgs) => Promise<RecordLike[]>;
    upsert: (args: FakeTableUpsertArgs) => Promise<RecordLike>;
  };
  edpDecisionPolicy: {
    findFirst: (args: FakeTableFindArgs) => Promise<RecordLike | null>;
    findMany: (args: FakeTableFindArgs) => Promise<RecordLike[]>;
    upsert: (args: FakeTableUpsertArgs) => Promise<RecordLike>;
  };
  edpDecisionStrategy: {
    findFirst: (args: FakeTableFindArgs) => Promise<RecordLike | null>;
    findMany: (args: FakeTableFindArgs) => Promise<RecordLike[]>;
    upsert: (args: FakeTableUpsertArgs) => Promise<RecordLike>;
  };
  edpSimulation: {
    findFirst: (args: FakeTableFindArgs) => Promise<RecordLike | null>;
    findMany: (args: FakeTableFindArgs) => Promise<RecordLike[]>;
    upsert: (args: FakeTableUpsertArgs) => Promise<RecordLike>;
  };
  edpRecommendation: {
    findFirst: (args: FakeTableFindArgs) => Promise<RecordLike | null>;
    findMany: (args: FakeTableFindArgs) => Promise<RecordLike[]>;
    upsert: (args: FakeTableUpsertArgs) => Promise<RecordLike>;
  };
  edpProposal: {
    findFirst: (args: FakeTableFindArgs) => Promise<RecordLike | null>;
    findMany: (args: FakeTableFindArgs) => Promise<RecordLike[]>;
    upsert: (args: FakeTableUpsertArgs) => Promise<RecordLike>;
  };
  edpProviderCapability: {
    findFirst: (args: FakeTableFindArgs) => Promise<RecordLike | null>;
    findMany: (args: FakeTableFindArgs) => Promise<RecordLike[]>;
    upsert: (args: FakeTableUpsertArgs) => Promise<RecordLike>;
  };
  edpProviderExecution: {
    findFirst: (args: FakeTableFindArgs) => Promise<RecordLike | null>;
    findMany: (args: FakeTableFindArgs) => Promise<RecordLike[]>;
    upsert: (args: FakeTableUpsertArgs) => Promise<RecordLike>;
  };
  edpOperationCandidate: {
    findFirst: (args: FakeTableFindArgs) => Promise<RecordLike | null>;
    findMany: (args: FakeTableFindArgs) => Promise<RecordLike[]>;
    upsert: (args: FakeTableUpsertArgs) => Promise<RecordLike>;
  };
  edpAuditTimelineEvent: {
    findFirst: (args: FakeTableFindArgs) => Promise<RecordLike | null>;
    findMany: (args: FakeTableFindArgs) => Promise<RecordLike[]>;
    create: (args: FakeTableCreateArgs) => Promise<RecordLike>;
  };
  edpEventStore: {
    findFirst: (args: FakeTableFindArgs) => Promise<RecordLike | null>;
    findMany: (args: FakeTableFindArgs) => Promise<RecordLike[]>;
    create: (args: FakeTableCreateArgs) => Promise<RecordLike>;
  };
  edpOutboxMessage: {
    findFirst: (args: FakeTableFindArgs) => Promise<RecordLike | null>;
    findMany: (args: FakeTableFindArgs) => Promise<RecordLike[]>;
    create: (args: FakeTableCreateArgs) => Promise<RecordLike>;
    update: (args: FakeTableUpdateArgs) => Promise<RecordLike>;
  };
  edpIdempotencyRecord: {
    findFirst: (args: FakeTableFindArgs) => Promise<RecordLike | null>;
    upsert: (args: FakeTableUpsertArgs) => Promise<RecordLike>;
    update: (args: FakeTableUpdateArgs) => Promise<RecordLike>;
  };
  edpCorrelationRecord: {
    findFirst: (args: FakeTableFindArgs) => Promise<RecordLike | null>;
    upsert: (args: FakeTableUpsertArgs) => Promise<RecordLike>;
  };
  simulationRuntimeEvidence: {
    findUnique: (args: FakeSimulationRuntimeEvidenceFindUniqueArgs) => Promise<RecordLike | null>;
    findMany: (args: FakeTableFindArgs) => Promise<RecordLike[]>;
    create: (args: FakeTableCreateArgs) => Promise<RecordLike>;
    deleteMany: (args: FakeSimulationRuntimeEvidenceDeleteManyArgs) => Promise<{ count: number }>;
  };
  $transaction: <T>(action: (transaction: FakePrismaClient) => Promise<T>) => Promise<T>;
  __state: FakeState;
  __reset: () => void;
  __seedTenant: (tenant: RecordLike) => void;
  __seedUser: (user: RecordLike) => void;
  __seedRole: (role: RecordLike) => void;
  __seedUserRole: (userRole: RecordLike) => void;
  __seedIdempotencyRecord: (record: RecordLike) => void;
  __setFailureModes: (modes: Partial<FakeFailModes>) => void;
};

const buildInitialState = (): FakeState => ({
  tenants: new Map(),
  users: new Map(),
  roles: new Map(),
  userRoles: new Map(),
  edpDecision: new Map(),
  edpDecisionPolicy: new Map(),
  edpDecisionStrategy: new Map(),
  edpSimulation: new Map(),
  edpRecommendation: new Map(),
  edpProposal: new Map(),
  edpProviderCapability: new Map(),
  edpProviderExecution: new Map(),
  edpOperationCandidate: new Map(),
  edpAuditTimelineEvent: new Map(),
  edpEventStore: new Map(),
  edpOutboxMessage: new Map(),
  edpIdempotencyRecord: new Map(),
  edpCorrelationRecord: new Map(),
  simulationRuntimeEvidence: new Map(),
  failModes: {
    eventStoreAppend: false,
    outboxEnqueue: false,
    auditAppend: false,
    correlationUpsert: false,
    idempotencyRemember: false,
    idempotencyMarkProcessed: false,
  },
});

const cloneState = (state: FakeState): FakeState => structuredClone(state);

const getString = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return undefined;
};

const matchesWhere = (row: RecordLike, where: RecordLike): boolean =>
  Object.entries(where).every(([key, value]) => {
    if (value === undefined) {
      return true;
    }

    if (value === null) {
      return row[key] === null || row[key] === undefined;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return matchesWhere((row[key] as RecordLike | undefined) ?? {}, value as RecordLike);
    }

    return row[key] === value;
  });

const sortRows = (rows: RecordLike[], orderBy?: Record<string, unknown> | Array<Record<string, unknown>>) => {
  if (!orderBy) {
    return rows;
  }

  const directives = Array.isArray(orderBy) ? orderBy : [orderBy];
  const sorted = [...rows];

  sorted.sort((left, right) => {
    for (const directive of directives) {
      const [field, direction] = Object.entries(directive)[0] ?? [];
      if (!field) {
        continue;
      }

      const leftValue = left[field];
      const rightValue = right[field];
      const leftText = leftValue instanceof Date ? leftValue.toISOString() : String(leftValue ?? '');
      const rightText = rightValue instanceof Date ? rightValue.toISOString() : String(rightValue ?? '');
      const comparison = leftText.localeCompare(rightText);

      if (comparison !== 0) {
        return direction === 'desc' ? -comparison : comparison;
      }
    }

    return 0;
  });

  return sorted;
};

const createKey = (...parts: Array<string | number | null | undefined>) => parts.map((part) => String(part ?? '')).join('|');

const createAggregateTable = (
  state: FakeState,
  table: keyof Pick<FakeState, 'edpDecision' | 'edpSimulation' | 'edpRecommendation' | 'edpProposal' | 'edpProviderCapability' | 'edpProviderExecution' | 'edpOperationCandidate'>,
) => ({
  findFirst: async ({ where }: FakeTableFindArgs) =>
    [...state[table].values()].find((row) => matchesWhere(row, where)) ?? null,
  findMany: async ({ where, orderBy }: FakeTableFindArgs) => {
    const rows = [...state[table].values()].filter((row) => matchesWhere(row, where));
    return sortRows(rows, orderBy);
  },
  upsert: async ({ where, create, update }: FakeTableUpsertArgs) => {
    const key = createKey(where.tenantId_aggregateId?.tenantId, where.tenantId_aggregateId?.aggregateId);
    const existing = state[table].get(key);
    const row = existing
      ? { ...existing, ...update, updatedAt: new Date() }
      : { ...create, createdAt: create.createdAt ?? new Date(), updatedAt: create.updatedAt ?? new Date() };

    state[table].set(key, row);
    return row;
  },
});

const createVersionTable = (
  state: FakeState,
  table: keyof Pick<FakeState, 'edpDecisionPolicy' | 'edpDecisionStrategy'>,
) => ({
  findFirst: async ({ where, orderBy }: FakeTableFindArgs) => {
    const rows = [...state[table].values()].filter((row) => matchesWhere(row, where));
    return sortRows(rows, orderBy)[0] ?? null;
  },
  findMany: async ({ where, orderBy }: FakeTableFindArgs) => {
    const rows = [...state[table].values()].filter((row) => matchesWhere(row, where));
    return sortRows(rows, orderBy);
  },
  upsert: async ({ where, create, update }: FakeTableUpsertArgs) => {
    const key = createKey(
      where.tenantId_aggregateId_version?.tenantId,
      where.tenantId_aggregateId_version?.aggregateId,
      where.tenantId_aggregateId_version?.version,
    );
    const existing = state[table].get(key);
    const row = existing
      ? { ...existing, ...update, updatedAt: new Date() }
      : { ...create, createdAt: create.createdAt ?? new Date(), updatedAt: create.updatedAt ?? new Date() };

    state[table].set(key, row);
    return row;
  },
});

const createSingleRowTable = (
  state: FakeState,
  table: keyof Pick<FakeState, 'edpAuditTimelineEvent' | 'edpOutboxMessage' | 'edpIdempotencyRecord' | 'edpCorrelationRecord' | 'simulationRuntimeEvidence'>,
) => ({
  findFirst: async ({ where }: FakeTableFindArgs) =>
    [...state[table].values()].find((row) => matchesWhere(row, where)) ?? null,
  findMany: async ({ where, orderBy }: FakeTableFindArgs) => {
    const rows = [...state[table].values()].filter((row) => matchesWhere(row, where));
    return sortRows(rows, orderBy);
  },
  create: async ({ data }: FakeTableCreateArgs) => {
    const row = {
      ...data,
      createdAt: data.createdAt ?? new Date(),
      updatedAt: data.updatedAt ?? new Date(),
    };

    const key = row.id ?? row.eventId ?? row.evidenceId ?? randomUUID();
    state[table].set(String(key), row);
    return row;
  },
});

const createSimulationRuntimeEvidenceTable = (state: FakeState) => ({
  findUnique: async ({ where }: FakeSimulationRuntimeEvidenceFindUniqueArgs) => {
    const identity = where.tenantId_campaignId_evidenceId;
    return [...state.simulationRuntimeEvidence.values()].find((row) =>
      row.tenantId === identity.tenantId &&
      row.campaignId === identity.campaignId &&
      row.evidenceId === identity.evidenceId,
    ) ?? null;
  },
  findMany: async ({ where, orderBy }: FakeTableFindArgs) => {
    const rows = [...state.simulationRuntimeEvidence.values()].filter((row) => matchesWhere(row, where));
    return sortRows(rows, orderBy);
  },
  create: async ({ data }: FakeTableCreateArgs) => {
    const row = {
      ...data,
      id: data.id ?? randomUUID(),
      createdAt: data.createdAt ?? new Date(),
    };

    state.simulationRuntimeEvidence.set(
      createKey(row.tenantId as string, row.campaignId as string, row.evidenceId as string),
      row,
    );
    return row;
  },
  deleteMany: async ({ where }: FakeSimulationRuntimeEvidenceDeleteManyArgs) => {
    let count = 0;

    for (const [key, row] of state.simulationRuntimeEvidence.entries()) {
      if (where.tenantId && row.tenantId !== where.tenantId) {
        continue;
      }

      state.simulationRuntimeEvidence.delete(key);
      count += 1;
    }

    return { count };
  },
});

const cascadeDeleteTenant = (state: FakeState, tenantId: string) => {
  state.tenants.delete(tenantId);

  for (const [key, user] of state.users.entries()) {
    if (user.tenantId === tenantId) {
      state.users.delete(key);
    }
  }

  for (const [key, role] of state.roles.entries()) {
    if (role.tenantId === tenantId) {
      state.roles.delete(key);
    }
  }

  for (const [key, userRole] of state.userRoles.entries()) {
    if (userRole.tenantId === tenantId) {
      state.userRoles.delete(key);
    }
  }

  const tables: Array<keyof Pick<FakeState, 'edpDecision' | 'edpDecisionPolicy' | 'edpDecisionStrategy' | 'edpSimulation' | 'edpRecommendation' | 'edpProposal' | 'edpProviderCapability' | 'edpProviderExecution' | 'edpOperationCandidate' | 'edpAuditTimelineEvent' | 'edpEventStore' | 'edpOutboxMessage' | 'edpIdempotencyRecord' | 'edpCorrelationRecord' | 'simulationRuntimeEvidence'>> = [
    'edpDecision',
    'edpDecisionPolicy',
    'edpDecisionStrategy',
    'edpSimulation',
    'edpRecommendation',
    'edpProposal',
    'edpProviderCapability',
    'edpProviderExecution',
    'edpOperationCandidate',
    'edpAuditTimelineEvent',
    'edpEventStore',
    'edpOutboxMessage',
    'edpIdempotencyRecord',
    'edpCorrelationRecord',
    'simulationRuntimeEvidence',
  ];

  for (const table of tables) {
    for (const [key, row] of state[table].entries()) {
      if (row.tenantId === tenantId) {
        state[table].delete(key);
      }
    }
  }
};

export const createFakePrismaClient = (initialState?: Partial<FakeState>): FakePrismaClient => {
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
    tenant: {
      create: async ({ data }) => {
        const row = {
          id: String(data.id ?? randomUUID()),
          name: String(data.name ?? 'tenant'),
          domain: data.domain ?? null,
          isActive: data.isActive ?? true,
          deletedAt: data.deletedAt ?? null,
          createdAt: data.createdAt ?? new Date(),
          updatedAt: data.updatedAt ?? new Date(),
          ...data,
        };

        getState().tenants.set(row.id, row);
        return row;
      },
      delete: async ({ where }) => {
        const state = getState();
        const row = state.tenants.get(where.id);
        if (!row) {
          throw new Error(`Tenant ${where.id} not found`);
        }

        cascadeDeleteTenant(state, where.id);
        return row;
      },
      findFirst: async ({ where }) =>
        [...getState().tenants.values()].find((row) => matchesWhere(row, where)) ?? null,
    },
    user: {
      create: async ({ data }) => {
        const row = {
          id: String(data.id ?? randomUUID()),
          tenantId: String(data.tenantId ?? data.tenant?.connect?.id ?? data.tenant?.connect?.tenantId ?? 'tenant-a'),
          email: String(data.email ?? 'user@example.test'),
          emailNormalized: String(data.emailNormalized ?? String(data.email ?? 'user@example.test').toLowerCase()),
          password: String(data.password ?? 'test-password'),
          firstName: String(data.firstName ?? 'Test'),
          lastName: String(data.lastName ?? 'User'),
          isActive: data.isActive ?? true,
          isEmailVerified: data.isEmailVerified ?? true,
          deletedAt: data.deletedAt ?? null,
          organizationId: data.organizationId ?? null,
          partnerId: data.partnerId ?? null,
          userRoles: data.userRoles ?? [],
          createdAt: data.createdAt ?? new Date(),
          updatedAt: data.updatedAt ?? new Date(),
          ...data,
        };

        getState().users.set(row.id, row);
        return row;
      },
      findFirst: async ({ where }) =>
        [...getState().users.values()].find((row) => matchesWhere(row, where)) ?? null,
      findUnique: async ({ where }) =>
        [...getState().users.values()].find((row) => matchesWhere(row, where)) ?? null,
    },
    role: {
      create: async ({ data }) => {
        const row = {
          id: String(data.id ?? randomUUID()),
          tenantId: String(data.tenantId ?? 'tenant-a'),
          name: String(data.name ?? 'Role'),
          slug: String(data.slug ?? 'ROLE_TEST'),
          type: data.type ?? 'SYSTEM',
          description: data.description ?? null,
          isSystem: data.isSystem ?? false,
          deletedAt: data.deletedAt ?? null,
          createdAt: data.createdAt ?? new Date(),
          updatedAt: data.updatedAt ?? new Date(),
          ...data,
        };

        getState().roles.set(row.id, row);
        return row;
      },
      findFirst: async ({ where }) =>
        [...getState().roles.values()].find((row) => matchesWhere(row, where)) ?? null,
    },
    userRole: {
      findFirst: async ({ where }) =>
        [...getState().userRoles.values()].find((row) => matchesWhere(row, where)) ?? null,
    },
    edpDecision: createAggregateTable(getState(), 'edpDecision'),
    edpDecisionPolicy: createVersionTable(getState(), 'edpDecisionPolicy'),
    edpDecisionStrategy: createVersionTable(getState(), 'edpDecisionStrategy'),
    edpSimulation: createAggregateTable(getState(), 'edpSimulation'),
    edpRecommendation: createAggregateTable(getState(), 'edpRecommendation'),
    edpProposal: createAggregateTable(getState(), 'edpProposal'),
    edpProviderCapability: createAggregateTable(getState(), 'edpProviderCapability'),
    edpProviderExecution: createAggregateTable(getState(), 'edpProviderExecution'),
    edpOperationCandidate: createAggregateTable(getState(), 'edpOperationCandidate'),
    edpAuditTimelineEvent: {
      ...createSingleRowTable(getState(), 'edpAuditTimelineEvent'),
      create: async ({ data }) => {
        const row = {
          id: String(data.id ?? randomUUID()),
          ...data,
          createdAt: data.createdAt ?? new Date(),
          updatedAt: data.updatedAt ?? new Date(),
        };

        getState().edpAuditTimelineEvent.set(row.id, row);
        return row;
      },
    },
    edpEventStore: {
      ...createSingleRowTable(getState(), 'edpEventStore'),
      create: async ({ data }) => {
        const row = {
          eventId: String(data.eventId ?? randomUUID()),
          ...data,
          createdAt: data.createdAt ?? new Date(),
        };

        getState().edpEventStore.set(row.eventId, row);
        return row;
      },
      findMany: async ({ where, orderBy }) => {
        const rows = [...getState().edpEventStore.values()].filter((row) => matchesWhere(row, where));
        return sortRows(rows, orderBy);
      },
      findFirst: async ({ where }) =>
        [...getState().edpEventStore.values()].find((row) => matchesWhere(row, where)) ?? null,
    },
    edpOutboxMessage: {
      ...createSingleRowTable(getState(), 'edpOutboxMessage'),
      create: async ({ data }) => {
        const row = {
          id: String(data.id ?? randomUUID()),
          ...data,
          createdAt: data.createdAt ?? new Date(),
          updatedAt: data.updatedAt ?? new Date(),
        };

        getState().edpOutboxMessage.set(row.id, row);
        return row;
      },
      update: async ({ where, data }) => {
        const current = getState().edpOutboxMessage.get(String(where.id));
        if (!current) {
          throw new Error('outbox row missing');
        }

        const row = {
          ...current,
          ...data,
          updatedAt: new Date(),
        };

        getState().edpOutboxMessage.set(String(where.id), row);
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

        const key = createKey(where.tenantId_idempotencyKey?.tenantId, where.tenantId_idempotencyKey?.idempotencyKey);
        const existing = state.edpIdempotencyRecord.get(key);
        const row = existing
          ? { ...existing, ...update, updatedAt: new Date() }
          : { ...create, createdAt: new Date(), updatedAt: new Date() };

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
          updatedAt: new Date(),
        };

        state.edpIdempotencyRecord.set(createKey(updated.tenantId, updated.idempotencyKey), updated);
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

        const key = createKey(where.tenantId_correlationId?.tenantId, where.tenantId_correlationId?.correlationId);
        const existing = state.edpCorrelationRecord.get(key);
        const row = existing
          ? { ...existing, ...update, updatedAt: new Date() }
          : { ...create, createdAt: new Date(), updatedAt: new Date() };

        state.edpCorrelationRecord.set(key, row);
        return row;
      },
    },
    simulationRuntimeEvidence: createSimulationRuntimeEvidenceTable(getState()),
    $transaction: async <T>(action: (transaction: FakePrismaClient) => Promise<T>) => {
      const snapshot = cloneState(rootState);
      transactionStack.push(snapshot);

      try {
        const result = await action(client);
        rootState = snapshot;
        return result;
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
    __seedTenant: (tenant) => {
      const row = {
        id: String(tenant.id ?? randomUUID()),
        name: String(tenant.name ?? 'tenant'),
        domain: tenant.domain ?? null,
        isActive: tenant.isActive ?? true,
        deletedAt: tenant.deletedAt ?? null,
        createdAt: tenant.createdAt ?? new Date(),
        updatedAt: tenant.updatedAt ?? new Date(),
        ...tenant,
      };

      rootState.tenants.set(row.id, row);
    },
    __seedUser: (user) => {
      const row = {
        id: String(user.id ?? randomUUID()),
        tenantId: String(user.tenantId ?? 'tenant-a'),
        email: String(user.email ?? 'user@example.test'),
        emailNormalized: String(user.emailNormalized ?? String(user.email ?? 'user@example.test').toLowerCase()),
        password: String(user.password ?? 'test-password'),
        firstName: String(user.firstName ?? 'Test'),
        lastName: String(user.lastName ?? 'User'),
        isActive: user.isActive ?? true,
        isEmailVerified: user.isEmailVerified ?? true,
        deletedAt: user.deletedAt ?? null,
        organizationId: user.organizationId ?? null,
        partnerId: user.partnerId ?? null,
        userRoles: user.userRoles ?? [],
        createdAt: user.createdAt ?? new Date(),
        updatedAt: user.updatedAt ?? new Date(),
        ...user,
      };

      rootState.users.set(row.id, row);
    },
    __seedRole: (role) => {
      const row = {
        id: String(role.id ?? randomUUID()),
        tenantId: String(role.tenantId ?? 'tenant-a'),
        name: String(role.name ?? 'Role'),
        slug: String(role.slug ?? 'ROLE_TEST'),
        type: role.type ?? 'SYSTEM',
        description: role.description ?? null,
        isSystem: role.isSystem ?? false,
        deletedAt: role.deletedAt ?? null,
        createdAt: role.createdAt ?? new Date(),
        updatedAt: role.updatedAt ?? new Date(),
        ...role,
      };

      rootState.roles.set(row.id, row);
    },
    __seedUserRole: (userRole) => {
      const row = {
        id: String(userRole.id ?? randomUUID()),
        tenantId: String(userRole.tenantId ?? 'tenant-a'),
        userId: String(userRole.userId ?? randomUUID()),
        roleId: String(userRole.roleId ?? randomUUID()),
        assignedAt: userRole.assignedAt ?? new Date(),
        role: userRole.role ?? null,
        ...userRole,
      };

      rootState.userRoles.set(row.id, row);
    },
    __seedIdempotencyRecord: (record) => {
      const row = {
        id: String(record.id ?? randomUUID()),
        tenantId: String(record.tenantId ?? 'tenant-a'),
        idempotencyKey: String(record.idempotencyKey ?? 'idem-1'),
        commandName: String(record.commandName ?? 'CreateSimulation'),
        commandHash: String(record.commandHash ?? 'command-hash'),
        responseSnapshot: record.responseSnapshot ?? null,
        status: String(record.status ?? 'RECEIVED'),
        expiresAt: record.expiresAt ?? new Date(),
        createdAt: record.createdAt ?? new Date(),
        updatedAt: record.updatedAt ?? new Date(),
        deletedAt: record.deletedAt ?? null,
        ...record,
      };

      rootState.edpIdempotencyRecord.set(createKey(row.tenantId, row.idempotencyKey), row);
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

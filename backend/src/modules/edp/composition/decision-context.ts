export interface DecisionTenantContext {
  tenantId: string;
  tenantScope: string | null;
  executionId: string | null;
}

export interface DecisionPrincipal {
  principalId: string;
  actorType: string;
  role: string | null;
  permissions: readonly string[];
  source: string | null;
}

export interface DecisionMetadata {
  requestId: string | null;
  source: string | null;
  correlationId: string;
  causationId: string | null;
  idempotencyKey: string | null;
  attributes: Readonly<Record<string, unknown>>;
}

export interface DecisionContext {
  tenant: DecisionTenantContext;
  principal: DecisionPrincipal;
  aggregate: {
    aggregateId: string;
    aggregateType: string;
    aggregateVersion: number | null;
  };
  command: {
    commandId: string;
    commandName: string;
    schemaVersion: string;
    source: string;
  };
  correlationId: string;
  causationId: string | null;
  idempotencyKey: string | null;
  audit: {
    requestId: string | null;
    actorId: string | null;
    actorType: string | null;
    source: string | null;
    tenantId: string | null;
  };
  metadata: DecisionMetadata;
  execution: DecisionExecutionContext;
}

export interface DecisionExecutionContext {
  tenant: DecisionTenantContext;
  principal: DecisionPrincipal;
  aggregate: DecisionContext['aggregate'];
  command: DecisionContext['command'];
  correlationId: string;
  causationId: string | null;
  idempotencyKey: string | null;
  audit: DecisionContext['audit'];
  metadata: DecisionMetadata;
}

export interface DecisionContextFactoryInput {
  tenant: DecisionTenantContext;
  principal: DecisionPrincipal;
  aggregate: DecisionContext['aggregate'];
  command: DecisionContext['command'];
  correlationId: string;
  causationId?: string | null;
  idempotencyKey?: string | null;
  audit: DecisionContext['audit'];
  metadata?: Record<string, unknown> | null;
}

export interface DecisionContextFactory {
  create(input: DecisionContextFactoryInput): DecisionContext;
}

const normalizeText = (value: string): string => value.trim();

const normalizeOptionalText = (value?: string | null): string | null => {
  if (value == null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizeMetadata = (metadata?: Record<string, unknown> | null): Readonly<Record<string, unknown>> => ({
  ...(metadata ?? {}),
});

const normalizeTenant = (tenant: DecisionTenantContext): DecisionTenantContext => ({
  tenantId: normalizeText(tenant.tenantId),
  tenantScope: normalizeOptionalText(tenant.tenantScope),
  executionId: normalizeOptionalText(tenant.executionId),
});

const normalizePrincipal = (principal: DecisionPrincipal): DecisionPrincipal => ({
  principalId: normalizeText(principal.principalId),
  actorType: normalizeText(principal.actorType),
  role: normalizeOptionalText(principal.role),
  permissions: [...principal.permissions],
  source: normalizeOptionalText(principal.source),
});

const normalizeAggregate = (aggregate: DecisionContext['aggregate']): DecisionContext['aggregate'] => ({
  aggregateId: normalizeText(aggregate.aggregateId),
  aggregateType: normalizeText(aggregate.aggregateType),
  aggregateVersion: aggregate.aggregateVersion ?? null,
});

const normalizeCommand = (command: DecisionContext['command']): DecisionContext['command'] => ({
  commandId: normalizeText(command.commandId),
  commandName: normalizeText(command.commandName),
  schemaVersion: normalizeText(command.schemaVersion),
  source: normalizeText(command.source),
});

const normalizeAudit = (audit: DecisionContext['audit']): DecisionContext['audit'] => ({
  requestId: normalizeOptionalText(audit.requestId),
  actorId: normalizeOptionalText(audit.actorId),
  actorType: normalizeOptionalText(audit.actorType),
  source: normalizeOptionalText(audit.source),
  tenantId: normalizeOptionalText(audit.tenantId),
});

export const createDecisionContextFactory = (): DecisionContextFactory => ({
  create(input: DecisionContextFactoryInput): DecisionContext {
    const tenant = normalizeTenant(input.tenant);
    const principal = normalizePrincipal(input.principal);
    const aggregate = normalizeAggregate(input.aggregate);
    const command = normalizeCommand(input.command);
    const audit = normalizeAudit(input.audit);
    const metadata: DecisionMetadata = {
      requestId: audit.requestId,
      source: audit.source,
      correlationId: normalizeText(input.correlationId),
      causationId: normalizeOptionalText(input.causationId),
      idempotencyKey: normalizeOptionalText(input.idempotencyKey),
      attributes: normalizeMetadata(input.metadata),
    };

    const execution: DecisionExecutionContext = {
      tenant,
      principal,
      aggregate,
      command,
      correlationId: metadata.correlationId,
      causationId: metadata.causationId,
      idempotencyKey: metadata.idempotencyKey,
      audit,
      metadata,
    };

    return {
      tenant,
      principal,
      aggregate,
      command,
      correlationId: metadata.correlationId,
      causationId: metadata.causationId,
      idempotencyKey: metadata.idempotencyKey,
      audit,
      metadata,
      execution,
    };
  },
});

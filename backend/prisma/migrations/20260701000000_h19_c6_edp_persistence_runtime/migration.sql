-- CreateTable
CREATE TABLE "edp_decisions" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "edp_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edp_decision_policies" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rollbackOf" TEXT,
    "configSnapshot" JSONB NOT NULL,
    "audit" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "edp_decision_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edp_decision_strategies" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rollbackOf" TEXT,
    "configSnapshot" JSONB NOT NULL,
    "audit" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "edp_decision_strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edp_simulations" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "edp_simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edp_recommendations" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "edp_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edp_proposals" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "edp_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edp_provider_capabilities" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "edp_provider_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edp_provider_executions" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "edp_provider_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edp_operation_candidates" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "edp_operation_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edp_audit_timeline_events" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "correlationId" TEXT,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "edp_audit_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edp_event_store" (
    "eventId" UUID NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventVersion" TEXT NOT NULL,
    "tenantId" UUID NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateVersion" INTEGER NOT NULL,
    "correlationId" TEXT NOT NULL,
    "causationId" TEXT,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "edp_event_store_pkey" PRIMARY KEY ("eventId")
);

-- CreateTable
CREATE TABLE "edp_outbox_messages" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "eventName" TEXT NOT NULL,
    "aggregateId" TEXT,
    "aggregateType" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "edp_outbox_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edp_idempotency_records" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "commandName" TEXT NOT NULL,
    "commandHash" TEXT NOT NULL,
    "responseSnapshot" JSONB,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "edp_idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edp_correlation_records" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "correlationId" TEXT NOT NULL,
    "aggregateId" TEXT,
    "aggregateType" TEXT,
    "causationId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "edp_correlation_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "edp_decisions_tenantId_aggregateId_key" ON "edp_decisions"("tenantId", "aggregateId");
CREATE INDEX "edp_decisions_tenantId_idx" ON "edp_decisions"("tenantId");
CREATE INDEX "edp_decisions_tenantId_aggregateType_idx" ON "edp_decisions"("tenantId", "aggregateType");
CREATE INDEX "edp_decisions_tenantId_deletedAt_idx" ON "edp_decisions"("tenantId", "deletedAt");

CREATE UNIQUE INDEX "edp_decision_policies_tenantId_aggregateId_version_key" ON "edp_decision_policies"("tenantId", "aggregateId", "version");
CREATE INDEX "edp_decision_policies_tenantId_idx" ON "edp_decision_policies"("tenantId");
CREATE INDEX "edp_decision_policies_tenantId_aggregateId_idx" ON "edp_decision_policies"("tenantId", "aggregateId");
CREATE INDEX "edp_decision_policies_tenantId_status_idx" ON "edp_decision_policies"("tenantId", "status");
CREATE INDEX "edp_decision_policies_tenantId_deletedAt_idx" ON "edp_decision_policies"("tenantId", "deletedAt");

CREATE UNIQUE INDEX "edp_decision_strategies_tenantId_aggregateId_version_key" ON "edp_decision_strategies"("tenantId", "aggregateId", "version");
CREATE INDEX "edp_decision_strategies_tenantId_idx" ON "edp_decision_strategies"("tenantId");
CREATE INDEX "edp_decision_strategies_tenantId_aggregateId_idx" ON "edp_decision_strategies"("tenantId", "aggregateId");
CREATE INDEX "edp_decision_strategies_tenantId_status_idx" ON "edp_decision_strategies"("tenantId", "status");
CREATE INDEX "edp_decision_strategies_tenantId_deletedAt_idx" ON "edp_decision_strategies"("tenantId", "deletedAt");

CREATE UNIQUE INDEX "edp_simulations_tenantId_aggregateId_key" ON "edp_simulations"("tenantId", "aggregateId");
CREATE INDEX "edp_simulations_tenantId_idx" ON "edp_simulations"("tenantId");
CREATE INDEX "edp_simulations_tenantId_aggregateType_idx" ON "edp_simulations"("tenantId", "aggregateType");
CREATE INDEX "edp_simulations_tenantId_deletedAt_idx" ON "edp_simulations"("tenantId", "deletedAt");

CREATE UNIQUE INDEX "edp_recommendations_tenantId_aggregateId_key" ON "edp_recommendations"("tenantId", "aggregateId");
CREATE INDEX "edp_recommendations_tenantId_idx" ON "edp_recommendations"("tenantId");
CREATE INDEX "edp_recommendations_tenantId_aggregateType_idx" ON "edp_recommendations"("tenantId", "aggregateType");
CREATE INDEX "edp_recommendations_tenantId_deletedAt_idx" ON "edp_recommendations"("tenantId", "deletedAt");

CREATE UNIQUE INDEX "edp_proposals_tenantId_aggregateId_key" ON "edp_proposals"("tenantId", "aggregateId");
CREATE INDEX "edp_proposals_tenantId_idx" ON "edp_proposals"("tenantId");
CREATE INDEX "edp_proposals_tenantId_aggregateType_idx" ON "edp_proposals"("tenantId", "aggregateType");
CREATE INDEX "edp_proposals_tenantId_deletedAt_idx" ON "edp_proposals"("tenantId", "deletedAt");

CREATE UNIQUE INDEX "edp_provider_capabilities_tenantId_aggregateId_key" ON "edp_provider_capabilities"("tenantId", "aggregateId");
CREATE INDEX "edp_provider_capabilities_tenantId_idx" ON "edp_provider_capabilities"("tenantId");
CREATE INDEX "edp_provider_capabilities_tenantId_aggregateType_idx" ON "edp_provider_capabilities"("tenantId", "aggregateType");
CREATE INDEX "edp_provider_capabilities_tenantId_deletedAt_idx" ON "edp_provider_capabilities"("tenantId", "deletedAt");

CREATE UNIQUE INDEX "edp_provider_executions_tenantId_aggregateId_key" ON "edp_provider_executions"("tenantId", "aggregateId");
CREATE INDEX "edp_provider_executions_tenantId_idx" ON "edp_provider_executions"("tenantId");
CREATE INDEX "edp_provider_executions_tenantId_aggregateType_idx" ON "edp_provider_executions"("tenantId", "aggregateType");
CREATE INDEX "edp_provider_executions_tenantId_deletedAt_idx" ON "edp_provider_executions"("tenantId", "deletedAt");

CREATE UNIQUE INDEX "edp_operation_candidates_tenantId_aggregateId_key" ON "edp_operation_candidates"("tenantId", "aggregateId");
CREATE INDEX "edp_operation_candidates_tenantId_idx" ON "edp_operation_candidates"("tenantId");
CREATE INDEX "edp_operation_candidates_tenantId_aggregateType_idx" ON "edp_operation_candidates"("tenantId", "aggregateType");
CREATE INDEX "edp_operation_candidates_tenantId_deletedAt_idx" ON "edp_operation_candidates"("tenantId", "deletedAt");

CREATE INDEX "edp_audit_timeline_events_tenantId_idx" ON "edp_audit_timeline_events"("tenantId");
CREATE INDEX "edp_audit_timeline_events_tenantId_aggregateId_idx" ON "edp_audit_timeline_events"("tenantId", "aggregateId");
CREATE INDEX "edp_audit_timeline_events_tenantId_correlationId_idx" ON "edp_audit_timeline_events"("tenantId", "correlationId");
CREATE INDEX "edp_audit_timeline_events_tenantId_eventName_idx" ON "edp_audit_timeline_events"("tenantId", "eventName");
CREATE INDEX "edp_audit_timeline_events_tenantId_timestamp_idx" ON "edp_audit_timeline_events"("tenantId", "timestamp");
CREATE INDEX "edp_audit_timeline_events_tenantId_deletedAt_idx" ON "edp_audit_timeline_events"("tenantId", "deletedAt");

CREATE INDEX "edp_event_store_tenantId_idx" ON "edp_event_store"("tenantId");
CREATE INDEX "edp_event_store_tenantId_aggregateId_idx" ON "edp_event_store"("tenantId", "aggregateId");
CREATE INDEX "edp_event_store_tenantId_correlationId_idx" ON "edp_event_store"("tenantId", "correlationId");
CREATE INDEX "edp_event_store_tenantId_eventName_idx" ON "edp_event_store"("tenantId", "eventName");
CREATE INDEX "edp_event_store_tenantId_occurredAt_idx" ON "edp_event_store"("tenantId", "occurredAt");

CREATE INDEX "edp_outbox_messages_tenantId_idx" ON "edp_outbox_messages"("tenantId");
CREATE INDEX "edp_outbox_messages_tenantId_status_idx" ON "edp_outbox_messages"("tenantId", "status");
CREATE INDEX "edp_outbox_messages_tenantId_nextAttemptAt_idx" ON "edp_outbox_messages"("tenantId", "nextAttemptAt");
CREATE INDEX "edp_outbox_messages_tenantId_deletedAt_idx" ON "edp_outbox_messages"("tenantId", "deletedAt");

CREATE UNIQUE INDEX "edp_idempotency_records_tenantId_idempotencyKey_key" ON "edp_idempotency_records"("tenantId", "idempotencyKey");
CREATE INDEX "edp_idempotency_records_tenantId_idx" ON "edp_idempotency_records"("tenantId");
CREATE INDEX "edp_idempotency_records_tenantId_commandName_idx" ON "edp_idempotency_records"("tenantId", "commandName");
CREATE INDEX "edp_idempotency_records_tenantId_status_idx" ON "edp_idempotency_records"("tenantId", "status");
CREATE INDEX "edp_idempotency_records_tenantId_expiresAt_idx" ON "edp_idempotency_records"("tenantId", "expiresAt");
CREATE INDEX "edp_idempotency_records_tenantId_deletedAt_idx" ON "edp_idempotency_records"("tenantId", "deletedAt");

CREATE UNIQUE INDEX "edp_correlation_records_tenantId_correlationId_key" ON "edp_correlation_records"("tenantId", "correlationId");
CREATE INDEX "edp_correlation_records_tenantId_idx" ON "edp_correlation_records"("tenantId");
CREATE INDEX "edp_correlation_records_tenantId_aggregateId_idx" ON "edp_correlation_records"("tenantId", "aggregateId");
CREATE INDEX "edp_correlation_records_tenantId_aggregateType_idx" ON "edp_correlation_records"("tenantId", "aggregateType");
CREATE INDEX "edp_correlation_records_tenantId_deletedAt_idx" ON "edp_correlation_records"("tenantId", "deletedAt");

-- AddForeignKey
ALTER TABLE "edp_decisions" ADD CONSTRAINT "edp_decisions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "edp_decision_policies" ADD CONSTRAINT "edp_decision_policies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "edp_decision_strategies" ADD CONSTRAINT "edp_decision_strategies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "edp_simulations" ADD CONSTRAINT "edp_simulations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "edp_recommendations" ADD CONSTRAINT "edp_recommendations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "edp_proposals" ADD CONSTRAINT "edp_proposals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "edp_provider_capabilities" ADD CONSTRAINT "edp_provider_capabilities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "edp_provider_executions" ADD CONSTRAINT "edp_provider_executions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "edp_operation_candidates" ADD CONSTRAINT "edp_operation_candidates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "edp_audit_timeline_events" ADD CONSTRAINT "edp_audit_timeline_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "edp_event_store" ADD CONSTRAINT "edp_event_store_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "edp_outbox_messages" ADD CONSTRAINT "edp_outbox_messages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "edp_idempotency_records" ADD CONSTRAINT "edp_idempotency_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "edp_correlation_records" ADD CONSTRAINT "edp_correlation_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

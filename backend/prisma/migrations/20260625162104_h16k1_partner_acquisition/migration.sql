-- CreateTable
CREATE TABLE "partner_acquisition_leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "leadCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "companyName" TEXT,
    "document" TEXT,
    "channel" TEXT NOT NULL,
    "sourceName" TEXT,
    "sourceReference" TEXT,
    "campaignId" TEXT,
    "hubContextId" TEXT,
    "ownerUserId" UUID,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "score" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" UUID NOT NULL,

    CONSTRAINT "partner_acquisition_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_acquisition_prospects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prospectCode" TEXT NOT NULL,
    "leadId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "companyName" TEXT,
    "document" TEXT,
    "channel" TEXT NOT NULL,
    "sourceName" TEXT,
    "sourceReference" TEXT,
    "campaignId" TEXT,
    "hubContextId" TEXT,
    "sdrAgentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "pipelineId" UUID,
    "stageId" UUID,
    "pipelineCode" TEXT,
    "stageCode" TEXT,
    "score" INTEGER,
    "qualificationReason" TEXT,
    "assignedUserId" UUID,
    "nextActionAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "partnerId" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" UUID NOT NULL,

    CONSTRAINT "partner_acquisition_prospects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_acquisition_command_inbox" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "commandType" TEXT NOT NULL,
    "aggregateId" UUID,
    "aggregateType" TEXT NOT NULL,
    "actorUserId" UUID NOT NULL,
    "requestId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" UUID NOT NULL,

    CONSTRAINT "partner_acquisition_command_inbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_acquisition_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventId" UUID NOT NULL,
    "aggregateId" UUID NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorUserId" UUID NOT NULL,
    "requestId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" UUID NOT NULL,

    CONSTRAINT "partner_acquisition_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_acquisition_outbox" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventId" UUID NOT NULL,
    "aggregateId" UUID NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" UUID NOT NULL,

    CONSTRAINT "partner_acquisition_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_acquisition_conversion_decisions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prospectId" UUID NOT NULL,
    "partnerId" UUID,
    "approved" BOOLEAN NOT NULL,
    "decidedByUserId" UUID NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" UUID NOT NULL,

    CONSTRAINT "partner_acquisition_conversion_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "partner_acquisition_leads_tenantId_idx" ON "partner_acquisition_leads"("tenantId");

-- CreateIndex
CREATE INDEX "partner_acquisition_leads_tenantId_channel_idx" ON "partner_acquisition_leads"("tenantId", "channel");

-- CreateIndex
CREATE INDEX "partner_acquisition_leads_tenantId_status_idx" ON "partner_acquisition_leads"("tenantId", "status");

-- CreateIndex
CREATE INDEX "partner_acquisition_leads_tenantId_ownerUserId_idx" ON "partner_acquisition_leads"("tenantId", "ownerUserId");

-- CreateIndex
CREATE INDEX "partner_acquisition_leads_tenantId_deletedAt_idx" ON "partner_acquisition_leads"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "partner_acquisition_leads_tenantId_leadCode_key" ON "partner_acquisition_leads"("tenantId", "leadCode");

-- CreateIndex
CREATE UNIQUE INDEX "partner_acquisition_leads_tenantId_sourceReference_key" ON "partner_acquisition_leads"("tenantId", "sourceReference");

-- CreateIndex
CREATE INDEX "partner_acquisition_prospects_tenantId_idx" ON "partner_acquisition_prospects"("tenantId");

-- CreateIndex
CREATE INDEX "partner_acquisition_prospects_tenantId_status_idx" ON "partner_acquisition_prospects"("tenantId", "status");

-- CreateIndex
CREATE INDEX "partner_acquisition_prospects_tenantId_pipelineCode_idx" ON "partner_acquisition_prospects"("tenantId", "pipelineCode");

-- CreateIndex
CREATE INDEX "partner_acquisition_prospects_tenantId_stageCode_idx" ON "partner_acquisition_prospects"("tenantId", "stageCode");

-- CreateIndex
CREATE INDEX "partner_acquisition_prospects_tenantId_assignedUserId_idx" ON "partner_acquisition_prospects"("tenantId", "assignedUserId");

-- CreateIndex
CREATE INDEX "partner_acquisition_prospects_tenantId_signedAt_idx" ON "partner_acquisition_prospects"("tenantId", "signedAt");

-- CreateIndex
CREATE INDEX "partner_acquisition_prospects_tenantId_convertedAt_idx" ON "partner_acquisition_prospects"("tenantId", "convertedAt");

-- CreateIndex
CREATE INDEX "partner_acquisition_prospects_tenantId_deletedAt_idx" ON "partner_acquisition_prospects"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "partner_acquisition_prospects_tenantId_prospectCode_key" ON "partner_acquisition_prospects"("tenantId", "prospectCode");

-- CreateIndex
CREATE UNIQUE INDEX "partner_acquisition_prospects_tenantId_leadId_key" ON "partner_acquisition_prospects"("tenantId", "leadId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_acquisition_prospects_tenantId_partnerId_key" ON "partner_acquisition_prospects"("tenantId", "partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_acquisition_prospects_tenantId_sourceReference_key" ON "partner_acquisition_prospects"("tenantId", "sourceReference");

-- CreateIndex
CREATE INDEX "partner_acquisition_command_inbox_tenantId_idx" ON "partner_acquisition_command_inbox"("tenantId");

-- CreateIndex
CREATE INDEX "partner_acquisition_command_inbox_tenantId_commandType_idx" ON "partner_acquisition_command_inbox"("tenantId", "commandType");

-- CreateIndex
CREATE INDEX "partner_acquisition_command_inbox_tenantId_aggregateType_idx" ON "partner_acquisition_command_inbox"("tenantId", "aggregateType");

-- CreateIndex
CREATE INDEX "partner_acquisition_command_inbox_tenantId_aggregateId_idx" ON "partner_acquisition_command_inbox"("tenantId", "aggregateId");

-- CreateIndex
CREATE INDEX "partner_acquisition_command_inbox_tenantId_status_idx" ON "partner_acquisition_command_inbox"("tenantId", "status");

-- CreateIndex
CREATE INDEX "partner_acquisition_command_inbox_tenantId_receivedAt_idx" ON "partner_acquisition_command_inbox"("tenantId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "partner_acquisition_command_inbox_tenantId_idempotencyKey_key" ON "partner_acquisition_command_inbox"("tenantId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "partner_acquisition_events_tenantId_idx" ON "partner_acquisition_events"("tenantId");

-- CreateIndex
CREATE INDEX "partner_acquisition_events_tenantId_aggregateId_idx" ON "partner_acquisition_events"("tenantId", "aggregateId");

-- CreateIndex
CREATE INDEX "partner_acquisition_events_tenantId_aggregateType_idx" ON "partner_acquisition_events"("tenantId", "aggregateType");

-- CreateIndex
CREATE INDEX "partner_acquisition_events_tenantId_eventType_idx" ON "partner_acquisition_events"("tenantId", "eventType");

-- CreateIndex
CREATE INDEX "partner_acquisition_events_tenantId_occurredAt_idx" ON "partner_acquisition_events"("tenantId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "partner_acquisition_events_tenantId_eventId_key" ON "partner_acquisition_events"("tenantId", "eventId");

-- CreateIndex
CREATE INDEX "partner_acquisition_outbox_tenantId_idx" ON "partner_acquisition_outbox"("tenantId");

-- CreateIndex
CREATE INDEX "partner_acquisition_outbox_tenantId_status_idx" ON "partner_acquisition_outbox"("tenantId", "status");

-- CreateIndex
CREATE INDEX "partner_acquisition_outbox_tenantId_availableAt_idx" ON "partner_acquisition_outbox"("tenantId", "availableAt");

-- CreateIndex
CREATE INDEX "partner_acquisition_outbox_tenantId_eventType_idx" ON "partner_acquisition_outbox"("tenantId", "eventType");

-- CreateIndex
CREATE UNIQUE INDEX "partner_acquisition_outbox_tenantId_eventId_key" ON "partner_acquisition_outbox"("tenantId", "eventId");

-- CreateIndex
CREATE INDEX "partner_acquisition_conversion_decisions_tenantId_idx" ON "partner_acquisition_conversion_decisions"("tenantId");

-- CreateIndex
CREATE INDEX "partner_acquisition_conversion_decisions_tenantId_approved_idx" ON "partner_acquisition_conversion_decisions"("tenantId", "approved");

-- CreateIndex
CREATE INDEX "partner_acquisition_conversion_decisions_tenantId_decidedAt_idx" ON "partner_acquisition_conversion_decisions"("tenantId", "decidedAt");

-- CreateIndex
CREATE UNIQUE INDEX "partner_acquisition_conversion_decisions_tenantId_prospectI_key" ON "partner_acquisition_conversion_decisions"("tenantId", "prospectId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_acquisition_conversion_decisions_tenantId_partnerId_key" ON "partner_acquisition_conversion_decisions"("tenantId", "partnerId");

-- AddForeignKey
ALTER TABLE "partner_acquisition_leads" ADD CONSTRAINT "partner_acquisition_leads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_acquisition_prospects" ADD CONSTRAINT "partner_acquisition_prospects_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_acquisition_prospects" ADD CONSTRAINT "partner_acquisition_prospects_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "partner_acquisition_leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_acquisition_prospects" ADD CONSTRAINT "partner_acquisition_prospects_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_acquisition_prospects" ADD CONSTRAINT "partner_acquisition_prospects_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "pipelines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_acquisition_prospects" ADD CONSTRAINT "partner_acquisition_prospects_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_acquisition_command_inbox" ADD CONSTRAINT "partner_acquisition_command_inbox_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_acquisition_events" ADD CONSTRAINT "partner_acquisition_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_acquisition_outbox" ADD CONSTRAINT "partner_acquisition_outbox_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_acquisition_conversion_decisions" ADD CONSTRAINT "partner_acquisition_conversion_decisions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_acquisition_conversion_decisions" ADD CONSTRAINT "partner_acquisition_conversion_decisions_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "partner_acquisition_prospects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_acquisition_conversion_decisions" ADD CONSTRAINT "partner_acquisition_conversion_decisions_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

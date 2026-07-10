-- CreateTable
CREATE TABLE "simulation_runtime_evidence" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "environment" TEXT NOT NULL,
    "tenantIdHash" TEXT,
    "opportunityIdHash" TEXT,
    "requestId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "subproductCode" TEXT NOT NULL,
    "legacyStatus" TEXT,
    "canonicalStatus" TEXT NOT NULL,
    "comparisonStatus" TEXT NOT NULL,
    "divergenceCategory" TEXT NOT NULL,
    "divergenceCount" INTEGER NOT NULL,
    "financialCriticalCount" INTEGER NOT NULL,
    "financialMinorCount" INTEGER NOT NULL,
    "structuralCount" INTEGER NOT NULL,
    "missingCanonicalFieldCount" INTEGER NOT NULL,
    "missingLegacyFieldCount" INTEGER NOT NULL,
    "mappingFailure" BOOLEAN NOT NULL,
    "runtimeFailure" BOOLEAN NOT NULL,
    "unsupportedScenario" BOOLEAN NOT NULL,
    "legacyDurationMs" INTEGER,
    "runtimeDurationMs" INTEGER,
    "fallbackUsed" BOOLEAN NOT NULL,
    "shadowMode" BOOLEAN NOT NULL,
    "comparatorVersion" TEXT NOT NULL,
    "contractVersion" TEXT NOT NULL,
    "catalogVersion" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "strategyVersion" TEXT NOT NULL,
    "receivedByUserId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulation_runtime_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "simulation_runtime_evidence_tenantId_campaignId_evidenceId_key" ON "simulation_runtime_evidence"("tenantId", "campaignId", "evidenceId");
CREATE INDEX "simulation_runtime_evidence_tenantId_idx" ON "simulation_runtime_evidence"("tenantId");
CREATE INDEX "simulation_runtime_evidence_tenantId_campaignId_idx" ON "simulation_runtime_evidence"("tenantId", "campaignId");
CREATE INDEX "simulation_runtime_evidence_tenantId_campaignId_subproductCode_idx" ON "simulation_runtime_evidence"("tenantId", "campaignId", "subproductCode");
CREATE INDEX "simulation_runtime_evidence_tenantId_campaignId_comparisonStatus_idx" ON "simulation_runtime_evidence"("tenantId", "campaignId", "comparisonStatus");
CREATE INDEX "simulation_runtime_evidence_tenantId_campaignId_divergenceCategory_idx" ON "simulation_runtime_evidence"("tenantId", "campaignId", "divergenceCategory");
CREATE INDEX "simulation_runtime_evidence_tenantId_campaignId_timestamp_idx" ON "simulation_runtime_evidence"("tenantId", "campaignId", "timestamp");
CREATE INDEX "simulation_runtime_evidence_tenantId_correlationId_idx" ON "simulation_runtime_evidence"("tenantId", "correlationId");

-- AddForeignKey
ALTER TABLE "simulation_runtime_evidence" ADD CONSTRAINT "simulation_runtime_evidence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

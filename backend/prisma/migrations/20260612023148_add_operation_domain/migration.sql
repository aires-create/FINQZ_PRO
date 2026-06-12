-- CreateEnum
CREATE TYPE "OperationStatus" AS ENUM ('CREATED', 'PROPOSAL_REQUESTED', 'PROPOSAL_RECEIVED', 'PROPOSAL_APPROVED', 'EXECUTED', 'COMMISSION_CALCULATED', 'SETTLEMENT_PENDING', 'SETTLED', 'REJECTED', 'FAILED', 'CANCELED');

-- CreateTable
CREATE TABLE "operations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "operationNumber" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "opportunityId" UUID NOT NULL,
    "bankProposalId" UUID,
    "createdById" UUID NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" "OperationStatus" NOT NULL DEFAULT 'CREATED',
    "executedAt" TIMESTAMP(3),
    "referenceDate" TIMESTAMP(3),
    "providerOperationId" TEXT,
    "externalReference" TEXT,
    "metadata" JSONB,
    "notes" TEXT,
    "correlationId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "operations_tenantId_idx" ON "operations"("tenantId");

-- CreateIndex
CREATE INDEX "operations_tenantId_status_idx" ON "operations"("tenantId", "status");

-- CreateIndex
CREATE INDEX "operations_opportunityId_idx" ON "operations"("opportunityId");

-- CreateIndex
CREATE INDEX "operations_bankProposalId_idx" ON "operations"("bankProposalId");

-- CreateIndex
CREATE INDEX "operations_createdById_idx" ON "operations"("createdById");

-- CreateIndex
CREATE INDEX "operations_deletedAt_idx" ON "operations"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "operations_tenantId_operationNumber_key" ON "operations"("tenantId", "operationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "operations_tenantId_year_sequence_key" ON "operations"("tenantId", "year", "sequence");

-- AddForeignKey
ALTER TABLE "operations" ADD CONSTRAINT "operations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations" ADD CONSTRAINT "operations_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations" ADD CONSTRAINT "operations_bankProposalId_fkey" FOREIGN KEY ("bankProposalId") REFERENCES "bank_proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations" ADD CONSTRAINT "operations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

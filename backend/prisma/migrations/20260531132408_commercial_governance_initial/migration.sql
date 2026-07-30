-- CreateEnum
CREATE TYPE "CommercialRequestStatus" AS ENUM ('Draft', 'Submitted', 'Approved', 'Rejected', 'Closed');

-- CreateTable
CREATE TABLE "commercial_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "status" "CommercialRequestStatus" NOT NULL,
    "requestedByUserId" UUID NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commercial_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "commercial_requests_tenantId_idx" ON "commercial_requests"("tenantId");

-- CreateIndex
CREATE INDEX "commercial_requests_tenantId_status_idx" ON "commercial_requests"("tenantId", "status");

-- CreateIndex
CREATE INDEX "commercial_requests_tenantId_requestedByUserId_idx" ON "commercial_requests"("tenantId", "requestedByUserId");

-- CreateIndex
CREATE INDEX "commercial_requests_tenantId_requestedAt_idx" ON "commercial_requests"("tenantId", "requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "commercial_requests_tenantId_requestNumber_key" ON "commercial_requests"("tenantId", "requestNumber");

-- CreateIndex
CREATE UNIQUE INDEX "commercial_requests_tenantId_year_sequence_key" ON "commercial_requests"("tenantId", "year", "sequence");

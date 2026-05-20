CREATE TABLE "commercial_tables" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "providerId" TEXT NOT NULL,
    "providerCode" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "subproductId" TEXT NOT NULL,
    "subproductCode" TEXT NOT NULL,
    "subproductName" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "modalityLabel" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "energyType" TEXT,
    "customerType" TEXT,
    "distributionCompany" TEXT,
    "region" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" UUID NOT NULL,

    CONSTRAINT "commercial_tables_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "commercial_conditions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "minTerm" INTEGER NOT NULL,
    "maxTerm" INTEGER NOT NULL,
    "term" INTEGER NOT NULL,
    "monthlyRate" DOUBLE PRECISION NOT NULL,
    "cetRate" DOUBLE PRECISION NOT NULL,
    "coefficient" DOUBLE PRECISION,
    "flatCommission" DOUBLE PRECISION,
    "bonusCommission" DOUBLE PRECISION,
    "advanceCommission" DOUBLE PRECISION,
    "totalCommission" DOUBLE PRECISION,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minAmount" DOUBLE PRECISION NOT NULL,
    "maxAmount" DOUBLE PRECISION NOT NULL,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "minConsumption" INTEGER,
    "maxConsumption" INTEGER,
    "tariffKwh" DOUBLE PRECISION,
    "savingsPercent" DOUBLE PRECISION,
    "estimatedValue" DOUBLE PRECISION,
    "contractTerm" INTEGER,
    "earlyTerminationFee" DOUBLE PRECISION,
    "campaignName" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" UUID NOT NULL,
    "commercialTableId" UUID NOT NULL,

    CONSTRAINT "commercial_conditions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "commercial_tables_tenantId_code_key" ON "commercial_tables"("tenantId", "code");
CREATE INDEX "commercial_tables_tenantId_idx" ON "commercial_tables"("tenantId");
CREATE INDEX "commercial_tables_providerId_idx" ON "commercial_tables"("providerId");
CREATE INDEX "commercial_tables_providerType_idx" ON "commercial_tables"("providerType");
CREATE INDEX "commercial_tables_productId_idx" ON "commercial_tables"("productId");
CREATE INDEX "commercial_tables_subproductId_idx" ON "commercial_tables"("subproductId");
CREATE INDEX "commercial_tables_modality_idx" ON "commercial_tables"("modality");
CREATE INDEX "commercial_tables_active_idx" ON "commercial_tables"("active");
CREATE INDEX "commercial_tables_deletedAt_idx" ON "commercial_tables"("deletedAt");

CREATE INDEX "commercial_conditions_tenantId_idx" ON "commercial_conditions"("tenantId");
CREATE INDEX "commercial_conditions_commercialTableId_idx" ON "commercial_conditions"("commercialTableId");
CREATE INDEX "commercial_conditions_term_idx" ON "commercial_conditions"("term");
CREATE INDEX "commercial_conditions_active_idx" ON "commercial_conditions"("active");
CREATE INDEX "commercial_conditions_deletedAt_idx" ON "commercial_conditions"("deletedAt");

ALTER TABLE "commercial_tables"
ADD CONSTRAINT "commercial_tables_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commercial_conditions"
ADD CONSTRAINT "commercial_conditions_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commercial_conditions"
ADD CONSTRAINT "commercial_conditions_commercialTableId_fkey"
FOREIGN KEY ("commercialTableId") REFERENCES "commercial_tables"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

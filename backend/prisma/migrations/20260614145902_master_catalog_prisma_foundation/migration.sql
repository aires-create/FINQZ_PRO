-- CreateEnum
CREATE TYPE "CatalogStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "master_catalog_segments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CatalogStatus" NOT NULL DEFAULT 'ACTIVE',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "master_catalog_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_catalog_products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CatalogStatus" NOT NULL DEFAULT 'ACTIVE',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "master_catalog_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_catalog_subproducts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CatalogStatus" NOT NULL DEFAULT 'ACTIVE',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "master_catalog_subproducts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_catalog_modalities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "subproductId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CatalogStatus" NOT NULL DEFAULT 'ACTIVE',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "master_catalog_modalities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "master_catalog_segments_tenantId_idx" ON "master_catalog_segments"("tenantId");

-- CreateIndex
CREATE INDEX "master_catalog_segments_tenantId_status_idx" ON "master_catalog_segments"("tenantId", "status");

-- CreateIndex
CREATE INDEX "master_catalog_segments_tenantId_displayOrder_idx" ON "master_catalog_segments"("tenantId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "master_catalog_segments_tenantId_code_key" ON "master_catalog_segments"("tenantId", "code");

-- CreateIndex
CREATE INDEX "master_catalog_products_tenantId_idx" ON "master_catalog_products"("tenantId");

-- CreateIndex
CREATE INDEX "master_catalog_products_tenantId_status_idx" ON "master_catalog_products"("tenantId", "status");

-- CreateIndex
CREATE INDEX "master_catalog_products_tenantId_displayOrder_idx" ON "master_catalog_products"("tenantId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "master_catalog_products_tenantId_code_key" ON "master_catalog_products"("tenantId", "code");

-- CreateIndex
CREATE INDEX "master_catalog_subproducts_tenantId_idx" ON "master_catalog_subproducts"("tenantId");

-- CreateIndex
CREATE INDEX "master_catalog_subproducts_tenantId_productId_idx" ON "master_catalog_subproducts"("tenantId", "productId");

-- CreateIndex
CREATE INDEX "master_catalog_subproducts_tenantId_status_idx" ON "master_catalog_subproducts"("tenantId", "status");

-- CreateIndex
CREATE INDEX "master_catalog_subproducts_tenantId_displayOrder_idx" ON "master_catalog_subproducts"("tenantId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "master_catalog_subproducts_tenantId_productId_code_key" ON "master_catalog_subproducts"("tenantId", "productId", "code");

-- CreateIndex
CREATE INDEX "master_catalog_modalities_tenantId_idx" ON "master_catalog_modalities"("tenantId");

-- CreateIndex
CREATE INDEX "master_catalog_modalities_tenantId_subproductId_idx" ON "master_catalog_modalities"("tenantId", "subproductId");

-- CreateIndex
CREATE INDEX "master_catalog_modalities_tenantId_status_idx" ON "master_catalog_modalities"("tenantId", "status");

-- CreateIndex
CREATE INDEX "master_catalog_modalities_tenantId_displayOrder_idx" ON "master_catalog_modalities"("tenantId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "master_catalog_modalities_tenantId_subproductId_code_key" ON "master_catalog_modalities"("tenantId", "subproductId", "code");

-- AddForeignKey
ALTER TABLE "master_catalog_segments" ADD CONSTRAINT "master_catalog_segments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_catalog_products" ADD CONSTRAINT "master_catalog_products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_catalog_subproducts" ADD CONSTRAINT "master_catalog_subproducts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_catalog_subproducts" ADD CONSTRAINT "master_catalog_subproducts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "master_catalog_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_catalog_modalities" ADD CONSTRAINT "master_catalog_modalities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_catalog_modalities" ADD CONSTRAINT "master_catalog_modalities_subproductId_fkey" FOREIGN KEY ("subproductId") REFERENCES "master_catalog_subproducts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

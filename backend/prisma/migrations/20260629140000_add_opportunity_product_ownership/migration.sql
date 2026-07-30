-- AlterTable
ALTER TABLE "opportunities" ADD COLUMN     "productId" UUID,
ADD COLUMN     "subproductId" UUID,
ADD COLUMN     "modalityId" UUID;

-- CreateIndex
CREATE INDEX "opportunities_productId_idx" ON "opportunities"("productId");

-- CreateIndex
CREATE INDEX "opportunities_subproductId_idx" ON "opportunities"("subproductId");

-- CreateIndex
CREATE INDEX "opportunities_modalityId_idx" ON "opportunities"("modalityId");

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_productId_fkey" FOREIGN KEY ("productId") REFERENCES "master_catalog_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_subproductId_fkey" FOREIGN KEY ("subproductId") REFERENCES "master_catalog_subproducts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "master_catalog_modalities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

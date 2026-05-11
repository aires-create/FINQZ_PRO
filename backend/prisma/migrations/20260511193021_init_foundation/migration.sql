/*
  Warnings:

  - You are about to drop the column `documentsProvided` on the `bank_proposals` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `document` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `partners` table. All the data in the column will be lost.
  - You are about to drop the column `managedById` on the `partners` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenantId,proposalNumber]` on the table `bank_proposals` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,commissionNumber]` on the table `commissions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,cpf]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,customerCode]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,emailNormalized]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,code]` on the table `partners` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pipelineId,order]` on the table `stages` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `emailNormalized` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pipelineId` to the `opportunities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `partners` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `role_permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `user_roles` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_userId_fkey";

-- DropForeignKey
ALTER TABLE "commissions" DROP CONSTRAINT "commissions_userId_fkey";

-- DropForeignKey
ALTER TABLE "customers" DROP CONSTRAINT "customers_customerId_fkey";

-- DropForeignKey
ALTER TABLE "opportunities" DROP CONSTRAINT "opportunities_stageId_fkey";

-- DropForeignKey
ALTER TABLE "partners" DROP CONSTRAINT "partners_companyId_fkey";

-- DropForeignKey
ALTER TABLE "partners" DROP CONSTRAINT "partners_managedById_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_roleId_fkey";

-- DropIndex
DROP INDEX "bank_proposals_proposalNumber_idx";

-- DropIndex
DROP INDEX "bank_proposals_proposalNumber_key";

-- DropIndex
DROP INDEX "commissions_commissionNumber_idx";

-- DropIndex
DROP INDEX "commissions_commissionNumber_key";

-- DropIndex
DROP INDEX "customers_cpf_idx";

-- DropIndex
DROP INDEX "customers_cpf_key";

-- DropIndex
DROP INDEX "customers_customerCode_idx";

-- DropIndex
DROP INDEX "customers_customerCode_key";

-- DropIndex
DROP INDEX "partners_code_key";

-- DropIndex
DROP INDEX "partners_companyId_idx";

-- DropIndex
DROP INDEX "stages_order_idx";

-- DropIndex
DROP INDEX "users_email_idx";

-- AlterTable
ALTER TABLE "bank_proposals" DROP COLUMN "documentsProvided",
ADD COLUMN     "documents" JSONB,
ADD COLUMN     "partnerId" UUID;

-- AlterTable
ALTER TABLE "commissions" ADD COLUMN     "opportunityId" UUID,
ADD COLUMN     "partnerId" UUID;

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "customerId",
DROP COLUMN "document",
ADD COLUMN     "emailNormalized" TEXT NOT NULL,
ADD COLUMN     "leadId" UUID,
ADD COLUMN     "parentCustomerId" UUID;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "convertedAt" TIMESTAMP(3),
ADD COLUMN     "partnerId" UUID;

-- AlterTable
ALTER TABLE "opportunities" ADD COLUMN     "partnerId" UUID,
ADD COLUMN     "pipelineId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "partners" DROP COLUMN "companyId",
DROP COLUMN "managedById",
ADD COLUMN     "parentId" UUID,
ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "role_permissions" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "user_roles" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "roleId",
ADD COLUMN     "partnerId" UUID;

-- CreateIndex
CREATE INDEX "activities_customerId_idx" ON "activities"("customerId");

-- CreateIndex
CREATE INDEX "bank_proposals_partnerId_idx" ON "bank_proposals"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_proposals_tenantId_proposalNumber_key" ON "bank_proposals"("tenantId", "proposalNumber");

-- CreateIndex
CREATE INDEX "commissions_opportunityId_idx" ON "commissions"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "commissions_tenantId_commissionNumber_key" ON "commissions"("tenantId", "commissionNumber");

-- CreateIndex
CREATE INDEX "customers_partnerId_idx" ON "customers"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenantId_cpf_key" ON "customers"("tenantId", "cpf");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenantId_customerCode_key" ON "customers"("tenantId", "customerCode");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenantId_emailNormalized_key" ON "customers"("tenantId", "emailNormalized");

-- CreateIndex
CREATE INDEX "leads_partnerId_idx" ON "leads"("partnerId");

-- CreateIndex
CREATE INDEX "opportunities_partnerId_idx" ON "opportunities"("partnerId");

-- CreateIndex
CREATE INDEX "partners_tenantId_idx" ON "partners"("tenantId");

-- CreateIndex
CREATE INDEX "partners_parentId_idx" ON "partners"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "partners_tenantId_code_key" ON "partners"("tenantId", "code");

-- CreateIndex
CREATE INDEX "role_permissions_tenantId_idx" ON "role_permissions"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "stages_pipelineId_order_key" ON "stages"("pipelineId", "order");

-- CreateIndex
CREATE INDEX "user_roles_tenantId_idx" ON "user_roles"("tenantId");

-- CreateIndex
CREATE INDEX "users_partnerId_idx" ON "users"("partnerId");

-- AddForeignKey
ALTER TABLE "partners" ADD CONSTRAINT "partners_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partners" ADD CONSTRAINT "partners_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_parentCustomerId_fkey" FOREIGN KEY ("parentCustomerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_proposals" ADD CONSTRAINT "bank_proposals_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

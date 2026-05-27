-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "address" JSONB,
ADD COLUMN     "bankData" JSONB,
ADD COLUMN     "doNotCallConsultedAt" TIMESTAMP(3),
ADD COLUMN     "doNotCallStatus" TEXT DEFAULT 'nao_consultado',
ADD COLUMN     "documentType" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "profession" TEXT,
ADD COLUMN     "rdConsultedAt" TIMESTAMP(3),
ADD COLUMN     "rdNotes" TEXT,
ADD COLUMN     "rdStatus" TEXT DEFAULT 'nao_consultado';

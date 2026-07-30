/*
  Warnings:

  - Made the column `email` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `emailNormalized` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "emailNormalized" SET NOT NULL;

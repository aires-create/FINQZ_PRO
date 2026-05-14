import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    await prisma.$executeRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
};

export default prisma;

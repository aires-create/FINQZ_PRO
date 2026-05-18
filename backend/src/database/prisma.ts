import { PrismaClient } from "@prisma/client";
import { config } from "../config/app.js";
import { logger } from "../shared/logger.js";

export const prisma = new PrismaClient();

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const getErrorCode = (error: unknown) => {
  if (!isRecord(error)) {
    return undefined;
  }

  const errorCode = error.code;

  if (typeof errorCode === "string" || typeof errorCode === "number") {
    return String(errorCode);
  }

  return undefined;
};

const getDatabaseReadinessErrorMeta = (error: unknown) => {
  const meta: Record<string, unknown> = {
    component: "database",
    status: "not_ready",
    environment: config.nodeEnv,
    errorName: "UnknownError",
    errorCode: getErrorCode(error),
  };

  if (error instanceof Error) {
    meta.errorName = error.name;
    meta.errorMessage =
      config.nodeEnv === "production"
        ? "Database readiness check failed"
        : error.message;

    if (config.nodeEnv !== "production" && error.stack) {
      meta.stack = error.stack;
    }
  }

  return meta;
};

export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    await prisma.$executeRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error(
      "Database readiness failure",
      getDatabaseReadinessErrorMeta(error),
    );
    return false;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
};

export default prisma;

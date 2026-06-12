import type { OperationStatus as PrismaOperationStatus } from '@prisma/client';

// ARCH-023 to ARCH-026: 1:1 contract with Prisma-generated enum, no local duplication.
export type OperationStatus = PrismaOperationStatus;


// ============================================
// FINQZ PRO - Prisma Client Configuration
// ============================================

import { PrismaClient } from '@prisma/client';
import { logger } from '../shared/logger';

// Extend Prisma Client with middleware for logging and soft deletes
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

export { prisma };

// Middleware for soft deletes
prisma.$use(async (params, next) => {
  // Handle soft deletes for findMany, findFirst, findUnique
  if (['findMany', 'findFirst', 'findUnique', 'count'].includes(params.action)) {
    const modelsWithSoftDelete = ['Tenant', 'User', 'Role', 'Lead', 'Customer', 'Opportunity', 'Pipeline', 'Stage', 'Activity', 'BankProposal', 'Commission', 'AuditLog'];
    
    if (modelsWithSoftDelete.includes(params.model as string) && !params.args?.where?.deletedAt) {
      params.args = {
        ...params.args,
        where: {
          ...params.args?.where,
          deletedAt: null,
        },
      };
    }
  }

  // Soft delete implementation
  if (params.action === 'delete') {
    const modelsWithSoftDelete = ['Tenant', 'User', 'Role', 'Lead', 'Customer', 'Opportunity', 'Pipeline', 'Stage', 'Activity', 'BankProposal', 'Commission', 'AuditLog'];
    
    if (modelsWithSoftDelete.includes(params.model as string)) {
      params.action = 'update';
      params.args.data = {
        deletedAt: new Date(),
      };
    }
  }

  if (params.action === 'deleteMany') {
    const modelsWithSoftDelete = ['Tenant', 'User', 'Role', 'Lead', 'Customer', 'Opportunity', 'Pipeline', 'Stage', 'Activity', 'BankProposal', 'Commission', 'AuditLog'];
    
    if (modelsWithSoftDelete.includes(params.model as string)) {
      params.action = 'updateMany';
      params.args.data = {
        deletedAt: new Date(),
      };
    }
  }

  const result = await next(params);
  return result;
});

// Connection test function
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    logger.info('✅ Database connection successful');
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed', { error });
    return false;
  }
}

// Health check function
export async function getDatabaseHealth() {
  try {
    await prisma.$queryRawUnsafe('SELECT NOW()');
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error disconnecting database', { error });
  }
}

// Enable shutdown hooks
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});

export default prisma;
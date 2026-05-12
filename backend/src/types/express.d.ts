// ============================================
// FINQZ PRO - Express Type Extensions
// Enterprise multi-tenant type definitions
// ============================================

import type { JWTPayload } from './index';
import type { Tenant, Organization, Membership, Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      // Authentication
      user?: JWTPayload & {
        permissions?: string[];
        role?: string | Role;
        organizationId?: string;
      };

      // Multi-tenant context
      tenantId?: string;
      tenant?: Tenant;

      // Organization context
      organizationId?: string;
      organization?: Organization;

      // Membership context
      membershipId?: string;
      membership?: Membership;

      // RBAC context
      userPermissions?: string[];
      userRole?: Role;

      // Legacy compatibility
      companyId?: string;
      userContext?: {
        roles: Array<Record<string, any>>;
        permissions: Set<string>;
      };

      // Audit context
      sessionId?: string;
      requestId?: string;

      // Request metadata
      startTime?: number;
      correlationId?: string;
    }

    interface Response {
      // Custom response methods
      success<T>(data: T, message?: string, meta?: any): Response;
      error(message: string, code?: string, status?: number): Response;
      paginated<T>(data: T[], total: number, page: number, limit: number): Response;
    }
  }
}

export {};

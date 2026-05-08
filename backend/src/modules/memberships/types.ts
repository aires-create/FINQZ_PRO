// ============================================
// FINQZ PRO - Memberships DTOs
// ============================================

import type { Prisma } from '@prisma/client';

export type MembershipRole = 'member' | 'manager' | 'admin' | 'owner';

export interface MembershipListQuery {
  organizationId?: string;
  userId?: string;
  role?: MembershipRole;
  status?: 'active' | 'inactive';
  page: number;
  limit: number;
}

export interface CreateMembershipRequest {
  userId: string;
  organizationId: string;
  role: MembershipRole;
  permissions?: Prisma.InputJsonValue;
}

export interface UpdateMembershipRequest {
  role?: MembershipRole;
  permissions?: Prisma.InputJsonValue | null;
  isActive?: boolean;
}

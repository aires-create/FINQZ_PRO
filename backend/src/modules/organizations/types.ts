// ============================================
// FINQZ PRO - Organizations DTOs
// ============================================

import type { Prisma } from '@prisma/client';

export type OrganizationType = 'department' | 'division' | 'team' | 'unit';

export interface OrganizationListQuery {
  parentId?: string;
  type?: OrganizationType;
  level?: number;
  search?: string;
  page: number;
  limit: number;
}

export interface CreateOrganizationRequest {
  name: string;
  code: string;
  description?: string;
  type: OrganizationType;
  parentId?: string;
  settings?: Prisma.InputJsonValue;
}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string | null;
  type?: OrganizationType;
  settings?: Prisma.InputJsonValue;
}

export type OrganizationResponse = Prisma.OrganizationGetPayload<{
  include: {
    parent: {
      select: {
        id: true;
        name: true;
        code: true;
        type: true;
      };
    };
    children: {
      select: {
        id: true;
        name: true;
        code: true;
        type: true;
        level: true;
      };
    };
    _count: {
      select: {
        users: true;
        memberships: true;
      };
    };
  };
}>;

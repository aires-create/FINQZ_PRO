import { describe, expect, it, vi } from 'vitest';

import {
  PARTNER_ACQUISITION_RBAC_PERMISSIONS,
  PARTNER_ACQUISITION_RBAC_PERMISSION_SLUGS,
} from '../../../modules/permissions/partner-acquisition-rbac.catalog.js';
import {
  materializeCommercialSalesRbac,
  materializePartnerAcquisitionRbac,
} from '../../../scripts/rbac-materialize.js';

vi.hoisted(() => {
  process.env.DATABASE_URL =
    'postgresql://finqz_user:finqz_password@localhost:5432/finqz_pro_test?schema=public';
});

vi.mock('../../../database/prisma.js', () => ({
  prisma: {
    $disconnect: vi.fn(async () => undefined),
  },
}));

const createCommercialMaterializationClient = () => {
  const permissions = new Map<string, { id: string; slug: string }>([
    ['SALES_VIEW', { id: 'permission-SALES_VIEW', slug: 'SALES_VIEW' }],
  ]);

  const roles = new Map<string, { id: string; tenantId: string; slug: string }>([
    ['super-admin', { id: 'role-super-admin', tenantId: 'tenant-1', slug: 'super-admin' }],
    ['ROLE_CEO', { id: 'role-ceo', tenantId: 'tenant-1', slug: 'ROLE_CEO' }],
    ['ROLE_ADMIN_SISTEMA', { id: 'role-admin', tenantId: 'tenant-1', slug: 'ROLE_ADMIN_SISTEMA' }],
  ]);

  const rolePermissions = new Map<string, { tenantId: string; roleId: string; permissionId: string }>([
    [
      'role-super-admin:permission-SALES_VIEW',
      {
        tenantId: 'tenant-1',
        roleId: 'role-super-admin',
        permissionId: 'permission-SALES_VIEW',
      },
    ],
    [
      'role-ceo:permission-SALES_VIEW',
      {
        tenantId: 'tenant-1',
        roleId: 'role-ceo',
        permissionId: 'permission-SALES_VIEW',
      },
    ],
    [
      'role-admin:permission-admin-only',
      {
        tenantId: 'tenant-1',
        roleId: 'role-admin',
        permissionId: 'permission-admin-only',
      },
    ],
  ]);

  const permissionUpsert = vi.fn(async ({ where, update, create }) => {
    const existing = permissions.get(where.slug);

    if (existing) {
      const next = { ...existing, ...update };
      permissions.set(where.slug, next);
      return next;
    }

    const next = { id: `permission-${create.slug}`, slug: create.slug };
    permissions.set(create.slug, next);
    return next;
  });

  const roleFindMany = vi.fn(async ({ where }) => {
    const role = roles.get(where.slug);
    return role ? [role] : [];
  });

  const rolePermissionUpsert = vi.fn(async ({ where, update, create }) => {
    const key = `${where.roleId_permissionId.roleId}:${where.roleId_permissionId.permissionId}`;
    const existing = rolePermissions.get(key);

    if (existing) {
      const next = { ...existing, ...update };
      rolePermissions.set(key, next);
      return next;
    }

    rolePermissions.set(key, create);
    return create;
  });

  return {
    client: {
      permission: { upsert: permissionUpsert },
      role: { findMany: roleFindMany },
      rolePermission: { upsert: rolePermissionUpsert },
    },
    state: {
      permissionSlugs: () => Array.from(permissions.keys()).sort(),
      rolePermissionSlugs: (roleSlug: string) => {
        const role = roles.get(roleSlug);

        if (!role) {
          return [];
        }

        return Array.from(rolePermissions.values())
          .filter((entry) => entry.roleId === role.id)
          .map((entry) => entry.permissionId)
          .sort();
      },
      rolePermissionCount: () => rolePermissions.size,
    },
    spies: {
      permissionUpsert,
      roleFindMany,
      rolePermissionUpsert,
    },
  };
};

describe('rbac materializer', () => {
  it('materializes Partner Acquisition permissions and grants them to super-admin roles idempotently', async () => {
    const permissionUpsert = vi.fn(async ({ create }) => ({
      id: `permission-${create.slug}`,
      slug: create.slug,
    }));
    const roleFindMany = vi.fn(async () => [
      { id: 'role-1', tenantId: 'tenant-1', slug: 'super-admin' },
      { id: 'role-2', tenantId: 'tenant-2', slug: 'super-admin' },
    ]);
    const rolePermissionUpsert = vi.fn(async () => ({}));

    const result = await materializePartnerAcquisitionRbac({
      permission: { upsert: permissionUpsert },
      role: { findMany: roleFindMany },
      rolePermission: { upsert: rolePermissionUpsert },
    });

    expect(PARTNER_ACQUISITION_RBAC_PERMISSIONS).toHaveLength(9);
    expect(PARTNER_ACQUISITION_RBAC_PERMISSION_SLUGS).toEqual([
      'partner_acquisition:read',
      'partner_acquisition:create',
      'partner_acquisition:transition',
      'partner_acquisition:promote',
      'partner_acquisition:approve',
      'partner_prospect:read',
      'partner_prospect:create',
      'partner_prospect:transition',
      'partner_prospect:convert',
    ]);
    expect(permissionUpsert).toHaveBeenCalledTimes(9);
    expect(roleFindMany).toHaveBeenCalledWith({
      where: { slug: 'super-admin' },
      select: { id: true, tenantId: true, slug: true },
    });
    expect(rolePermissionUpsert).toHaveBeenCalledTimes(18);
    expect(result).toEqual({
      permissionsUpserted: 9,
      roleGrantsUpserted: 18,
      superAdminRolesFound: 2,
    });
    expect(permissionUpsert.mock.calls[0][0]).toMatchObject({
      where: { slug: 'partner_acquisition:read' },
      create: {
        slug: 'partner_acquisition:read',
        resource: 'partner_acquisition',
      },
    });
    expect(rolePermissionUpsert.mock.calls[0][0]).toMatchObject({
      create: {
        tenantId: 'tenant-1',
        roleId: 'role-1',
        permissionId: 'permission-partner_acquisition:read',
      },
    });
  });

  it('materializes canonical sales:view, preserves SALES_VIEW, and backfills only authorized roles idempotently', async () => {
    const { client, state, spies } = createCommercialMaterializationClient();

    const firstResult = await materializeCommercialSalesRbac(client);
    const secondResult = await materializeCommercialSalesRbac(client);

    expect(firstResult).toEqual({
      permissionsUpserted: 1,
      roleGrantsUpserted: 2,
      rolesFound: 2,
    });
    expect(secondResult).toEqual({
      permissionsUpserted: 1,
      roleGrantsUpserted: 2,
      rolesFound: 2,
    });
    expect(state.permissionSlugs()).toEqual(['SALES_VIEW', 'sales:view']);
    expect(state.rolePermissionSlugs('super-admin')).toEqual([
      'permission-SALES_VIEW',
      'permission-sales:view',
    ]);
    expect(state.rolePermissionSlugs('ROLE_CEO')).toEqual([
      'permission-SALES_VIEW',
      'permission-sales:view',
    ]);
    expect(state.rolePermissionSlugs('ROLE_ADMIN_SISTEMA')).toEqual([
      'permission-admin-only',
    ]);
    expect(state.rolePermissionCount()).toBe(5);
    expect(spies.permissionUpsert).toHaveBeenCalledTimes(2);
    expect(spies.roleFindMany).toHaveBeenCalledTimes(4);
    expect(spies.rolePermissionUpsert).toHaveBeenCalledTimes(4);
    expect(spies.permissionUpsert.mock.calls[0][0]).toMatchObject({
      where: { slug: 'sales:view' },
      create: {
        slug: 'sales:view',
        resource: 'sales',
      },
    });
  });
});

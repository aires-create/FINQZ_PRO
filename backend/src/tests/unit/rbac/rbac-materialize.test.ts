import { describe, expect, it, vi } from 'vitest';

import {
  PARTNER_ACQUISITION_RBAC_PERMISSIONS,
  PARTNER_ACQUISITION_RBAC_PERMISSION_SLUGS,
} from '../../../modules/permissions/partner-acquisition-rbac.catalog.js';
import { materializePartnerAcquisitionRbac } from '../../../scripts/rbac-materialize.js';

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

    expect(PARTNER_ACQUISITION_RBAC_PERMISSIONS).toHaveLength(7);
    expect(PARTNER_ACQUISITION_RBAC_PERMISSION_SLUGS).toEqual([
      'partner_acquisition:read',
      'partner_acquisition:create',
      'partner_acquisition:approve',
      'partner_prospect:read',
      'partner_prospect:create',
      'partner_prospect:transition',
      'partner_prospect:convert',
    ]);
    expect(permissionUpsert).toHaveBeenCalledTimes(7);
    expect(roleFindMany).toHaveBeenCalledWith({
      where: { slug: 'super-admin' },
      select: { id: true, tenantId: true, slug: true },
    });
    expect(rolePermissionUpsert).toHaveBeenCalledTimes(14);
    expect(result).toEqual({
      permissionsUpserted: 7,
      roleGrantsUpserted: 14,
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
});

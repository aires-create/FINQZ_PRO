import { PermissionAction } from '@prisma/client';

export interface RbacPermissionDefinition {
  name: string;
  slug: string;
  description: string;
  resource: string;
  action: PermissionAction;
}

export const PARTNER_ACQUISITION_RBAC_PERMISSIONS: readonly RbacPermissionDefinition[] = [
  {
    name: 'Read Partner Acquisition',
    slug: 'partner_acquisition:read',
    description: 'View partner acquisition leads and prospects',
    resource: 'partner_acquisition',
    action: PermissionAction.READ,
  },
  {
    name: 'Create Partner Acquisition',
    slug: 'partner_acquisition:create',
    description: 'Create partner acquisition leads and prospects',
    resource: 'partner_acquisition',
    action: PermissionAction.CREATE,
  },
  {
    name: 'Promote Partner Acquisition Lead',
    slug: 'partner_acquisition:promote',
    description: 'Promote qualified partner acquisition leads to prospects',
    resource: 'partner_acquisition',
    action: PermissionAction.UPDATE,
  },
  {
    name: 'Approve Partner Acquisition',
    slug: 'partner_acquisition:approve',
    description: 'Approve partner acquisition conversions',
    resource: 'partner_acquisition',
    action: PermissionAction.APPROVE,
  },
  {
    name: 'Read Partner Prospect',
    slug: 'partner_prospect:read',
    description: 'View partner prospect lifecycle records',
    resource: 'partner_prospect',
    action: PermissionAction.READ,
  },
  {
    name: 'Create Partner Prospect',
    slug: 'partner_prospect:create',
    description: 'Create partner prospect lifecycle records',
    resource: 'partner_prospect',
    action: PermissionAction.CREATE,
  },
  {
    name: 'Transition Partner Prospect',
    slug: 'partner_prospect:transition',
    description: 'Move partner prospects through lifecycle stages',
    resource: 'partner_prospect',
    action: PermissionAction.UPDATE,
  },
  {
    name: 'Convert Partner Prospect',
    slug: 'partner_prospect:convert',
    description: 'Convert partner prospects into official partners',
    resource: 'partner_prospect',
    action: PermissionAction.APPROVE,
  },
] as const;

export const PARTNER_ACQUISITION_RBAC_PERMISSION_SLUGS = PARTNER_ACQUISITION_RBAC_PERMISSIONS.map(
  (permission) => permission.slug,
);

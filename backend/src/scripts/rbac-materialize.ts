import { PermissionAction, type PrismaClient } from '@prisma/client';
import { pathToFileURL } from 'node:url';

import { prisma } from '../database/prisma.js';
import { createModuleLogger } from '../shared/logger.js';
import {
  PARTNER_ACQUISITION_RBAC_PERMISSIONS,
  PARTNER_ACQUISITION_RBAC_PERMISSION_SLUGS,
} from '../modules/permissions/partner-acquisition-rbac.catalog.js';

const logger = createModuleLogger('RbacMaterializer');

type PermissionDelegate = PrismaClient['permission'];
type RoleDelegate = PrismaClient['role'];
type RolePermissionDelegate = PrismaClient['rolePermission'];

export interface RbacMaterializationClient {
  permission: Pick<PermissionDelegate, 'upsert'>;
  role: Pick<RoleDelegate, 'findMany'>;
  rolePermission: Pick<RolePermissionDelegate, 'upsert'>;
}

export interface RbacMaterializationResult {
  permissionsUpserted: number;
  roleGrantsUpserted: number;
  superAdminRolesFound: number;
}

export interface CommercialSalesMaterializationResult {
  permissionsUpserted: number;
  roleGrantsUpserted: number;
  rolesFound: number;
}

const COMMERCIAL_SALES_PERMISSION = {
  name: 'View Commercial Sales',
  slug: 'sales:view',
  description: 'Canonical view access for commercial coverage and commercial tables',
  resource: 'sales',
  action: PermissionAction.VIEW,
};

const COMMERCIAL_SALES_ROLE_SLUGS = ['super-admin', 'ROLE_CEO'] as const;

export const materializePartnerAcquisitionRbac = async (
  client: RbacMaterializationClient = prisma,
): Promise<RbacMaterializationResult> => {
  const permissions = [];

  for (const definition of PARTNER_ACQUISITION_RBAC_PERMISSIONS) {
    const permission = await client.permission.upsert({
      where: { slug: definition.slug },
      update: {
        name: definition.name,
        description: definition.description,
        resource: definition.resource,
        action: definition.action,
      },
      create: {
        name: definition.name,
        slug: definition.slug,
        description: definition.description,
        resource: definition.resource,
        action: definition.action,
      },
    });

    permissions.push(permission);
  }

  const superAdminRoles = await client.role.findMany({
    where: { slug: 'super-admin' },
    select: { id: true, tenantId: true, slug: true },
  });

  let roleGrantsUpserted = 0;

  for (const role of superAdminRoles) {
    for (const permission of permissions) {
      await client.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {
          tenantId: role.tenantId,
        },
        create: {
          tenantId: role.tenantId,
          roleId: role.id,
          permissionId: permission.id,
        },
      });

      roleGrantsUpserted += 1;
    }
  }

  return {
    permissionsUpserted: PARTNER_ACQUISITION_RBAC_PERMISSION_SLUGS.length,
    roleGrantsUpserted,
    superAdminRolesFound: superAdminRoles.length,
  };
};

export const materializeCommercialSalesRbac = async (
  client: RbacMaterializationClient = prisma,
): Promise<CommercialSalesMaterializationResult> => {
  const permission = await client.permission.upsert({
    where: { slug: COMMERCIAL_SALES_PERMISSION.slug },
    update: {
      name: COMMERCIAL_SALES_PERMISSION.name,
      description: COMMERCIAL_SALES_PERMISSION.description,
      resource: COMMERCIAL_SALES_PERMISSION.resource,
      action: COMMERCIAL_SALES_PERMISSION.action,
    },
    create: COMMERCIAL_SALES_PERMISSION,
  });

  const [superAdminRoles, ceoRoles] = await Promise.all([
    client.role.findMany({
      where: { slug: COMMERCIAL_SALES_ROLE_SLUGS[0] },
      select: { id: true, tenantId: true, slug: true },
    }),
    client.role.findMany({
      where: { slug: COMMERCIAL_SALES_ROLE_SLUGS[1] },
      select: { id: true, tenantId: true, slug: true },
    }),
  ]);

  if (superAdminRoles.length === 0) {
    throw new Error('No super-admin roles found for commercial sales RBAC materialization');
  }

  if (ceoRoles.length === 0) {
    throw new Error('No ROLE_CEO roles found for commercial sales RBAC materialization');
  }

  const roles = [...superAdminRoles, ...ceoRoles];
  let roleGrantsUpserted = 0;

  for (const role of roles) {
    await client.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      update: {
        tenantId: role.tenantId,
      },
      create: {
        tenantId: role.tenantId,
        roleId: role.id,
        permissionId: permission.id,
      },
    });

    roleGrantsUpserted += 1;
  }

  return {
    permissionsUpserted: 1,
    roleGrantsUpserted,
    rolesFound: roles.length,
  };
};

export async function main(): Promise<void> {
  logger.info('Starting RBAC materialization');

  try {
    const partnerAcquisitionResult = await materializePartnerAcquisitionRbac(prisma);

    if (partnerAcquisitionResult.superAdminRolesFound === 0) {
      throw new Error('No super-admin roles found for RBAC materialization');
    }

    const commercialSalesResult = await materializeCommercialSalesRbac(prisma);

    logger.info('RBAC materialization completed', {
      partnerAcquisitionResult,
      commercialSalesResult,
    });
  } finally {
    await prisma.$disconnect();
  }
}

const isDirectExecution = () => {
  const entrypoint = process.argv[1];

  if (!entrypoint) {
    return false;
  }

  return import.meta.url === pathToFileURL(entrypoint).href;
};

if (isDirectExecution()) {
  main().catch((error) => {
    logger.error('RBAC materialization failed', error);
    process.exitCode = 1;
  });
}

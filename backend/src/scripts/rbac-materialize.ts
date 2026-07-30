import { pathToFileURL } from 'node:url';

import { prisma } from '../database/prisma.js';
import { createModuleLogger } from '../shared/logger.js';
import {
  PARTNER_ACQUISITION_RBAC_PERMISSIONS,
  PARTNER_ACQUISITION_RBAC_PERMISSION_SLUGS,
} from '../modules/permissions/partner-acquisition-rbac.catalog.js';

const logger = createModuleLogger('RbacMaterializer');

export interface RbacMaterializationClient {
  permission: {
    upsert: (args: {
      where: { slug: string };
      update: {
        name: string;
        description: string;
        resource: string;
        action: (typeof PARTNER_ACQUISITION_RBAC_PERMISSIONS)[number]['action'];
      };
      create: {
        name: string;
        slug: string;
        description: string;
        resource: string;
        action: (typeof PARTNER_ACQUISITION_RBAC_PERMISSIONS)[number]['action'];
      };
    }) => Promise<{ id: string; slug: string }>;
  };
  role: {
    findMany: (args: {
      where: { slug: string };
      select: { id: boolean; tenantId: boolean; slug: boolean };
    }) => Promise<Array<{ id: string; tenantId: string; slug: string }>>;
  };
  rolePermission: {
    upsert: (args: {
      where: { roleId_permissionId: { roleId: string; permissionId: string } };
      update: { tenantId: string };
      create: { tenantId: string; roleId: string; permissionId: string };
    }) => Promise<unknown>;
  };
}

export interface RbacMaterializationResult {
  permissionsUpserted: number;
  roleGrantsUpserted: number;
  superAdminRolesFound: number;
}

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

export async function main(): Promise<void> {
  logger.info('Starting Partner Acquisition RBAC materialization');

  try {
    const result = await materializePartnerAcquisitionRbac(prisma);

    if (result.superAdminRolesFound === 0) {
      throw new Error('No super-admin roles found for RBAC materialization');
    }

    logger.info('Partner Acquisition RBAC materialization completed', result);
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
    logger.error('Partner Acquisition RBAC materialization failed', error);
    process.exitCode = 1;
  });
}

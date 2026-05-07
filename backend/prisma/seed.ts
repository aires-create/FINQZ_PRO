import { PrismaClient, PermissionAction, RoleType } from '@prisma/client';
import { hashPassword } from '../src/utils/password';
import { createModuleLogger } from '../src/shared/logger';

const prisma = new PrismaClient();
const logger = createModuleLogger('DatabaseSeed');

interface PermissionData {
  name: string;
  slug: string;
  description?: string;
  resource: string;
  action: PermissionAction;
}

interface RoleData {
  name: string;
  slug: string;
  type: RoleType;
  description?: string;
  isSystem: boolean;
  permissions: string[]; // permission slugs
}

interface UserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  roleSlug: string;
}

/**
 * Enterprise RBAC Seed System for FINQZ PRO
 * Idempotent execution with TypeScript strict mode compatibility
 */
async function seedRBAC(): Promise<void> {
  try {
    logger.info('Starting RBAC seed process...');

    // 1. Create default tenant
    const tenant = await createDefaultTenant();

    // 2. Create permissions
    const permissions = await createPermissions();

    // 3. Create roles
    const roles = await createRoles(tenant.id, permissions);

    // 4. Create role-permission relations
    await createRolePermissions(roles, permissions);

    // 5. Create default SUPER_ADMIN user
    await createDefaultSuperAdmin(tenant.id, roles);

    logger.info('RBAC seed process completed successfully');
  } catch (error) {
    logger.error('RBAC seed process failed:', error);
    throw error;
  }
}

/**
 * Create default tenant for the system
 */
async function createDefaultTenant() {
  logger.info('Creating default tenant...');

  const tenant = await prisma.tenant.upsert({
    where: { domain: 'finqz-pro.com' },
    update: {},
    create: {
      name: 'FINQZ PRO',
      domain: 'finqz-pro.com',
      plan: 'enterprise',
      isActive: true,
    },
  });

  logger.info(`Default tenant created/updated: ${tenant.id}`);
  return tenant;
}

/**
 * Create comprehensive permissions for the system
 */
async function createPermissions() {
  logger.info('Creating permissions...');

  const permissionData: PermissionData[] = [
    // System permissions
    {
      name: 'System Administration',
      slug: 'system:admin',
      description: 'Full system administration access',
      resource: 'system',
      action: PermissionAction.VIEW,
    },

    // User permissions
    {
      name: 'Create User',
      slug: 'user:create',
      description: 'Create new users',
      resource: 'users',
      action: PermissionAction.CREATE,
    },
    {
      name: 'Read User',
      slug: 'user:read',
      description: 'View user information',
      resource: 'users',
      action: PermissionAction.READ,
    },
    {
      name: 'Update User',
      slug: 'user:update',
      description: 'Update user information',
      resource: 'users',
      action: PermissionAction.UPDATE,
    },
    {
      name: 'Delete User',
      slug: 'user:delete',
      description: 'Delete users',
      resource: 'users',
      action: PermissionAction.DELETE,
    },

    // Role permissions
    {
      name: 'Create Role',
      slug: 'role:create',
      description: 'Create new roles',
      resource: 'roles',
      action: PermissionAction.CREATE,
    },
    {
      name: 'Read Role',
      slug: 'role:read',
      description: 'View role information',
      resource: 'roles',
      action: PermissionAction.READ,
    },
    {
      name: 'Update Role',
      slug: 'role:update',
      description: 'Update role information',
      resource: 'roles',
      action: PermissionAction.UPDATE,
    },
    {
      name: 'Delete Role',
      slug: 'role:delete',
      description: 'Delete roles',
      resource: 'roles',
      action: PermissionAction.DELETE,
    },

    // Permission permissions
    {
      name: 'Create Permission',
      slug: 'permission:create',
      description: 'Create new permissions',
      resource: 'permissions',
      action: PermissionAction.CREATE,
    },
    {
      name: 'Read Permission',
      slug: 'permission:read',
      description: 'View permission information',
      resource: 'permissions',
      action: PermissionAction.READ,
    },
    {
      name: 'Update Permission',
      slug: 'permission:update',
      description: 'Update permission information',
      resource: 'permissions',
      action: PermissionAction.UPDATE,
    },
    {
      name: 'Delete Permission',
      slug: 'permission:delete',
      description: 'Delete permissions',
      resource: 'permissions',
      action: PermissionAction.DELETE,
    },

    // Tenant permissions
    {
      name: 'Create Tenant',
      slug: 'tenant:create',
      description: 'Create new tenants',
      resource: 'tenants',
      action: PermissionAction.CREATE,
    },
    {
      name: 'Read Tenant',
      slug: 'tenant:read',
      description: 'View tenant information',
      resource: 'tenants',
      action: PermissionAction.READ,
    },
    {
      name: 'Update Tenant',
      slug: 'tenant:update',
      description: 'Update tenant information',
      resource: 'tenants',
      action: PermissionAction.UPDATE,
    },
    {
      name: 'Delete Tenant',
      slug: 'tenant:delete',
      description: 'Delete tenants',
      resource: 'tenants',
      action: PermissionAction.DELETE,
    },

    // Lead permissions
    {
      name: 'Create Lead',
      slug: 'lead:create',
      description: 'Create new leads',
      resource: 'leads',
      action: PermissionAction.CREATE,
    },
    {
      name: 'Read Lead',
      slug: 'lead:read',
      description: 'View lead information',
      resource: 'leads',
      action: PermissionAction.READ,
    },
    {
      name: 'Update Lead',
      slug: 'lead:update',
      description: 'Update lead information',
      resource: 'leads',
      action: PermissionAction.UPDATE,
    },
    {
      name: 'Delete Lead',
      slug: 'lead:delete',
      description: 'Delete leads',
      resource: 'leads',
      action: PermissionAction.DELETE,
    },
    {
      name: 'Export Lead',
      slug: 'lead:export',
      description: 'Export lead data',
      resource: 'leads',
      action: PermissionAction.EXPORT,
    },

    // Customer permissions
    {
      name: 'Create Customer',
      slug: 'customer:create',
      description: 'Create new customers',
      resource: 'customers',
      action: PermissionAction.CREATE,
    },
    {
      name: 'Read Customer',
      slug: 'customer:read',
      description: 'View customer information',
      resource: 'customers',
      action: PermissionAction.READ,
    },
    {
      name: 'Update Customer',
      slug: 'customer:update',
      description: 'Update customer information',
      resource: 'customers',
      action: PermissionAction.UPDATE,
    },
    {
      name: 'Delete Customer',
      slug: 'customer:delete',
      description: 'Delete customers',
      resource: 'customers',
      action: PermissionAction.DELETE,
    },
    {
      name: 'Export Customer',
      slug: 'customer:export',
      description: 'Export customer data',
      resource: 'customers',
      action: PermissionAction.EXPORT,
    },

    // Opportunity permissions
    {
      name: 'Create Opportunity',
      slug: 'opportunity:create',
      description: 'Create new opportunities',
      resource: 'opportunities',
      action: PermissionAction.CREATE,
    },
    {
      name: 'Read Opportunity',
      slug: 'opportunity:read',
      description: 'View opportunity information',
      resource: 'opportunities',
      action: PermissionAction.READ,
    },
    {
      name: 'Update Opportunity',
      slug: 'opportunity:update',
      description: 'Update opportunity information',
      resource: 'opportunities',
      action: PermissionAction.UPDATE,
    },
    {
      name: 'Delete Opportunity',
      slug: 'opportunity:delete',
      description: 'Delete opportunities',
      resource: 'opportunities',
      action: PermissionAction.DELETE,
    },
    {
      name: 'Approve Opportunity',
      slug: 'opportunity:approve',
      description: 'Approve opportunities',
      resource: 'opportunities',
      action: PermissionAction.APPROVE,
    },

    // Bank Proposal permissions
    {
      name: 'Create Bank Proposal',
      slug: 'bank-proposal:create',
      description: 'Create new bank proposals',
      resource: 'bank-proposals',
      action: PermissionAction.CREATE,
    },
    {
      name: 'Read Bank Proposal',
      slug: 'bank-proposal:read',
      description: 'View bank proposal information',
      resource: 'bank-proposals',
      action: PermissionAction.READ,
    },
    {
      name: 'Update Bank Proposal',
      slug: 'bank-proposal:update',
      description: 'Update bank proposal information',
      resource: 'bank-proposals',
      action: PermissionAction.UPDATE,
    },
    {
      name: 'Delete Bank Proposal',
      slug: 'bank-proposal:delete',
      description: 'Delete bank proposals',
      resource: 'bank-proposals',
      action: PermissionAction.DELETE,
    },
    {
      name: 'Approve Bank Proposal',
      slug: 'bank-proposal:approve',
      description: 'Approve bank proposals',
      resource: 'bank-proposals',
      action: PermissionAction.APPROVE,
    },

    // Commission permissions
    {
      name: 'Create Commission',
      slug: 'commission:create',
      description: 'Create new commissions',
      resource: 'commissions',
      action: PermissionAction.CREATE,
    },
    {
      name: 'Read Commission',
      slug: 'commission:read',
      description: 'View commission information',
      resource: 'commissions',
      action: PermissionAction.READ,
    },
    {
      name: 'Update Commission',
      slug: 'commission:update',
      description: 'Update commission information',
      resource: 'commissions',
      action: PermissionAction.UPDATE,
    },
    {
      name: 'Delete Commission',
      slug: 'commission:delete',
      description: 'Delete commissions',
      resource: 'commissions',
      action: PermissionAction.DELETE,
    },

    // Partner permissions
    {
      name: 'Create Partner',
      slug: 'partner:create',
      description: 'Create new partners',
      resource: 'partners',
      action: PermissionAction.CREATE,
    },
    {
      name: 'Read Partner',
      slug: 'partner:read',
      description: 'View partner information',
      resource: 'partners',
      action: PermissionAction.READ,
    },
    {
      name: 'Update Partner',
      slug: 'partner:update',
      description: 'Update partner information',
      resource: 'partners',
      action: PermissionAction.UPDATE,
    },
    {
      name: 'Delete Partner',
      slug: 'partner:delete',
      description: 'Delete partners',
      resource: 'partners',
      action: PermissionAction.DELETE,
    },
    {
      name: 'Assign Partner',
      slug: 'partner:assign',
      description: 'Assign partners to customers',
      resource: 'partners',
      action: PermissionAction.ASSIGN,
    },

    // Pipeline permissions
    {
      name: 'Create Pipeline',
      slug: 'pipeline:create',
      description: 'Create new pipelines',
      resource: 'pipelines',
      action: PermissionAction.CREATE,
    },
    {
      name: 'Read Pipeline',
      slug: 'pipeline:read',
      description: 'View pipeline information',
      resource: 'pipelines',
      action: PermissionAction.READ,
    },
    {
      name: 'Update Pipeline',
      slug: 'pipeline:update',
      description: 'Update pipeline information',
      resource: 'pipelines',
      action: PermissionAction.UPDATE,
    },
    {
      name: 'Delete Pipeline',
      slug: 'pipeline:delete',
      description: 'Delete pipelines',
      resource: 'pipelines',
      action: PermissionAction.DELETE,
    },

    // Report permissions
    {
      name: 'Read Report',
      slug: 'report:read',
      description: 'View reports',
      resource: 'reports',
      action: PermissionAction.READ,
    },
    {
      name: 'Export Report',
      slug: 'report:export',
      description: 'Export report data',
      resource: 'reports',
      action: PermissionAction.EXPORT,
    },

    // Audit permissions
    {
      name: 'Read Audit Log',
      slug: 'audit:read',
      description: 'View audit logs',
      resource: 'audit',
      action: PermissionAction.READ,
    },
  ];

  const permissions: Record<string, any> = {};

  for (const perm of permissionData) {
    const permission = await prisma.permission.upsert({
      where: { slug: perm.slug },
      update: {},
      create: perm,
    });
    permissions[perm.slug] = permission;
  }

  logger.info(`Created/updated ${Object.keys(permissions).length} permissions`);
  return permissions;
}

/**
 * Create roles with their associated permissions
 */
async function createRoles(tenantId: string, permissions: Record<string, any>) {
  logger.info('Creating roles...');

  const roleData: RoleData[] = [
    {
      name: 'Super Administrator',
      slug: 'super-admin',
      type: RoleType.SYSTEM,
      description: 'Full system access with all permissions',
      isSystem: true,
      permissions: Object.keys(permissions), // All permissions
    },
    {
      name: 'Administrator',
      slug: 'admin',
      type: RoleType.ADMIN,
      description: 'Administrative access to most system features',
      isSystem: true,
      permissions: [
        // User management
        'user:create', 'user:read', 'user:update', 'user:delete',
        // Role management
        'role:create', 'role:read', 'role:update', 'role:delete',
        // Permission management
        'permission:create', 'permission:read', 'permission:update', 'permission:delete',
        // Tenant management
        'tenant:create', 'tenant:read', 'tenant:update', 'tenant:delete',
        // Lead management
        'lead:create', 'lead:read', 'lead:update', 'lead:delete', 'lead:export',
        // Customer management
        'customer:create', 'customer:read', 'customer:update', 'customer:delete', 'customer:export',
        // Opportunity management
        'opportunity:create', 'opportunity:read', 'opportunity:update', 'opportunity:delete', 'opportunity:approve',
        // Bank proposal management
        'bank-proposal:create', 'bank-proposal:read', 'bank-proposal:update', 'bank-proposal:delete', 'bank-proposal:approve',
        // Commission management
        'commission:create', 'commission:read', 'commission:update', 'commission:delete',
        // Partner management
        'partner:create', 'partner:read', 'partner:update', 'partner:delete', 'partner:assign',
        // Pipeline management
        'pipeline:create', 'pipeline:read', 'pipeline:update', 'pipeline:delete',
        // Reports
        'report:read', 'report:export',
        // Audit
        'audit:read',
      ],
    },
    {
      name: 'Manager',
      slug: 'manager',
      type: RoleType.MANAGER,
      description: 'Management access to operational features',
      isSystem: true,
      permissions: [
        // User management (limited)
        'user:read', 'user:update',
        // Lead management
        'lead:create', 'lead:read', 'lead:update', 'lead:delete', 'lead:export',
        // Customer management
        'customer:create', 'customer:read', 'customer:update', 'customer:delete', 'customer:export',
        // Opportunity management
        'opportunity:create', 'opportunity:read', 'opportunity:update', 'opportunity:delete', 'opportunity:approve',
        // Bank proposal management
        'bank-proposal:create', 'bank-proposal:read', 'bank-proposal:update', 'bank-proposal:delete', 'bank-proposal:approve',
        // Commission management
        'commission:create', 'commission:read', 'commission:update', 'commission:delete',
        // Partner management (limited)
        'partner:read', 'partner:update', 'partner:assign',
        // Pipeline management
        'pipeline:create', 'pipeline:read', 'pipeline:update', 'pipeline:delete',
        // Reports
        'report:read', 'report:export',
      ],
    },
    {
      name: 'User',
      slug: 'user',
      type: RoleType.USER,
      description: 'Standard user access',
      isSystem: true,
      permissions: [
        // Lead management (limited)
        'lead:create', 'lead:read', 'lead:update',
        // Customer management (limited)
        'customer:read', 'customer:update',
        // Opportunity management (limited)
        'opportunity:create', 'opportunity:read', 'opportunity:update',
        // Bank proposal management (limited)
        'bank-proposal:create', 'bank-proposal:read', 'bank-proposal:update',
        // Commission management (limited)
        'commission:read',
        // Partner management (limited)
        'partner:read',
        // Pipeline management (limited)
        'pipeline:read',
        // Reports (limited)
        'report:read',
      ],
    },
    {
      name: 'Auditor',
      slug: 'auditor',
      type: RoleType.AUDITOR,
      description: 'Read-only access for auditing purposes',
      isSystem: true,
      permissions: [
        // Read-only permissions
        'user:read',
        'role:read',
        'permission:read',
        'tenant:read',
        'lead:read',
        'customer:read',
        'opportunity:read',
        'bank-proposal:read',
        'commission:read',
        'partner:read',
        'pipeline:read',
        'report:read',
        'audit:read',
      ],
    },
    {
      name: 'Support',
      slug: 'support',
      type: RoleType.SUPPORT,
      description: 'Support team access',
      isSystem: true,
      permissions: [
        // User support
        'user:read', 'user:update',
        // Lead support
        'lead:read', 'lead:update',
        // Customer support
        'customer:read', 'customer:update',
        // Opportunity support
        'opportunity:read', 'opportunity:update',
        // Bank proposal support
        'bank-proposal:read', 'bank-proposal:update',
        // Commission support
        'commission:read', 'commission:update',
        // Partner support
        'partner:read', 'partner:update',
        // Pipeline support
        'pipeline:read',
        // Reports
        'report:read',
        // Audit
        'audit:read',
      ],
    },
  ];

  const roles: Record<string, any> = {};

  for (const role of roleData) {
    const createdRole = await prisma.role.upsert({
      where: {
        tenantId_slug: {
          tenantId,
          slug: role.slug,
        },
      },
      update: {},
      create: {
        name: role.name,
        slug: role.slug,
        type: role.type,
        description: role.description,
        isSystem: role.isSystem,
        tenantId,
      },
    });
    roles[role.slug] = createdRole;
  }

  logger.info(`Created/updated ${Object.keys(roles).length} roles`);
  return roles;
}

/**
 * Create role-permission relationships
 */
async function createRolePermissions(roles: Record<string, any>, permissions: Record<string, any>) {
  logger.info('Creating role-permission relationships...');

  const rolePermissionData = [
    {
      roleSlug: 'super-admin',
      permissionSlugs: Object.keys(permissions), // All permissions
    },
    {
      roleSlug: 'admin',
      permissionSlugs: [
        'user:create', 'user:read', 'user:update', 'user:delete',
        'role:create', 'role:read', 'role:update', 'role:delete',
        'permission:create', 'permission:read', 'permission:update', 'permission:delete',
        'tenant:create', 'tenant:read', 'tenant:update', 'tenant:delete',
        'lead:create', 'lead:read', 'lead:update', 'lead:delete', 'lead:export',
        'customer:create', 'customer:read', 'customer:update', 'customer:delete', 'customer:export',
        'opportunity:create', 'opportunity:read', 'opportunity:update', 'opportunity:delete', 'opportunity:approve',
        'bank-proposal:create', 'bank-proposal:read', 'bank-proposal:update', 'bank-proposal:delete', 'bank-proposal:approve',
        'commission:create', 'commission:read', 'commission:update', 'commission:delete',
        'partner:create', 'partner:read', 'partner:update', 'partner:delete', 'partner:assign',
        'pipeline:create', 'pipeline:read', 'pipeline:update', 'pipeline:delete',
        'report:read', 'report:export',
        'audit:read',
      ],
    },
    {
      roleSlug: 'manager',
      permissionSlugs: [
        'user:read', 'user:update',
        'lead:create', 'lead:read', 'lead:update', 'lead:delete', 'lead:export',
        'customer:create', 'customer:read', 'customer:update', 'customer:delete', 'customer:export',
        'opportunity:create', 'opportunity:read', 'opportunity:update', 'opportunity:delete', 'opportunity:approve',
        'bank-proposal:create', 'bank-proposal:read', 'bank-proposal:update', 'bank-proposal:delete', 'bank-proposal:approve',
        'commission:create', 'commission:read', 'commission:update', 'commission:delete',
        'partner:read', 'partner:update', 'partner:assign',
        'pipeline:create', 'pipeline:read', 'pipeline:update', 'pipeline:delete',
        'report:read', 'report:export',
      ],
    },
    {
      roleSlug: 'user',
      permissionSlugs: [
        'lead:create', 'lead:read', 'lead:update',
        'customer:read', 'customer:update',
        'opportunity:create', 'opportunity:read', 'opportunity:update',
        'bank-proposal:create', 'bank-proposal:read', 'bank-proposal:update',
        'commission:read',
        'partner:read',
        'pipeline:read',
        'report:read',
      ],
    },
    {
      roleSlug: 'auditor',
      permissionSlugs: [
        'user:read',
        'role:read',
        'permission:read',
        'tenant:read',
        'lead:read',
        'customer:read',
        'opportunity:read',
        'bank-proposal:read',
        'commission:read',
        'partner:read',
        'pipeline:read',
        'report:read',
        'audit:read',
      ],
    },
    {
      roleSlug: 'support',
      permissionSlugs: [
        'user:read', 'user:update',
        'lead:read', 'lead:update',
        'customer:read', 'customer:update',
        'opportunity:read', 'opportunity:update',
        'bank-proposal:read', 'bank-proposal:update',
        'commission:read', 'commission:update',
        'partner:read', 'partner:update',
        'pipeline:read',
        'report:read',
        'audit:read',
      ],
    },
  ];

  for (const rp of rolePermissionData) {
    const role = roles[rp.roleSlug];
    if (!role) {
      logger.warn(`Role ${rp.roleSlug} not found, skipping permissions`);
      continue;
    }

    for (const permSlug of rp.permissionSlugs) {
      const permission = permissions[permSlug];
      if (!permission) {
        logger.warn(`Permission ${permSlug} not found, skipping`);
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  logger.info('Role-permission relationships created');
}

/**
 * Create default SUPER_ADMIN user
 */
async function createDefaultSuperAdmin(tenantId: string, roles: Record<string, any>) {
  logger.info('Creating default SUPER_ADMIN user...');

  const superAdminRole = roles['super-admin'];
  if (!superAdminRole) {
    throw new Error('SUPER_ADMIN role not found');
  }

  const userData: UserData = {
    email: 'admin@finqz-pro.com',
    password: 'SuperAdmin123!',
    firstName: 'Super',
    lastName: 'Administrator',
    isEmailVerified: true,
    roleSlug: 'super-admin',
  };

  const hashedPassword = await hashPassword(userData.password);

  const user = await prisma.user.upsert({
    where: {
      tenantId_emailNormalized: {
        tenantId,
        emailNormalized: userData.email.toLowerCase().trim(),
      },
    },
    update: {},
    create: {
      email: userData.email,
      emailNormalized: userData.email.toLowerCase().trim(),
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      isActive: true,
      isEmailVerified: userData.isEmailVerified,
      tenantId,
      roleId: superAdminRole.id,
    },
  });

  logger.info(`Default SUPER_ADMIN user created/updated: ${user.id}`);
  return user;
}

/**
 * Main seed execution function
 */
async function main() {
  try {
    logger.info('Starting database seed process...');

    await seedRBAC();

    logger.info('Database seed process completed successfully');
  } catch (error) {
    logger.error('Database seed process failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute seed if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      logger.info('Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seed failed:', error);
      process.exit(1);
    });
}

export { seedRBAC, main };
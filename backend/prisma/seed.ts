import { Prisma, PrismaClient, PermissionAction, RoleType } from '@prisma/client';
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
  priority: number;
  parentSlug?: string;
  permissions: string[]; // permission slugs
}

interface OrganizationData {
  name: string;
  code: string;
  description?: string;
  type: string;
  level: number;
  parentCode?: string; // Reference to parent by code
  settings?: any;
}

interface MembershipData {
  userEmail: string;
  organizationCode: string;
  role: string;
  permissions?: any;
}

interface UserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  roleSlug: string;
}

const consignadoPipelineSeed = {
  name: 'Consignado',
  description: 'Pipeline oficial minimo para homologacao de oportunidades.',
  isDefault: true,
  isActive: true,
  stages: [
    { name: 'Novo Lead', order: 1, isWon: false, isLost: false },
    { name: 'Negociação', order: 2, isWon: false, isLost: false },
    { name: 'Documentação', order: 3, isWon: false, isLost: false },
    { name: 'Aceite', order: 4, isWon: false, isLost: false },
    { name: 'Contrato Enviado', order: 5, isWon: false, isLost: false },
    { name: 'Aguardando Assinatura', order: 6, isWon: false, isLost: false },
    { name: 'Contrato Assinado', order: 7, isWon: false, isLost: false },
    { name: 'Formalização', order: 8, isWon: false, isLost: false },
    { name: 'Integrado', order: 9, isWon: true, isLost: false },
    { name: 'Pendência', order: 10, isWon: false, isLost: false },
    { name: 'Perdido', order: 11, isWon: false, isLost: true },
  ],
} as const;

/**
 * Enterprise RBAC Seed System for FINQZ PRO
 * Idempotent execution with TypeScript strict mode compatibility
 */
async function seedRBAC(): Promise<void> {
  try {
    logger.info('Starting RBAC seed process...');

    // 1. Create default tenant
    const tenant = await createDefaultTenant();

    // 1.1 Create minimum pipeline/stage foundation
    await seedOpportunityFoundation(tenant.id);

    // 2. Create permissions
    const permissions = await createPermissions();

    // 3. Create roles
    const roles = await createRoles(tenant.id, permissions);

    // 4. Create role-permission relations
    await createRolePermissions(tenant.id, roles, permissions);

    // 5. Create organizations
    const organizations = await createOrganizations(tenant.id);

    // 6. Create default SUPER_ADMIN user
    await createDefaultSuperAdmin(tenant.id, roles);

    // 7. Create memberships
    await createMemberships(tenant.id, organizations);

    logger.info('RBAC seed process completed successfully');
  } catch (error) {
    logger.error('RBAC seed process failed:', error);
    throw error;
  }
}

async function seedOpportunityFoundation(tenantId: string): Promise<void> {
  logger.info('Creating minimum opportunity pipeline foundation...');

  const existingPipeline = await prisma.pipeline.findFirst({
    where: {
      tenantId,
      name: consignadoPipelineSeed.name,
    },
    select: { id: true },
  });

  const pipeline = existingPipeline
    ? await prisma.pipeline.update({
        where: { id: existingPipeline.id },
        data: {
          description: consignadoPipelineSeed.description,
          isDefault: consignadoPipelineSeed.isDefault,
          isActive: consignadoPipelineSeed.isActive,
          deletedAt: null,
        },
      })
    : await prisma.pipeline.create({
        data: {
          tenantId,
          name: consignadoPipelineSeed.name,
          description: consignadoPipelineSeed.description,
          isDefault: consignadoPipelineSeed.isDefault,
          isActive: consignadoPipelineSeed.isActive,
        },
      });

  for (const stage of consignadoPipelineSeed.stages) {
    await prisma.stage.upsert({
      where: {
        pipelineId_order: {
          pipelineId: pipeline.id,
          order: stage.order,
        },
      },
      update: {
        tenantId,
        name: stage.name,
        isWon: stage.isWon,
        isLost: stage.isLost,
        deletedAt: null,
      },
      create: {
        tenantId,
        pipelineId: pipeline.id,
        name: stage.name,
        order: stage.order,
        isWon: stage.isWon,
        isLost: stage.isLost,
      },
    });
  }

  logger.info(`Pipeline foundation created/updated: ${pipeline.id}`);
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
    {
      name: 'Reset User Password',
      slug: 'user:reset-password',
      description: 'Reset user passwords administratively',
      resource: 'users',
      action: PermissionAction.UPDATE,
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

    // Organization permissions
    {
      name: 'Create Organization',
      slug: 'organization:create',
      description: 'Create tenant organizations',
      resource: 'organizations',
      action: PermissionAction.CREATE,
    },
    {
      name: 'Read Organization',
      slug: 'organization:read',
      description: 'View tenant organizations',
      resource: 'organizations',
      action: PermissionAction.READ,
    },
    {
      name: 'Update Organization',
      slug: 'organization:update',
      description: 'Update tenant organizations',
      resource: 'organizations',
      action: PermissionAction.UPDATE,
    },
    {
      name: 'Delete Organization',
      slug: 'organization:delete',
      description: 'Delete tenant organizations',
      resource: 'organizations',
      action: PermissionAction.DELETE,
    },

    // Membership permissions
    {
      name: 'Create Membership',
      slug: 'membership:create',
      description: 'Invite users into organizations',
      resource: 'memberships',
      action: PermissionAction.CREATE,
    },
    {
      name: 'Read Membership',
      slug: 'membership:read',
      description: 'View organization memberships',
      resource: 'memberships',
      action: PermissionAction.READ,
    },
    {
      name: 'Update Membership',
      slug: 'membership:update',
      description: 'Update organization memberships',
      resource: 'memberships',
      action: PermissionAction.UPDATE,
    },
    {
      name: 'Delete Membership',
      slug: 'membership:delete',
      description: 'Remove organization memberships',
      resource: 'memberships',
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

    // Commercial Governance permissions
    {
      name: 'Create Commercial Request',
      slug: 'commercial-request:create',
      description: 'Create commercial governance requests',
      resource: 'commercial-requests',
      action: PermissionAction.CREATE,
    },
    {
      name: 'Read Commercial Request',
      slug: 'commercial-request:read',
      description: 'View commercial governance requests',
      resource: 'commercial-requests',
      action: PermissionAction.READ,
    },
    {
      name: 'Submit Commercial Request',
      slug: 'commercial-request:submit',
      description: 'Submit commercial governance requests',
      resource: 'commercial-requests',
      action: PermissionAction.UPDATE,
    },
    {
      name: 'Approve Commercial Request',
      slug: 'commercial-request:approve',
      description: 'Approve commercial governance requests',
      resource: 'commercial-requests',
      action: PermissionAction.APPROVE,
    },
    {
      name: 'Reject Commercial Request',
      slug: 'commercial-request:reject',
      description: 'Reject commercial governance requests',
      resource: 'commercial-requests',
      action: PermissionAction.UPDATE,
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

    // Enterprise permissions
    {
      name: 'View Dashboard',
      slug: 'DASHBOARD_VIEW',
      description: 'View enterprise dashboard',
      resource: 'dashboard',
      action: PermissionAction.VIEW,
    },
    {
      name: 'View Reports',
      slug: 'REPORT_VIEW',
      description: 'View enterprise reports',
      resource: 'report',
      action: PermissionAction.READ,
    },
    {
      name: 'View Simulador',
      slug: 'SIMULADOR_VIEW',
      description: 'View simulator module',
      resource: 'simulador',
      action: PermissionAction.VIEW,
    },
    {
      name: 'Export Reports',
      slug: 'REPORT_EXPORT',
      description: 'Export enterprise reports',
      resource: 'report',
      action: PermissionAction.EXPORT,
    },
    {
      name: 'View Finance',
      slug: 'FINANCE_VIEW',
      description: 'View finance module data',
      resource: 'finance',
      action: PermissionAction.VIEW,
    },
    {
      name: 'Create Finance',
      slug: 'FINANCE_CREATE',
      description: 'Create finance records',
      resource: 'finance',
      action: PermissionAction.CREATE,
    },
    {
      name: 'Edit Finance',
      slug: 'FINANCE_EDIT',
      description: 'Edit finance records',
      resource: 'finance',
      action: PermissionAction.UPDATE,
    },
    {
      name: 'Delete Finance',
      slug: 'FINANCE_DELETE',
      description: 'Delete finance records',
      resource: 'finance',
      action: PermissionAction.DELETE,
    },
    {
      name: 'Approve Finance',
      slug: 'FINANCE_APPROVE',
      description: 'Approve finance records',
      resource: 'finance',
      action: PermissionAction.APPROVE,
    },
    {
      name: 'Export Finance',
      slug: 'FINANCE_EXPORT',
      description: 'Export finance data',
      resource: 'finance',
      action: PermissionAction.EXPORT,
    },
    {
      name: 'View Sales',
      slug: 'SALES_VIEW',
      description: 'View sales data',
      resource: 'sales',
      action: PermissionAction.VIEW,
    },
    {
      name: 'View Customer',
      slug: 'CUSTOMER_VIEW',
      description: 'View customer data',
      resource: 'customer',
      action: PermissionAction.READ,
    },
    {
      name: 'View Contract',
      slug: 'CONTRACT_VIEW',
      description: 'View contract data',
      resource: 'sales',
      action: PermissionAction.READ,
    },
    {
      name: 'View Dispute',
      slug: 'DISPUTE_VIEW',
      description: 'View dispute records',
      resource: 'dispute',
      action: PermissionAction.VIEW,
    },
    {
      name: 'Create Dispute',
      slug: 'DISPUTE_CREATE',
      description: 'Create dispute records',
      resource: 'dispute',
      action: PermissionAction.CREATE,
    },
    {
      name: 'Edit Dispute',
      slug: 'DISPUTE_EDIT',
      description: 'Edit dispute records',
      resource: 'dispute',
      action: PermissionAction.UPDATE,
    },
    {
      name: 'Approve Dispute',
      slug: 'DISPUTE_APPROVE',
      description: 'Approve dispute records',
      resource: 'dispute',
      action: PermissionAction.APPROVE,
    },
    {
      name: 'Resolve Dispute',
      slug: 'DISPUTE_RESOLVE',
      description: 'Resolve dispute records',
      resource: 'dispute',
      action: PermissionAction.UPDATE,
    },
    {
      name: 'View Audit',
      slug: 'AUDIT_VIEW',
      description: 'View audit module data',
      resource: 'audit',
      action: PermissionAction.VIEW,
    },
    {
      name: 'Execute Audit',
      slug: 'AUDIT_EXECUTE',
      description: 'Execute audit operations',
      resource: 'audit',
      action: PermissionAction.UPDATE,
    },
    {
      name: 'Audit Report',
      slug: 'AUDIT_REPORT',
      description: 'Generate audit reports',
      resource: 'audit',
      action: PermissionAction.EXPORT,
    },
    {
      name: 'View System',
      slug: 'SYSTEM_VIEW',
      description: 'View system data',
      resource: 'system',
      action: PermissionAction.VIEW,
    },
    {
      name: 'Configure System',
      slug: 'SYSTEM_CONFIG',
      description: 'Configure system settings',
      resource: 'system',
      action: PermissionAction.UPDATE,
    },
    {
      name: 'Manage System Users',
      slug: 'SYSTEM_USERS_MANAGE',
      description: 'Manage system users',
      resource: 'system',
      action: PermissionAction.UPDATE,
    },
    {
      name: 'Manage System Roles',
      slug: 'SYSTEM_ROLES_MANAGE',
      description: 'Manage system roles',
      resource: 'system',
      action: PermissionAction.UPDATE,
    },
    {
      name: 'View System Logs',
      slug: 'SYSTEM_LOGS_VIEW',
      description: 'View system logs',
      resource: 'system',
      action: PermissionAction.READ,
    },
    {
      name: 'View Backoffice',
      slug: 'BACKOFFICE_VIEW',
      description: 'View backoffice features',
      resource: 'system',
      action: PermissionAction.VIEW,
    },
    {
      name: 'Edit Backoffice',
      slug: 'BACKOFFICE_EDIT',
      description: 'Edit backoffice features',
      resource: 'system',
      action: PermissionAction.UPDATE,
    },
    {
      name: 'Use SDR IA',
      slug: 'SDR_IA_USE',
      description: 'Use SDR AI assistant capabilities',
      resource: 'sales',
      action: PermissionAction.VIEW,
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
      priority: 100,
      parentSlug: 'admin',
      permissions: Object.keys(permissions), // All permissions
    },
    {
      name: 'Administrator',
      slug: 'admin',
      type: RoleType.ADMIN,
      description: 'Administrative access to most system features',
      isSystem: true,
      priority: 80,
      parentSlug: 'manager',
      permissions: [
        // User management
        'user:create', 'user:read', 'user:update', 'user:delete',
        // Role management
        'role:create', 'role:read', 'role:update', 'role:delete',
        // Permission management
        'permission:create', 'permission:read', 'permission:update', 'permission:delete',
        // Organization management
        'organization:create', 'organization:read', 'organization:update', 'organization:delete',
        // Membership management
        'membership:create', 'membership:read', 'membership:update', 'membership:delete',
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
      priority: 60,
      parentSlug: 'user',
      permissions: [
        // User management (limited)
        'user:read', 'user:update',
        // Organization management
        'organization:create', 'organization:read', 'organization:update',
        // Membership management
        'membership:create', 'membership:read', 'membership:update',
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
      priority: 10,
      permissions: [
        // Lead management (limited)
        'organization:read',
        'membership:read',
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
      priority: 20,
      parentSlug: 'user',
      permissions: [
        // Read-only permissions
        'user:read',
        'role:read',
        'permission:read',
        'organization:read',
        'membership:read',
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
      priority: 30,
      parentSlug: 'user',
      permissions: [
        // User support
        'user:read', 'user:update',
        // Organization support
        'organization:read',
        'membership:read', 'membership:update',
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
    {
      name: 'Admin Sistema',
      slug: 'ROLE_ADMIN_SISTEMA',
      type: RoleType.SYSTEM,
      description: 'Administrative access for FINQZ PRO system operations',
      isSystem: true,
      priority: 100,
      permissions: [],
    },
    {
      name: 'CEO',
      slug: 'ROLE_CEO',
      type: RoleType.ADMIN,
      description: 'Chief executive access',
      isSystem: true,
      priority: 95,
      permissions: [],
    },
    {
      name: 'Diretor de Auditoria',
      slug: 'ROLE_DIRETOR_AUDITORIA',
      type: RoleType.USER,
      description: 'Executive access for audit leadership',
      isSystem: true,
      priority: 80,
      permissions: [],
    },
    {
      name: 'Gerente de Auditoria',
      slug: 'ROLE_GERENTE_AUDITORIA',
      type: RoleType.USER,
      description: 'Manager access for audit operations',
      isSystem: true,
      priority: 60,
      permissions: [],
    },
    {
      name: 'Auditor',
      slug: 'ROLE_AUDITOR',
      type: RoleType.USER,
      description: 'Audit review access',
      isSystem: true,
      priority: 50,
      permissions: [],
    },
    {
      name: 'Diretor Financeiro',
      slug: 'ROLE_DIRETOR_FINANCEIRO',
      type: RoleType.USER,
      description: 'Executive access for finance leadership',
      isSystem: true,
      priority: 80,
      permissions: [],
    },
    {
      name: 'Gerente Financeiro',
      slug: 'ROLE_GERENTE_FINANCEIRO',
      type: RoleType.USER,
      description: 'Manager access for finance operations',
      isSystem: true,
      priority: 60,
      permissions: [],
    },
    {
      name: 'Analista Financeiro',
      slug: 'ROLE_ANALISTA_FINANCEIRO',
      type: RoleType.USER,
      description: 'Analyst access for finance operations',
      isSystem: true,
      priority: 40,
      permissions: [],
    },
    {
      name: 'Assistente Financeiro',
      slug: 'ROLE_ASSISTENTE_FINANCEIRO',
      type: RoleType.USER,
      description: 'Assistant access for finance operations',
      isSystem: true,
      priority: 20,
      permissions: [],
    },
    {
      name: 'Gerente de Contestação',
      slug: 'ROLE_GERENTE_CONTESTACAO',
      type: RoleType.USER,
      description: 'Manager access for contestation operations',
      isSystem: true,
      priority: 60,
      permissions: [],
    },
    {
      name: 'Analista de Contestação',
      slug: 'ROLE_ANALISTA_CONTESTACAO',
      type: RoleType.USER,
      description: 'Analyst access for contestation operations',
      isSystem: true,
      priority: 40,
      permissions: [],
    },
    {
      name: 'Assistente de Contestação',
      slug: 'ROLE_ASSISTENTE_CONTESTACAO',
      type: RoleType.USER,
      description: 'Assistant access for contestation operations',
      isSystem: true,
      priority: 20,
      permissions: [],
    },
    {
      name: 'Superintendente',
      slug: 'ROLE_SUPERINTENDENTE',
      type: RoleType.USER,
      description: 'Superintendent-level operational access',
      isSystem: true,
      priority: 70,
      permissions: [],
    },
    {
      name: 'Diretor Comercial B2C',
      slug: 'ROLE_DIRETOR_COMERCIAL_B2C',
      type: RoleType.USER,
      description: 'Executive access for B2C commercial leadership',
      isSystem: true,
      priority: 80,
      permissions: [],
    },
    {
      name: 'Gerente Comercial B2C',
      slug: 'ROLE_GERENTE_COMERCIAL_B2C',
      type: RoleType.USER,
      description: 'Manager access for B2C commercial operations',
      isSystem: true,
      priority: 60,
      permissions: [],
    },
    {
      name: 'Consultor Comercial B2C',
      slug: 'ROLE_CONSULTOR_COMERCIAL_B2C',
      type: RoleType.USER,
      description: 'Consultant access for B2C commercial operations',
      isSystem: true,
      priority: 40,
      permissions: [],
    },
    {
      name: 'Diretor Comercial B2B',
      slug: 'ROLE_DIRETOR_COMERCIAL_B2B',
      type: RoleType.USER,
      description: 'Executive access for B2B commercial leadership',
      isSystem: true,
      priority: 80,
      permissions: [],
    },
    {
      name: 'Gerente Comercial B2B',
      slug: 'ROLE_GERENTE_COMERCIAL_B2B',
      type: RoleType.USER,
      description: 'Manager access for B2B commercial operations',
      isSystem: true,
      priority: 60,
      permissions: [],
    },
    {
      name: 'Consultor Comercial B2B',
      slug: 'ROLE_CONSULTOR_COMERCIAL_B2B',
      type: RoleType.USER,
      description: 'Consultant access for B2B commercial operations',
      isSystem: true,
      priority: 40,
      permissions: [],
    },
    {
      name: 'Gerente Regional B2C',
      slug: 'ROLE_GERENTE_REGIONAL_B2C',
      type: RoleType.USER,
      description: 'Regional manager access for B2C operations',
      isSystem: true,
      priority: 60,
      permissions: [],
    },
    {
      name: 'Gerente Regional B2B',
      slug: 'ROLE_GERENTE_REGIONAL_B2B',
      type: RoleType.USER,
      description: 'Regional manager access for B2B operations',
      isSystem: true,
      priority: 60,
      permissions: [],
    },
    {
      name: 'Supervisor Backoffice',
      slug: 'ROLE_SUPERVISOR_BACKOFFICE',
      type: RoleType.USER,
      description: 'Supervisor access for backoffice operations',
      isSystem: true,
      priority: 60,
      permissions: [],
    },
    {
      name: 'Assistente Backoffice',
      slug: 'ROLE_ASSISTENTE_BACKOFFICE',
      type: RoleType.USER,
      description: 'Assistant access for backoffice operations',
      isSystem: true,
      priority: 20,
      permissions: [],
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
      update: {
        name: role.name,
        type: role.type,
        description: role.description ?? null,
        isSystem: role.isSystem,
        priority: role.priority,
      },
      create: {
        name: role.name,
        slug: role.slug,
        type: role.type,
        description: role.description ?? null,
        isSystem: role.isSystem,
        priority: role.priority,
        tenantId,
      },
    });
    roles[role.slug] = createdRole;
  }

  for (const role of roleData) {
    if (role.parentSlug && roles[role.slug] && roles[role.parentSlug]) {
      roles[role.slug] = await prisma.role.update({
        where: { id: roles[role.slug].id },
        data: { parentId: roles[role.parentSlug].id },
      });
    }
  }

  logger.info(`Created/updated ${Object.keys(roles).length} roles`);
  return roles;
}

/**
 * Create role-permission relationships
 */
async function createRolePermissions(
  tenantId: string,
  roles: any[],
  permissions: any[]
): Promise<void> {

  const rolePermissionData = [
    {
      roleSlug: 'super-admin',
      permissionSlugs: Object.keys(permissions), // All permissions
    },
    {
      roleSlug: 'ROLE_ADMIN_SISTEMA',
      permissionSlugs: [
        'tenant:read',
        'user:reset-password',
        'customer:create',
        'customer:read',
        'customer:update',
        'customer:delete',
        'customer:export',
        'commercial-request:create',
        'commercial-request:read',
        'commercial-request:submit',
        'commercial-request:approve',
        'commercial-request:reject',
      ],
    },
    {
      roleSlug: 'ROLE_CEO',
      permissionSlugs: [
        'tenant:read',
        'DASHBOARD_VIEW',
        'REPORT_VIEW',
        'REPORT_EXPORT',
        'SIMULADOR_VIEW',
        'AUDIT_VIEW',
        'FINANCE_VIEW',
        'SALES_VIEW',
        'CUSTOMER_VIEW',
        'customer:create',
        'customer:read',
        'customer:update',
        'customer:delete',
        'customer:export',
        'commercial-request:read',
        'commercial-request:approve',
        'commercial-request:reject',
      ],
    },
    {
      roleSlug: 'ROLE_GERENTE_FINANCEIRO',
      permissionSlugs: [
        'FINANCE_VIEW',
        'FINANCE_CREATE',
        'FINANCE_EDIT',
        'FINANCE_APPROVE',
        'FINANCE_EXPORT',
        'REPORT_VIEW',
      ],
    },
    {
      roleSlug: 'ROLE_ANALISTA_FINANCEIRO',
      permissionSlugs: [
        'FINANCE_VIEW',
        'FINANCE_CREATE',
        'FINANCE_EDIT',
      ],
    },
    {
      roleSlug: 'admin',
      permissionSlugs: [
        'user:create', 'user:read', 'user:update', 'user:delete',
        'user:reset-password',
        'role:create', 'role:read', 'role:update', 'role:delete',
        'permission:create', 'permission:read', 'permission:update', 'permission:delete',
        'organization:create', 'organization:read', 'organization:update', 'organization:delete',
        'membership:create', 'membership:read', 'membership:update', 'membership:delete',
        'tenant:create', 'tenant:read', 'tenant:update', 'tenant:delete',
        'lead:create', 'lead:read', 'lead:update', 'lead:delete', 'lead:export',
        'customer:create', 'customer:read', 'customer:update', 'customer:delete', 'customer:export',
        'opportunity:create', 'opportunity:read', 'opportunity:update', 'opportunity:delete', 'opportunity:approve',
        'bank-proposal:create', 'bank-proposal:read', 'bank-proposal:update', 'bank-proposal:delete', 'bank-proposal:approve',
        'commission:create', 'commission:read', 'commission:update', 'commission:delete',
        'partner:create', 'partner:read', 'partner:update', 'partner:delete', 'partner:assign',
        'pipeline:create', 'pipeline:read', 'pipeline:update', 'pipeline:delete',
        'commercial-request:create', 'commercial-request:read', 'commercial-request:submit', 'commercial-request:approve', 'commercial-request:reject',
        'report:read', 'report:export',
        'audit:read',
      ],
    },
    {
      roleSlug: 'manager',
      permissionSlugs: [
        'user:read', 'user:update',
        'organization:create', 'organization:read', 'organization:update',
        'membership:create', 'membership:read', 'membership:update',
        'lead:create', 'lead:read', 'lead:update', 'lead:delete', 'lead:export',
        'customer:create', 'customer:read', 'customer:update', 'customer:delete', 'customer:export',
        'opportunity:create', 'opportunity:read', 'opportunity:update', 'opportunity:delete', 'opportunity:approve',
        'bank-proposal:create', 'bank-proposal:read', 'bank-proposal:update', 'bank-proposal:delete', 'bank-proposal:approve',
        'commission:create', 'commission:read', 'commission:update', 'commission:delete',
        'partner:read', 'partner:update', 'partner:assign',
        'pipeline:create', 'pipeline:read', 'pipeline:update', 'pipeline:delete',
        'commercial-request:create', 'commercial-request:read', 'commercial-request:submit', 'commercial-request:approve', 'commercial-request:reject',
        'report:read', 'report:export',
      ],
    },
    {
      roleSlug: 'user',
      permissionSlugs: [
        'organization:read',
        'membership:read',
        'lead:create', 'lead:read', 'lead:update',
        'customer:read', 'customer:update',
        'opportunity:create', 'opportunity:read', 'opportunity:update',
        'bank-proposal:create', 'bank-proposal:read', 'bank-proposal:update',
        'commission:read',
        'partner:read',
        'pipeline:read',
        'commercial-request:create', 'commercial-request:read', 'commercial-request:submit',
        'report:read',
      ],
    },
    {
      roleSlug: 'auditor',
      permissionSlugs: [
        'user:read',
        'role:read',
        'permission:read',
        'organization:read',
        'membership:read',
        'tenant:read',
        'lead:read',
        'customer:read',
        'opportunity:read',
        'bank-proposal:read',
        'commission:read',
        'partner:read',
        'pipeline:read',
        'commercial-request:read',
        'commercial-request:reject',
        'report:read',
        'audit:read',
      ],
    },
    {
      roleSlug: 'support',
      permissionSlugs: [
        'user:read', 'user:update',
        'organization:read',
        'membership:read', 'membership:update',
        'lead:read', 'lead:update',
        'customer:read', 'customer:update',
        'opportunity:read', 'opportunity:update',
        'bank-proposal:read', 'bank-proposal:update',
        'commission:read', 'commission:update',
        'partner:read', 'partner:update',
        'pipeline:read',
        'commercial-request:read',
        'report:read',
        'audit:read',
      ],
    },
    {
      roleSlug: 'ROLE_DIRETOR_AUDITORIA',
      permissionSlugs: [
        'commercial-request:read',
        'commercial-request:reject',
      ],
    },
    {
      roleSlug: 'ROLE_GERENTE_AUDITORIA',
      permissionSlugs: [
        'commercial-request:read',
        'commercial-request:reject',
      ],
    },
    {
      roleSlug: 'ROLE_AUDITOR',
      permissionSlugs: [
        'commercial-request:read',
        'commercial-request:reject',
      ],
    },
    {
      roleSlug: 'ROLE_DIRETOR_COMERCIAL_B2C',
      permissionSlugs: [
        'commercial-request:read',
        'commercial-request:approve',
        'commercial-request:reject',
      ],
    },
    {
      roleSlug: 'ROLE_DIRETOR_COMERCIAL_B2B',
      permissionSlugs: [
        'commercial-request:read',
        'commercial-request:approve',
        'commercial-request:reject',
      ],
    },
    {
      roleSlug: 'ROLE_GERENTE_COMERCIAL_B2C',
      permissionSlugs: [
        'commercial-request:create',
        'commercial-request:read',
        'commercial-request:submit',
        'commercial-request:approve',
        'commercial-request:reject',
      ],
    },
    {
      roleSlug: 'ROLE_GERENTE_COMERCIAL_B2B',
      permissionSlugs: [
        'commercial-request:create',
        'commercial-request:read',
        'commercial-request:submit',
        'commercial-request:approve',
        'commercial-request:reject',
      ],
    },
    {
      roleSlug: 'ROLE_GERENTE_REGIONAL_B2C',
      permissionSlugs: [
        'commercial-request:create',
        'commercial-request:read',
        'commercial-request:submit',
        'commercial-request:approve',
        'commercial-request:reject',
      ],
    },
    {
      roleSlug: 'ROLE_GERENTE_REGIONAL_B2B',
      permissionSlugs: [
        'commercial-request:create',
        'commercial-request:read',
        'commercial-request:submit',
        'commercial-request:approve',
        'commercial-request:reject',
      ],
    },
    {
      roleSlug: 'ROLE_CONSULTOR_COMERCIAL_B2C',
      permissionSlugs: [
        'commercial-request:create',
        'commercial-request:read',
        'commercial-request:submit',
      ],
    },
    {
      roleSlug: 'ROLE_CONSULTOR_COMERCIAL_B2B',
      permissionSlugs: [
        'commercial-request:create',
        'commercial-request:read',
        'commercial-request:submit',
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
  tenantId,
  roleId: role.id,
  permissionId: permission.id,
},
      });
    }
  }

  logger.info('Role-permission relationships created');
}

/**
 * Create organizations with hierarchy
 */
async function createOrganizations(tenantId: string) {
  logger.info('Creating organizations...');

  const organizationData: OrganizationData[] = [
    // Root level organizations
    {
      name: 'Executive Office',
      code: 'EXEC',
      description: 'Executive leadership and strategic oversight',
      type: 'department',
      level: 1,
      settings: { priority: 'high', budget: 'unlimited' }
    },
    {
      name: 'Information Technology',
      code: 'IT',
      description: 'Technology infrastructure and development',
      type: 'department',
      level: 1,
      settings: { priority: 'high', budget: 'large' }
    },
    {
      name: 'Sales & Marketing',
      code: 'SALES',
      description: 'Sales, marketing and business development',
      type: 'department',
      level: 1,
      settings: { priority: 'high', budget: 'large' }
    },
    {
      name: 'Customer Success',
      code: 'CS',
      description: 'Customer support and success management',
      type: 'department',
      level: 1,
      settings: { priority: 'medium', budget: 'medium' }
    },
    {
      name: 'Finance & Operations',
      code: 'FINOPS',
      description: 'Financial management and operations',
      type: 'department',
      level: 1,
      settings: { priority: 'high', budget: 'large' }
    },

    // IT Sub-organizations
    {
      name: 'Software Development',
      code: 'DEV',
      description: 'Application development and engineering',
      type: 'division',
      level: 2,
      parentCode: 'IT',
      settings: { priority: 'high', technologies: ['typescript', 'react', 'node'] }
    },
    {
      name: 'DevOps & Infrastructure',
      code: 'DEVOPS',
      description: 'Infrastructure, deployment and operations',
      type: 'division',
      level: 2,
      parentCode: 'IT',
      settings: { priority: 'high', technologies: ['aws', 'docker', 'kubernetes'] }
    },
    {
      name: 'Quality Assurance',
      code: 'QA',
      description: 'Testing and quality assurance',
      type: 'team',
      level: 2,
      parentCode: 'IT',
      settings: { priority: 'medium', methodologies: ['agile', 'tdd'] }
    },

    // Sales Sub-organizations
    {
      name: 'Business Development',
      code: 'BD',
      description: 'New business acquisition and partnerships',
      type: 'division',
      level: 2,
      parentCode: 'SALES',
      settings: { priority: 'high', focus: 'enterprise' }
    },
    {
      name: 'Account Management',
      code: 'AM',
      description: 'Existing customer account management',
      type: 'division',
      level: 2,
      parentCode: 'SALES',
      settings: { priority: 'high', focus: 'retention' }
    },

    // Development Teams
    {
      name: 'Frontend Team',
      code: 'FE',
      description: 'User interface and experience development',
      type: 'team',
      level: 3,
      parentCode: 'DEV',
      settings: { priority: 'high', stack: ['react', 'typescript', 'tailwind'] }
    },
    {
      name: 'Backend Team',
      code: 'BE',
      description: 'API and server-side development',
      type: 'team',
      level: 3,
      parentCode: 'DEV',
      settings: { priority: 'high', stack: ['node', 'typescript', 'postgresql'] }
    },
    {
      name: 'Mobile Team',
      code: 'MOBILE',
      description: 'Mobile application development',
      type: 'team',
      level: 3,
      parentCode: 'DEV',
      settings: { priority: 'medium', stack: ['react-native', 'typescript'] }
    }
  ];

  const organizations: Record<string, any> = {};

  // First pass: Create all organizations
  for (const org of organizationData) {
    const organization = await prisma.organization.upsert({
      where: {
        tenantId_code: {
          tenantId,
          code: org.code
        }
      },
      update: {
        name: org.name,
        description: org.description ?? null,
        type: org.type,
        level: org.level,
        settings: org.settings ?? Prisma.JsonNull,
      },
      create: {
        name: org.name,
        code: org.code,
        description: org.description ?? null,
        type: org.type,
        level: org.level,
        settings: org.settings ?? Prisma.JsonNull,
        tenantId
      }
    });
    organizations[org.code] = organization;
  }

  // Second pass: Set parent relationships
  for (const org of organizationData) {
    if (org.parentCode && organizations[org.parentCode]) {
      await prisma.organization.update({
        where: { id: organizations[org.code].id },
        data: { parentId: organizations[org.parentCode].id }
      });
    }
  }

  logger.info(`Created/updated ${Object.keys(organizations).length} organizations`);
  return organizations;
}

/**
 * Create memberships for users in organizations
 */
async function createMemberships(tenantId: string, organizations: Record<string, any>) {
  logger.info('Creating memberships...');

  const membershipData: MembershipData[] = [
    // Executive Office
    {
      userEmail: 'admin@finqz-pro.com',
      organizationCode: 'EXEC',
      role: 'owner',
      permissions: { all: true }
    },

    // IT Department
    {
      userEmail: 'admin@finqz-pro.com',
      organizationCode: 'IT',
      role: 'admin',
      permissions: { manage_users: true, manage_budget: true }
    },

    // Development Teams
    {
      userEmail: 'admin@finqz-pro.com',
      organizationCode: 'DEV',
      role: 'admin',
      permissions: { manage_projects: true, code_review: true }
    },
    {
      userEmail: 'admin@finqz-pro.com',
      organizationCode: 'FE',
      role: 'admin',
      permissions: { deploy_frontend: true, ui_review: true }
    },
    {
      userEmail: 'admin@finqz-pro.com',
      organizationCode: 'BE',
      role: 'admin',
      permissions: { deploy_backend: true, api_review: true }
    },

    // Sales Department
    {
      userEmail: 'admin@finqz-pro.com',
      organizationCode: 'SALES',
      role: 'admin',
      permissions: { manage_deals: true, approve_discounts: true }
    },
    {
      userEmail: 'admin@finqz-pro.com',
      organizationCode: 'BD',
      role: 'manager',
      permissions: { create_leads: true, negotiate_contracts: true }
    },

    // Customer Success
    {
      userEmail: 'admin@finqz-pro.com',
      organizationCode: 'CS',
      role: 'manager',
      permissions: { manage_tickets: true, escalate_issues: true }
    },

    // Finance & Operations
    {
      userEmail: 'admin@finqz-pro.com',
      organizationCode: 'FINOPS',
      role: 'manager',
      permissions: { approve_expenses: true, manage_budget: true }
    }
  ];

  for (const membership of membershipData) {
    // Get user
    const user = await prisma.user.findFirst({
      where: {
        emailNormalized: membership.userEmail.toLowerCase().trim(),
        tenantId
      }
    });

    if (!user) {
      logger.warn(`User ${membership.userEmail} not found, skipping membership`);
      continue;
    }

    // Get organization
    const organization = organizations[membership.organizationCode];
    if (!organization) {
      logger.warn(`Organization ${membership.organizationCode} not found, skipping membership`);
      continue;
    }

    // Create membership
    await prisma.membership.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id
        }
      },
      update: {
        role: membership.role,
        permissions: membership.permissions,
        isActive: true,
        deletedAt: null
      },
      create: {
        userId: user.id,
        organizationId: organization.id,
        role: membership.role,
        permissions: membership.permissions,
        invitedById: user.id, // Self-invited for seed
        tenantId
      }
    });
  }

  logger.info('Memberships created');
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
    },
  });
  await prisma.userRole.upsert({
  where: {
    userId_roleId: {
      userId: user.id,
      roleId: superAdminRole.id,
    },
  },
  update: {},
  create: {
    tenantId,
    userId: user.id,
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
main()
  .then(() => {
    logger.info('Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Seed failed:', error);
    process.exit(1);
  });

export { seedRBAC, main };

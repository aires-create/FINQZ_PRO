// ============================================
// FINQZ PRO - Database Seeding Script
// ============================================

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // ============================================
    // 1. CREATE DEFAULT TENANT
    // ============================================
    console.log('📦 Creating default tenant...');
    
    const defaultTenant = await prisma.tenant.upsert({
      where: { domain: 'finqz-pro' },
      update: {},
      create: {
        name: 'FINQZ PRO - Development',
        domain: 'finqz-pro',
        plan: 'enterprise',
        isActive: true,
        settings: {
          timezone: 'America/Sao_Paulo',
          currency: 'BRL',
          language: 'pt-BR',
        },
      },
    });
    
    console.log(`✅ Tenant created: ${defaultTenant.id}`);

    // ============================================
    // 2. CREATE PERMISSIONS
    // ============================================
    console.log('🔐 Creating permissions...');
    
    const permissions = [
      // User permissions
      { name: 'users:read', slug: 'users_read', resource: 'users', action: 'read' },
      { name: 'users:create', slug: 'users_create', resource: 'users', action: 'create' },
      { name: 'users:update', slug: 'users_update', resource: 'users', action: 'update' },
      { name: 'users:delete', slug: 'users_delete', resource: 'users', action: 'delete' },
      
      // Lead permissions
      { name: 'leads:read', slug: 'leads_read', resource: 'leads', action: 'read' },
      { name: 'leads:create', slug: 'leads_create', resource: 'leads', action: 'create' },
      { name: 'leads:update', slug: 'leads_update', resource: 'leads', action: 'update' },
      { name: 'leads:delete', slug: 'leads_delete', resource: 'leads', action: 'delete' },
      
      // Customer permissions
      { name: 'customers:read', slug: 'customers_read', resource: 'customers', action: 'read' },
      { name: 'customers:create', slug: 'customers_create', resource: 'customers', action: 'create' },
      { name: 'customers:update', slug: 'customers_update', resource: 'customers', action: 'update' },
      { name: 'customers:delete', slug: 'customers_delete', resource: 'customers', action: 'delete' },
      
      // Opportunity permissions
      { name: 'opportunities:read', slug: 'opportunities_read', resource: 'opportunities', action: 'read' },
      { name: 'opportunities:create', slug: 'opportunities_create', resource: 'opportunities', action: 'create' },
      { name: 'opportunities:update', slug: 'opportunities_update', resource: 'opportunities', action: 'update' },
      { name: 'opportunities:delete', slug: 'opportunities_delete', resource: 'opportunities', action: 'delete' },
      
      // Bank Proposal permissions
      { name: 'proposals:read', slug: 'proposals_read', resource: 'proposals', action: 'read' },
      { name: 'proposals:create', slug: 'proposals_create', resource: 'proposals', action: 'create' },
      { name: 'proposals:update', slug: 'proposals_update', resource: 'proposals', action: 'update' },
      { name: 'proposals:delete', slug: 'proposals_delete', resource: 'proposals', action: 'delete' },
      
      // Commission permissions
      { name: 'commissions:read', slug: 'commissions_read', resource: 'commissions', action: 'read' },
      { name: 'commissions:create', slug: 'commissions_create', resource: 'commissions', action: 'create' },
      { name: 'commissions:approve', slug: 'commissions_approve', resource: 'commissions', action: 'approve' },
      { name: 'commissions:pay', slug: 'commissions_pay', resource: 'commissions', action: 'pay' },
      
      // Report permissions
      { name: 'reports:read', slug: 'reports_read', resource: 'reports', action: 'read' },
      { name: 'reports:export', slug: 'reports_export', resource: 'reports', action: 'export' },
    ];

    const createdPermissions = await Promise.all(
      permissions.map(permission =>
        prisma.permission.upsert({
          where: { slug: permission.slug },
          update: {},
          create: permission,
        })
      )
    );

    console.log(`✅ Created ${createdPermissions.length} permissions`);

    // ============================================
    // 3. CREATE ROLES
    // ============================================
    console.log('👤 Creating roles...');
    
    const adminPermissionIds = createdPermissions.map(p => p.id);
    const salesPermissionIds = createdPermissions
      .filter(p => ['leads', 'customers', 'opportunities', 'proposals', 'reports'].includes(p.resource))
      .map(p => p.id);
    const viewerPermissionIds = createdPermissions
      .filter(p => p.action === 'read')
      .map(p => p.id);

    const adminRole = await prisma.role.upsert({
      where: { slug_tenantId: { slug: 'admin', tenantId: defaultTenant.id } },
      update: {},
      create: {
        name: 'Administrator',
        slug: 'admin',
        description: 'Full system access',
        isSystem: true,
        tenantId: defaultTenant.id,
        permissions: {
          connect: adminPermissionIds.map(id => ({ id })),
        },
      },
    });

    const salesRole = await prisma.role.upsert({
      where: { slug_tenantId: { slug: 'sales', tenantId: defaultTenant.id } },
      update: {},
      create: {
        name: 'Sales Representative',
        slug: 'sales',
        description: 'Sales and opportunity management',
        isSystem: true,
        tenantId: defaultTenant.id,
        permissions: {
          connect: salesPermissionIds.map(id => ({ id })),
        },
      },
    });

    const viewerRole = await prisma.role.upsert({
      where: { slug_tenantId: { slug: 'viewer', tenantId: defaultTenant.id } },
      update: {},
      create: {
        name: 'Viewer',
        slug: 'viewer',
        description: 'Read-only access',
        isSystem: true,
        tenantId: defaultTenant.id,
        permissions: {
          connect: viewerPermissionIds.map(id => ({ id })),
        },
      },
    });

    console.log(`✅ Created 3 roles`);

    // ============================================
    // 4. CREATE ADMIN USER
    // ============================================
    console.log('👨‍💼 Creating admin user...');
    
    const adminPassword = await bcrypt.hash('Admin@123456', 12);
    const adminUser = await prisma.user.upsert({
      where: { emailNormalized_tenantId: { emailNormalized: 'admin@finqz.dev', tenantId: defaultTenant.id } },
      update: {},
      create: {
        email: 'admin@finqz.dev',
        emailNormalized: 'admin@finqz.dev',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'FINQZ PRO',
        isActive: true,
        isEmailVerified: true,
        tenantId: defaultTenant.id,
        roleId: adminRole.id,
      },
    });

    console.log(`✅ Admin user created: ${adminUser.email}`);

    // ============================================
    // 5. CREATE DEMO USERS
    // ============================================
    console.log('👥 Creating demo users...');
    
    const demoPassword = await bcrypt.hash('Demo@123456', 12);
    
    const demoUsers = [
      {
        email: 'sales1@finqz.dev',
        firstName: 'João',
        lastName: 'Silva',
        role: salesRole,
      },
      {
        email: 'sales2@finqz.dev',
        firstName: 'Maria',
        lastName: 'Santos',
        role: salesRole,
      },
    ];

    for (const demoUser of demoUsers) {
      await prisma.user.upsert({
        where: { emailNormalized_tenantId: { emailNormalized: demoUser.email.toLowerCase(), tenantId: defaultTenant.id } },
        update: {},
        create: {
          email: demoUser.email,
          emailNormalized: demoUser.email.toLowerCase(),
          password: demoPassword,
          firstName: demoUser.firstName,
          lastName: demoUser.lastName,
          isActive: true,
          isEmailVerified: true,
          tenantId: defaultTenant.id,
          roleId: demoUser.role.id,
        },
      });
    }

    console.log(`✅ Created 2 demo sales users`);

    // ============================================
    // 6. CREATE PIPELINE & STAGES
    // ============================================
    console.log('🔄 Creating default pipeline...');
    
    const pipeline = await prisma.pipeline.upsert({
      where: { name_tenantId: { name: 'Sales Pipeline', tenantId: defaultTenant.id } },
      update: {},
      create: {
        name: 'Sales Pipeline',
        description: 'Default sales pipeline',
        isDefault: true,
        isActive: true,
        tenantId: defaultTenant.id,
        stages: {
          create: [
            { name: 'Lead', description: 'New leads', order: 1 },
            { name: 'Contact', description: 'Contacted leads', order: 2 },
            { name: 'Qualified', description: 'Qualified leads', order: 3 },
            { name: 'Proposal', description: 'Proposal sent', order: 4 },
            { name: 'Negotiation', description: 'In negotiation', order: 5 },
            { name: 'Won', description: 'Deal won', order: 6, isWon: true },
            { name: 'Lost', description: 'Deal lost', order: 7, isLost: true },
          ],
        },
      },
    });

    console.log(`✅ Pipeline created with 7 stages`);

    // ============================================
    // 7. CREATE DEMO LEAD
    // ============================================
    console.log('📝 Creating demo lead...');
    
    const demoLead = await prisma.lead.create({
      data: {
        firstName: 'João',
        lastName: 'Silva',
        email: 'joao.silva@email.com',
        emailNormalized: 'joao.silva@email.com',
        phone: '(11) 98765-4321',
        cpf: '12345678901',
        birthDate: new Date('1990-05-15'),
        income: 5000,
        score: 75,
        status: 'prospect',
        source: 'website',
        tenantId: defaultTenant.id,
        createdById: adminUser.id,
        ownerId: adminUser.id,
      },
    });

    console.log(`✅ Demo lead created`);

    // ============================================
    // 8. CREATE DEMO CUSTOMER
    // ============================================
    console.log('👤 Creating demo customer...');
    
    const demoCustomer = await prisma.customer.create({
      data: {
        customerCode: 'CUST-001',
        firstName: 'Maria',
        lastName: 'Santos',
        email: 'maria.santos@email.com',
        cpf: '98765432100',
        phone: '(11) 99876-5432',
        monthlyIncome: 7000,
        annualIncome: 84000,
        kycStatus: 'approved',
        kycVerifiedAt: new Date(),
        tenantId: defaultTenant.id,
      },
    });

    console.log(`✅ Demo customer created`);

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📋 Default Credentials:');
    console.log('   Email: admin@finqz.dev');
    console.log('   Password: Admin@123456');
    console.log('\n   Demo Sales Users:');
    console.log('   - sales1@finqz.dev (Demo@123456)');
    console.log('   - sales2@finqz.dev (Demo@123456)');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
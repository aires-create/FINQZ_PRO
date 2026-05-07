// ============================================
// FINQZ PRO - Database Seed
// ============================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from '../src/config/app';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default company
  const defaultCompany = await prisma.company.upsert({
    where: { id: config.multiTenant.defaultCompanyId },
    update: {},
    create: {
      id: config.multiTenant.defaultCompanyId,
      name: 'FINQZ PRO Demo Company',
      domain: 'demo.finqzpro.com',
      isActive: true,
    },
  });

  console.log('✅ Default company created:', defaultCompany.name);

  // Create default roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with full access',
      permissions: {
        users: ['create', 'read', 'update', 'delete'],
        crm: ['create', 'read', 'update', 'delete'],
        partners: ['create', 'read', 'update', 'delete'],
        proposals: ['create', 'read', 'update', 'delete'],
        commissions: ['create', 'read', 'update', 'delete'],
        financial: ['create', 'read', 'update', 'delete'],
        analytics: ['read'],
        banking: ['create', 'read', 'update', 'delete'],
      },
      isSystem: true,
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: {},
    create: {
      name: 'manager',
      description: 'Manager with operational access',
      permissions: {
        users: ['read'],
        crm: ['create', 'read', 'update'],
        partners: ['create', 'read', 'update'],
        proposals: ['create', 'read', 'update'],
        commissions: ['create', 'read', 'update'],
        financial: ['read'],
        analytics: ['read'],
        banking: ['read'],
      },
      isSystem: true,
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Standard user with basic access',
      permissions: {
        crm: ['read'],
        partners: ['read'],
        proposals: ['read'],
        commissions: ['read'],
        financial: ['read'],
        analytics: ['read'],
      },
      isSystem: true,
    },
  });

  console.log('✅ Roles created');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', config.bcryptRounds);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@finqzpro.com' },
    update: {},
    create: {
      email: 'admin@finqzpro.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'FINQZ PRO',
      isActive: true,
      isEmailVerified: true,
      companyId: defaultCompany.id,
      roleId: adminRole.id,
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Create sample partner
  const samplePartner = await prisma.partner.upsert({
    where: { code: 'P-0001' },
    update: {},
    create: {
      code: 'P-0001',
      name: 'Parceiro Exemplo Ltda',
      type: 'partner',
      document: '12.345.678/0001-90',
      email: 'contato@parceiroexemplo.com',
      phone: '(11) 99999-9999',
      status: 'active',
      companyId: defaultCompany.id,
      managedById: adminUser.id,
    },
  });

  console.log('✅ Sample partner created:', samplePartner.name);

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
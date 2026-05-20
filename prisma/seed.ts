import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting seed (Users only)...');

  // ============================
  // 1️⃣ Seed Users (idempotent via upsert)
  // ============================

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@assetflow.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@assetflow.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  });

  const purchaseHeadUser = await prisma.user.upsert({
    where: { email: 'purchase@assetflow.com' },
    update: {},
    create: {
      name: 'Purchase Head',
      email: 'purchase@assetflow.com',
      passwordHash: await bcrypt.hash('purchase123', 10),
      role: 'PURCHASE_HEAD',
    },
  });

  const financeManagerUser = await prisma.user.upsert({
    where: { email: 'finance@assetflow.com' },
    update: {},
    create: {
      name: 'Finance Manager',
      email: 'finance@assetflow.com',
      passwordHash: await bcrypt.hash('finance123', 10),
      role: 'FINANCE_MANAGER',
    },
  });

  const deptUser = await prisma.user.upsert({
    where: { email: 'dept@assetflow.com' },
    update: {},
    create: {
      name: 'Department User',
      email: 'dept@assetflow.com',
      passwordHash: await bcrypt.hash('dept123', 10),
      role: 'DEPARTMENT_USER',
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@assetflow.com' },
    update: {},
    create: {
      name: 'Asset Manager',
      email: 'manager@assetflow.com',
      passwordHash: await bcrypt.hash('manager123', 10),
      role: 'MANAGER',
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'user@assetflow.com' },
    update: {},
    create: {
      name: 'Staff User',
      email: 'user@assetflow.com',
      passwordHash: await bcrypt.hash('user123', 10),
      role: 'USER',
    },
  });

  console.log('✅ Users seeded successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

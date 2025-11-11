import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting seed...");

  // ============================
  // 1️⃣ Seed Users
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

  console.log("✅ Users seeded");

  // ============================
  // 2️⃣ Seed Assets (PROCUREMENT)
  // ============================

  const asset1 = await prisma.asset.create({
    data: {
      name: 'Dell Laptop XPS 13',
      category: 'IT Equipment',
      department: 'Engineering',
      vendor: 'Dell Inc.',
      purchaseCost: 1200,
      purchaseDate: new Date('2024-01-15'),
      status: 'PROCUREMENT',
      ownerUserId: managerUser.id,
    },
  });

  const asset2 = await prisma.asset.create({
    data: {
      name: 'Office Desk',
      category: 'Furniture',
      department: 'Operations',
      vendor: 'IKEA',
      purchaseCost: 300,
      purchaseDate: new Date('2024-02-01'),
      status: 'PROCUREMENT',
      ownerUserId: adminUser.id,
    },
  });

  const asset3 = await prisma.asset.create({
    data: {
      name: 'Projector',
      category: 'AV Equipment',
      department: 'Marketing',
      vendor: 'Epson',
      purchaseCost: 800,
      purchaseDate: new Date('2024-03-10'),
      status: 'PROCUREMENT',
      ownerUserId: managerUser.id,
    },
  });

  console.log("✅ Assets seeded");

  // ============================
  // 3️⃣ Commissioning
  // ============================

  await prisma.lifecycle.create({
    data: {
      assetId: asset1.id,
      performedBy: adminUser.id,
      stage: 'COMMISSIONED',
      notes: 'Asset commissioned and ready for use',
      location: 'Engineering Floor 3',
      scheduledDate: new Date('2024-01-20'),
    },
  });

  await prisma.asset.update({
    where: { id: asset1.id },
    data: { status: 'COMMISSIONED' },
  });

  await prisma.lifecycle.create({
    data: {
      assetId: asset2.id,
      performedBy: managerUser.id,
      stage: 'COMMISSIONED',
      notes: 'Commissioned for operations department',
      location: 'Operations Office',
      scheduledDate: new Date('2024-02-05'),
    },
  });

  await prisma.asset.update({
    where: { id: asset2.id },
    data: { status: 'COMMISSIONED' },
  });

  await prisma.lifecycle.create({
    data: {
      assetId: asset3.id,
      performedBy: adminUser.id,
      stage: 'COMMISSIONED',
      notes: 'Commissioned for marketing team',
      location: 'Conference Room A',
      scheduledDate: new Date('2024-03-15'),
    },
  });

  await prisma.asset.update({
    where: { id: asset3.id },
    data: { status: 'COMMISSIONED' },
  });

  console.log("✅ Commissioning stage completed");

  // ============================
  // 4️⃣ Operation
  // ============================

  await prisma.lifecycle.create({
    data: {
      assetId: asset1.id,
      performedBy: staffUser.id,
      stage: 'IN_OPERATION',
      notes: 'Asset now in active operation',
      location: 'Engineering Floor 3',
    },
  });

  await prisma.asset.update({
    where: { id: asset1.id },
    data: { status: 'IN_OPERATION' },
  });

  await prisma.lifecycle.create({
    data: {
      assetId: asset2.id,
      performedBy: staffUser.id,
      stage: 'IN_OPERATION',
      notes: 'In use by operations team',
      location: 'Operations Office',
    },
  });

  await prisma.asset.update({
    where: { id: asset2.id },
    data: { status: 'IN_OPERATION' },
  });

  await prisma.lifecycle.create({
    data: {
      assetId: asset3.id,
      performedBy: staffUser.id,
      stage: 'IN_OPERATION',
      notes: 'Active in marketing presentations',
      location: 'Conference Room A',
    },
  });

  await prisma.asset.update({
    where: { id: asset3.id },
    data: { status: 'IN_OPERATION' },
  });

  console.log("✅ Operation stage completed");

  // ============================
  // 5️⃣ Maintenance stage
  // ============================

  await prisma.maintenance.create({
    data: {
      assetId: asset1.id,
      type: 'PREVENTIVE',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      reportedById: managerUser.id,
      assignedToId: adminUser.id,
      scheduledDate: new Date('2024-06-01'),
      notes: 'Routine maintenance check',
    },
  });

  await prisma.asset.update({
    where: { id: asset1.id },
    data: { status: 'MAINTENANCE' },
  });

  await prisma.maintenance.create({
    data: {
      assetId: asset2.id,
      type: 'BREAKDOWN',
      status: 'COMPLETED',
      priority: 'HIGH',
      reportedById: staffUser.id,
      assignedToId: managerUser.id,
      scheduledDate: new Date('2024-05-15'),
      notes: 'Fixed broken drawer mechanism',
    },
  });

  console.log("✅ Maintenance stage completed");

  // ============================
  // 6️⃣ Disposal stage
  // ============================

  await prisma.disposalRequest.create({
    data: {
      assetId: asset3.id,
      method: 'Sale',
      reason: 'Outdated technology',
      estimatedValue: 200,
      salvageValue: 150,
      approvedById: adminUser.id,
      status: 'APPROVED',
    },
  });

  await prisma.asset.update({
    where: { id: asset3.id },
    data: { status: 'DISPOSAL' },
  });

  console.log("✅ Disposal stage completed");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

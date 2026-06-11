const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Teams ───────────────────────────────────────────────
  const teams = await Promise.all([
    prisma.team.upsert({
      where: { name: 'Sales' },
      update: {},
      create: { name: 'Sales', description: 'Sales and business development' },
    }),
    prisma.team.upsert({
      where: { name: 'Warehouse' },
      update: {},
      create: { name: 'Warehouse', description: 'Warehouse and logistics operations' },
    }),
    prisma.team.upsert({
      where: { name: 'Finance' },
      update: {},
      create: { name: 'Finance', description: 'Financial operations and accounting' },
    }),
    prisma.team.upsert({
      where: { name: 'IT' },
      update: {},
      create: { name: 'IT', description: 'Information technology and systems' },
    }),
    prisma.team.upsert({
      where: { name: 'Operations' },
      update: {},
      create: { name: 'Operations', description: 'Day-to-day business operations' },
    }),
    prisma.team.upsert({
      where: { name: 'Vendor Management' },
      update: {},
      create: { name: 'Vendor Management', description: 'Vendor relations and procurement' },
    }),
    prisma.team.upsert({
      where: { name: 'HR' },
      update: {},
      create: { name: 'HR', description: 'Human resources and people operations' },
    }),
  ]);

  console.log(`✅ Created ${teams.length} teams`);

  // ─── Categories ──────────────────────────────────────────
  const categoryNames = [
    { name: 'System Issue', description: 'Software, hardware, or infrastructure failures' },
    { name: 'Operational Delay', description: 'Delays in operational processes' },
    { name: 'Dispatch Delay', description: 'Shipping and dispatch related delays' },
    { name: 'Payment Delay', description: 'Payment processing or financial delays' },
    { name: 'Vendor Issue', description: 'Issues with external vendors or suppliers' },
    { name: 'Inventory Issue', description: 'Stock, inventory, or supply chain problems' },
    { name: 'Compliance Issue', description: 'Regulatory or compliance related issues' },
    { name: 'Data Issue', description: 'Data quality, access, or integrity problems' },
    { name: 'Resource Issue', description: 'Staffing, equipment, or resource constraints' },
    { name: 'Communication Failure', description: 'Breakdown in inter-team communication' },
    { name: 'Other', description: 'Issues not covered by other categories' },
  ];

  const categories = await Promise.all(
    categoryNames.map((cat, index) =>
      prisma.category.upsert({
        where: { name: cat.name },
        update: {},
        create: { ...cat, sortOrder: index },
      })
    )
  );

  console.log(`✅ Created ${categories.length} categories`);

  // ─── Admin User ──────────────────────────────────────────
  const passwordHash = await bcrypt.hash('admin123', 12);
  const itTeam = teams.find((t) => t.name === 'IT');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@blamegame.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@blamegame.com',
      employeeId: 'EMP001',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      teamId: itTeam.id,
    },
  });

  console.log(`✅ Admin user created: ${admin.email} (password: admin123)`);

  // ─── Demo Users ──────────────────────────────────────────
  const demoPassword = await bcrypt.hash('user123', 12);
  const salesTeam = teams.find((t) => t.name === 'Sales');
  const warehouseTeam = teams.find((t) => t.name === 'Warehouse');
  const financeTeam = teams.find((t) => t.name === 'Finance');

  const demoUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'aadit@blamegame.com' },
      update: {},
      create: {
        name: 'Aadit',
        email: 'aadit@blamegame.com',
        employeeId: 'EMP002',
        passwordHash: demoPassword,
        role: 'USER',
        teamId: salesTeam.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'warehouse.user@blamegame.com' },
      update: {},
      create: {
        name: 'Warehouse User',
        email: 'warehouse.user@blamegame.com',
        employeeId: 'EMP003',
        passwordHash: demoPassword,
        role: 'USER',
        teamId: warehouseTeam.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'finance.user@blamegame.com' },
      update: {},
      create: {
        name: 'Finance User',
        email: 'finance.user@blamegame.com',
        employeeId: 'EMP004',
        passwordHash: demoPassword,
        role: 'USER',
        teamId: financeTeam.id,
      },
    }),
  ]);

  console.log(`✅ Created ${demoUsers.length} demo users (password: user123)`);

  console.log('\n🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

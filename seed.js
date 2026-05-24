const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL || "file:./dev.db" } },
});

async function seed() {
  const perms = ['read', 'write', 'edit', 'delete', 'approve', 'reject', 'shortlist', 'interview_access'];
  for (const name of perms) {
    await prisma.permission.upsert({
      where: { name }, update: {},
      create: { name, description: 'Can ' + name },
    });
  }

  await prisma.user.upsert({
    where: { mobileNumber: '01700000000' },
    update: {},
    create: { fullName: 'Super Admin', mobileNumber: '01700000000', password: bcrypt.hashSync('admin123', 10), role: 'admin' },
  });

  await prisma.user.upsert({
    where: { mobileNumber: '01700000001' },
    update: {},
    create: { fullName: 'Sample Manager', mobileNumber: '01700000001', password: bcrypt.hashSync('manager123', 10), role: 'manager' },
  });

  await prisma.user.upsert({
    where: { mobileNumber: '01700000002' },
    update: {},
    create: { fullName: 'Sample Executive', mobileNumber: '01700000002', password: bcrypt.hashSync('executive123', 10), role: 'executive' },
  });

  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (admin) {
    const count = await prisma.jobPost.count();
    if (count === 0) {
      await prisma.jobPost.createMany({
        data: [
          { title: 'Senior Software Engineer', companyName: 'Tech Solutions Ltd', designation: 'Senior Software Engineer', description: 'We need a Senior Software Engineer with 5+ years experience.', applicationDeadline: '2026-06-30', createdById: admin.id },
          { title: 'HR Manager', companyName: 'Global HR Corp', designation: 'Manager', description: 'Experienced HR Manager needed.', applicationDeadline: '2026-07-15', createdById: admin.id },
          { title: 'Junior Web Developer', companyName: 'Digital Agency BD', designation: 'Junior Developer', description: 'Fresh graduates encouraged.', applicationDeadline: '2026-06-20', createdById: admin.id },
        ],
      });
    }
  }

  console.log('Database seeded successfully!');
  await prisma.$disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });

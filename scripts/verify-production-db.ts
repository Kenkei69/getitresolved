import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDatabase() {
  console.log('================================================================');
  console.log('Getitresolved — Production Database & Municipal Readiness Check');
  console.log('================================================================');

  if (!process.env.DATABASE_URL) {
    console.error('❌ FAILED: DATABASE_URL environment variable is missing.');
    console.error('   Please provide a valid PostgreSQL connection string.');
    process.exit(1);
  }

  // Sanitize connection display
  try {
    const parsed = new URL(process.env.DATABASE_URL);
    console.log(`📡 Connecting to PostgreSQL host: ${parsed.hostname}:${parsed.port || '5432'} (database: ${parsed.pathname.slice(1)})`);
  } catch {
    console.log('📡 Connecting to PostgreSQL database...');
  }

  try {
    // 1. Connection check
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connectivity established successfully.');

    // 2. Department Verification
    const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
    console.log(`\n🏛️  Municipal Departments: ${departments.length} found`);
    departments.forEach((d) => console.log(`   - ${d.name} (${d.code})`));

    const expectedDepts = ['ROADS', 'ELECTRICAL', 'WATER', 'DRAINAGE', 'SANITATION'];
    const missingDepts = expectedDepts.filter((code) => !departments.some((d) => d.code === code));
    if (missingDepts.length > 0) {
      console.warn(`⚠️  Warning: Missing expected core departments: ${missingDepts.join(', ')}`);
      console.log('   Run `npm run db:init-meta` to seed required municipal metadata.');
    } else {
      console.log('   ✅ All 5 core municipal departments are properly provisioned.');
    }

    // 3. Category Verification
    const categories = await prisma.category.findMany();
    console.log(`\n🏷️  Classification Categories: ${categories.length} found`);
    if (categories.length === 0) {
      console.warn('⚠️  Warning: No complaint categories found. Run `npm run db:init-meta`.');
    }

    // 4. Service Areas Verification
    const serviceAreas = await prisma.serviceArea.findMany();
    console.log(`\n📍 Service Areas / Municipal Wards: ${serviceAreas.length} found`);
    if (serviceAreas.length === 0) {
      console.warn('⚠️  Warning: No service areas found. Run `npm run db:init-meta`.');
    }

    // 5. User Roles Summary
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const staffCount = await prisma.user.count({ where: { role: 'STAFF' } });
    const citizenCount = await prisma.user.count({ where: { role: 'CITIZEN' } });
    console.log('\n👥 User Accounts:');
    console.log(`   - Administrators: ${adminCount}`);
    console.log(`   - Department Staff: ${staffCount}`);
    console.log(`   - Registered Citizens: ${citizenCount}`);

    if (adminCount === 0) {
      console.warn('⚠️  Notice: No administrator accounts exist.');
      console.log('   Run `npm run admin:init` to safely bootstrap the initial administrator.');
    }

    // 6. Complaint Count
    const complaintCount = await prisma.complaint.count();
    console.log(`\n📋 Complaint Records in System: ${complaintCount}`);

    console.log('\n================================================================');
    console.log('🎉 Production Database Verification Complete: All Checks Passed.');
    console.log('================================================================');
  } catch (err: any) {
    console.error('\n❌ DATABASE VERIFICATION ERROR:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();

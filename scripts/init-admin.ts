import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || process.argv[2] || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || process.argv[3] || '';
  const name = (process.env.ADMIN_NAME || process.argv[4] || 'Municipal Administrator').trim();
  const setupSecret = process.env.ADMIN_SETUP_SECRET || process.argv[5] || '';

  if (!email || !password) {
    console.error('================================================================');
    console.error('ERROR: Administrator email and password are required.');
    console.error('Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run admin:init');
    console.error('Or:    npx tsx scripts/init-admin.ts <email> <password> [name] [setupSecret]');
    console.error('================================================================');
    process.exit(1);
  }

  // 1. Validate Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('ERROR: Invalid email address format.');
    process.exit(1);
  }

  // 2. Validate Password Strength (Min 12 characters, uppercase, lowercase, digit, symbol)
  if (password.length < 12) {
    console.error('ERROR: Administrator password must be at least 12 characters long for production security.');
    process.exit(1);
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    console.error('ERROR: Password does not meet municipal security complexity standards.');
    console.error('Must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol.');
    process.exit(1);
  }

  // 3. Authorization Verification
  const requiredSecret = process.env.INITIAL_ADMIN_SECRET;
  if (requiredSecret) {
    const providedSecret = setupSecret || process.env.ADMIN_SETUP_SECRET;
    if (providedSecret !== requiredSecret) {
      console.error('ERROR: Unauthorized. Provided ADMIN_SETUP_SECRET does not match INITIAL_ADMIN_SECRET.');
      process.exit(1);
    }
  }

  // 4. Overwrite Guard
  const existingAdmin = await prisma.user.findUnique({ where: { email } });
  if (existingAdmin && process.env.FORCE_ADMIN_OVERWRITE !== 'true') {
    console.log(`[Admin Init] User ${email} already exists with role ${existingAdmin.role}.`);
    console.log('To update this user password/role, set FORCE_ADMIN_OVERWRITE=true.');
    process.exit(1);
  }

  console.log(`[Admin Init] Authorizing and establishing administrator account: ${email}...`);
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: 'ADMIN',
    },
    create: {
      email,
      name,
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log(`[Admin Init] SUCCESS: Administrator established securely.`);
  console.log(`  User ID: ${admin.id}`);
  console.log(`  Email:   ${admin.email}`);
  console.log(`  Role:    ${admin.role}`);
}

main()
  .catch((e) => {
    console.error('[Admin Init Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { validateEnv } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import User from '../models/User.js';

/**
 * CLI script to securely bootstrap the first Admin account.
 * Usage:
 *   npm run seed:admin
 * Optional environment overrides:
 *   SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_COLLEGE, SEED_ADMIN_ID
 */
const seedInitialAdmin = async () => {
  validateEnv();
  await connectDatabase();

  try {
    const email = (process.env.SEED_ADMIN_EMAIL || 'admin@eventhub.edu').trim().toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@1234';
    const fullName = process.env.SEED_ADMIN_NAME || 'EventHub Administrator';
    const collegeName = process.env.SEED_ADMIN_COLLEGE || 'EventHub Central Campus';
    const studentId = process.env.SEED_ADMIN_ID || 'ADMIN-001';

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log(`[SeedAdmin] Admin account already exists for ${email} (role: ${existingAdmin.role}).`);
      return;
    }

    await User.create({
      fullName,
      email,
      password,
      collegeName,
      studentId,
      role: 'admin',
    });

    console.log('[SeedAdmin] Initial Admin account created successfully:');
    console.log(`  Email: ${email}`);
    console.log('  Role:  admin');
    console.log('  Note:  Change the default password immediately in non-local environments.');
  } finally {
    await disconnectDatabase();
  }
};

seedInitialAdmin().catch((err) => {
  console.error('[SeedAdmin] Failed:', err.message);
  process.exit(1);
});

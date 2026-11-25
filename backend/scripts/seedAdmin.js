/**
 * Controlled ADMIN account seed.
 * Run manually: npm run seed:admin
 * Does NOT run on server startup.
 */
import mongoose from 'mongoose';
import env from '../src/config/env.js';
import User from '../src/models/User.js';
import { USER_ROLES } from '../src/constants/roles.js';
import { hashPassword } from '../src/utils/password.js';

const seedAdmin = async () => {
  if (!env.adminEmail || !env.adminPassword) {
    throw new Error(
      'ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment before seeding.'
    );
  }

  if (env.adminPassword.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
  }

  await mongoose.connect(env.mongodbUri);

  const normalizedEmail = env.adminEmail.trim().toLowerCase();
  const existingAdmin = await User.findOne({ email: normalizedEmail });

  if (existingAdmin) {
    if (existingAdmin.role === USER_ROLES.ADMIN) {
      console.log('Admin user already exists. No changes made.');
      return;
    }

    throw new Error(
      'A user with the configured admin email already exists but is not an ADMIN.'
    );
  }

  const hashedPassword = await hashPassword(env.adminPassword);

  await User.create({
    name: env.adminName,
    email: normalizedEmail,
    password: hashedPassword,
    role: USER_ROLES.ADMIN,
  });

  console.log('Admin user created successfully.');
  console.log(`Email: ${normalizedEmail}`);
  console.log('Password: [REDACTED]');
};

seedAdmin()
  .catch((error) => {
    console.error('Admin seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });

/**
 * Seed default Admin role + admin user.
 * Run: npm run seed
 * Default login: admin / Admin@123
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');
const { SYSTEM_PAGES, buildDefaultPages } = require('../../shared/constants');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const adminPages = SYSTEM_PAGES.map(({ pageName }) => ({
    pageName,
    canView: true,
    canAdd: true,
    canEdit: true,
    canDelete: true,
  }));

  let role = await Role.findOne({ roleName: 'Administrator' });
  if (!role) {
    role = await Role.create({
      roleName: 'Administrator',
      roleDescription: 'Full system access',
      dashboard: '/dashboard',
      pages: adminPages,
    });
    console.log('Created Administrator role');
  } else {
    console.log('Administrator role already exists');
  }

  const standardPages = buildDefaultPages().map((p) => ({
    ...p,
    canView: ['dashboard', 'customers', 'samples', 'plans', 'workshop', 'specifications', 'tests', 'equipment'].includes(p.pageName),
    canAdd: ['samples', 'customers'].includes(p.pageName),
    canEdit: ['samples', 'workshop'].includes(p.pageName),
  }));

  let standardRole = await Role.findOne({ roleName: 'Standard User' });
  if (!standardRole) {
    standardRole = await Role.create({
      roleName: 'Standard User',
      roleDescription: 'Default role for registered users',
      dashboard: '/dashboard',
      pages: standardPages,
    });
    console.log('Created Standard User role');
  }

  const existing = await User.findOne({ userId: 'admin' });
  if (existing) {
    console.log('Admin user already exists — skipping');
  } else {
    await User.create({
      userId: 'admin',
      userName: 'System Administrator',
      password: 'Admin@123',
      role: role._id,
      userCategory: 'admin',
      department: 'Management',
      emailId: 'admin@lims.local',
      userInitial: 'ADM',
      remoteLogin: true,
    });
    console.log('Created admin user (userId: admin, password: Admin@123)');
  }

  await mongoose.disconnect();
  console.log('Seed complete');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

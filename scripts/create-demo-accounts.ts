/**
 * Script to create demo accounts for testing
 * 
 * This script creates Firebase accounts and syncs them to the database
 * with appropriate roles (student, instructor, admin)
 * 
 * Usage: npx tsx scripts/create-demo-accounts.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

// Initialize Firebase Admin (if service account available)
let firebaseAdmin: any = null;
let auth: any = null;

try {
  // Try to initialize Firebase Admin
  // Note: This requires FIREBASE_SERVICE_ACCOUNT_KEY or similar
  // For now, we'll create accounts via the API or manual process
  console.log('📝 Note: This script will guide you through creating demo accounts.');
  console.log('   Accounts need to be created via the signup flow or Firebase Console.\n');
} catch (error) {
  console.log('⚠️  Firebase Admin not configured. Accounts will need to be created via signup flow.\n');
}

interface DemoAccount {
  email: string;
  password: string;
  role: 'student' | 'instructor' | 'admin';
  firstName: string;
  lastName: string;
}

const demoAccounts: DemoAccount[] = [
  {
    email: 'student.demo@flightpro.com',
    password: 'DemoPass123!',
    role: 'student',
    firstName: 'Demo',
    lastName: 'Student',
  },
  {
    email: 'instructor.demo@flightpro.com',
    password: 'DemoPass123!',
    role: 'instructor',
    firstName: 'Demo',
    lastName: 'Instructor',
  },
  {
    email: 'admin.demo@flightpro.com',
    password: 'DemoPass123!',
    role: 'admin',
    firstName: 'Demo',
    lastName: 'Admin',
  },
];

async function checkExistingAccounts() {
  console.log('🔍 Checking for existing demo accounts...\n');

  for (const account of demoAccounts) {
    let exists = false;
    let hasFirebase = false;

    if (account.role === 'student') {
      const student = await prisma.student.findUnique({
        where: { email: account.email },
      });
      exists = !!student;
      hasFirebase = !!student?.firebaseUid;
    } else if (account.role === 'instructor') {
      const instructor = await prisma.instructor.findUnique({
        where: { email: account.email },
      });
      exists = !!instructor;
      hasFirebase = !!instructor?.firebaseUid;
    } else if (account.role === 'admin') {
      const admin = await prisma.admin.findUnique({
        where: { email: account.email },
      });
      exists = !!admin;
      hasFirebase = !!admin?.firebaseUid;
    }

    const status = exists
      ? hasFirebase
        ? '✅ Complete (has Firebase account)'
        : '⚠️  Exists but missing Firebase account'
      : '❌ Not created';

    console.log(`   ${account.role.toUpperCase().padEnd(12)} ${account.email.padEnd(35)} ${status}`);
  }
}

async function getFirstSchool() {
  const school = await prisma.school.findFirst();
  if (!school) {
    throw new Error('No schools found in database. Please run seed script first.');
  }
  return school;
}

async function main() {
  console.log('🚀 Demo Account Setup\n');
  console.log('='.repeat(60));

  try {
    // Check existing accounts
    await checkExistingAccounts();

    console.log('\n' + '='.repeat(60));
    console.log('\n📋 Instructions to Create Demo Accounts:\n');

    const school = await getFirstSchool();
    console.log(`✅ Found school: ${school.name} (${school.airportCode})\n`);

    console.log('Option 1: Create via Signup Flow (Recommended)');
    console.log('   1. Go to: http://localhost:3000/signup');
    console.log('   2. For each account:');
    for (const account of demoAccounts) {
      console.log(`\n   ${account.role.toUpperCase()}:`);
      console.log(`      Email: ${account.email}`);
      console.log(`      Password: ${account.password}`);
      console.log(`      School: ${school.name}`);
      console.log(`      Note: Signup creates "student" by default.`);
      if (account.role !== 'student') {
        console.log(`      ⚠️  After signup, you'll need to update the role in database.`);
      }
    }

    console.log('\n\nOption 2: Create via API (if sync-user endpoint supports role)');
    console.log('   Use the /api/auth/sync-user endpoint with role parameter');

    console.log('\n\nOption 3: Manual Database Update');
    console.log('   1. Create Firebase accounts via Firebase Console');
    console.log('   2. Get Firebase UIDs');
    console.log('   3. Update database records with Firebase UIDs');

    console.log('\n' + '='.repeat(60));
    console.log('\n💡 After creating accounts, run this script again to verify.');
    console.log('='.repeat(60));
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


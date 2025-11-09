/**
 * Create Firebase accounts for all users in the database
 * 
 * This script:
 * 1. Finds all admins, instructors, and students
 * 2. Creates Firebase Authentication accounts for each
 * 3. Updates their database records with firebaseUid
 * 4. Uses password "DemoPass123!" for all accounts
 * 
 * Usage: npx tsx scripts/create-firebase-accounts.ts
 */

import { PrismaClient } from '@prisma/client';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const DEFAULT_PASSWORD = 'DemoPass123!';

interface UserCredential {
  email: string;
  password: string;
  role: string;
  name: string;
  schoolId?: string;
}

async function createFirebaseAccount(email: string, displayName: string): Promise<string> {
  try {
    // Check if user already exists
    const existingUser = await admin.auth().getUserByEmail(email).catch(() => null);
    
    if (existingUser) {
      console.log(`  ✓ Firebase account exists: ${email}`);
      return existingUser.uid;
    }

    // Create new user
    const userRecord = await admin.auth().createUser({
      email,
      password: DEFAULT_PASSWORD,
      displayName,
      emailVerified: true,
    });

    console.log(`  ✅ Created Firebase account: ${email}`);
    return userRecord.uid;
  } catch (error: any) {
    console.error(`  ❌ Error creating Firebase account for ${email}:`, error.message);
    throw error;
  }
}

async function main() {
  const credentials: UserCredential[] = [];
  let created = 0;
  let updated = 0;
  let errors = 0;

  console.log('🔥 Creating Firebase accounts for all users...\n');

  // Process Admins
  console.log('👤 Processing Admins...');
  const admins = await prisma.admin.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      firebaseUid: true,
    },
  });

  for (const admin of admins) {
    try {
      const displayName = `${admin.firstName} ${admin.lastName}`;
      const firebaseUid = await createFirebaseAccount(admin.email, displayName);

      if (!admin.firebaseUid || admin.firebaseUid !== firebaseUid) {
        await prisma.admin.update({
          where: { id: admin.id },
          data: { firebaseUid },
        });
        updated++;
      }

      credentials.push({
        email: admin.email,
        password: DEFAULT_PASSWORD,
        role: 'Admin',
        name: displayName,
      });

      if (!admin.firebaseUid) created++;
    } catch (error) {
      errors++;
    }
  }

  console.log(`  Processed ${admins.length} admins\n`);

  // Process Instructors
  console.log('✈️  Processing Instructors...');
  const instructors = await prisma.instructor.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      firebaseUid: true,
      schoolId: true,
      school: {
        select: {
          name: true,
        },
      },
    },
  });

  let instructorCount = 0;
  for (const instructor of instructors) {
    try {
      const displayName = `${instructor.firstName} ${instructor.lastName}`;
      const firebaseUid = await createFirebaseAccount(instructor.email, displayName);

      if (!instructor.firebaseUid || instructor.firebaseUid !== firebaseUid) {
        await prisma.instructor.update({
          where: { id: instructor.id },
          data: { firebaseUid },
        });
        updated++;
      }

      credentials.push({
        email: instructor.email,
        password: DEFAULT_PASSWORD,
        role: 'Instructor',
        name: displayName,
        schoolId: instructor.school.name,
      });

      if (!instructor.firebaseUid) created++;
      instructorCount++;

      // Progress indicator for large batches
      if (instructorCount % 50 === 0) {
        console.log(`  Processed ${instructorCount}/${instructors.length} instructors...`);
      }
    } catch (error) {
      errors++;
    }
  }

  console.log(`  Processed ${instructors.length} instructors\n`);

  // Process Students
  console.log('🎓 Processing Students...');
  const students = await prisma.student.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      firebaseUid: true,
      schoolId: true,
      school: {
        select: {
          name: true,
        },
      },
    },
  });

  let studentCount = 0;
  for (const student of students) {
    try {
      const displayName = `${student.firstName} ${student.lastName}`;
      const firebaseUid = await createFirebaseAccount(student.email, displayName);

      if (!student.firebaseUid || student.firebaseUid !== firebaseUid) {
        await prisma.student.update({
          where: { id: student.id },
          data: { firebaseUid },
        });
        updated++;
      }

      credentials.push({
        email: student.email,
        password: DEFAULT_PASSWORD,
        role: 'Student',
        name: displayName,
        schoolId: student.school.name,
      });

      if (!student.firebaseUid) created++;
      studentCount++;

      // Progress indicator for large batches
      if (studentCount % 100 === 0) {
        console.log(`  Processed ${studentCount}/${students.length} students...`);
      }
    } catch (error) {
      errors++;
    }
  }

  console.log(`  Processed ${students.length} students\n`);

  // Save credentials to file
  const credentialsFilePath = path.join(process.cwd(), 'DEMO_CREDENTIALS.md');
  let credentialsMarkdown = `# Demo Account Credentials

**Password for ALL accounts**: \`${DEFAULT_PASSWORD}\`

## Summary

- Total Users: ${credentials.length}
- Admins: ${admins.length}
- Instructors: ${instructors.length}
- Students: ${students.length}

## Quick Access Accounts

### Admin Account
\`\`\`
Email: ${credentials.find(c => c.role === 'Admin')?.email || 'N/A'}
Password: ${DEFAULT_PASSWORD}
\`\`\`

### Instructor Account (First)
\`\`\`
Email: ${credentials.find(c => c.role === 'Instructor')?.email || 'N/A'}
Password: ${DEFAULT_PASSWORD}
\`\`\`

### Student Account (First)
\`\`\`
Email: ${credentials.find(c => c.role === 'Student')?.email || 'N/A'}
Password: ${DEFAULT_PASSWORD}
\`\`\`

---

## All Accounts

`;

  // Group by role and school
  const adminCreds = credentials.filter(c => c.role === 'Admin');
  const instructorCreds = credentials.filter(c => c.role === 'Instructor');
  const studentCreds = credentials.filter(c => c.role === 'Student');

  // Admins
  credentialsMarkdown += `### Admins (${adminCreds.length})\n\n`;
  credentialsMarkdown += `| Name | Email |\n`;
  credentialsMarkdown += `|------|-------|\n`;
  adminCreds.forEach(c => {
    credentialsMarkdown += `| ${c.name} | ${c.email} |\n`;
  });
  credentialsMarkdown += `\n`;

  // Instructors (grouped by school)
  credentialsMarkdown += `### Instructors (${instructorCreds.length})\n\n`;
  const instructorsBySchool = instructorCreds.reduce((acc, c) => {
    const school = c.schoolId || 'Unknown';
    if (!acc[school]) acc[school] = [];
    acc[school].push(c);
    return acc;
  }, {} as Record<string, UserCredential[]>);

  Object.entries(instructorsBySchool).forEach(([school, creds]) => {
    credentialsMarkdown += `#### ${school} (${creds.length} instructors)\n\n`;
    credentialsMarkdown += `| Name | Email |\n`;
    credentialsMarkdown += `|------|-------|\n`;
    creds.slice(0, 10).forEach(c => {
      credentialsMarkdown += `| ${c.name} | ${c.email} |\n`;
    });
    if (creds.length > 10) {
      credentialsMarkdown += `| ... | (${creds.length - 10} more) |\n`;
    }
    credentialsMarkdown += `\n`;
  });

  // Students (grouped by school, limited to first 10 per school)
  credentialsMarkdown += `### Students (${studentCreds.length})\n\n`;
  const studentsBySchool = studentCreds.reduce((acc, c) => {
    const school = c.schoolId || 'Unknown';
    if (!acc[school]) acc[school] = [];
    acc[school].push(c);
    return acc;
  }, {} as Record<string, UserCredential[]>);

  Object.entries(studentsBySchool).forEach(([school, creds]) => {
    credentialsMarkdown += `#### ${school} (${creds.length} students)\n\n`;
    credentialsMarkdown += `| Name | Email |\n`;
    credentialsMarkdown += `|------|-------|\n`;
    creds.slice(0, 10).forEach(c => {
      credentialsMarkdown += `| ${c.name} | ${c.email} |\n`;
    });
    if (creds.length > 10) {
      credentialsMarkdown += `| ... | (${creds.length - 10} more) |\n`;
    }
    credentialsMarkdown += `\n`;
  });

  credentialsMarkdown += `\n---\n\n*All accounts use the password: \`${DEFAULT_PASSWORD}\`*\n`;

  fs.writeFileSync(credentialsFilePath, credentialsMarkdown);

  console.log('\n✅ Firebase account creation complete!\n');
  console.log('📊 Summary:');
  console.log(`   - Total users: ${credentials.length}`);
  console.log(`   - New Firebase accounts created: ${created}`);
  console.log(`   - Database records updated: ${updated}`);
  console.log(`   - Errors: ${errors}`);
  console.log(`\n📄 Credentials saved to: ${credentialsFilePath}\n`);
  console.log(`🔑 Password for ALL accounts: ${DEFAULT_PASSWORD}\n`);

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  prisma.$disconnect();
  process.exit(1);
});


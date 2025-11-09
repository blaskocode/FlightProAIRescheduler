/**
 * Script to update demo account roles after signup
 * 
 * After creating accounts via signup (which creates students),
 * run this script to update instructor and admin accounts.
 * 
 * Usage: npx tsx scripts/update-demo-roles.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function updateDemoRoles() {
  console.log('🔄 Updating demo account roles...\n');

  try {
    // Get first school
    const school = await prisma.school.findFirst();
    if (!school) {
      throw new Error('No school found');
    }

    // Update instructor account
    const instructorEmail = 'instructor.demo@flightpro.com';
    const instructor = await prisma.student.findUnique({
      where: { email: instructorEmail },
    });

    if (instructor && instructor.firebaseUid) {
      // Check if instructor already exists
      const existingInstructor = await prisma.instructor.findUnique({
        where: { firebaseUid: instructor.firebaseUid },
      });

      if (!existingInstructor) {
        // Create instructor record
        await prisma.instructor.create({
          data: {
            schoolId: school.id,
            email: instructorEmail,
            firebaseUid: instructor.firebaseUid,
            firstName: 'Demo',
            lastName: 'Instructor',
            phone: instructor.phone || '',
            certificateNumber: 'CFI-DEMO-001', // Demo certificate number
          },
        });
        console.log('✅ Created instructor account');

        // Delete student record
        await prisma.student.delete({
          where: { id: instructor.id },
        });
        console.log('✅ Removed student record for instructor');
      } else {
        console.log('⚠️  Instructor account already exists');
      }
    } else {
      console.log('❌ Instructor account not found or missing Firebase UID');
    }

    // Update admin account
    const adminEmail = 'admin.demo@flightpro.com';
    const adminStudent = await prisma.student.findUnique({
      where: { email: adminEmail },
    });

    if (adminStudent && adminStudent.firebaseUid) {
      // Check if admin already exists
      const existingAdmin = await prisma.admin.findUnique({
        where: { firebaseUid: adminStudent.firebaseUid },
      });

      if (!existingAdmin) {
        // Create admin record
        await prisma.admin.create({
          data: {
            email: adminEmail,
            firebaseUid: adminStudent.firebaseUid,
            firstName: 'Demo',
            lastName: 'Admin',
          },
        });
        console.log('✅ Created admin account');

        // Delete student record
        await prisma.student.delete({
          where: { id: adminStudent.id },
        });
        console.log('✅ Removed student record for admin');
      } else {
        console.log('⚠️  Admin account already exists');
      }
    } else {
      console.log('❌ Admin account not found or missing Firebase UID');
    }

    console.log('\n✅ Role update complete!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateDemoRoles();


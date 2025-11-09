/**
 * Create demo accounts for system demonstration
 * 
 * Creates:
 * - 1 Admin
 * - 1 Instructor (CFII)
 * - 2 Students (one beginner, one instrument)
 * - 2 Test flights for tomorrow
 * 
 * Usage: npx tsx scripts/create-demo-accounts.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Creating demo accounts for system demonstration...\n');

  // Get or create school
  let school = await prisma.school.findFirst();
  if (!school) {
    school = await prisma.school.create({
      data: {
        name: 'Demo Flight School',
        airportCode: 'KAUS',
        address: '123 Aviation Way, Austin, TX',
        phone: '512-555-0100',
        email: 'info@demoflightschool.com',
      },
    });
    console.log('✅ Created demo school:', school.name);
  } else {
    console.log('✅ Using existing school:', school.name);
  }

  // Create or update admin
  let admin = await prisma.admin.findUnique({
    where: { email: 'demo.admin@flightpro.com' },
  });

  if (!admin) {
    admin = await prisma.admin.create({
      data: {
        email: 'demo.admin@flightpro.com',
        firstName: 'Demo',
        lastName: 'Admin',
        firebaseUid: `demo-admin-${Date.now()}`, // Unique placeholder
      },
    });
    console.log('✅ Created admin account:', admin.email);
  } else {
    console.log('✅ Admin account exists:', admin.email);
  }

  // Create or update instructor
  let instructor = await prisma.instructor.findUnique({
    where: { email: 'demo.instructor@flightpro.com' },
  });

  if (!instructor) {
    instructor = await prisma.instructor.create({
      data: {
        schoolId: school.id,
        email: 'demo.instructor@flightpro.com',
        firstName: 'Demo',
        lastName: 'Instructor',
        phone: '512-555-0101',
        firebaseUid: `demo-instructor-${Date.now()}`, // Unique placeholder
        certificateNumber: 'CFI123456',
        certificateExpiry: new Date('2026-12-31'),
        cfiExpiry: new Date('2026-12-31'),
        cfiiRating: true, // Instrument instructor
        meiRating: false,
        instrumentCurrent: true,
      },
    });
    console.log('✅ Created instructor account (CFII):', instructor.email);
  } else {
    console.log('✅ Instructor account exists:', instructor.email);
  }

  // Create or update student pilot (beginner)
  let studentPilot = await prisma.student.findUnique({
    where: { email: 'demo.student@flightpro.com' },
  });

  if (!studentPilot) {
    studentPilot = await prisma.student.create({
      data: {
        schoolId: school.id,
        email: 'demo.student@flightpro.com',
        firstName: 'Demo',
        lastName: 'Student',
        phone: '512-555-0102',
        firebaseUid: `demo-student-${Date.now()}`, // Unique placeholder
        trainingLevel: 'PRIVATE_PILOT',
        currentStage: 'STAGE_1_PRE_SOLO',
        currentLesson: 1,
        totalFlightHours: 15,
        preferredInstructorId: instructor.id,
      },
    });
    console.log('✅ Created student pilot account:', studentPilot.email);
  } else {
    console.log('✅ Student pilot account exists:', studentPilot.email);
  }

  // Create or update instrument student (advanced)
  let irStudent = await prisma.student.findUnique({
    where: { email: 'demo.ir.student@flightpro.com' },
  });

  if (!irStudent) {
    irStudent = await prisma.student.create({
      data: {
        schoolId: school.id,
        email: 'demo.ir.student@flightpro.com',
        firstName: 'Demo IR',
        lastName: 'Student',
        phone: '512-555-0103',
        firebaseUid: `demo-ir-student-${Date.now()}`, // Unique placeholder
        trainingLevel: 'INSTRUMENT_RATED',
        currentStage: 'STAGE_3_CHECKRIDE_PREP',
        currentLesson: 15,
        totalFlightHours: 75,
        instrumentHours: 20,
        preferredInstructorId: instructor.id,
      },
    });
    console.log('✅ Created instrument student account:', irStudent.email);
  } else {
    console.log('✅ Instrument student account exists:', irStudent.email);
  }

  // Get or create aircraft
  let aircraft = await prisma.aircraft.findFirst({
    where: { schoolId: school.id },
  });

  if (!aircraft) {
    aircraft = await prisma.aircraft.create({
      data: {
        schoolId: school.id,
        typeId: 'c172', // Assuming aircraft type exists
        tailNumber: 'N12345',
        homeBase: school.airportCode,
        status: 'AVAILABLE',
        hobbsTime: 1500,
        lastInspection: new Date(),
        nextInspectionDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      },
    });
    console.log('✅ Created demo aircraft:', aircraft.tailNumber);
  } else {
    console.log('✅ Using existing aircraft:', aircraft.tailNumber);
  }

  // Create test flights for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(12, 0, 0, 0);

  // Flight 1: Student pilot (stricter weather minimums)
  const briefingStart = new Date(tomorrow);
  briefingStart.setMinutes(tomorrow.getMinutes() - 30); // 30 min before flight

  const debriefEnd = new Date(tomorrowEnd);
  debriefEnd.setMinutes(tomorrowEnd.getMinutes() + 30); // 30 min after flight

  const flight1 = await prisma.flight.create({
    data: {
      schoolId: school.id,
      studentId: studentPilot.id,
      instructorId: instructor.id,
      aircraftId: aircraft.id,
      scheduledStart: tomorrow,
      scheduledEnd: tomorrowEnd,
      briefingStart,
      debriefEnd,
      departureAirport: 'KAUS',
      destinationAirport: 'KHYI',
      route: 'KAUS-KHYI',
      lessonTitle: 'Basic Maneuvers',
      status: 'CONFIRMED',
      flightType: 'DUAL_INSTRUCTION',
    },
  });
  console.log('✅ Created test flight 1 (Student Pilot):', flight1.id);

  // Flight 2: Instrument student (relaxed weather minimums)
  const tomorrow2 = new Date(tomorrow);
  tomorrow2.setMinutes(30);
  const tomorrow2End = new Date(tomorrow2);
  tomorrow2End.setHours(12, 30, 0, 0);

  const briefingStart2 = new Date(tomorrow2);
  briefingStart2.setMinutes(tomorrow2.getMinutes() - 30); // 30 min before flight

  const debriefEnd2 = new Date(tomorrow2End);
  debriefEnd2.setMinutes(tomorrow2End.getMinutes() + 30); // 30 min after flight

  const flight2 = await prisma.flight.create({
    data: {
      schoolId: school.id,
      studentId: irStudent.id,
      instructorId: instructor.id,
      aircraftId: aircraft.id,
      scheduledStart: tomorrow2,
      scheduledEnd: tomorrow2End,
      briefingStart: briefingStart2,
      debriefEnd: debriefEnd2,
      departureAirport: 'KAUS',
      destinationAirport: 'KHYI',
      route: 'KAUS-KHYI',
      lessonTitle: 'ILS Approaches',
      status: 'CONFIRMED',
      flightType: 'DUAL_INSTRUCTION',
    },
  });
  console.log('✅ Created test flight 2 (Instrument Student):', flight2.id);

  console.log('\n✅ Demo accounts setup complete!\n');
  console.log('📋 Account Credentials (Password for all: DemoPass123!):\n');
  console.log('Admin:');
  console.log('  Email: demo.admin@flightpro.com');
  console.log('  Password: DemoPass123!\n');
  console.log('Instructor (CFII):');
  console.log('  Email: demo.instructor@flightpro.com');
  console.log('  Password: DemoPass123!\n');
  console.log('Student Pilot (Beginner):');
  console.log('  Email: demo.student@flightpro.com');
  console.log('  Password: DemoPass123!');
  console.log('  Training: Private Pilot (Strict weather minimums)\n');
  console.log('Instrument Student (Advanced):');
  console.log('  Email: demo.ir.student@flightpro.com');
  console.log('  Password: DemoPass123!');
  console.log('  Training: Instrument Rating (Relaxed weather minimums)\n');
  console.log('📅 Test Flights Created:');
  console.log(`  Flight 1 (Student): Tomorrow ${tomorrow.toLocaleTimeString()} - KAUS to KHYI`);
  console.log(`  Flight 2 (IR Student): Tomorrow ${tomorrow2.toLocaleTimeString()} - KAUS to KHYI\n`);
  console.log('🔥 Next Steps:');
  console.log('  1. Create these accounts in Firebase Console');
  console.log('  2. Run: npm run db:firebase (if you have service account)');
  console.log('  3. Or manually create in Firebase Auth');
  console.log('  4. Follow docs/DEMO_WALKTHROUGH.md for full demo script\n');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error creating demo accounts:', error);
  prisma.$disconnect();
  process.exit(1);
});

/**
 * Assign flights to a user for testing
 * Usage: tsx scripts/assign-flights-to-user.ts <firebaseUid>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const firebaseUid = process.argv[2];
  
  if (!firebaseUid) {
    console.error('Usage: tsx scripts/assign-flights-to-user.ts <firebaseUid>');
    process.exit(1);
  }

  // Find the user
  let user = await prisma.student.findUnique({
    where: { firebaseUid },
    include: { school: true },
  });

  if (!user) {
    user = await prisma.instructor.findUnique({
      where: { firebaseUid },
      include: { school: true },
    }) as any;
  }

  if (!user) {
    console.error(`User with Firebase UID ${firebaseUid} not found`);
    process.exit(1);
  }

  console.log(`Found user: ${user.firstName} ${user.lastName} (${user.email})`);
  console.log(`School: ${user.school.name}`);

  // Get available aircraft and instructors for this school
  const aircraft = await prisma.aircraft.findFirst({
    where: { schoolId: user.schoolId, status: 'AVAILABLE' },
  });

  if (!aircraft) {
    console.error('No available aircraft found for this school');
    process.exit(1);
  }

  const instructor = user.role === 'student' 
    ? await prisma.instructor.findFirst({
        where: { schoolId: user.schoolId },
      })
    : null;

  // Create 5 test flights for the next 2 weeks
  const flights = [];
  const now = new Date();
  
  for (let i = 0; i < 5; i++) {
    const flightDate = new Date(now);
    flightDate.setDate(now.getDate() + (i * 3) + 1); // Every 3 days
    flightDate.setHours(10 + (i % 5), 0, 0, 0); // 10 AM, 11 AM, etc.

    const scheduledStart = flightDate;
    const scheduledEnd = new Date(scheduledStart);
    scheduledEnd.setHours(scheduledEnd.getHours() + 2);
    const briefingStart = new Date(scheduledStart);
    briefingStart.setMinutes(briefingStart.getMinutes() - 30);
    const debriefEnd = new Date(scheduledEnd);
    debriefEnd.setMinutes(debriefEnd.getMinutes() + 20);

    const flight = await prisma.flight.create({
      data: {
        schoolId: user.schoolId,
        studentId: user.role === 'student' ? user.id : undefined,
        instructorId: user.role === 'student' ? instructor?.id : user.id,
        aircraftId: aircraft.id,
        scheduledStart,
        scheduledEnd,
        briefingStart,
        debriefEnd,
        flightType: user.role === 'student' ? 'DUAL_INSTRUCTION' : 'DUAL_INSTRUCTION',
        lessonNumber: user.role === 'student' ? (user as any).currentLesson || 1 : undefined,
        lessonTitle: 'Flight Lesson',
        departureAirport: user.school.airportCode,
        status: i === 0 ? 'CONFIRMED' : 'SCHEDULED',
      },
    });

    flights.push(flight);
    console.log(`Created flight ${i + 1}: ${scheduledStart.toLocaleString()}`);
  }

  console.log(`\n✅ Created ${flights.length} flights for ${user.firstName} ${user.lastName}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


/**
 * Clear pending reschedule requests for a specific flight
 * Usage: npx tsx scripts/clear-pending-reschedules.ts [flightId]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearPendingReschedules(flightId?: string) {
  try {
    const where = flightId 
      ? { flightId, status: { in: ['PENDING_STUDENT', 'PENDING_INSTRUCTOR'] } }
      : { status: { in: ['PENDING_STUDENT', 'PENDING_INSTRUCTOR'] } };

    const requests = await prisma.rescheduleRequest.findMany({
      where,
      include: {
        flight: {
          select: {
            id: true,
            scheduledStart: true,
            student: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    console.log(`Found ${requests.length} pending reschedule request(s):`);
    requests.forEach((req, i) => {
      console.log(`  ${i + 1}. Flight: ${req.flightId} (${req.flight.student.email}), Status: ${req.status}, Created: ${req.createdAt}`);
    });

    if (requests.length === 0) {
      console.log('No pending reschedule requests to delete.');
      return;
    }

    const result = await prisma.rescheduleRequest.deleteMany({
      where,
    });

    console.log(`\n✅ Deleted ${result.count} pending reschedule request(s).`);
    console.log('💡 You can now test the reschedule flow again!');
  } catch (error) {
    console.error('Error clearing pending reschedules:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

const flightId = process.argv[2];
clearPendingReschedules(flightId)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });


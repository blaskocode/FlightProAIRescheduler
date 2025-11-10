import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Reset demo flights to CONFIRMED status so they can be used for reschedule demo
 */
async function resetDemoFlights() {
  console.log('🔄 Resetting Demo Flights...\n');

  try {
    // Find all demo flights
    const flights = await prisma.flight.findMany({
      where: {
        student: {
          email: { in: ['demo.student@flightpro.com', 'demo.ir.student@flightpro.com'] }
        },
        scheduledStart: { gte: new Date() }
      },
      include: {
        student: { select: { email: true } }
      }
    });

    console.log(`Found ${flights.length} demo flights to reset\n`);

    for (const flight of flights) {
      // Reset to CONFIRMED status
      await prisma.flight.update({
        where: { id: flight.id },
        data: { status: 'CONFIRMED' }
      });

      console.log(`✅ Reset flight ${flight.id.substring(0, 8)}... (${flight.student.email}) to CONFIRMED`);
    }

    console.log('\n✅ All demo flights reset to CONFIRMED status');
    console.log('💡 Weather alerts still exist, but flights are now reschedulable\n');

  } catch (error: any) {
    console.error('❌ Error resetting flights:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetDemoFlights();


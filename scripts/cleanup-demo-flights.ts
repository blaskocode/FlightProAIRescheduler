import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDemoFlights() {
  console.log('🧹 Cleaning up demo flights...\n');

  try {
    // Find demo accounts
    const demoStudent = await prisma.student.findUnique({
      where: { email: 'demo.student@flightpro.com' },
    });

    const demoIRStudent = await prisma.student.findUnique({
      where: { email: 'demo.ir.student@flightpro.com' },
    });

    const demoInstructor = await prisma.instructor.findUnique({
      where: { email: 'demo.instructor@flightpro.com' },
    });

    if (!demoStudent || !demoIRStudent || !demoInstructor) {
      console.error('❌ Demo accounts not found!');
      console.log('Demo Student:', !!demoStudent);
      console.log('Demo IR Student:', !!demoIRStudent);
      console.log('Demo Instructor:', !!demoInstructor);
      return;
    }

    console.log('✅ Found all demo accounts');
    console.log(`   Demo Student: ${demoStudent.id}`);
    console.log(`   Demo IR Student: ${demoIRStudent.id}`);
    console.log(`   Demo Instructor: ${demoInstructor.id}\n`);

    // Find all flights for demo students
    const allDemoStudentFlights = await prisma.flight.findMany({
      where: {
        OR: [
          { studentId: demoStudent.id },
          { studentId: demoIRStudent.id },
        ],
      },
      include: {
        instructor: {
          select: {
            email: true,
          },
        },
        student: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        scheduledStart: 'asc',
      },
    });

    console.log(`📊 Found ${allDemoStudentFlights.length} total flights for demo students\n`);

    // Categorize flights
    const flightsWithDemoInstructor: typeof allDemoStudentFlights = [];
    const flightsWithOtherInstructor: typeof allDemoStudentFlights = [];
    const flightsWithNoInstructor: typeof allDemoStudentFlights = [];

    allDemoStudentFlights.forEach(flight => {
      if (!flight.instructorId) {
        flightsWithNoInstructor.push(flight);
      } else if (flight.instructorId === demoInstructor.id) {
        flightsWithDemoInstructor.push(flight);
      } else {
        flightsWithOtherInstructor.push(flight);
      }
    });

    console.log('📋 Breakdown:');
    console.log(`   ✅ With Demo Instructor: ${flightsWithDemoInstructor.length}`);
    console.log(`   ⚠️  With other instructor: ${flightsWithOtherInstructor.length}`);
    console.log(`   ⚠️  With no instructor: ${flightsWithNoInstructor.length}\n`);

    // Update flights with other instructors to Demo Instructor
    if (flightsWithOtherInstructor.length > 0) {
      console.log(`🔄 Updating ${flightsWithOtherInstructor.length} flights to Demo Instructor...`);
      for (const flight of flightsWithOtherInstructor) {
        await prisma.flight.update({
          where: { id: flight.id },
          data: { instructorId: demoInstructor.id },
        });
        console.log(`   ✅ ${flight.lessonTitle || 'Flight'} (${new Date(flight.scheduledStart).toLocaleString()}) - ${flight.student.email}`);
        console.log(`      Changed from: ${flight.instructor?.email || 'Unknown'}`);
      }
      console.log('');
    }

    // Update flights with no instructor to Demo Instructor
    if (flightsWithNoInstructor.length > 0) {
      console.log(`🔄 Assigning ${flightsWithNoInstructor.length} flights without instructor to Demo Instructor...`);
      for (const flight of flightsWithNoInstructor) {
        await prisma.flight.update({
          where: { id: flight.id },
          data: { instructorId: demoInstructor.id },
        });
        console.log(`   ✅ ${flight.lessonTitle || 'Flight'} (${new Date(flight.scheduledStart).toLocaleString()}) - ${flight.student.email}`);
      }
      console.log('');
    }

    // Final count
    const finalFlights = await prisma.flight.count({
      where: {
        OR: [
          { studentId: demoStudent.id },
          { studentId: demoIRStudent.id },
        ],
        instructorId: demoInstructor.id,
      },
    });

    console.log('🎉 Cleanup complete!');
    console.log(`   Total demo student flights: ${allDemoStudentFlights.length}`);
    console.log(`   All now assigned to Demo Instructor: ${finalFlights}`);
    console.log(`   Updated/Assigned: ${flightsWithOtherInstructor.length + flightsWithNoInstructor.length}`);

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDemoFlights();


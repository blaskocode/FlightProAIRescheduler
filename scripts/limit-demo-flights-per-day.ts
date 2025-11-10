import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function limitFlightsPerDay() {
  console.log('📅 Checking flights per day for demo students...\n');

  try {
    // Find demo accounts
    const demoStudent = await prisma.student.findUnique({
      where: { email: 'demo.student@flightpro.com' },
    });

    const demoIRStudent = await prisma.student.findUnique({
      where: { email: 'demo.ir.student@flightpro.com' },
    });

    if (!demoStudent || !demoIRStudent) {
      console.error('❌ Demo accounts not found!');
      return;
    }

    console.log('✅ Found demo accounts\n');

    // Process each student
    for (const student of [demoStudent, demoIRStudent]) {
      console.log(`\n📊 Analyzing flights for ${student.email}:`);
      
      // Get all flights for this student
      const flights = await prisma.flight.findMany({
        where: {
          studentId: student.id,
          // Only future flights
          scheduledStart: {
            gte: new Date(),
          },
        },
        orderBy: {
          scheduledStart: 'asc',
        },
        include: {
          instructor: {
            select: {
              email: true,
            },
          },
        },
      });

      if (flights.length === 0) {
        console.log('   No upcoming flights');
        continue;
      }

      // Group flights by day
      const flightsByDay = new Map<string, typeof flights>();
      
      flights.forEach(flight => {
        const date = new Date(flight.scheduledStart);
        const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (!flightsByDay.has(dayKey)) {
          flightsByDay.set(dayKey, []);
        }
        flightsByDay.get(dayKey)!.push(flight);
      });

      console.log(`   Total upcoming flights: ${flights.length}`);
      console.log(`   Spread across ${flightsByDay.size} day(s)\n`);

      // Check each day
      for (const [dayKey, dayFlights] of flightsByDay.entries()) {
        const date = new Date(dayKey);
        const dateStr = date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          year: 'numeric' 
        });
        
        console.log(`   📅 ${dateStr}: ${dayFlights.length} flight(s)`);
        
        if (dayFlights.length <= 2) {
          // OK - 2 or fewer flights
          dayFlights.forEach(flight => {
            console.log(`      ✅ ${new Date(flight.scheduledStart).toLocaleTimeString()} - ${flight.lessonTitle || 'Flight'}`);
          });
        } else {
          // Too many flights - need to remove extras
          console.log(`      ⚠️  TOO MANY! (${dayFlights.length} flights, limit is 2)`);
          
          // Keep first 2, delete the rest
          const toKeep = dayFlights.slice(0, 2);
          const toDelete = dayFlights.slice(2);
          
          console.log(`      Keeping first 2:`);
          toKeep.forEach(flight => {
            console.log(`         ✅ ${new Date(flight.scheduledStart).toLocaleTimeString()} - ${flight.lessonTitle || 'Flight'}`);
          });
          
          console.log(`      Deleting ${toDelete.length} extra flight(s):`);
          for (const flight of toDelete) {
            console.log(`         🗑️  ${new Date(flight.scheduledStart).toLocaleTimeString()} - ${flight.lessonTitle || 'Flight'} (ID: ${flight.id})`);
            
            // Delete associated reschedule requests first
            const deletedRequests = await prisma.rescheduleRequest.deleteMany({
              where: { flightId: flight.id },
            });
            if (deletedRequests.count > 0) {
              console.log(`            Deleted ${deletedRequests.count} reschedule request(s)`);
            }
            
            // Delete associated weather checks
            const deletedWeatherChecks = await prisma.weatherCheck.deleteMany({
              where: { flightId: flight.id },
            });
            if (deletedWeatherChecks.count > 0) {
              console.log(`            Deleted ${deletedWeatherChecks.count} weather check(s)`);
            }
            
            // Delete the flight
            await prisma.flight.delete({
              where: { id: flight.id },
            });
            console.log(`            ✅ Flight deleted`);
          }
        }
        console.log('');
      }
    }

    // Final summary
    console.log('\n📊 Final Summary:');
    
    for (const student of [demoStudent, demoIRStudent]) {
      const finalFlights = await prisma.flight.findMany({
        where: {
          studentId: student.id,
          scheduledStart: {
            gte: new Date(),
          },
        },
        orderBy: {
          scheduledStart: 'asc',
        },
      });

      // Group by day
      const flightsByDay = new Map<string, typeof finalFlights>();
      finalFlights.forEach(flight => {
        const dayKey = new Date(flight.scheduledStart).toISOString().split('T')[0];
        if (!flightsByDay.has(dayKey)) {
          flightsByDay.set(dayKey, []);
        }
        flightsByDay.get(dayKey)!.push(flight);
      });

      const maxFlightsPerDay = Math.max(0, ...Array.from(flightsByDay.values()).map(f => f.length));

      console.log(`\n${student.email}:`);
      console.log(`   Total upcoming flights: ${finalFlights.length}`);
      console.log(`   Max flights per day: ${maxFlightsPerDay}`);
      console.log(`   Status: ${maxFlightsPerDay <= 2 ? '✅ COMPLIANT' : '❌ EXCEEDS LIMIT'}`);
    }

    console.log('\n🎉 Cleanup complete!');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

limitFlightsPerDay();


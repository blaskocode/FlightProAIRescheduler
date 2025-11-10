import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupWeatherOverrides() {
  console.log('🧹 Cleaning up inappropriate weather overrides...\n');

  try {
    const now = new Date();
    const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Find all flights with weather overrides
    const overriddenFlights = await prisma.flight.findMany({
      where: {
        weatherOverride: true,
      },
      orderBy: {
        scheduledStart: 'asc',
      },
    });

    console.log(`📊 Found ${overriddenFlights.length} flights with weather overrides`);

    // Categorize flights
    const pastFlights: typeof overriddenFlights = [];
    const distantFutureFlights: typeof overriddenFlights = [];
    const validOverrides: typeof overriddenFlights = [];

    overriddenFlights.forEach(flight => {
      const flightTime = new Date(flight.scheduledStart);
      
      if (flightTime < now) {
        pastFlights.push(flight);
      } else if (flightTime > fortyEightHoursFromNow) {
        distantFutureFlights.push(flight);
      } else {
        validOverrides.push(flight);
      }
    });

    console.log(`\n📅 Breakdown:`);
    console.log(`   - Past flights (invalid): ${pastFlights.length}`);
    console.log(`   - Flights >48 hours away (invalid): ${distantFutureFlights.length}`);
    console.log(`   - Valid overrides (within 48 hours): ${validOverrides.length}`);

    // Remove overrides from past flights
    if (pastFlights.length > 0) {
      console.log(`\n🗑️  Removing overrides from ${pastFlights.length} past flights...`);
      for (const flight of pastFlights) {
        await prisma.flight.update({
          where: { id: flight.id },
          data: {
            weatherOverride: false,
            overrideReason: null,
            overrideBy: null,
          },
        });
        console.log(`   ✅ Cleared: ${flight.lessonTitle} (${new Date(flight.scheduledStart).toLocaleString()})`);
      }
    }

    // Remove overrides from distant future flights
    if (distantFutureFlights.length > 0) {
      console.log(`\n🗑️  Removing overrides from ${distantFutureFlights.length} flights >48 hours away...`);
      for (const flight of distantFutureFlights) {
        await prisma.flight.update({
          where: { id: flight.id },
          data: {
            weatherOverride: false,
            overrideReason: null,
            overrideBy: null,
          },
        });
        console.log(`   ✅ Cleared: ${flight.lessonTitle} (${new Date(flight.scheduledStart).toLocaleString()})`);
      }
    }

    // Report valid overrides
    if (validOverrides.length > 0) {
      console.log(`\n✅ Valid overrides (kept):`);
      validOverrides.forEach(flight => {
        console.log(`   - ${flight.lessonTitle} (${new Date(flight.scheduledStart).toLocaleString()})`);
      });
    }

    const totalCleaned = pastFlights.length + distantFutureFlights.length;
    console.log(`\n🎉 Cleanup complete!`);
    console.log(`   - Removed: ${totalCleaned} invalid overrides`);
    console.log(`   - Kept: ${validOverrides.length} valid overrides`);

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupWeatherOverrides();


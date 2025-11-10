import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDemo() {
  console.log('🔄 Resetting demo walkthrough...\n');

  try {
    // 1. Find demo accounts
    console.log('📋 Step 1: Verifying demo accounts...');
    const demoStudent = await prisma.student.findUnique({
      where: { email: 'demo.student@flightpro.com' },
      include: { school: true },
    });

    const demoInstructor = await prisma.instructor.findUnique({
      where: { email: 'demo.instructor@flightpro.com' },
      include: { school: true },
    });

    const demoIRStudent = await prisma.student.findUnique({
      where: { email: 'demo.ir.student@flightpro.com' },
      include: { school: true },
    });

    if (!demoStudent || !demoInstructor || !demoIRStudent) {
      console.error('❌ Missing demo accounts!');
      console.log('Demo Student:', !!demoStudent);
      console.log('Demo Instructor:', !!demoInstructor);
      console.log('Demo IR Student:', !!demoIRStudent);
      return;
    }

    console.log('✅ All demo accounts found');
    console.log(`   School: ${demoStudent.school.name}`);

    // 2. Delete ALL reschedule requests for demo accounts
    console.log('\n🗑️  Step 2: Deleting all reschedule requests...');
    const deletedRequests = await prisma.rescheduleRequest.deleteMany({
      where: {
        OR: [
          { studentId: demoStudent.id },
          { studentId: demoIRStudent.id },
        ],
      },
    });
    console.log(`✅ Deleted ${deletedRequests.count} reschedule request(s)`);

    // 3. Delete ALL notifications for demo accounts
    console.log('\n🗑️  Step 3: Deleting all notifications...');
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        OR: [
          { recipientId: demoStudent.id },
          { recipientId: demoIRStudent.id },
        ],
      },
    });
    console.log(`✅ Deleted ${deletedNotifications.count} notification(s)`);

    // 4. Find all flights for demo students
    console.log('\n✈️  Step 4: Finding demo flights...');
    const allFlights = await prisma.flight.findMany({
      where: {
        OR: [
          { studentId: demoStudent.id },
          { studentId: demoIRStudent.id },
        ],
      },
      include: {
        student: { select: { email: true } },
        instructor: { select: { email: true } },
      },
      orderBy: { scheduledStart: 'asc' },
    });

    console.log(`✅ Found ${allFlights.length} total flights`);

    // 5. Reset ALL flights to CONFIRMED status
    console.log('\n🔄 Step 5: Resetting all flights to CONFIRMED...');
    for (const flight of allFlights) {
      await prisma.flight.update({
        where: { id: flight.id },
        data: { status: 'CONFIRMED' },
      });
    }
    console.log(`✅ Reset ${allFlights.length} flight(s) to CONFIRMED`);

    // 6. Delete ALL old weather checks for demo flights
    console.log('\n🗑️  Step 6: Deleting old weather checks...');
    const deletedWeatherChecks = await prisma.weatherCheck.deleteMany({
      where: {
        flightId: {
          in: allFlights.map(f => f.id),
        },
      },
    });
    console.log(`✅ Deleted ${deletedWeatherChecks.count} weather check(s)`);

    // 7. Get upcoming flights (within next 48 hours) for weather alerts
    console.log('\n🌩️  Step 7: Creating fresh weather alerts for upcoming flights...');
    const now = new Date();
    const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    
    const upcomingFlights = allFlights.filter(f => {
      const flightTime = new Date(f.scheduledStart);
      return flightTime > now && flightTime <= fortyEightHoursFromNow;
    });

    console.log(`   Found ${upcomingFlights.length} upcoming flight(s) to create alerts for`);

    for (const flight of upcomingFlights) {
      const student = await prisma.student.findUnique({
        where: { id: flight.studentId },
      });

      if (!student) continue;

      // Determine minimums based on training level
      const requiredVisibility = student.trainingLevel === 'EARLY_STUDENT' ? 5.0 : 3.0;
      const requiredCeiling = student.trainingLevel === 'EARLY_STUDENT' ? 3000 : 1500;
      const maxWindSpeed = student.trainingLevel === 'EARLY_STUDENT' ? 15 : 20;

      // Create UNSAFE weather check
      await prisma.weatherCheck.create({
        data: {
          flightId: flight.id,
          checkType: 'PRE_FLIGHT_BRIEFING',
          checkTime: flight.scheduledStart,
          location: flight.departureAirport,
          latitude: 30.1945, // KAUS coordinates
          longitude: -97.6699,
          rawMetar: 'KAUS 102053Z 35015G25KT 1SM -RA BR BKN008 OVC015 12/11 A2990 RMK AO2',
          visibility: 1.0, // Below minimums
          ceiling: 800, // Below minimums
          windSpeed: 15,
          windGust: 25,
          windDirection: 350,
          temperature: 12,
          conditions: 'Rain, Mist, Broken clouds at 800ft, Overcast at 1500ft',
          result: 'UNSAFE',
          confidence: 0.95,
          reasons: [
            `Visibility below minimum (1.0 SM < ${requiredVisibility} SM required)`,
            `Ceiling below minimum (800 ft < ${requiredCeiling} ft required)`,
            `Gusty winds (25 kt gusts)`,
          ],
          studentTrainingLevel: student.trainingLevel,
          requiredVisibility,
          requiredCeiling,
          maxWindSpeed,
        },
      });

      console.log(`   ✅ Created UNSAFE weather alert for: ${flight.lessonTitle} (${student.email})`);
      console.log(`      Scheduled: ${new Date(flight.scheduledStart).toLocaleString()}`);
      console.log(`      Instructor: ${flight.instructor?.email || 'None'}`);
    }

    // 8. Verify final state
    console.log('\n📊 Step 8: Verifying final state...');
    
    const confirmedFlights = await prisma.flight.count({
      where: {
        OR: [
          { studentId: demoStudent.id },
          { studentId: demoIRStudent.id },
        ],
        status: 'CONFIRMED',
      },
    });

    const weatherAlerts = await prisma.weatherCheck.count({
      where: {
        flightId: {
          in: allFlights.map(f => f.id),
        },
        result: 'UNSAFE',
      },
    });

    const pendingRequests = await prisma.rescheduleRequest.count({
      where: {
        OR: [
          { studentId: demoStudent.id },
          { studentId: demoIRStudent.id },
        ],
      },
    });

    console.log('\n✅ Final state:');
    console.log(`   - Total flights: ${allFlights.length}`);
    console.log(`   - Confirmed flights: ${confirmedFlights}`);
    console.log(`   - Weather alerts: ${weatherAlerts}`);
    console.log(`   - Pending reschedule requests: ${pendingRequests}`);

    if (pendingRequests > 0) {
      console.warn('\n⚠️  WARNING: Still have pending reschedule requests!');
    }

    console.log('\n🎉 Demo walkthrough reset complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Refresh your browser');
    console.log('   2. Log in as demo.student@flightpro.com');
    console.log('   3. You should see flights with weather alerts');
    console.log('   4. Click "Request Reschedule" to start the workflow');

  } catch (error) {
    console.error('\n❌ Error resetting demo:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetDemo();


import { PrismaClient } from '@prisma/client';
import { getAirportCoordinates } from '../src/lib/utils/airport-coordinates';
import { getWeatherMinimums } from '../src/lib/services/weather-service';

const prisma = new PrismaClient();

/**
 * Set up a demo flight for the instructor with weather alert and pending reschedule
 */
async function setupInstructorDemoFlight() {
  console.log('🎬 Setting up Instructor Demo Flight...\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Get Demo Instructor
    console.log('\n1️⃣ Getting Demo Instructor...');
    const instructor = await prisma.instructor.findUnique({
      where: { email: 'demo.instructor@flightpro.com' },
    });

    if (!instructor) {
      throw new Error('Demo instructor not found. Please create demo.instructor@flightpro.com first.');
    }
    console.log(`   ✅ Instructor: ${instructor.firstName} ${instructor.lastName}`);

    // Step 2: Get a student for the flight
    console.log('\n2️⃣ Getting Student...');
    const student = await prisma.student.findFirst({
      where: { 
        schoolId: instructor.schoolId,
        email: { in: ['demo.student@flightpro.com', 'demo.ir.student@flightpro.com'] }
      },
    });

    if (!student) {
      throw new Error('No demo student found for this school.');
    }
    console.log(`   ✅ Student: ${student.firstName} ${student.lastName} (${student.trainingLevel})`);

    // Step 3: Get Aircraft
    console.log('\n3️⃣ Getting Aircraft...');
    const aircraft = await prisma.aircraft.findFirst({
      where: { 
        schoolId: instructor.schoolId, 
        status: 'AVAILABLE' 
      },
      include: { aircraftType: true },
    });

    if (!aircraft) {
      throw new Error('No available aircraft found.');
    }
    console.log(`   ✅ Aircraft: ${aircraft.tailNumber}`);

    // Step 4: Create Flight for Tomorrow
    console.log('\n4️⃣ Creating Flight...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0); // 2:00 PM - different time from student flights

    // Check if flight already exists
    const existingFlight = await prisma.flight.findFirst({
      where: {
        instructorId: instructor.id,
        studentId: student.id,
        scheduledStart: {
          gte: new Date(tomorrow.getTime() - 60 * 60 * 1000),
          lte: new Date(tomorrow.getTime() + 60 * 60 * 1000),
        },
      },
    });

    let flight;
    if (existingFlight) {
      flight = existingFlight;
      console.log(`   ✅ Using existing flight: ${flight.scheduledStart.toLocaleString()}`);
    } else {
      const flightEnd = new Date(tomorrow);
      flightEnd.setHours(flightEnd.getHours() + 2);

      flight = await prisma.flight.create({
        data: {
          schoolId: instructor.schoolId!,
          studentId: student.id,
          instructorId: instructor.id,
          aircraftId: aircraft.id,
          scheduledStart: tomorrow,
          scheduledEnd: flightEnd,
          briefingStart: new Date(tomorrow.getTime() - 30 * 60 * 1000),
          debriefEnd: new Date(flightEnd.getTime() + 20 * 60 * 1000),
          flightType: 'DUAL_INSTRUCTION',
          lessonTitle: 'Cross-Country Navigation',
          lessonNumber: 8,
          departureAirport: 'KAUS',
          destinationAirport: 'KHYI',
          route: 'KAUS-KHYI-KAUS',
          status: 'CONFIRMED',
        },
      });
      console.log(`   ✅ Created flight: ${flight.scheduledStart.toLocaleString()}`);
    }

    // Step 5: Create Weather Alert
    console.log('\n5️⃣ Creating Weather Alert...');
    
    // Check if weather alert already exists
    const existingAlert = await prisma.weatherCheck.findFirst({
      where: {
        flightId: flight.id,
        result: { in: ['UNSAFE', 'MARGINAL'] },
      },
    });

    if (existingAlert) {
      console.log(`   ✅ Weather alert already exists (${existingAlert.result})`);
    } else {
      // Get full flight data
      const fullFlight = await prisma.flight.findUnique({
        where: { id: flight.id },
        include: {
          student: true,
          aircraft: { include: { aircraftType: true } },
        },
      });

      if (!fullFlight) {
        throw new Error('Flight not found');
      }

      // Get airport coordinates
      const coordinates = await getAirportCoordinates(fullFlight.departureAirport);

      // Get minimums
      const minimums = getWeatherMinimums(
        fullFlight.student.trainingLevel,
        fullFlight.aircraft.aircraftType,
        fullFlight.flightType
      );

      // Create UNSAFE weather alert
      const weatherCheck = await prisma.weatherCheck.create({
        data: {
          flightId: fullFlight.id,
          checkType: 'MANUAL_REFRESH',
          location: fullFlight.departureAirport,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          rawMetar: JSON.stringify({
            visibility: { value: 0.5, unit: 'SM' },
            clouds: [{ altitude: 200, type: 'BKN' }],
            wind: { speed: 20, gust: 28, direction: 270 },
            temperature: 15,
            conditions: ['Rain', 'Thunderstorm'],
          }),
          visibility: 0.5,
          ceiling: 200,
          windSpeed: 20,
          windGust: 28,
          windDirection: 270,
          temperature: 15,
          conditions: 'Rain, Thunderstorm',
          result: 'UNSAFE',
          confidence: 95,
          reasons: [
            `Visibility ${0.5} SM below minimum of ${minimums.visibility} SM`,
            `Ceiling ${200} ft below minimum of ${minimums.ceiling} ft`,
            `Wind gusts ${28} kt exceed maximum of ${minimums.maxWind} kt`,
          ],
          studentTrainingLevel: fullFlight.student.trainingLevel,
          requiredVisibility: minimums.visibility,
          requiredCeiling: minimums.ceiling,
          maxWindSpeed: minimums.maxWind,
          checkTime: new Date(),
        },
      });

      console.log(`   ✅ Created UNSAFE weather alert`);
      console.log(`      Reason: ${weatherCheck.reasons[0]}`);
    }

    // Step 6: Create Pending Reschedule Request (Optional - for instructor to confirm)
    console.log('\n6️⃣ Checking for Pending Reschedule...');
    
    const existingReschedule = await prisma.rescheduleRequest.findFirst({
      where: {
        flightId: flight.id,
        status: { in: ['PENDING_INSTRUCTOR', 'PENDING_STUDENT'] },
      },
    });

    if (existingReschedule) {
      console.log(`   ✅ Pending reschedule already exists (${existingReschedule.status})`);
    } else {
      // Create a reschedule request that's pending instructor approval
      // This simulates a student requesting a reschedule
      const suggestedTime = new Date(tomorrow);
      suggestedTime.setDate(suggestedTime.getDate() + 1); // Next day
      suggestedTime.setHours(14, 0, 0, 0); // Same time next day

      // Set expiration to 48 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      const rescheduleRequest = await prisma.rescheduleRequest.create({
        data: {
          flightId: flight.id,
          studentId: student.id,
          status: 'PENDING_INSTRUCTOR',
          suggestions: [
            {
              time: suggestedTime.toISOString(),
              reason: 'Weather forecast shows clear skies tomorrow afternoon',
              instructorAvailable: true,
              aircraftAvailable: true,
            },
            {
              time: new Date(suggestedTime.getTime() + 24 * 60 * 60 * 1000).toISOString(),
              reason: 'Alternative time slot with good weather conditions',
              instructorAvailable: true,
              aircraftAvailable: true,
            },
            {
              time: new Date(suggestedTime.getTime() + 48 * 60 * 60 * 1000).toISOString(),
              reason: 'Latest available slot with favorable weather',
              instructorAvailable: true,
              aircraftAvailable: true,
            },
          ],
          aiReasoning: {
            summary: 'Student requested reschedule due to unsafe weather conditions',
            factors: [
              'Current weather shows visibility below minimums',
              'Forecast indicates improving conditions tomorrow',
              'Instructor and aircraft available for suggested time',
            ],
          },
          expiresAt,
        },
      });

      console.log(`   ✅ Created pending reschedule request`);
      console.log(`      Suggested time: ${suggestedTime.toLocaleString()}`);
      console.log(`      Status: PENDING_INSTRUCTOR`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ INSTRUCTOR DEMO FLIGHT SETUP COMPLETE!\n');
    console.log('📋 Summary:');
    console.log(`   - Instructor: ${instructor.firstName} ${instructor.lastName}`);
    console.log(`   - Student: ${student.firstName} ${student.lastName}`);
    console.log(`   - Flight: ${flight.scheduledStart.toLocaleString()}`);
    console.log(`   - Status: ${flight.status}`);
    console.log(`   - Weather Alert: UNSAFE`);
    console.log(`   - Reschedule: PENDING_INSTRUCTOR\n`);
    
    console.log('🎬 Ready for Instructor Demo!\n');
    console.log('Next Steps:');
    console.log('1. Login as demo.instructor@flightpro.com');
    console.log('2. View flights - should see weather alert');
    console.log('3. View pending reschedule request');
    console.log('4. Confirm or reject the reschedule\n');

  } catch (error: any) {
    console.error('\n❌ Error setting up instructor demo flight:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupInstructorDemoFlight();


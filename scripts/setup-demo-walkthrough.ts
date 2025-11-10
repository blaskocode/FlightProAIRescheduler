import { PrismaClient } from '@prisma/client';
import { getAirportCoordinates } from '../src/lib/utils/airport-coordinates';
import { getWeatherMinimums } from '../src/lib/services/weather-service';

const prisma = new PrismaClient();

/**
 * Complete Demo Walkthrough Setup Script
 * 
 * This script sets up all conditions needed for the demo:
 * 1. Ensures demo accounts exist
 * 2. Creates flights for tomorrow
 * 3. Creates weather alerts
 * 4. Sets up reschedule requests (optional)
 */
async function setupDemoWalkthrough() {
  console.log('🎬 Setting up Demo Walkthrough...\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Verify/Create Demo Accounts
    console.log('\n1️⃣ Verifying Demo Accounts...');
    
    const demoAccounts = [
      { email: 'demo.admin@flightpro.com', role: 'admin' },
      { email: 'demo.instructor@flightpro.com', role: 'instructor' },
      { email: 'demo.student@flightpro.com', role: 'student', trainingLevel: 'EARLY_STUDENT' },
      { email: 'demo.ir.student@flightpro.com', role: 'student', trainingLevel: 'INSTRUMENT_RATED' },
    ];

    const accounts = [];
    for (const account of demoAccounts) {
      if (account.role === 'admin') {
        let admin = await prisma.admin.findUnique({ where: { email: account.email } });
        if (!admin) {
          console.log(`   ⚠️  Admin account ${account.email} not found in database`);
          console.log(`   💡 Create this account in Firebase Console first, then run sync`);
        } else {
          console.log(`   ✅ Admin: ${account.email}`);
          accounts.push({ type: 'admin', record: admin });
        }
      } else if (account.role === 'instructor') {
        let instructor = await prisma.instructor.findUnique({ where: { email: account.email } });
        if (!instructor) {
          console.log(`   ⚠️  Instructor account ${account.email} not found in database`);
          console.log(`   💡 Create this account in Firebase Console first, then run sync`);
        } else {
          console.log(`   ✅ Instructor: ${account.email}`);
          accounts.push({ type: 'instructor', record: instructor });
        }
      } else if (account.role === 'student') {
        let student = await prisma.student.findUnique({ where: { email: account.email } });
        if (!student) {
          console.log(`   ⚠️  Student account ${account.email} not found in database`);
          console.log(`   💡 Create this account in Firebase Console first, then run sync`);
        } else {
          console.log(`   ✅ Student: ${account.email} (${student.trainingLevel})`);
          accounts.push({ type: 'student', record: student });
        }
      }
    }

    // Step 2: Get or Create School
    console.log('\n2️⃣ Setting up School...');
    let school = await prisma.school.findFirst();
    if (!school) {
      school = await prisma.school.create({
        data: {
          name: 'Demo Flight Academy',
          airportCode: 'KAUS',
          latitude: 30.1945,
          longitude: -97.6699,
        },
      });
      console.log(`   ✅ Created school: ${school.name}`);
    } else {
      console.log(`   ✅ Using existing school: ${school.name}`);
    }

    // Step 3: Get Aircraft
    console.log('\n3️⃣ Getting Available Aircraft...');
    let aircraft = await prisma.aircraft.findFirst({
      where: { schoolId: school.id, status: 'AVAILABLE' },
      include: { aircraftType: true },
    });

    if (!aircraft) {
      // Create a default aircraft if none exists
      const aircraftType = await prisma.aircraftType.findFirst() || await prisma.aircraftType.create({
        data: {
          make: 'Cessna',
          model: '172',
          category: 'SINGLE_ENGINE',
          isComplex: false,
          isHighPerformance: false,
        },
      });

      aircraft = await prisma.aircraft.create({
        data: {
          schoolId: school.id,
          tailNumber: 'N12345',
          aircraftTypeId: aircraftType.id,
          status: 'AVAILABLE',
        },
        include: { aircraftType: true },
      });
      console.log(`   ✅ Created aircraft: ${aircraft.tailNumber}`);
    } else {
      console.log(`   ✅ Using aircraft: ${aircraft.tailNumber}`);
    }

    // Step 4: Get Instructor
    console.log('\n4️⃣ Getting Instructor...');
    const instructorRecord = accounts.find(a => a.type === 'instructor')?.record;
    if (!instructorRecord) {
      console.log('   ⚠️  No instructor found - creating placeholder');
      const instructor = await prisma.instructor.findFirst({ where: { schoolId: school.id } });
      if (!instructor) {
        throw new Error('No instructor available. Please create demo.instructor@flightpro.com first.');
      }
      console.log(`   ✅ Using instructor: ${instructor.email}`);
    } else {
      console.log(`   ✅ Using instructor: ${instructorRecord.email}`);
    }

    // Step 5: Create Flights for Tomorrow
    console.log('\n5️⃣ Creating Demo Flights...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0); // 10:00 AM

    const studentRecord = accounts.find(a => a.type === 'student' && a.record.email === 'demo.student@flightpro.com')?.record;
    const irStudentRecord = accounts.find(a => a.type === 'student' && a.record.email === 'demo.ir.student@flightpro.com')?.record;

    const flights = [];

    // Flight 1: Student Pilot (will get weather alert)
    if (studentRecord) {
      const flight1Start = new Date(tomorrow);
      const flight1End = new Date(flight1Start);
      flight1End.setHours(flight1End.getHours() + 2);

      // Check if flight already exists
      const existingFlight1 = await prisma.flight.findFirst({
        where: {
          studentId: studentRecord.id,
          scheduledStart: {
            gte: new Date(tomorrow.getTime() - 60 * 60 * 1000),
            lte: new Date(tomorrow.getTime() + 60 * 60 * 1000),
          },
        },
      });

      if (!existingFlight1) {
        const flight1 = await prisma.flight.create({
          data: {
            schoolId: school.id,
            studentId: studentRecord.id,
            instructorId: instructorRecord?.id || (await prisma.instructor.findFirst({ where: { schoolId: school.id } }))?.id,
            aircraftId: aircraft.id,
            scheduledStart: flight1Start,
            scheduledEnd: flight1End,
            briefingStart: new Date(flight1Start.getTime() - 30 * 60 * 1000),
            debriefEnd: new Date(flight1End.getTime() + 20 * 60 * 1000),
            flightType: 'DUAL_INSTRUCTION',
            lessonTitle: 'Basic Maneuvers',
            lessonNumber: 5,
            departureAirport: 'KAUS',
            destinationAirport: 'KHYI',
            route: 'KAUS-KHYI-KAUS',
            status: 'CONFIRMED',
          },
        });
        flights.push(flight1);
        console.log(`   ✅ Created Flight 1: ${flight1Start.toLocaleString()} - Student Pilot`);
      } else {
        flights.push(existingFlight1);
        console.log(`   ✅ Using existing Flight 1: ${existingFlight1.scheduledStart.toLocaleString()}`);
      }
    }

    // Flight 2: Instrument Student (same time, different minimums)
    if (irStudentRecord) {
      const flight2Start = new Date(tomorrow);
      flight2Start.setHours(10, 30, 0, 0); // 10:30 AM
      const flight2End = new Date(flight2Start);
      flight2End.setHours(flight2End.getHours() + 2);

      const existingFlight2 = await prisma.flight.findFirst({
        where: {
          studentId: irStudentRecord.id,
          scheduledStart: {
            gte: new Date(flight2Start.getTime() - 60 * 60 * 1000),
            lte: new Date(flight2Start.getTime() + 60 * 60 * 1000),
          },
        },
      });

      if (!existingFlight2) {
        const flight2 = await prisma.flight.create({
          data: {
            schoolId: school.id,
            studentId: irStudentRecord.id,
            instructorId: instructorRecord?.id || (await prisma.instructor.findFirst({ where: { schoolId: school.id } }))?.id,
            aircraftId: aircraft.id,
            scheduledStart: flight2Start,
            scheduledEnd: flight2End,
            briefingStart: new Date(flight2Start.getTime() - 30 * 60 * 1000),
            debriefEnd: new Date(flight2End.getTime() + 20 * 60 * 1000),
            flightType: 'DUAL_INSTRUCTION',
            lessonTitle: 'Instrument Approaches',
            lessonNumber: 12,
            departureAirport: 'KAUS',
            destinationAirport: 'KHYI',
            route: 'KAUS-KHYI-KAUS',
            status: 'CONFIRMED',
          },
        });
        flights.push(flight2);
        console.log(`   ✅ Created Flight 2: ${flight2Start.toLocaleString()} - Instrument Student`);
      } else {
        flights.push(existingFlight2);
        console.log(`   ✅ Using existing Flight 2: ${existingFlight2.scheduledStart.toLocaleString()}`);
      }
    }

    // Step 6: Create Weather Alerts
    console.log('\n6️⃣ Creating Weather Alerts...');
    
    for (const flight of flights) {
      // Get full flight data with student
      const fullFlight = await prisma.flight.findUnique({
        where: { id: flight.id },
        include: {
          student: true,
          aircraft: { include: { aircraftType: true } },
        },
      });

      if (!fullFlight) continue;

      // Check if weather alert already exists
      const existingAlert = await prisma.weatherCheck.findFirst({
        where: {
          flightId: flight.id,
          result: { in: ['UNSAFE', 'MARGINAL'] },
        },
      });

      if (existingAlert) {
        console.log(`   ✅ Weather alert already exists for flight ${flight.id.substring(0, 8)}...`);
        continue;
      }

      // Get airport coordinates
      const coordinates = await getAirportCoordinates(fullFlight.departureAirport);

      // Get minimums
      const minimums = getWeatherMinimums(
        fullFlight.student.trainingLevel,
        fullFlight.aircraft.aircraftType,
        fullFlight.flightType
      );

      // Create UNSAFE weather for student pilot, MARGINAL for instrument student
      const isStudentPilot = fullFlight.student.trainingLevel === 'EARLY_STUDENT' || 
                            fullFlight.student.trainingLevel === 'MID_STUDENT' ||
                            fullFlight.student.trainingLevel === 'ADVANCED_STUDENT' ||
                            fullFlight.student.trainingLevel === 'PRIVATE_PILOT';

      const result = isStudentPilot ? 'UNSAFE' : 'MARGINAL';
      const visibility = isStudentPilot ? 0.5 : 1.5; // Below student minimum (3 SM), but OK for instrument (1 SM)
      const ceiling = isStudentPilot ? 200 : 400; // Below student minimum (1500 ft), but OK for instrument (500 ft)
      const reasons = isStudentPilot
        ? ['Visibility 0.5 SM below student pilot minimum of 3 SM', 'Ceiling 200 ft below student pilot minimum of 1500 ft']
        : ['Visibility 1.5 SM - marginal conditions', 'Ceiling 400 ft - marginal conditions'];

      const weatherCheck = await prisma.weatherCheck.create({
        data: {
          flightId: fullFlight.id,
          checkType: 'MANUAL_REFRESH',
          location: fullFlight.departureAirport,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          rawMetar: JSON.stringify({
            visibility: { value: visibility, unit: 'SM' },
            clouds: [{ altitude: ceiling, type: 'BKN' }],
            wind: { speed: 15, gust: 20, direction: 270 },
            temperature: 15,
            conditions: isStudentPilot ? ['Rain', 'Thunderstorm'] : ['Rain'],
          }),
          visibility,
          ceiling,
          windSpeed: 15,
          windGust: 20,
          windDirection: 270,
          temperature: 15,
          conditions: isStudentPilot ? 'Rain, Thunderstorm' : 'Rain',
          result,
          confidence: 95,
          reasons,
          studentTrainingLevel: fullFlight.student.trainingLevel,
          requiredVisibility: minimums.visibility,
          requiredCeiling: minimums.ceiling,
          maxWindSpeed: minimums.maxWind,
          checkTime: new Date(),
        },
      });

      console.log(`   ✅ Created ${result} weather alert for ${fullFlight.student.email}`);
      console.log(`      Flight: ${fullFlight.scheduledStart.toLocaleString()}`);
      console.log(`      Reason: ${reasons[0]}`);
    }

    // Step 7: Set up Instructor Demo Flight (with pending reschedule)
    console.log('\n7️⃣ Setting up Instructor Demo Flight...');
    try {
      // Run the instructor demo flight setup
      const { execSync } = require('child_process');
      execSync('npx tsx scripts/setup-instructor-demo-flight.ts', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('   ✅ Instructor demo flight configured');
    } catch (error) {
      console.log('   ⚠️  Instructor demo flight setup skipped (run manually if needed)');
      console.log('   💡 Run: npx tsx scripts/setup-instructor-demo-flight.ts');
    }

    // Step 8: Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ DEMO SETUP COMPLETE!\n');
    console.log('📋 Setup Summary:');
    console.log(`   - School: ${school.name} (${school.airportCode})`);
    console.log(`   - Aircraft: ${aircraft.tailNumber}`);
    console.log(`   - Student Flights Created: ${flights.length}`);
    console.log(`   - Weather Alerts: Created for all flights`);
    console.log(`   - Instructor Demo Flight: Configured with pending reschedule\n`);
    
    console.log('🎬 Ready for Demo Walkthrough!\n');
    console.log('Next Steps:');
    console.log('1. Login as demo.admin@flightpro.com');
    console.log('2. View dashboard and weather alerts');
    console.log('3. Login as demo.student@flightpro.com');
    console.log('4. Request reschedule for weather-affected flight');
    console.log('5. Login as demo.instructor@flightpro.com');
    console.log('6. View weather alert and pending reschedule request');
    console.log('7. Confirm the reschedule\n');

  } catch (error: any) {
    console.error('\n❌ Error setting up demo:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDemoWalkthrough();


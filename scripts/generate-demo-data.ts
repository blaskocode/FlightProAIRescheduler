import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration - Adjust these numbers for your demo scale
const CONFIG = {
  schools: 10,              // Number of flight schools
  instructorsPerSchool: 30, // Instructors per school
  studentsPerSchool: 150,   // Students per school
  aircraftPerSchool: 8,     // Aircraft per school
  flightsPerSchool: 200,    // Flights per school (past + future)
  weatherChecks: 500,       // Historical weather checks
  rescheduleRequests: 100,  // Reschedule requests to show AI in action
};

// Airport codes for variety
const AIRPORTS = [
  { code: 'KAUS', name: 'Austin-Bergstrom', lat: 30.1945, lng: -97.6699, city: 'Austin', state: 'TX' },
  { code: 'KDAL', name: 'Dallas Love Field', lat: 32.8471, lng: -96.8518, city: 'Dallas', state: 'TX' },
  { code: 'KHOU', name: 'William P. Hobby', lat: 29.6454, lng: -95.2789, city: 'Houston', state: 'TX' },
  { code: 'KDFW', name: 'Dallas/Fort Worth', lat: 32.8998, lng: -97.0403, city: 'Dallas', state: 'TX' },
  { code: 'KIAH', name: 'George Bush Intercontinental', lat: 29.9844, lng: -95.3414, city: 'Houston', state: 'TX' },
  { code: 'KSAT', name: 'San Antonio International', lat: 29.5337, lng: -98.4697, city: 'San Antonio', state: 'TX' },
  { code: 'KELP', name: 'El Paso International', lat: 31.8072, lng: -106.3776, city: 'El Paso', state: 'TX' },
  { code: 'KABQ', name: 'Albuquerque International', lat: 35.0402, lng: -106.6091, city: 'Albuquerque', state: 'NM' },
  { code: 'KPHX', name: 'Phoenix Sky Harbor', lat: 33.4342, lng: -112.0116, city: 'Phoenix', state: 'AZ' },
  { code: 'KLAX', name: 'Los Angeles International', lat: 33.9425, lng: -118.4081, city: 'Los Angeles', state: 'CA' },
  { code: 'KSFO', name: 'San Francisco International', lat: 37.6213, lng: -122.3790, city: 'San Francisco', state: 'CA' },
  { code: 'KSEA', name: 'Seattle-Tacoma International', lat: 47.4502, lng: -122.3088, city: 'Seattle', state: 'WA' },
  { code: 'KORD', name: "O'Hare International", lat: 41.9786, lng: -87.9048, city: 'Chicago', state: 'IL' },
  { code: 'KJFK', name: 'John F. Kennedy International', lat: 40.6413, lng: -73.7781, city: 'New York', state: 'NY' },
  { code: 'KMIA', name: 'Miami International', lat: 25.7959, lng: -80.2870, city: 'Miami', state: 'FL' },
];

const AIRCRAFT_TYPES = [
  { make: 'Cessna', model: '172', variant: 'Skyhawk', category: 'SINGLE_ENGINE_LAND' },
  { make: 'Cessna', model: '152', variant: 'Aerobat', category: 'SINGLE_ENGINE_LAND' },
  { make: 'Piper', model: 'PA-28', variant: 'Cherokee', category: 'SINGLE_ENGINE_LAND' },
  { make: 'Piper', model: 'PA-28', variant: 'Arrow', category: 'SINGLE_ENGINE_LAND' },
  { make: 'Cirrus', model: 'SR20', variant: 'G2', category: 'SINGLE_ENGINE_LAND' },
  { make: 'Cirrus', model: 'SR22', variant: 'G3', category: 'SINGLE_ENGINE_LAND' },
  { make: 'Diamond', model: 'DA40', variant: 'Diamond Star', category: 'SINGLE_ENGINE_LAND' },
  { make: 'Beechcraft', model: 'Bonanza', variant: 'A36', category: 'SINGLE_ENGINE_LAND' },
];

const FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle', 'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa', 'Timothy', 'Deborah'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];
const TRAINING_LEVELS = ['EARLY_STUDENT', 'MID_STUDENT', 'ADVANCED_STUDENT', 'PRIVATE_PILOT', 'INSTRUMENT_RATED', 'COMMERCIAL_PILOT'];
const FLIGHT_STATUSES = ['CONFIRMED', 'PENDING', 'RESCHEDULE_PENDING', 'WEATHER_CANCELLED', 'COMPLETED', 'IN_PROGRESS'];
const FLIGHT_TYPES = ['DUAL_INSTRUCTION', 'SOLO_SUPERVISED', 'SOLO_UNSUPERVISED', 'STAGE_CHECK', 'CHECKRIDE', 'DISCOVERY_FLIGHT', 'GROUND_SCHOOL'];

const randomName = () => FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
const randomLastName = () => LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
const randomDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};
const randomFutureDate = (years: number) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + years);
  return date;
};
const randomRecentDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * days));
  return date;
};

async function main() {
  console.log('🚀 Starting large-scale demo data generation...\n');
  console.log(`Configuration:`);
  console.log(`  - Schools: ${CONFIG.schools}`);
  console.log(`  - Instructors per school: ${CONFIG.instructorsPerSchool} (${CONFIG.schools * CONFIG.instructorsPerSchool} total)`);
  console.log(`  - Students per school: ${CONFIG.studentsPerSchool} (${CONFIG.schools * CONFIG.studentsPerSchool} total)`);
  console.log(`  - Aircraft per school: ${CONFIG.aircraftPerSchool} (${CONFIG.schools * CONFIG.aircraftPerSchool} total)`);
  console.log(`  - Flights per school: ${CONFIG.flightsPerSchool} (${CONFIG.schools * CONFIG.flightsPerSchool} total)`);
  console.log(`\n⏳ This may take several minutes...\n`);

  const startTime = Date.now();

  // Step 0: Check what data already exists and skip if present
  console.log('🔍 Checking existing data...');
  const existingSchools = await prisma.school.count();
  const existingInstructors = await prisma.instructor.count();
  const existingStudents = await prisma.student.count();
  const existingAircraft = await prisma.aircraft.count();
  const existingFlights = await prisma.flight.count();
  const existingRescheduleRequests = await prisma.rescheduleRequest.count();
  
  const skipDataCreation = existingSchools > 0 && existingInstructors > 0 && existingStudents > 0 && existingAircraft > 0 && existingFlights > 0;
  
  if (skipDataCreation) {
    console.log(`📊 Found existing data:`);
    console.log(`   Schools: ${existingSchools}`);
    console.log(`   Instructors: ${existingInstructors}`);
    console.log(`   Students: ${existingStudents}`);
    console.log(`   Aircraft: ${existingAircraft}`);
    console.log(`   Flights: ${existingFlights}`);
    console.log(`   Reschedule Requests: ${existingRescheduleRequests}`);
    console.log(`\n⏭️  Skipping data creation - using existing data\n`);
  } else {
    // Clear existing data only if we're starting fresh
    console.log('🧹 Clearing existing data...');
    await prisma.studentProgress.deleteMany();
    await prisma.lessonSyllabus.deleteMany();
    await prisma.squawk.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.rescheduleRequest.deleteMany();
    await prisma.weatherLog.deleteMany();
    await prisma.weatherCheck.deleteMany();
    await prisma.flight.deleteMany();
    await prisma.aircraft.deleteMany();
    await prisma.instructor.deleteMany();
    await prisma.student.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.school.deleteMany();
    // Note: We keep aircraft types as they're reference data
    console.log('✅ Existing data cleared\n');
  }

  // Step 1: Create Aircraft Types (if they don't exist) - Always run
  console.log('📦 Creating aircraft types...');
  const aircraftTypes = [];
  for (const type of AIRCRAFT_TYPES) {
    const existing = await prisma.aircraftType.findFirst({
      where: { make: type.make, model: type.model, variant: type.variant },
    });
    if (!existing) {
      const created = await prisma.aircraftType.create({
        data: {
          ...type,
          crosswindLimit: 15 + Math.floor(Math.random() * 10),
          maxWindSpeed: 20 + Math.floor(Math.random() * 10),
          hasDeicing: type.variant.includes('SR') || type.variant.includes('Bonanza'),
          isComplex: type.variant.includes('Arrow') || type.variant.includes('Bonanza'),
          isHighPerf: type.variant.includes('SR22') || type.variant.includes('Bonanza'),
          vfrOnly: !type.variant.includes('SR'),
          imcCapable: type.variant.includes('SR') || type.variant.includes('Bonanza'),
          icingApproved: type.variant.includes('SR'),
        },
      });
      aircraftTypes.push(created);
    } else {
      aircraftTypes.push(existing);
    }
  }
  console.log(`✅ Created ${aircraftTypes.length} aircraft types\n`);

  // Step 2: Create Schools (or fetch existing)
  console.log('🏫 Creating schools...');
  let schools = [];
  if (skipDataCreation) {
    schools = await prisma.school.findMany({ take: CONFIG.schools });
    console.log(`✅ Using ${schools.length} existing schools\n`);
  } else {
    for (let i = 0; i < CONFIG.schools; i++) {
      const airport = AIRPORTS[i % AIRPORTS.length];
      // If we have more schools than airports, add a number suffix to make codes unique
      const airportCode = CONFIG.schools > AIRPORTS.length && i >= AIRPORTS.length
        ? `${airport.code}${Math.floor(i / AIRPORTS.length) + 1}`
        : airport.code;
      
      const school = await prisma.school.create({
        data: {
          name: `${airport.city} Flight Academy${i >= AIRPORTS.length ? ` ${Math.floor(i / AIRPORTS.length) + 1}` : ''}`,
          airportCode: airportCode,
          latitude: airport.lat + (Math.random() - 0.5) * 0.1, // Slight variation
          longitude: airport.lng + (Math.random() - 0.5) * 0.1,
          timezone: 'America/Chicago',
          phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
          email: `info@${airportCode.toLowerCase()}flightacademy.com`,
          address: `${Math.floor(Math.random() * 9999) + 1} Aviation Way, ${airport.city}, ${airport.state}`,
          weatherApiEnabled: Math.random() > 0.5,
          weatherCheckFrequency: ['hourly', 'every-30-min', 'every-15-min'][Math.floor(Math.random() * 3)],
        },
      });
      schools.push(school);
      if ((i + 1) % 5 === 0) {
        console.log(`  Created ${i + 1}/${CONFIG.schools} schools...`);
      }
    }
    console.log(`✅ Created ${schools.length} schools\n`);
  }

  // Step 3: Create Instructors (or skip if exists)
  if (skipDataCreation) {
    console.log('👨‍✈️ Skipping instructor creation - using existing data\n');
  } else {
    console.log('👨‍✈️ Creating instructors...');
    let totalInstructors = 0;
    for (const school of schools) {
      const schoolInstructors = [];
      for (let i = 0; i < CONFIG.instructorsPerSchool; i++) {
        const firstName = randomName();
        const lastName = randomLastName();
        // Add number suffix to ensure unique emails (always include index to prevent duplicates)
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${school.airportCode.toLowerCase()}flightacademy.com`;
        
        const instructor = await prisma.instructor.create({
          data: {
            schoolId: school.id,
            email,
            firstName,
            lastName,
            phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            firebaseUid: `instructor_${school.id}_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            certificateNumber: `CFI-${Math.floor(Math.random() * 900000) + 100000}`,
            certificateExpiry: randomFutureDate(2),
            cfiExpiry: randomFutureDate(1),
            cfiiRating: Math.random() > 0.6,
            meiRating: Math.random() > 0.8,
            instrumentCurrent: Math.random() > 0.3,
            totalStudents: Math.floor(Math.random() * 50),
            activeStudents: Math.floor(Math.random() * 20),
            totalInstructionalHours: Math.floor(Math.random() * 5000) + 500,
            smsNotifications: Math.random() > 0.7,
            smsOptIn: Math.random() > 0.8,
            phoneVerified: Math.random() > 0.9,
          },
        });
        schoolInstructors.push(instructor);
      }
      totalInstructors += schoolInstructors.length;
      console.log(`  Created ${schoolInstructors.length} instructors for ${school.name} (${totalInstructors} total)...`);
    }
    console.log(`✅ Created ${totalInstructors} instructors\n`);
  }

  // Step 4: Create Students (or skip if exists)
  if (skipDataCreation) {
    console.log('👨‍🎓 Skipping student creation - using existing data\n');
  } else {
    console.log('👨‍🎓 Creating students...');
    let totalStudents = 0;
    const allStudents = [];
    for (const school of schools) {
      const schoolStudents = [];
      const instructors = await prisma.instructor.findMany({ where: { schoolId: school.id } });
      
      for (let i = 0; i < CONFIG.studentsPerSchool; i++) {
        const firstName = randomName();
        const lastName = randomLastName();
        // Add number suffix to ensure unique emails (always include index to prevent duplicates)
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${school.airportCode.toLowerCase()}flightacademy.com`;
        const trainingLevel = TRAINING_LEVELS[Math.floor(Math.random() * TRAINING_LEVELS.length)];
        
        const student = await prisma.student.create({
          data: {
            schoolId: school.id,
            email,
            firstName,
            lastName,
            phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            firebaseUid: `student_${school.id}_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            trainingLevel: trainingLevel as any,
            currentStage: ['STAGE_1_PRE_SOLO', 'STAGE_2_SOLO_XC', 'STAGE_3_CHECKRIDE_PREP'][Math.floor(Math.random() * 3)] as any,
            currentLesson: Math.floor(Math.random() * 40) + 1,
            totalFlightHours: trainingLevel === 'EARLY_STUDENT' ? Math.random() * 10 : 
                             trainingLevel === 'MID_STUDENT' ? 10 + Math.random() * 20 :
                             trainingLevel === 'ADVANCED_STUDENT' ? 30 + Math.random() * 20 :
                             trainingLevel === 'PRIVATE_PILOT' ? 50 + Math.random() * 50 :
                             trainingLevel === 'INSTRUMENT_RATED' ? 100 + Math.random() * 100 :
                             200 + Math.random() * 200,
            soloHours: trainingLevel !== 'EARLY_STUDENT' ? Math.random() * 20 : 0,
            crossCountryHours: trainingLevel === 'PRIVATE_PILOT' || trainingLevel === 'INSTRUMENT_RATED' || trainingLevel === 'COMMERCIAL_PILOT' ? Math.random() * 50 : 0,
            nightHours: trainingLevel === 'PRIVATE_PILOT' || trainingLevel === 'INSTRUMENT_RATED' || trainingLevel === 'COMMERCIAL_PILOT' ? Math.random() * 10 : 0,
            instrumentHours: trainingLevel === 'INSTRUMENT_RATED' || trainingLevel === 'COMMERCIAL_PILOT' ? Math.random() * 50 : 0,
            lastFlightDate: randomRecentDate(30),
            daysSinceLastFlight: Math.floor(Math.random() * 30),
            preferredInstructorId: instructors.length > 0 ? instructors[Math.floor(Math.random() * instructors.length)].id : undefined,
            emailNotifications: true,
            smsNotifications: Math.random() > 0.7,
            weatherAlerts: true,
            progressUpdates: true,
          },
        });
        schoolStudents.push(student);
        allStudents.push(student);
      }
      totalStudents += schoolStudents.length;
      console.log(`  Created ${schoolStudents.length} students for ${school.name} (${totalStudents} total)...`);
    }
    console.log(`✅ Created ${totalStudents} students\n`);
  }

  // Step 5: Create Aircraft (or skip if exists)
  if (skipDataCreation) {
    console.log('✈️ Skipping aircraft creation - using existing data\n');
  } else {
    console.log('✈️ Creating aircraft...');
    let totalAircraft = 0;
    const allAircraft = [];
    for (const school of schools) {
      const schoolAircraft = [];
      for (let i = 0; i < CONFIG.aircraftPerSchool; i++) {
        const type = aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)];
        const tailNumber = `${school.airportCode.substring(1)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 900) + 100}`;
        
        const aircraft = await prisma.aircraft.create({
          data: {
            schoolId: school.id,
            aircraftTypeId: type.id,
            tailNumber,
            status: ['AVAILABLE', 'MAINTENANCE', 'IN_FLIGHT', 'GROUNDED'][Math.floor(Math.random() * 4)] as any,
            homeBase: school.airportCode, // Required field
            hobbsTime: Math.floor(Math.random() * 10000) + 1000,
            lastInspection: randomRecentDate(90),
            nextInspectionDue: randomFutureDate(0.08), // ~30 days
          },
        });
        schoolAircraft.push(aircraft);
        allAircraft.push(aircraft);
      }
      totalAircraft += schoolAircraft.length;
      console.log(`  Created ${schoolAircraft.length} aircraft for ${school.name} (${totalAircraft} total)...`);
    }
    console.log(`✅ Created ${totalAircraft} aircraft\n`);
  }

  // Step 6: Create Flights (or skip if exists)
  if (skipDataCreation) {
    console.log('🛫 Skipping flight creation - using existing data\n');
  } else {
    console.log('🛫 Creating flights...');
    let totalFlights = 0;
    for (const school of schools) {
      const schoolStudents = await prisma.student.findMany({ where: { schoolId: school.id } });
      const schoolInstructors = await prisma.instructor.findMany({ where: { schoolId: school.id } });
      const schoolAircraft = await prisma.aircraft.findMany({ where: { schoolId: school.id } });
      
      if (schoolStudents.length === 0 || schoolInstructors.length === 0 || schoolAircraft.length === 0) {
        console.log(`  ⚠️  Skipping flights for ${school.name} - missing students, instructors, or aircraft`);
        continue;
      }

      const flights = [];
      const now = new Date();
      
      for (let i = 0; i < CONFIG.flightsPerSchool; i++) {
        const student = schoolStudents[Math.floor(Math.random() * schoolStudents.length)];
        const instructor = schoolInstructors[Math.floor(Math.random() * schoolInstructors.length)];
        const aircraft = schoolAircraft[Math.floor(Math.random() * schoolAircraft.length)];
        
        // Mix of past and future flights
        const daysOffset = i % 2 === 0 
          ? -Math.floor(Math.random() * 60) // Past flights
          : Math.floor(Math.random() * 90); // Future flights
        
        const scheduledStart = new Date(now);
        scheduledStart.setDate(scheduledStart.getDate() + daysOffset);
        scheduledStart.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 4) * 15, 0, 0);
        
        const scheduledEnd = new Date(scheduledStart);
        scheduledEnd.setHours(scheduledEnd.getHours() + 2);
        
        const briefingStart = new Date(scheduledStart);
        briefingStart.setMinutes(briefingStart.getMinutes() - 30);
        
        const debriefEnd = new Date(scheduledEnd);
        debriefEnd.setMinutes(debriefEnd.getMinutes() + 20);
        
        const status = daysOffset < 0 
          ? (Math.random() > 0.3 ? 'COMPLETED' : 'WEATHER_CANCELLED')
          : FLIGHT_STATUSES[Math.floor(Math.random() * FLIGHT_STATUSES.length)];
        
        const flight = await prisma.flight.create({
          data: {
            schoolId: school.id,
            studentId: student.id,
            instructorId: instructor.id,
            aircraftId: aircraft.id,
            scheduledStart,
            scheduledEnd,
            briefingStart,
            debriefEnd,
            flightType: FLIGHT_TYPES[Math.floor(Math.random() * FLIGHT_TYPES.length)] as any,
            lessonNumber: student.currentLesson,
            lessonTitle: `Lesson ${student.currentLesson}: ${['Takeoffs and Landings', 'Pattern Work', 'Cross Country', 'Instrument Training', 'Emergency Procedures'][Math.floor(Math.random() * 5)]}`,
            departureAirport: school.airportCode,
            destinationAirport: daysOffset > 0 && Math.random() > 0.7 ? AIRPORTS[Math.floor(Math.random() * AIRPORTS.length)].code : school.airportCode,
            status: status as any,
          },
        });
        flights.push(flight);
      }
      totalFlights += flights.length;
      console.log(`  Created ${flights.length} flights for ${school.name} (${totalFlights} total)...`);
    }
    console.log(`✅ Created ${totalFlights} flights\n`);
  }

  // Step 7: Create some reschedule requests (to show AI features)
  console.log('🔄 Creating reschedule requests...');
  const cancelledFlights = await prisma.flight.findMany({
    where: { status: 'WEATHER_CANCELLED' },
    take: CONFIG.rescheduleRequests,
    include: { student: true },
  });
  
  let createdRequests = 0;
  for (const flight of cancelledFlights) {
    // Check if reschedule request already exists for this flight
    const existing = await prisma.rescheduleRequest.findFirst({
      where: { flightId: flight.id },
    });
    
    if (existing) {
      continue; // Skip if already exists
    }
    
    const suggestion1Date = new Date(flight.scheduledStart.getTime() + 24 * 60 * 60 * 1000);
    const suggestion2Date = new Date(flight.scheduledStart.getTime() + 48 * 60 * 60 * 1000);
    const suggestion3Date = new Date(flight.scheduledStart.getTime() + 72 * 60 * 60 * 1000);
    
    await prisma.rescheduleRequest.create({
      data: {
        flightId: flight.id,
        studentId: flight.studentId,
        status: ['PENDING_STUDENT', 'PENDING_INSTRUCTOR', 'ACCEPTED', 'REJECTED'][Math.floor(Math.random() * 4)] as any,
        suggestions: [
          { date: suggestion1Date, confidence: 85, reason: 'Clear weather forecast' },
          { date: suggestion2Date, confidence: 90, reason: 'Optimal conditions expected' },
          { date: suggestion3Date, confidence: 75, reason: 'Good weather window' },
        ],
        aiReasoning: {
          analysis: 'Weather conditions are expected to improve significantly over the next 48-72 hours',
          factors: ['Wind speeds decreasing', 'Visibility improving', 'No precipitation forecast'],
          recommendation: 'Reschedule to one of the suggested times for optimal flight conditions',
        },
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
        createdAt: new Date(flight.scheduledStart.getTime() - 2 * 60 * 60 * 1000),
      },
    });
    createdRequests++;
  }
  console.log(`✅ Created ${createdRequests} reschedule requests (${cancelledFlights.length - createdRequests} already existed)\n`);

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Get final counts from database
  const finalCounts = {
    schools: await prisma.school.count(),
    instructors: await prisma.instructor.count(),
    students: await prisma.student.count(),
    aircraft: await prisma.aircraft.count(),
    flights: await prisma.flight.count(),
    rescheduleRequests: await prisma.rescheduleRequest.count(),
  };

  console.log('='.repeat(60));
  console.log('✅ Demo data generation completed!');
  console.log('='.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   Schools: ${finalCounts.schools}`);
  console.log(`   Instructors: ${finalCounts.instructors}`);
  console.log(`   Students: ${finalCounts.students}`);
  console.log(`   Aircraft: ${finalCounts.aircraft}`);
  console.log(`   Flights: ${finalCounts.flights}`);
  console.log(`   Reschedule Requests: ${finalCounts.rescheduleRequests}`);
  console.log(`\n⏱️  Time taken: ${duration} seconds`);
  console.log('\n🎉 Your demo is ready!');
}

main()
  .catch((e) => {
    console.error('❌ Error generating demo data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


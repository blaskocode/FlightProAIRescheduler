import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.studentProgress.deleteMany();
  await prisma.lessonSyllabus.deleteMany();
  await prisma.squawk.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.rescheduleRequest.deleteMany();
  await prisma.weatherLog.deleteMany();
  await prisma.weatherCheck.deleteMany();
  await prisma.flight.deleteMany();
  await prisma.aircraft.deleteMany();
  await prisma.aircraftType.deleteMany();
  await prisma.instructor.deleteMany();
  await prisma.student.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.school.deleteMany();

  // Create Aircraft Types
  const cessna172 = await prisma.aircraftType.create({
    data: {
      make: 'Cessna',
      model: '172',
      variant: 'Skyhawk',
      category: 'SINGLE_ENGINE_LAND',
      crosswindLimit: 15,
      maxWindSpeed: 20,
      hasDeicing: false,
      isComplex: false,
      isHighPerf: false,
      isTailwheel: false,
      vfrOnly: true,
      imcCapable: false,
      icingApproved: false,
    },
  });

  const piperArrow = await prisma.aircraftType.create({
    data: {
      make: 'Piper',
      model: 'PA-28',
      variant: 'Arrow',
      category: 'SINGLE_ENGINE_LAND',
      crosswindLimit: 17,
      maxWindSpeed: 25,
      hasDeicing: false,
      isComplex: true,
      isHighPerf: false,
      isTailwheel: false,
      vfrOnly: true,
      imcCapable: false,
      icingApproved: false,
    },
  });

  const cirrusSR20 = await prisma.aircraftType.create({
    data: {
      make: 'Cirrus',
      model: 'SR20',
      variant: 'G2',
      category: 'SINGLE_ENGINE_LAND',
      crosswindLimit: 20,
      maxWindSpeed: 25,
      hasDeicing: true,
      isComplex: false,
      isHighPerf: false,
      isTailwheel: false,
      vfrOnly: false,
      imcCapable: true,
      icingApproved: true,
    },
  });

  // Create Schools
  const school1 = await prisma.school.create({
    data: {
      name: 'Austin Flight Academy',
      airportCode: 'KAUS',
      latitude: 30.1945,
      longitude: -97.6699,
      timezone: 'America/Chicago',
      phone: '(512) 555-0100',
      email: 'info@austinflightacademy.com',
      address: '3600 Presidential Blvd, Austin, TX 78719',
      weatherApiEnabled: false,
    },
  });

  const school2 = await prisma.school.create({
    data: {
      name: 'Dallas Flight Training',
      airportCode: 'KDAL',
      latitude: 32.8471,
      longitude: -96.8518,
      timezone: 'America/Chicago',
      phone: '(214) 555-0200',
      email: 'info@dallasflighttraining.com',
      address: '7200 Lemmon Ave, Dallas, TX 75209',
      weatherApiEnabled: false,
    },
  });

  const school3 = await prisma.school.create({
    data: {
      name: 'Houston Aviation Center',
      airportCode: 'KHOU',
      latitude: 29.6454,
      longitude: -95.2789,
      timezone: 'America/Chicago',
      phone: '(713) 555-0300',
      email: 'info@houstonaviation.com',
      address: '7800 Airport Blvd, Houston, TX 77061',
      weatherApiEnabled: false,
    },
  });

  // Create Instructors
  const instructor1 = await prisma.instructor.create({
    data: {
      schoolId: school1.id,
      email: 'john.smith@austinflightacademy.com',
      firstName: 'John',
      lastName: 'Smith',
      phone: '(512) 555-0101',
      firebaseUid: 'instructor1-firebase-uid',
      certificateNumber: 'CFI-12345',
      certificateExpiry: new Date('2026-12-31'),
      cfiExpiry: new Date('2026-12-31'),
      cfiiRating: true,
      meiRating: false,
      lastInstructionalFlight: new Date('2025-11-01'),
      flightReviewDue: new Date('2026-11-01'),
      instrumentCurrent: true,
      availability: [
        { day: 'MON', start: '08:00', end: '17:00' },
        { day: 'TUE', start: '08:00', end: '17:00' },
        { day: 'WED', start: '08:00', end: '17:00' },
        { day: 'THU', start: '08:00', end: '17:00' },
        { day: 'FRI', start: '08:00', end: '17:00' },
      ],
    },
  });

  const instructor2 = await prisma.instructor.create({
    data: {
      schoolId: school1.id,
      email: 'sarah.johnson@austinflightacademy.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '(512) 555-0102',
      firebaseUid: 'instructor2-firebase-uid',
      certificateNumber: 'CFI-12346',
      certificateExpiry: new Date('2027-06-30'),
      cfiExpiry: new Date('2027-06-30'),
      cfiiRating: false,
      meiRating: false,
      lastInstructionalFlight: new Date('2025-11-02'),
      flightReviewDue: new Date('2027-06-30'),
      instrumentCurrent: false,
      availability: [
        { day: 'MON', start: '09:00', end: '18:00' },
        { day: 'TUE', start: '09:00', end: '18:00' },
        { day: 'WED', start: '09:00', end: '18:00' },
        { day: 'THU', start: '09:00', end: '18:00' },
        { day: 'FRI', start: '09:00', end: '18:00' },
      ],
    },
  });

  const instructor3 = await prisma.instructor.create({
    data: {
      schoolId: school2.id,
      email: 'mike.chen@dallasflighttraining.com',
      firstName: 'Mike',
      lastName: 'Chen',
      phone: '(214) 555-0201',
      firebaseUid: 'instructor3-firebase-uid',
      certificateNumber: 'CFI-12347',
      certificateExpiry: new Date('2026-09-15'),
      cfiExpiry: new Date('2026-09-15'),
      cfiiRating: true,
      meiRating: true,
      lastInstructionalFlight: new Date('2025-10-28'),
      flightReviewDue: new Date('2026-09-15'),
      instrumentCurrent: true,
      availability: [
        { day: 'MON', start: '07:00', end: '16:00' },
        { day: 'TUE', start: '07:00', end: '16:00' },
        { day: 'WED', start: '07:00', end: '16:00' },
        { day: 'THU', start: '07:00', end: '16:00' },
        { day: 'FRI', start: '07:00', end: '16:00' },
      ],
    },
  });

  const instructor4 = await prisma.instructor.create({
    data: {
      schoolId: school2.id,
      email: 'emily.davis@dallasflighttraining.com',
      firstName: 'Emily',
      lastName: 'Davis',
      phone: '(214) 555-0202',
      firebaseUid: 'instructor4-firebase-uid',
      certificateNumber: 'CFI-12348',
      certificateExpiry: new Date('2027-03-20'),
      cfiExpiry: new Date('2027-03-20'),
      cfiiRating: false,
      meiRating: false,
      lastInstructionalFlight: new Date('2025-11-03'),
      flightReviewDue: new Date('2027-03-20'),
      instrumentCurrent: false,
      availability: [
        { day: 'MON', start: '10:00', end: '19:00' },
        { day: 'TUE', start: '10:00', end: '19:00' },
        { day: 'WED', start: '10:00', end: '19:00' },
        { day: 'THU', start: '10:00', end: '19:00' },
        { day: 'FRI', start: '10:00', end: '19:00' },
      ],
    },
  });

  const instructor5 = await prisma.instructor.create({
    data: {
      schoolId: school3.id,
      email: 'david.wilson@houstonaviation.com',
      firstName: 'David',
      lastName: 'Wilson',
      phone: '(713) 555-0301',
      firebaseUid: 'instructor5-firebase-uid',
      certificateNumber: 'CFI-12349',
      certificateExpiry: new Date('2026-11-10'),
      cfiExpiry: new Date('2026-11-10'),
      cfiiRating: true,
      meiRating: false,
      lastInstructionalFlight: new Date('2025-10-30'),
      flightReviewDue: new Date('2026-11-10'),
      instrumentCurrent: true,
      availability: [
        { day: 'MON', start: '08:00', end: '17:00' },
        { day: 'TUE', start: '08:00', end: '17:00' },
        { day: 'WED', start: '08:00', end: '17:00' },
        { day: 'THU', start: '08:00', end: '17:00' },
        { day: 'FRI', start: '08:00', end: '17:00' },
        { day: 'SAT', start: '08:00', end: '14:00' },
      ],
    },
  });

  // Create Aircraft
  const aircraft1 = await prisma.aircraft.create({
    data: {
      schoolId: school1.id,
      tailNumber: 'N172AB',
      aircraftTypeId: cessna172.id,
      status: 'AVAILABLE',
      hobbsTime: 2450.5,
      lastInspection: new Date('2025-10-01'),
      nextInspectionDue: new Date('2026-01-01'),
      homeBase: 'KAUS',
    },
  });

  const aircraft2 = await prisma.aircraft.create({
    data: {
      schoolId: school1.id,
      tailNumber: 'N172CD',
      aircraftTypeId: cessna172.id,
      status: 'AVAILABLE',
      hobbsTime: 1890.2,
      lastInspection: new Date('2025-09-15'),
      nextInspectionDue: new Date('2025-12-15'),
      homeBase: 'KAUS',
    },
  });

  const aircraft3 = await prisma.aircraft.create({
    data: {
      schoolId: school2.id,
      tailNumber: 'N28EF',
      aircraftTypeId: piperArrow.id,
      status: 'AVAILABLE',
      hobbsTime: 3200.8,
      lastInspection: new Date('2025-08-20'),
      nextInspectionDue: new Date('2025-11-20'),
      homeBase: 'KDAL',
    },
  });

  const aircraft4 = await prisma.aircraft.create({
    data: {
      schoolId: school2.id,
      tailNumber: 'N20GH',
      aircraftTypeId: cirrusSR20.id,
      status: 'AVAILABLE',
      hobbsTime: 1560.3,
      lastInspection: new Date('2025-10-10'),
      nextInspectionDue: new Date('2026-01-10'),
      homeBase: 'KDAL',
    },
  });

  const aircraft5 = await prisma.aircraft.create({
    data: {
      schoolId: school3.id,
      tailNumber: 'N172IJ',
      aircraftTypeId: cessna172.id,
      status: 'AVAILABLE',
      hobbsTime: 2780.1,
      lastInspection: new Date('2025-09-01'),
      nextInspectionDue: new Date('2025-12-01'),
      homeBase: 'KHOU',
    },
  });

  // Create Students (20 students with varied training levels)
  const studentNames = [
    { first: 'Alice', last: 'Brown', level: 'EARLY_STUDENT', stage: 'STAGE_1_PRE_SOLO', hours: 5.2, lesson: 3 },
    { first: 'Bob', last: 'Martinez', level: 'EARLY_STUDENT', stage: 'STAGE_1_PRE_SOLO', hours: 8.5, lesson: 5 },
    { first: 'Charlie', last: 'Taylor', level: 'MID_STUDENT', stage: 'STAGE_1_PRE_SOLO', hours: 15.3, lesson: 10 },
    { first: 'Diana', last: 'Anderson', level: 'MID_STUDENT', stage: 'STAGE_1_PRE_SOLO', hours: 22.1, lesson: 12 },
    { first: 'Ethan', last: 'Thomas', level: 'ADVANCED_STUDENT', stage: 'STAGE_2_SOLO_XC', hours: 35.8, lesson: 18 },
    { first: 'Fiona', last: 'Jackson', level: 'ADVANCED_STUDENT', stage: 'STAGE_2_SOLO_XC', hours: 42.5, lesson: 22 },
    { first: 'George', last: 'White', level: 'PRIVATE_PILOT', stage: 'STAGE_3_CHECKRIDE_PREP', hours: 48.2, lesson: 35 },
    { first: 'Hannah', last: 'Harris', level: 'PRIVATE_PILOT', stage: 'STAGE_3_CHECKRIDE_PREP', hours: 52.1, lesson: 38 },
    { first: 'Ian', last: 'Martin', level: 'EARLY_STUDENT', stage: 'STAGE_1_PRE_SOLO', hours: 3.5, lesson: 2 },
    { first: 'Julia', last: 'Thompson', level: 'MID_STUDENT', stage: 'STAGE_1_PRE_SOLO', hours: 18.7, lesson: 11 },
    { first: 'Kevin', last: 'Garcia', level: 'ADVANCED_STUDENT', stage: 'STAGE_2_SOLO_XC', hours: 38.9, lesson: 20 },
    { first: 'Laura', last: 'Martinez', level: 'PRIVATE_PILOT', stage: 'STAGE_3_CHECKRIDE_PREP', hours: 45.6, lesson: 33 },
    { first: 'Michael', last: 'Robinson', level: 'EARLY_STUDENT', stage: 'STAGE_1_PRE_SOLO', hours: 6.8, lesson: 4 },
    { first: 'Nancy', last: 'Clark', level: 'MID_STUDENT', stage: 'STAGE_1_PRE_SOLO', hours: 25.3, lesson: 13 },
    { first: 'Oscar', last: 'Rodriguez', level: 'ADVANCED_STUDENT', stage: 'STAGE_2_SOLO_XC', hours: 40.2, lesson: 21 },
    { first: 'Patricia', last: 'Lewis', level: 'PRIVATE_PILOT', stage: 'STAGE_3_CHECKRIDE_PREP', hours: 50.4, lesson: 36 },
    { first: 'Quinn', last: 'Lee', level: 'EARLY_STUDENT', stage: 'STAGE_1_PRE_SOLO', hours: 4.1, lesson: 2 },
    { first: 'Rachel', last: 'Walker', level: 'MID_STUDENT', stage: 'STAGE_1_PRE_SOLO', hours: 20.5, lesson: 12 },
    { first: 'Samuel', last: 'Hall', level: 'ADVANCED_STUDENT', stage: 'STAGE_2_SOLO_XC', hours: 36.7, lesson: 19 },
    { first: 'Tina', last: 'Allen', level: 'PRIVATE_PILOT', stage: 'STAGE_3_CHECKRIDE_PREP', hours: 47.3, lesson: 34 },
  ];

  const students = [];
  for (let i = 0; i < studentNames.length; i++) {
    const student = studentNames[i];
    const schoolId = i < 7 ? school1.id : i < 14 ? school2.id : school3.id;
    const instructorId = i < 7 ? instructor1.id : i < 14 ? instructor3.id : instructor5.id;
    const lastFlightDate = new Date();
    lastFlightDate.setDate(lastFlightDate.getDate() - (i % 7));

    const created = await prisma.student.create({
      data: {
        schoolId,
        email: `${student.first.toLowerCase()}.${student.last.toLowerCase()}@example.com`,
        firstName: student.first,
        lastName: student.last,
        phone: `(512) 555-${String(1000 + i).slice(-4)}`,
        firebaseUid: `student${i + 1}-firebase-uid`,
        trainingLevel: student.level as any,
        currentStage: student.stage as any,
        currentLesson: student.lesson,
        totalFlightHours: student.hours,
        soloHours: student.level === 'ADVANCED_STUDENT' ? student.hours * 0.2 : 0,
        crossCountryHours: student.level === 'ADVANCED_STUDENT' ? student.hours * 0.1 : 0,
        lastFlightDate,
        daysSinceLastFlight: i % 7,
        availability: [
          { day: 'MON', start: '09:00', end: '17:00' },
          { day: 'WED', start: '09:00', end: '17:00' },
          { day: 'SAT', start: '08:00', end: '12:00' },
        ],
        preferredInstructorId: instructorId,
      },
    });
    students.push(created);
  }

  // Create Lesson Syllabus (40 lessons across 3 stages)
  const lessons = [];
  
  // Stage 1: Pre-Solo (Lessons 1-15)
  const stage1Lessons = [
    { num: 1, title: 'Introduction to Flight', duration: 1.5, flightTime: 1.0 },
    { num: 2, title: 'Basic Maneuvers', duration: 1.5, flightTime: 1.0 },
    { num: 3, title: 'Traffic Patterns', duration: 2.0, flightTime: 1.5 },
    { num: 4, title: 'Landings', duration: 2.0, flightTime: 1.5 },
    { num: 5, title: 'Takeoffs', duration: 1.5, flightTime: 1.0 },
    { num: 6, title: 'Slow Flight', duration: 1.5, flightTime: 1.0 },
    { num: 7, title: 'Emergency Procedures', duration: 2.0, flightTime: 1.5 },
    { num: 8, title: 'Ground Reference', duration: 1.5, flightTime: 1.0 },
    { num: 9, title: 'Navigation', duration: 2.0, flightTime: 1.5 },
    { num: 10, title: 'Solo Prep', duration: 1.5, flightTime: 1.0 },
    { num: 11, title: 'Solo Practice 1', duration: 1.0, flightTime: 1.0 },
    { num: 12, title: 'Solo Practice 2', duration: 1.0, flightTime: 1.0 },
    { num: 13, title: 'Solo Practice 3', duration: 1.0, flightTime: 1.0 },
    { num: 14, title: 'Solo Practice 4', duration: 1.0, flightTime: 1.0 },
    { num: 15, title: 'Stage 1 Check', duration: 2.0, flightTime: 1.5 },
  ];

  for (const lesson of stage1Lessons) {
    const created = await prisma.lessonSyllabus.create({
      data: {
        stage: 'STAGE_1_PRE_SOLO',
        lessonNumber: lesson.num,
        title: lesson.title,
        description: `Lesson ${lesson.num}: ${lesson.title}`,
        objectives: [`Master ${lesson.title.toLowerCase()}`],
        prerequisites: lesson.num > 1 ? [lesson.num - 1] : [],
        estimatedDuration: lesson.duration,
        groundTime: lesson.duration - lesson.flightTime,
        flightTime: lesson.flightTime,
        weatherMinimums: {
          visibility: 10,
          ceiling: 3000,
          maxWind: 8,
          maxCrosswind: 5,
        },
        aircraftRequirement: 'any',
        maneuvers: [],
        references: [],
      },
    });
    lessons.push(created);
  }

  // Stage 2: Solo Cross-Country (Lessons 16-30)
  const stage2Lessons = [
    { num: 16, title: 'Navigation Planning', duration: 2.0, flightTime: 1.5 },
    { num: 17, title: 'Cross-Country Prep', duration: 2.0, flightTime: 1.5 },
    { num: 18, title: 'First Solo XC', duration: 3.0, flightTime: 2.5 },
    { num: 19, title: 'Advanced Navigation', duration: 2.0, flightTime: 1.5 },
    { num: 20, title: 'Second Solo XC', duration: 3.5, flightTime: 3.0 },
    { num: 21, title: 'Third Solo XC', duration: 4.0, flightTime: 3.5 },
    { num: 22, title: 'Night Flying Intro', duration: 2.0, flightTime: 1.5 },
    { num: 23, title: 'Night Landing Practice', duration: 2.0, flightTime: 1.5 },
    { num: 24, title: 'Advanced Maneuvers', duration: 2.0, flightTime: 1.5 },
    { num: 25, title: 'Emergency Procedures Review', duration: 2.0, flightTime: 1.5 },
    { num: 26, title: 'Stage 2 Check', duration: 2.5, flightTime: 2.0 },
    { num: 27, title: 'Checkride Prep 1', duration: 2.0, flightTime: 1.5 },
    { num: 28, title: 'Checkride Prep 2', duration: 2.0, flightTime: 1.5 },
    { num: 29, title: 'Checkride Prep 3', duration: 2.0, flightTime: 1.5 },
    { num: 30, title: 'Mock Checkride', duration: 2.5, flightTime: 2.0 },
  ];

  for (const lesson of stage2Lessons) {
    const created = await prisma.lessonSyllabus.create({
      data: {
        stage: 'STAGE_2_SOLO_XC',
        lessonNumber: lesson.num,
        title: lesson.title,
        description: `Lesson ${lesson.num}: ${lesson.title}`,
        objectives: [`Master ${lesson.title.toLowerCase()}`],
        prerequisites: lesson.num > 16 ? [lesson.num - 1] : [15],
        estimatedDuration: lesson.duration,
        groundTime: lesson.duration - lesson.flightTime,
        flightTime: lesson.flightTime,
        weatherMinimums: {
          visibility: 5,
          ceiling: 1500,
          maxWind: 12,
          maxCrosswind: 8,
        },
        aircraftRequirement: 'any',
        maneuvers: [],
        references: [],
      },
    });
    lessons.push(created);
  }

  // Stage 3: Checkride Prep (Lessons 31-40)
  const stage3Lessons = [
    { num: 31, title: 'Checkride Maneuvers 1', duration: 2.0, flightTime: 1.5 },
    { num: 32, title: 'Checkride Maneuvers 2', duration: 2.0, flightTime: 1.5 },
    { num: 33, title: 'Checkride Maneuvers 3', duration: 2.0, flightTime: 1.5 },
    { num: 34, title: 'Checkride Maneuvers 4', duration: 2.0, flightTime: 1.5 },
    { num: 35, title: 'Checkride Maneuvers 5', duration: 2.0, flightTime: 1.5 },
    { num: 36, title: 'Mock Checkride 1', duration: 2.5, flightTime: 2.0 },
    { num: 37, title: 'Mock Checkride 2', duration: 2.5, flightTime: 2.0 },
    { num: 38, title: 'Final Review', duration: 1.5, flightTime: 1.0 },
    { num: 39, title: 'Pre-Checkride Briefing', duration: 1.0, flightTime: 0 },
    { num: 40, title: 'Checkride', duration: 3.0, flightTime: 2.5 },
  ];

  for (const lesson of stage3Lessons) {
    const created = await prisma.lessonSyllabus.create({
      data: {
        stage: 'STAGE_3_CHECKRIDE_PREP',
        lessonNumber: lesson.num,
        title: lesson.title,
        description: `Lesson ${lesson.num}: ${lesson.title}`,
        objectives: [`Master ${lesson.title.toLowerCase()}`],
        prerequisites: lesson.num > 31 ? [lesson.num - 1] : [30],
        estimatedDuration: lesson.duration,
        groundTime: lesson.duration - lesson.flightTime,
        flightTime: lesson.flightTime,
        weatherMinimums: {
          visibility: 3,
          ceiling: 1000,
          maxWind: 15,
          maxCrosswind: 10,
        },
        aircraftRequirement: 'any',
        maneuvers: [],
        references: [],
      },
    });
    lessons.push(created);
  }

  // Create 50 upcoming flights
  const flightDates = [];
  const today = new Date();
  for (let i = 0; i < 50; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + Math.floor(i / 5) + 1);
    date.setHours(9 + (i % 5) * 2, 0, 0, 0);
    flightDates.push(date);
  }

  const aircraftList = [aircraft1, aircraft2, aircraft3, aircraft4, aircraft5];
  const instructorList = [instructor1, instructor2, instructor3, instructor4, instructor5];

  for (let i = 0; i < 50; i++) {
    const student = students[i % students.length];
    const aircraft = aircraftList[i % aircraftList.length];
    const instructor = instructorList[i % instructorList.length];
    const startTime = flightDates[i];
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 2);
    const briefingStart = new Date(startTime);
    briefingStart.setMinutes(briefingStart.getMinutes() - 30);
    const debriefEnd = new Date(endTime);
    debriefEnd.setMinutes(debriefEnd.getMinutes() + 20);

    await prisma.flight.create({
      data: {
        schoolId: student.schoolId,
        studentId: student.id,
        instructorId: instructor.id,
        aircraftId: aircraft.id,
        scheduledStart: startTime,
        scheduledEnd: endTime,
        briefingStart,
        debriefEnd,
        flightType: i % 10 === 0 ? 'SOLO_SUPERVISED' : 'DUAL_INSTRUCTION',
        lessonNumber: student.currentLesson,
        lessonTitle: lessons.find(l => l.lessonNumber === student.currentLesson)?.title || 'Flight Lesson',
        departureAirport: student.schoolId === school1.id ? 'KAUS' : student.schoolId === school2.id ? 'KDAL' : 'KHOU',
        status: i < 5 ? 'CONFIRMED' : 'PENDING',
      },
    });
  }

  console.log('✅ Seed completed successfully!');
  console.log(`   - ${3} schools created`);
  console.log(`   - ${5} instructors created`);
  console.log(`   - ${20} students created`);
  console.log(`   - ${5} aircraft created`);
  console.log(`   - ${40} lessons created`);
  console.log(`   - ${50} flights created`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


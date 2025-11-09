import { PrismaClient } from '@prisma/client';
import { getAirportCoordinates } from '../src/lib/utils/airport-coordinates';
import { getWeatherMinimums } from '../src/lib/services/weather-service';

const prisma = new PrismaClient();

async function createWeatherAlertForStudent(studentEmail: string) {
  try {
    // Find the student
    const student = await prisma.student.findUnique({
      where: { email: studentEmail },
      select: {
        id: true,
        email: true,
        trainingLevel: true,
      },
    });

    if (!student) {
      console.error(`Student not found: ${studentEmail}`);
      process.exit(1);
    }

    // Find a flight for this student scheduled in the next 48 hours
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const future = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const flight = await prisma.flight.findFirst({
      where: {
        studentId: student.id,
        scheduledStart: {
          gte: oneHourFromNow,
          lte: future,
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            trainingLevel: true,
          },
        },
        aircraft: {
          include: {
            aircraftType: true,
          },
        },
      },
    });

    if (!flight) {
      console.error(`No upcoming flights found for student: ${studentEmail}`);
      process.exit(1);
    }

    console.log(`Found flight: ${flight.id}`);
    console.log(`  Scheduled: ${flight.scheduledStart}`);
    console.log(`  Student: ${flight.student.email}`);
    console.log(`  Airport: ${flight.departureAirport}`);

    // Get airport coordinates
    const coordinates = await getAirportCoordinates(flight.departureAirport);

    // Get minimums for this student/aircraft
    const minimums = getWeatherMinimums(
      flight.student.trainingLevel,
      flight.aircraft.aircraftType,
      flight.flightType
    );

    // Create a UNSAFE weather check
    const result = 'UNSAFE';
    const reasons = [
      'Visibility below minimums (0.5 SM)',
      'Ceiling below minimums (200 ft AGL)',
      'Wind gusts exceed limits (25+ knots)',
    ];

    const weatherCheck = await prisma.weatherCheck.create({
      data: {
        flightId: flight.id,
        checkType: 'MANUAL_REFRESH',
        location: flight.departureAirport,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        rawMetar: JSON.stringify({
          visibility: { value: 0.5, unit: 'SM' },
          clouds: [{ altitude: 200, type: 'BKN' }],
          wind: { speed: 20, gust: 28, direction: 270 },
          temperature: 15,
          conditions: ['Rain', 'Thunderstorm'],
        }),
        visibility: 0.5, // Below minimums
        ceiling: 200, // Below minimums
        windSpeed: 20,
        windGust: 28, // Exceeds limits
        windDirection: 270,
        temperature: 15,
        conditions: 'Rain, Thunderstorm',
        result: result,
        confidence: 95,
        reasons: reasons,
        studentTrainingLevel: flight.student.trainingLevel,
        requiredVisibility: minimums.visibility,
        requiredCeiling: minimums.ceiling,
        maxWindSpeed: minimums.maxWind,
      },
    });

    console.log('\n✅ Weather alert created successfully!');
    console.log(`   Weather Check ID: ${weatherCheck.id}`);
    console.log(`   Flight ID: ${flight.id}`);
    console.log(`   Result: ${weatherCheck.result}`);
    console.log(`   Confidence: ${weatherCheck.confidence}%`);
    console.log(`   Reasons: ${reasons.join(', ')}`);
    console.log('\n💡 Refresh your dashboard to see the weather alert and "Request Reschedule" button!');
  } catch (error) {
    console.error('Error creating weather alert:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get student email from command line or use default
const studentEmail = process.argv[2] || 'student.demo@flightpro.com';
createWeatherAlertForStudent(studentEmail);


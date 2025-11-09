/**
 * Script to create a weather alert for a flight assigned to the demo instructor
 * This allows testing the weather override feature
 * 
 * Usage: npx tsx scripts/create-weather-alert-for-instructor.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createWeatherAlertForInstructor() {
  try {
    console.log('Finding demo instructor...');
    
    // Find the demo instructor
    const instructor = await prisma.instructor.findUnique({
      where: { email: 'instructor.demo@flightpro.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!instructor) {
      console.error('Demo instructor not found. Please create the instructor account first.');
      process.exit(1);
    }

    console.log(`Found instructor: ${instructor.firstName} ${instructor.lastName} (${instructor.email})`);

    // Find an upcoming flight assigned to this instructor
    const now = new Date();
    const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Next 7 days

    const flight = await prisma.flight.findFirst({
      where: {
        instructorId: instructor.id,
        scheduledStart: {
          gte: now,
          lte: future,
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      select: {
        id: true,
        scheduledStart: true,
        scheduledEnd: true,
        departureAirport: true,
        status: true,
        student: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            trainingLevel: true,
          },
        },
        aircraft: {
          select: {
            id: true,
            tailNumber: true,
            aircraftType: {
              select: {
                id: true,
                make: true,
                model: true,
                category: true,
                maxWindSpeed: true,
                crosswindLimit: true,
              },
            },
          },
        },
        school: {
          select: {
            id: true,
            name: true,
            airportCode: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: {
        scheduledStart: 'asc',
      },
    });

    if (!flight) {
      console.error('No upcoming flights found for demo instructor.');
      console.log('Creating a test flight first...');
      
      // Find a student and aircraft for the instructor's school
      const school = await prisma.school.findFirst({
        where: {
          instructors: {
            some: {
              id: instructor.id,
            },
          },
        },
        select: {
          id: true,
          name: true,
          airportCode: true,
          latitude: true,
          longitude: true,
        },
      });

      if (!school) {
        console.error('No school found for instructor.');
        process.exit(1);
      }

      const student = await prisma.student.findFirst({
        where: { schoolId: school.id },
        select: { id: true },
      });

      const aircraft = await prisma.aircraft.findFirst({
        where: { schoolId: school.id },
        select: { id: true },
      });

      if (!student || !aircraft) {
        console.error('No student or aircraft found for school.');
        process.exit(1);
      }

      // Create a test flight 2 hours from now
      const scheduledStart = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const scheduledEnd = new Date(scheduledStart.getTime() + 2 * 60 * 60 * 1000);

      const newFlight = await prisma.flight.create({
        data: {
          schoolId: school.id,
          studentId: student.id,
          instructorId: instructor.id,
          aircraftId: aircraft.id,
          scheduledStart,
          scheduledEnd,
          briefingStart: new Date(scheduledStart.getTime() - 30 * 60 * 1000),
          debriefEnd: new Date(scheduledEnd.getTime() + 20 * 60 * 1000),
          flightType: 'DUAL_INSTRUCTION',
          departureAirport: school.airportCode,
          status: 'CONFIRMED',
        },
        select: {
          id: true,
          scheduledStart: true,
          scheduledEnd: true,
          departureAirport: true,
          status: true,
          student: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              trainingLevel: true,
            },
          },
          aircraft: {
            select: {
              id: true,
              tailNumber: true,
              aircraftType: {
                select: {
                  id: true,
                  make: true,
                  model: true,
                  category: true,
                  maxWindSpeed: true,
                  crosswindLimit: true,
                },
              },
            },
          },
          school: {
            select: {
              id: true,
              name: true,
              airportCode: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      });

      console.log(`Created test flight: ${newFlight.id}`);
      console.log(`Scheduled: ${newFlight.scheduledStart.toLocaleString()}`);
      
      // Use the new flight
      const flightToUse = newFlight;
      
      // Create weather check with UNSAFE result
      const weatherCheck = await prisma.weatherCheck.create({
        data: {
          flightId: flightToUse.id,
          checkType: 'MANUAL_REFRESH',
          location: flightToUse.departureAirport,
          latitude: flightToUse.school.latitude,
          longitude: flightToUse.school.longitude,
          rawMetar: JSON.stringify({
            visibility: { value: 10, unit: 'SM' },
            clouds: [{ altitude: 25000, type: 'FEW' }],
            wind: { speed: 20, gust: 25, direction: 270 },
            temperature: 15,
            conditions: ['Windy'],
          }),
          visibility: 10,
          ceiling: 25000,
          windSpeed: 20,
          windGust: 25,
          windDirection: 270,
          temperature: 15,
          conditions: 'Windy',
          result: 'UNSAFE',
          confidence: 90,
          reasons: [
            'Wind speed 20 kt exceeds maximum limits',
            'Wind gusts 25 kt exceed maximum limits',
          ],
          studentTrainingLevel: flightToUse.student.trainingLevel,
          requiredVisibility: 10,
          requiredCeiling: 3000,
          maxWindSpeed: 8,
        },
      });

      // Update flight status to WEATHER_CANCELLED
      await prisma.flight.update({
        where: { id: flightToUse.id },
        data: { status: 'WEATHER_CANCELLED' },
      });

      console.log('\n✅ Weather alert created successfully!');
      console.log(`Flight ID: ${flightToUse.id}`);
      console.log(`Weather Check ID: ${weatherCheck.id}`);
      console.log(`Status: WEATHER_CANCELLED`);
      console.log(`Student: ${flightToUse.student.firstName} ${flightToUse.student.lastName}`);
      console.log(`Scheduled: ${flightToUse.scheduledStart.toLocaleString()}`);
      console.log(`\nThe instructor can now test the "Override Weather" button on this flight.`);
    } else {
      console.log(`Found flight: ${flight.id}`);
      console.log(`Scheduled: ${flight.scheduledStart.toLocaleString()}`);
      console.log(`Student: ${flight.student.firstName} ${flight.student.lastName}`);

      // Check if weather check already exists
      const existingCheck = await prisma.weatherCheck.findFirst({
        where: {
          flightId: flight.id,
          result: 'UNSAFE',
          checkTime: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      if (existingCheck) {
        console.log('\n⚠️  Weather alert already exists for this flight.');
        console.log(`Weather Check ID: ${existingCheck.id}`);
        
        // Update flight status if not already cancelled
        if (flight.status !== 'WEATHER_CANCELLED') {
          await prisma.flight.update({
            where: { id: flight.id },
            data: { status: 'WEATHER_CANCELLED' },
          });
          console.log('✅ Updated flight status to WEATHER_CANCELLED');
        }
      } else {
        // Create weather check with UNSAFE result
        const weatherCheck = await prisma.weatherCheck.create({
          data: {
            flightId: flight.id,
            checkType: 'MANUAL_REFRESH',
            location: flight.departureAirport,
            latitude: flight.school.latitude,
            longitude: flight.school.longitude,
            rawMetar: JSON.stringify({
              visibility: { value: 10, unit: 'SM' },
              clouds: [{ altitude: 25000, type: 'FEW' }],
              wind: { speed: 20, gust: 25, direction: 270 },
              temperature: 15,
              conditions: ['Windy'],
            }),
            visibility: 10,
            ceiling: 25000,
            windSpeed: 20,
            windGust: 25,
            windDirection: 270,
            temperature: 15,
            conditions: 'Windy',
            result: 'UNSAFE',
            confidence: 90,
            reasons: [
              'Wind speed 20 kt exceeds maximum limits',
              'Wind gusts 25 kt exceed maximum limits',
            ],
            studentTrainingLevel: flight.student.trainingLevel,
            requiredVisibility: 10,
            requiredCeiling: 3000,
            maxWindSpeed: 8,
          },
        });

        // Update flight status to WEATHER_CANCELLED
        await prisma.flight.update({
          where: { id: flight.id },
          data: { status: 'WEATHER_CANCELLED' },
        });

        console.log('\n✅ Weather alert created successfully!');
        console.log(`Weather Check ID: ${weatherCheck.id}`);
        console.log(`Status: WEATHER_CANCELLED`);
        console.log(`\nThe instructor can now test the "Override Weather" button on this flight.`);
      }
    }
  } catch (error: any) {
    console.error('Error creating weather alert:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createWeatherAlertForInstructor();


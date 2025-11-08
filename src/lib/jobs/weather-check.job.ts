import { Job } from 'bullmq';
import { prisma } from '@/lib/prisma';
import { fetchFAAWeather, getWeatherMinimums, checkWeatherSafety } from '@/lib/services/weather-service';
import { getAirportCoordinates } from '@/lib/utils/airport-coordinates';
import { generateRescheduleSuggestions } from '@/lib/services/ai-reschedule-service';
import { sendNotification, generateWeatherConflictEmail } from '@/lib/services/notification-service';

export interface WeatherCheckJobData {
  flightId: string;
  checkType: 'HOURLY' | 'BRIEFING' | 'MANUAL';
}

export async function processWeatherCheck(job: Job<WeatherCheckJobData>) {
  const { flightId, checkType } = job.data;
  
  try {
    // 1. Fetch flight details
    const flight = await prisma.flight.findUnique({
      where: { id: flightId },
      include: {
        student: true,
        aircraft: {
          include: {
            aircraftType: true,
          },
        },
      },
    });

    if (!flight) {
      throw new Error(`Flight ${flightId} not found`);
    }

    // 2. Get weather data
    const weather = await fetchFAAWeather(flight.departureAirport);
    
    if (!weather) {
      throw new Error(`Weather data not available for ${flight.departureAirport}`);
    }

    // 3. Get minimums
    const minimums = getWeatherMinimums(
      flight.student.trainingLevel,
      flight.aircraft.aircraftType,
      flight.flightType
    );

    // 4. Check safety
    const checkResult = checkWeatherSafety(weather, minimums);

    // 5. Get airport coordinates
    const coordinates = await getAirportCoordinates(flight.departureAirport);

    // 6. Save weather check
    const weatherCheck = await prisma.weatherCheck.create({
      data: {
        flightId: flight.id,
        checkType: checkType === 'HOURLY' ? 'SCHEDULED_HOURLY' : 
                   checkType === 'BRIEFING' ? 'PRE_FLIGHT_BRIEFING' : 'MANUAL_REFRESH',
        location: flight.departureAirport,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        rawMetar: JSON.stringify(weather),
        visibility: weather.visibility.value,
        ceiling: weather.clouds[0]?.altitude || 99999,
        windSpeed: weather.wind.speed,
        windGust: weather.wind.gust,
        windDirection: weather.wind.direction,
        temperature: weather.temperature,
        conditions: weather.conditions?.join(',') || 'Clear',
        result: checkResult.result,
        confidence: checkResult.confidence,
        reasons: checkResult.reasons,
        studentTrainingLevel: flight.student.trainingLevel,
        requiredVisibility: minimums.visibility,
        requiredCeiling: minimums.ceiling,
        maxWindSpeed: minimums.maxWind,
      },
    });

    // 7. If unsafe, trigger AI rescheduling
    if (checkResult.result === 'UNSAFE') {
      // Update flight status
      await prisma.flight.update({
        where: { id: flightId },
        data: { status: 'WEATHER_CANCELLED' },
      });

      try {
        // Generate AI reschedule suggestions
        const rescheduleResponse = await generateRescheduleSuggestions(flightId);

        // Create reschedule request
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48); // 48 hour expiration

        const rescheduleRequest = await prisma.rescheduleRequest.create({
          data: {
            flightId: flight.id,
            studentId: flight.studentId,
            suggestions: rescheduleResponse.suggestions as any, // Convert to JSON
            aiReasoning: rescheduleResponse.priorityFactors as any, // Convert to JSON
            status: 'PENDING_STUDENT',
            expiresAt,
          },
        });

        // Send notification to student
        const emailData = generateWeatherConflictEmail({
          student: flight.student,
          flight,
          weatherCheck,
        });

        await sendNotification({
          ...emailData,
          recipientId: flight.studentId,
          type: 'WEATHER_CONFLICT',
          metadata: {
            rescheduleRequestId: rescheduleRequest.id,
            weatherCheckId: weatherCheck.id,
          },
        });

        job.log(`Weather conflict detected for flight ${flightId}. AI rescheduling triggered. Request ID: ${rescheduleRequest.id}`);
      } catch (error: any) {
        job.log(`Error triggering AI rescheduling: ${error.message}`);
        // Don't throw - weather check still succeeded
      }
    }

    return {
      flightId,
      result: checkResult.result,
      confidence: checkResult.confidence,
    };
  } catch (error: any) {
    job.log(`Error processing weather check: ${error.message}`);
    throw error;
  }
}


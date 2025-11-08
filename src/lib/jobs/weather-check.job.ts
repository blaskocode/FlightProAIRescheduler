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

    // 2. Get weather data (with schoolId for provider selection)
    // For cross-country flights, check route weather instead
    let weather;
    let routeWeatherResult = null;
    
    if (flight.route && flight.route.includes('-')) {
      // Cross-country flight - check route weather
      const { checkRouteWeather } = await import('@/lib/services/route-weather-service');
      routeWeatherResult = await checkRouteWeather(
        flight.route,
        flight.schoolId,
        getWeatherMinimums(
          flight.student.trainingLevel,
          flight.aircraft.aircraftType,
          flight.flightType
        )
      );
      
      // Use departure airport weather for compatibility with existing code
      weather = await fetchFAAWeather(flight.departureAirport, flight.schoolId);
      
    } else {
      // Local flight - check departure airport only
      weather = await fetchFAAWeather(flight.departureAirport, flight.schoolId);
    }
    
    if (!weather) {
      throw new Error(`Weather data not available for ${flight.departureAirport}`);
    }

    // 3. Get minimums
    const minimums = getWeatherMinimums(
      flight.student.trainingLevel,
      flight.aircraft.aircraftType,
      flight.flightType
    );

    // 4. Check safety (use route weather result if available, otherwise check departure)
    let checkResult: any;
    if (routeWeatherResult) {
      // Use route weather result
      checkResult = {
        result: routeWeatherResult.overallResult,
        confidence: routeWeatherResult.confidence,
        reasons: routeWeatherResult.reasons,
      };
    } else {
      // Local flight - check departure airport only
      checkResult = checkWeatherSafety(weather, minimums);
    }

    // 5. Get airport coordinates
    const coordinates = await getAirportCoordinates(flight.departureAirport);

    // 6. Calculate forecast confidence for proactive alerts
    let forecastConfidence = null;
    try {
      const { calculateForecastConfidence } = await import('@/lib/services/forecast-confidence-service');
      forecastConfidence = await calculateForecastConfidence(
        flightId,
        weather,
        flight.scheduledStart
      );
    } catch (error) {
      console.error('Error calculating forecast confidence:', error);
      // Continue without confidence data
    }

    // 7. Save weather check
    const weatherCheck = await prisma.weatherCheck.create({
      data: {
        flightId: flight.id,
        checkType: checkType === 'HOURLY' ? 'SCHEDULED_HOURLY' : 
                   checkType === 'BRIEFING' ? 'PRE_FLIGHT_BRIEFING' : 'MANUAL_REFRESH',
        location: flight.departureAirport,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        rawMetar: JSON.stringify({
          departure: weather,
          route: routeWeatherResult ? {
            route: routeWeatherResult.route,
            waypoints: routeWeatherResult.waypoints,
            overallResult: routeWeatherResult.overallResult,
            unsafeWaypoints: routeWeatherResult.unsafeWaypoints,
            marginalWaypoints: routeWeatherResult.marginalWaypoints,
          } : null,
        }),
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

    // 8. If unsafe OR high confidence forecast suggests reschedule, trigger AI rescheduling
    const shouldReschedule = checkResult.result === 'UNSAFE' || 
      (forecastConfidence && forecastConfidence.recommendation === 'AUTO_RESCHEDULE' && forecastConfidence.tier === 'HIGH');
    
    if (shouldReschedule) {
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

        // Send notification to student (with forecast confidence if available)
        const emailData = generateWeatherConflictEmail({
          student: flight.student,
          flight,
          weatherCheck,
          forecastConfidence: forecastConfidence || undefined,
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


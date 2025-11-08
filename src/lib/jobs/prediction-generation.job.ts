/**
 * Prediction Generation Job
 * 
 * Automatically generates cancellation predictions for upcoming flights
 */

import { prisma } from '@/lib/prisma';
import { predictCancellation } from '@/lib/services/prediction-service';

/**
 * Generate predictions for upcoming flights
 * Runs daily to update predictions for flights in the next 7 days
 */
export async function generatePredictionsForUpcomingFlights() {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get all upcoming flights in the next 7 days that don't have recent predictions
    const flights = await prisma.flight.findMany({
      where: {
        scheduledStart: {
          gte: now,
          lte: sevenDaysFromNow,
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
        // Only update predictions older than 24 hours or missing
        OR: [
          { predictionMadeAt: null },
          { predictionMadeAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
        ],
      },
      include: {
        student: true,
        aircraft: {
          include: {
            aircraftType: true,
          },
        },
        weatherChecks: {
          orderBy: { checkTime: 'desc' },
          take: 1,
        },
      },
      take: 100, // Limit to 100 flights per run
    });

    let successCount = 0;
    let errorCount = 0;

    for (const flight of flights) {
      try {
        // Get latest weather forecast if available
        let weatherForecast;
        if (flight.weatherChecks.length > 0) {
          const latestCheck = flight.weatherChecks[0];
          weatherForecast = {
            visibility: latestCheck.visibility,
            ceiling: latestCheck.ceiling,
            windSpeed: latestCheck.windSpeed,
            windGust: latestCheck.windGust,
            precipitation: latestCheck.precipitation,
            conditions: latestCheck.reasons as string[],
          };
        }

        // Generate prediction
        const prediction = await predictCancellation({
          flightId: flight.id,
          scheduledStart: flight.scheduledStart,
          studentLevel: flight.student.trainingLevel,
          aircraftType: flight.aircraft.aircraftType.make + ' ' + flight.aircraft.aircraftType.model,
          departureAirport: flight.departureAirport,
          weatherForecast,
        });

        // Store prediction
        await prisma.flight.update({
          where: { id: flight.id },
          data: {
            cancellationPrediction: prediction.cancellationProbability,
            predictionConfidence: prediction.confidence,
            predictionMadeAt: new Date(),
          },
        });

        successCount++;
      } catch (error) {
        console.error(`Error generating prediction for flight ${flight.id}:`, error);
        errorCount++;
      }
    }

    return {
      success: true,
      processed: flights.length,
      successCount,
      errorCount,
    };
  } catch (error) {
    console.error('Error in prediction generation job:', error);
    throw error;
  }
}


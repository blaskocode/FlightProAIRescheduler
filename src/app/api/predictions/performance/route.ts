import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions/check';
import { getModelPerformance } from '@/lib/services/prediction-service';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/predictions/performance
 * Get model performance metrics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth();

    // Only admins can view model performance
    if (!(await hasPermission(authUser, 'analytics.view'))) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (!schoolId) {
      return NextResponse.json(
        { error: 'schoolId is required' },
        { status: 400 }
      );
    }

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000); // Default to 90 days

    // Get flights with predictions and actual outcomes
    const flights = await prisma.flight.findMany({
      where: {
        schoolId,
        scheduledStart: {
          gte: startDate,
          lte: endDate,
        },
        cancellationPrediction: {
          not: null,
        },
      },
      select: {
        id: true,
        cancellationPrediction: true,
        status: true,
        scheduledStart: true,
      },
    });

    if (flights.length === 0) {
      return NextResponse.json({
        totalPredictions: 0,
        accuratePredictions: 0,
        accuracy: 0,
        falsePositives: 0,
        falseNegatives: 0,
        precision: 0,
        recall: 0,
        message: 'No predictions available for this period',
      });
    }

    // Analyze predictions vs actual outcomes
    let accuratePredictions = 0;
    let falsePositives = 0; // Predicted cancellation but didn't cancel
    let falseNegatives = 0; // Didn't predict cancellation but cancelled
    let truePositives = 0; // Predicted cancellation and cancelled
    let trueNegatives = 0; // Predicted no cancellation and didn't cancel

    const CANCELLATION_THRESHOLD = 50; // 50% probability threshold

    for (const flight of flights) {
      const predictedCancellation = (flight.cancellationPrediction || 0) >= CANCELLATION_THRESHOLD;
      const actuallyCancelled = flight.status === 'WEATHER_CANCELLED';

      if (predictedCancellation && actuallyCancelled) {
        truePositives++;
        accuratePredictions++;
      } else if (!predictedCancellation && !actuallyCancelled) {
        trueNegatives++;
        accuratePredictions++;
      } else if (predictedCancellation && !actuallyCancelled) {
        falsePositives++;
      } else if (!predictedCancellation && actuallyCancelled) {
        falseNegatives++;
      }
    }

    const totalPredictions = flights.length;
    const accuracy = (accuratePredictions / totalPredictions) * 100;
    const precision = truePositives + falsePositives > 0
      ? (truePositives / (truePositives + falsePositives)) * 100
      : 0;
    const recall = truePositives + falseNegatives > 0
      ? (truePositives / (truePositives + falseNegatives)) * 100
      : 0;

    return NextResponse.json({
      totalPredictions,
      accuratePredictions,
      accuracy,
      falsePositives,
      falseNegatives,
      truePositives,
      trueNegatives,
      precision,
      recall,
      threshold: CANCELLATION_THRESHOLD,
    });
  } catch (error: any) {
    console.error('Error fetching model performance:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


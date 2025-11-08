/**
 * Predictive Cancellation Model Service
 * 
 * Uses historical weather and cancellation data to predict flight cancellation probability
 * 
 * Note: This is a rule-based/statistical model. For production, consider TensorFlow.js
 * or a Python ML backend for more sophisticated models.
 */

import { prisma } from '@/lib/prisma';

export interface PredictionInput {
  flightId: string;
  scheduledStart: Date;
  studentLevel: string; // TrainingLevel enum
  aircraftType: string;
  departureAirport: string;
  weatherForecast?: {
    visibility?: number;
    ceiling?: number;
    windSpeed?: number;
    windGust?: number;
    precipitation?: boolean;
    conditions?: string[];
  };
}

export interface PredictionResult {
  cancellationProbability: number; // 0-100
  confidence: number; // 0-100
  factors: Array<{
    factor: string;
    impact: number; // -100 to +100
    explanation: string;
  }>;
  recommendation: 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK' | 'VERY_HIGH_RISK';
}

/**
 * Predict cancellation probability for a flight
 */
export async function predictCancellation(
  input: PredictionInput
): Promise<PredictionResult> {
  const factors: Array<{ factor: string; impact: number; explanation: string }> = [];
  let baseProbability = 0;

  // Factor 1: Historical cancellation rate for this time/season
  const seasonalRate = await getSeasonalCancellationRate(
    input.scheduledStart,
    input.departureAirport
  );
  baseProbability = seasonalRate;
  factors.push({
    factor: 'Seasonal Pattern',
    impact: seasonalRate - 10, // Normalize around 10%
    explanation: `Historical cancellation rate for this time period: ${seasonalRate.toFixed(1)}%`,
  });

  // Factor 2: Student level (early students more likely to cancel in marginal weather)
  const studentLevelImpact = getStudentLevelImpact(input.studentLevel);
  baseProbability += studentLevelImpact;
  factors.push({
    factor: 'Student Experience',
    impact: studentLevelImpact,
    explanation: `${input.studentLevel} students have ${studentLevelImpact > 0 ? 'higher' : 'lower'} cancellation risk`,
  });

  // Factor 3: Aircraft type (some aircraft more sensitive to weather)
  const aircraftImpact = await getAircraftTypeImpact(input.aircraftType);
  baseProbability += aircraftImpact;
  factors.push({
    factor: 'Aircraft Type',
    impact: aircraftImpact,
    explanation: `This aircraft type has ${aircraftImpact > 0 ? 'higher' : 'lower'} weather sensitivity`,
  });

  // Factor 4: Weather forecast (if provided)
  if (input.weatherForecast) {
    const weatherImpact = calculateWeatherImpact(input.weatherForecast);
    baseProbability += weatherImpact.impact;
    factors.push({
      factor: 'Weather Forecast',
      impact: weatherImpact.impact,
      explanation: weatherImpact.explanation,
    });
  }

  // Factor 5: Time of day (early morning/late evening more risky)
  const timeOfDayImpact = getTimeOfDayImpact(input.scheduledStart);
  baseProbability += timeOfDayImpact;
  factors.push({
    factor: 'Time of Day',
    impact: timeOfDayImpact,
    explanation: getTimeOfDayExplanation(input.scheduledStart),
  });

  // Factor 6: Day of week (weekends may have different patterns)
  const dayOfWeekImpact = getDayOfWeekImpact(input.scheduledStart);
  baseProbability += dayOfWeekImpact;
  factors.push({
    factor: 'Day of Week',
    impact: dayOfWeekImpact,
    explanation: getDayOfWeekExplanation(input.scheduledStart),
  });

  // Clamp probability between 0 and 100
  const cancellationProbability = Math.max(0, Math.min(100, baseProbability));

  // Calculate confidence based on data availability
  const confidence = calculateConfidence(input);

  // Determine recommendation
  const recommendation = getRecommendation(cancellationProbability);

  return {
    cancellationProbability,
    confidence,
    factors,
    recommendation,
  };
}

/**
 * Get seasonal cancellation rate from historical data
 */
async function getSeasonalCancellationRate(
  date: Date,
  airportCode: string
): Promise<number> {
  const month = date.getMonth(); // 0-11
  const year = date.getFullYear();

  // Look at same month in previous years (last 2 years)
  const startDate = new Date(year - 2, month, 1);
  const endDate = new Date(year - 1, month + 1, 0);
  
  // Also include current year's same month if we have data
  const currentYearStart = new Date(year, month, 1);
  const currentYearEnd = new Date(year, month + 1, 0);

  // Get flights from historical period
  const historicalFlights = await prisma.flight.findMany({
    where: {
      departureAirport: airportCode,
      scheduledStart: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      status: true,
    },
  });

  // Get flights from current year's same month (if available)
  const currentYearFlights = await prisma.flight.findMany({
    where: {
      departureAirport: airportCode,
      scheduledStart: {
        gte: currentYearStart,
        lte: currentYearEnd < new Date() ? currentYearEnd : new Date(),
      },
    },
    select: {
      status: true,
    },
  });

  const flights = [...historicalFlights, ...currentYearFlights];

  if (flights.length === 0) {
    return 15; // Default baseline
  }

  const cancelled = flights.filter(
    (f) => f.status === 'WEATHER_CANCELLED'
  ).length;

  return (cancelled / flights.length) * 100;
}

/**
 * Get impact of student level on cancellation probability
 */
function getStudentLevelImpact(level: string): number {
  const impacts: Record<string, number> = {
    EARLY_STUDENT: 8, // More likely to cancel in marginal conditions
    MID_STUDENT: 2,
    ADVANCED_STUDENT: -2,
    SOLO_READY: -5,
    SOLO_CURRENT: -3,
    CHECKRIDE_READY: -1,
  };

  return impacts[level] || 0;
}

/**
 * Get impact of aircraft type on cancellation probability
 */
async function getAircraftTypeImpact(aircraftType: string): Promise<number> {
  // Some aircraft types are more sensitive to weather
  // This could be enhanced with actual aircraft performance data
  
  const type = aircraftType.toLowerCase();
  if (type.includes('cessna 172') || type.includes('piper')) {
    return -2; // More forgiving aircraft
  }
  if (type.includes('complex') || type.includes('twin')) {
    return 5; // More sensitive to weather
  }

  return 0; // Neutral
}

/**
 * Calculate weather impact on cancellation probability
 */
function calculateWeatherImpact(forecast: {
  visibility?: number;
  ceiling?: number;
  windSpeed?: number;
  windGust?: number;
  precipitation?: boolean;
  conditions?: string[];
}): { impact: number; explanation: string } {
  let impact = 0;
  const reasons: string[] = [];

  // Visibility impact
  if (forecast.visibility !== undefined) {
    if (forecast.visibility < 3) {
      impact += 30;
      reasons.push('Very low visibility');
    } else if (forecast.visibility < 5) {
      impact += 15;
      reasons.push('Low visibility');
    } else if (forecast.visibility < 10) {
      impact += 5;
      reasons.push('Reduced visibility');
    }
  }

  // Ceiling impact
  if (forecast.ceiling !== undefined) {
    if (forecast.ceiling < 500) {
      impact += 25;
      reasons.push('Very low ceiling');
    } else if (forecast.ceiling < 1000) {
      impact += 15;
      reasons.push('Low ceiling');
    } else if (forecast.ceiling < 2000) {
      impact += 8;
      reasons.push('Marginal ceiling');
    }
  }

  // Wind impact
  if (forecast.windSpeed !== undefined) {
    if (forecast.windSpeed > 25) {
      impact += 20;
      reasons.push('High winds');
    } else if (forecast.windSpeed > 20) {
      impact += 12;
      reasons.push('Strong winds');
    } else if (forecast.windSpeed > 15) {
      impact += 5;
      reasons.push('Moderate winds');
    }

    if (forecast.windGust && forecast.windGust > forecast.windSpeed + 10) {
      impact += 10;
      reasons.push('Gusty conditions');
    }
  }

  // Precipitation impact
  if (forecast.precipitation) {
    impact += 10;
    reasons.push('Precipitation expected');
  }

  // Condition impacts
  if (forecast.conditions) {
    if (forecast.conditions.some((c) => c.includes('thunderstorm'))) {
      impact += 40;
      reasons.push('Thunderstorms');
    } else if (forecast.conditions.some((c) => c.includes('freezing'))) {
      impact += 35;
      reasons.push('Freezing conditions');
    } else if (forecast.conditions.some((c) => c.includes('fog'))) {
      impact += 20;
      reasons.push('Fog');
    }
  }

  return {
    impact,
    explanation: reasons.length > 0 ? reasons.join(', ') : 'Weather conditions normal',
  };
}

/**
 * Get time of day impact
 */
function getTimeOfDayImpact(date: Date): number {
  const hour = date.getHours();
  
  // Early morning (6-8 AM) and late evening (6-8 PM) have higher cancellation rates
  if (hour >= 6 && hour < 8) {
    return 5; // Early morning fog/weather issues
  }
  if (hour >= 18 && hour < 20) {
    return 3; // Evening weather deterioration
  }
  if (hour >= 8 && hour < 17) {
    return -2; // Mid-day typically better
  }

  return 0;
}

function getTimeOfDayExplanation(date: Date): string {
  const hour = date.getHours();
  if (hour >= 6 && hour < 8) return 'Early morning flights have higher cancellation risk';
  if (hour >= 18 && hour < 20) return 'Evening flights may face deteriorating conditions';
  return 'Mid-day flights typically have better weather';
}

/**
 * Get day of week impact
 */
function getDayOfWeekImpact(date: Date): number {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Weekends might have different patterns (more recreational flights, different weather patterns)
  if (day === 0 || day === 6) {
    return 2; // Slightly higher risk on weekends
  }

  return 0;
}

function getDayOfWeekExplanation(date: Date): string {
  const day = date.getDay();
  if (day === 0 || day === 6) return 'Weekend flights may have different weather patterns';
  return 'Weekday flights follow typical patterns';
}

/**
 * Calculate prediction confidence
 */
function calculateConfidence(input: PredictionInput): number {
  let confidence = 50; // Base confidence

  // More historical data = higher confidence
  confidence += 20;

  // Weather forecast provided = higher confidence
  if (input.weatherForecast) {
    confidence += 20;
  }

  // More specific data = higher confidence
  if (input.aircraftType && input.studentLevel) {
    confidence += 10;
  }

  return Math.min(100, confidence);
}

/**
 * Get recommendation based on probability
 */
function getRecommendation(probability: number): PredictionResult['recommendation'] {
  if (probability >= 70) {
    return 'VERY_HIGH_RISK';
  }
  if (probability >= 50) {
    return 'HIGH_RISK';
  }
  if (probability >= 30) {
    return 'MODERATE_RISK';
  }
  return 'LOW_RISK';
}

/**
 * Get model performance metrics
 */
export async function getModelPerformance(
  schoolId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalPredictions: number;
  accuratePredictions: number;
  accuracy: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
}> {
  // Get flights with predictions and actual outcomes
  const flights = await prisma.flight.findMany({
    where: {
      schoolId,
      scheduledStart: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      weatherChecks: {
        orderBy: { checkTime: 'desc' },
        take: 1,
      },
    },
  });

  // This would require storing predictions, which we'll add to the schema
  // For now, return placeholder metrics
  return {
    totalPredictions: 0,
    accuratePredictions: 0,
    accuracy: 0,
    falsePositives: 0,
    falseNegatives: 0,
    precision: 0,
    recall: 0,
  };
}


import { WeatherData } from './weather-providers/types';
import { prisma } from '@/lib/prisma';

export interface ForecastConfidence {
  confidence: number; // 0-100
  tier: 'HIGH' | 'MEDIUM' | 'LOW';
  factors: {
    timeUntilFlight: number; // hours
    forecastStability: number; // 0-100 (how much forecast has changed)
    weatherPatternType: 'FRONT' | 'POPUP' | 'STABLE' | 'UNKNOWN';
    historicalAccuracy?: number; // 0-100 (if we have historical data)
  };
  trend: 'IMPROVING' | 'WORSENING' | 'STABLE';
  recommendation: 'AUTO_RESCHEDULE' | 'ALERT' | 'MONITOR';
}

/**
 * Calculate forecast confidence based on multiple factors
 */
export async function calculateForecastConfidence(
  flightId: string,
  currentWeather: WeatherData,
  flightTime: Date
): Promise<ForecastConfidence> {
  const flight = await prisma.flight.findUnique({
    where: { id: flightId },
    include: {
      weatherChecks: {
        orderBy: { checkTime: 'desc' },
        take: 5, // Get last 5 weather checks for stability analysis
      },
    },
  });

  if (!flight) {
    throw new Error('Flight not found');
  }

  // Factor 1: Time until flight (closer = higher confidence)
  const now = new Date();
  const hoursUntilFlight = (flightTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  // Confidence decreases with time (0-24 hours: 100-70%, 24-48 hours: 70-50%, 48+ hours: 50-30%)
  let timeConfidence = 100;
  if (hoursUntilFlight > 24) {
    timeConfidence = Math.max(30, 100 - (hoursUntilFlight - 24) * 0.5);
  } else if (hoursUntilFlight > 12) {
    timeConfidence = 70 + (24 - hoursUntilFlight) * 2.5;
  } else {
    timeConfidence = 100 - hoursUntilFlight * 2.5;
  }
  timeConfidence = Math.max(30, Math.min(100, timeConfidence));

  // Factor 2: Forecast stability (how much has the forecast changed?)
  let forecastStability = 100;
  if (flight.weatherChecks.length > 1) {
    const recentChecks = flight.weatherChecks.slice(0, 3);
    const visibilityChanges = recentChecks.map((check, idx) => {
      if (idx === 0) return 0;
      return Math.abs((check.visibility || 0) - (recentChecks[idx - 1].visibility || 0));
    });
    const ceilingChanges = recentChecks.map((check, idx) => {
      if (idx === 0) return 0;
      return Math.abs((check.ceiling || 0) - (recentChecks[idx - 1].ceiling || 0));
    });
    
    const avgVisibilityChange = visibilityChanges.reduce((a, b) => a + b, 0) / visibilityChanges.length;
    const avgCeilingChange = ceilingChanges.reduce((a, b) => a + b, 0) / ceilingChanges.length;
    
    // Stability decreases with changes (0-1 SM change = 100%, 1-3 SM = 80%, 3+ SM = 60%)
    const visibilityStability = avgVisibilityChange < 1 ? 100 : avgVisibilityChange < 3 ? 80 : 60;
    const ceilingStability = avgCeilingChange < 200 ? 100 : avgCeilingChange < 500 ? 80 : 60;
    
    forecastStability = (visibilityStability + ceilingStability) / 2;
  }

  // Factor 3: Weather pattern type
  let weatherPatternType: 'FRONT' | 'POPUP' | 'STABLE' | 'UNKNOWN' = 'UNKNOWN';
  if (currentWeather.conditions?.includes('TS')) {
    weatherPatternType = 'POPUP';
  } else if (currentWeather.wind.speed > 15 || currentWeather.conditions?.includes('RA')) {
    weatherPatternType = 'FRONT';
  } else {
    weatherPatternType = 'STABLE';
  }

  // Pattern confidence: STABLE = high, FRONT = medium, POPUP = low
  let patternConfidence = 100;
  if (weatherPatternType === 'STABLE') {
    patternConfidence = 90;
  } else if (weatherPatternType === 'FRONT') {
    patternConfidence = 70;
  } else {
    patternConfidence = 50; // POPUP storms are unpredictable
  }

  // Factor 4: Historical accuracy (if we have data)
  // This would require tracking forecast accuracy over time
  // For now, use a default value
  const historicalAccuracy = 75; // Placeholder

  // Calculate overall confidence (weighted average)
  const overallConfidence = Math.round(
    timeConfidence * 0.4 + // Time is most important
    forecastStability * 0.3 + // Stability is important
    patternConfidence * 0.2 + // Pattern type matters
    historicalAccuracy * 0.1 // Historical data helps
  );

  // Determine tier
  let tier: 'HIGH' | 'MEDIUM' | 'LOW';
  if (overallConfidence >= 90) {
    tier = 'HIGH';
  } else if (overallConfidence >= 60) {
    tier = 'MEDIUM';
  } else {
    tier = 'LOW';
  }

  // Determine trend (comparing current weather to previous checks)
  let trend: 'IMPROVING' | 'WORSENING' | 'STABLE' = 'STABLE';
  if (flight.weatherChecks.length > 1) {
    const latest = flight.weatherChecks[0];
    const previous = flight.weatherChecks[1];
    
    const visibilityDiff = (latest.visibility || 0) - (previous.visibility || 0);
    const ceilingDiff = (latest.ceiling || 0) - (previous.ceiling || 0);
    
    if (visibilityDiff > 1 && ceilingDiff > 500) {
      trend = 'IMPROVING';
    } else if (visibilityDiff < -1 || ceilingDiff < -500) {
      trend = 'WORSENING';
    }
  }

  // Determine recommendation
  let recommendation: 'AUTO_RESCHEDULE' | 'ALERT' | 'MONITOR';
  if (tier === 'HIGH' && currentWeather.visibility.value < 3) {
    recommendation = 'AUTO_RESCHEDULE';
  } else if (tier === 'MEDIUM') {
    recommendation = 'ALERT';
  } else {
    recommendation = 'MONITOR';
  }

  return {
    confidence: overallConfidence,
    tier,
    factors: {
      timeUntilFlight: hoursUntilFlight,
      forecastStability: Math.round(forecastStability),
      weatherPatternType,
      historicalAccuracy,
    },
    trend,
    recommendation,
  };
}

/**
 * Get watch list flights (medium confidence flights that need monitoring)
 */
export async function getWatchListFlights(schoolId?: string): Promise<any[]> {
  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const flights = await prisma.flight.findMany({
    where: {
      schoolId: schoolId || undefined,
      scheduledStart: {
        gte: now,
        lte: next24Hours,
      },
      status: {
        in: ['PENDING', 'CONFIRMED'],
      },
    },
    include: {
      student: true,
      aircraft: true,
      weatherChecks: {
        orderBy: { checkTime: 'desc' },
        take: 1,
      },
    },
  });

  // Filter flights with medium confidence weather checks
  const watchList = flights.filter(flight => {
    const latestCheck = flight.weatherChecks[0];
    if (!latestCheck) return false;
    
    // Medium confidence = 60-89%
    return latestCheck.confidence >= 60 && latestCheck.confidence < 90;
  });

  return watchList;
}


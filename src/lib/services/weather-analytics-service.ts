import { prisma } from '@/lib/prisma';
import { WeatherCheckResult } from '@prisma/client';

/**
 * Weather Analytics Service
 * 
 * Provides historical weather analysis and insights for flight schools.
 */

export interface MonthlyWeatherPattern {
  month: number; // 1-12
  monthName: string;
  totalChecks: number;
  safeCount: number;
  marginalCount: number;
  unsafeCount: number;
  avgVisibility: number;
  avgCeiling: number;
  avgWindSpeed: number;
  cancellationRate: number;
}

export interface AirportWeatherPattern {
  airportCode: string;
  totalChecks: number;
  safeRate: number;
  marginalRate: number;
  unsafeRate: number;
  avgVisibility: number;
  avgCeiling: number;
  commonConditions: string[];
}

export interface CancellationTrend {
  date: string; // YYYY-MM-DD
  totalFlights: number;
  weatherCancellations: number;
  cancellationRate: number;
}

export interface ForecastAccuracy {
  date: string;
  predictedResult: WeatherCheckResult;
  actualResult: WeatherCheckResult;
  accuracy: boolean;
  confidence: number;
}

export interface OptimalTrainingWindow {
  month: number;
  monthName: string;
  recommendation: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  reasoning: string;
  avgSafeRate: number;
}

export interface WeatherInsight {
  type: 'BEST_TRAINING_TIME' | 'WEATHER_IMPROVEMENT' | 'SEASONAL_PATTERN';
  title: string;
  description: string;
  recommendation: string;
  confidence: number;
}

/**
 * Get monthly weather patterns for a school
 */
export async function getMonthlyWeatherPatterns(
  schoolId: string,
  startDate: Date,
  endDate: Date
): Promise<MonthlyWeatherPattern[]> {
  const weatherChecks = await prisma.weatherCheck.findMany({
    where: {
      flight: {
        schoolId,
        scheduledStart: {
          gte: startDate,
          lte: endDate,
        },
      },
    },
    include: {
      flight: true,
    },
  });

  // Group by month
  const monthlyData = new Map<number, {
    checks: typeof weatherChecks;
    cancellations: number;
  }>();

  for (const check of weatherChecks) {
    const month = check.checkTime.getMonth() + 1; // 1-12
    if (!monthlyData.has(month)) {
      monthlyData.set(month, { checks: [], cancellations: 0 });
    }
    monthlyData.get(month)!.checks.push(check);
    
    // Count cancellations
    if (check.flight.status === 'WEATHER_CANCELLED') {
      monthlyData.get(month)!.cancellations++;
    }
  }

  const patterns: MonthlyWeatherPattern[] = [];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  for (let month = 1; month <= 12; month++) {
    const data = monthlyData.get(month);
    if (!data || data.checks.length === 0) {
      patterns.push({
        month,
        monthName: monthNames[month - 1],
        totalChecks: 0,
        safeCount: 0,
        marginalCount: 0,
        unsafeCount: 0,
        avgVisibility: 0,
        avgCeiling: 0,
        avgWindSpeed: 0,
        cancellationRate: 0,
      });
      continue;
    }

    const checks = data.checks;
    const safeCount = checks.filter(c => c.result === 'SAFE').length;
    const marginalCount = checks.filter(c => c.result === 'MARGINAL').length;
    const unsafeCount = checks.filter(c => c.result === 'UNSAFE').length;

    const avgVisibility = checks
      .filter(c => c.visibility !== null)
      .reduce((sum, c) => sum + (c.visibility || 0), 0) / checks.filter(c => c.visibility !== null).length || 0;

    const avgCeiling = checks
      .filter(c => c.ceiling !== null)
      .reduce((sum, c) => sum + (c.ceiling || 0), 0) / checks.filter(c => c.ceiling !== null).length || 0;

    const avgWindSpeed = checks
      .filter(c => c.windSpeed !== null)
      .reduce((sum, c) => sum + (c.windSpeed || 0), 0) / checks.filter(c => c.windSpeed !== null).length || 0;

    const totalFlights = new Set(checks.map(c => c.flightId)).size;
    const cancellationRate = totalFlights > 0 ? (data.cancellations / totalFlights) * 100 : 0;

    patterns.push({
      month,
      monthName: monthNames[month - 1],
      totalChecks: checks.length,
      safeCount,
      marginalCount,
      unsafeCount,
      avgVisibility,
      avgCeiling,
      avgWindSpeed,
      cancellationRate,
    });
  }

  return patterns;
}

/**
 * Get airport-specific weather patterns
 */
export async function getAirportWeatherPatterns(
  schoolId: string,
  startDate: Date,
  endDate: Date
): Promise<AirportWeatherPattern[]> {
  const weatherChecks = await prisma.weatherCheck.findMany({
    where: {
      flight: {
        schoolId,
        scheduledStart: {
          gte: startDate,
          lte: endDate,
        },
      },
    },
  });

  // Group by airport
  const airportData = new Map<string, typeof weatherChecks>();

  for (const check of weatherChecks) {
    const airport = check.location;
    if (!airportData.has(airport)) {
      airportData.set(airport, []);
    }
    airportData.get(airport)!.push(check);
  }

  const patterns: AirportWeatherPattern[] = [];

  for (const [airportCode, checks] of airportData.entries()) {
    const totalChecks = checks.length;
    const safeCount = checks.filter(c => c.result === 'SAFE').length;
    const marginalCount = checks.filter(c => c.result === 'MARGINAL').length;
    const unsafeCount = checks.filter(c => c.result === 'UNSAFE').length;

    const avgVisibility = checks
      .filter(c => c.visibility !== null)
      .reduce((sum, c) => sum + (c.visibility || 0), 0) / checks.filter(c => c.visibility !== null).length || 0;

    const avgCeiling = checks
      .filter(c => c.ceiling !== null)
      .reduce((sum, c) => sum + (c.ceiling || 0), 0) / checks.filter(c => c.ceiling !== null).length || 0;

    // Get common conditions
    const conditions = checks
      .filter(c => c.conditions)
      .map(c => c.conditions!.split(','))
      .flat()
      .map(c => c.trim())
      .filter(c => c.length > 0);

    const conditionCounts = new Map<string, number>();
    for (const condition of conditions) {
      conditionCounts.set(condition, (conditionCounts.get(condition) || 0) + 1);
    }

    const commonConditions = Array.from(conditionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([condition]) => condition);

    patterns.push({
      airportCode,
      totalChecks,
      safeRate: (safeCount / totalChecks) * 100,
      marginalRate: (marginalCount / totalChecks) * 100,
      unsafeRate: (unsafeCount / totalChecks) * 100,
      avgVisibility,
      avgCeiling,
      commonConditions,
    });
  }

  return patterns.sort((a, b) => b.totalChecks - a.totalChecks);
}

/**
 * Get cancellation trends over time
 */
export async function getCancellationTrends(
  schoolId: string,
  startDate: Date,
  endDate: Date,
  groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<CancellationTrend[]> {
  const flights = await prisma.flight.findMany({
    where: {
      schoolId,
      scheduledStart: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      scheduledStart: true,
      status: true,
    },
  });

  // Group by time period
  const grouped = new Map<string, {
    total: number;
    cancelled: number;
  }>();

  for (const flight of flights) {
    let key: string;
    const date = new Date(flight.scheduledStart);

    if (groupBy === 'day') {
      key = date.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (groupBy === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
    }

    if (!grouped.has(key)) {
      grouped.set(key, { total: 0, cancelled: 0 });
    }

    const group = grouped.get(key)!;
    group.total++;
    if (flight.status === 'WEATHER_CANCELLED') {
      group.cancelled++;
    }
  }

  const trends: CancellationTrend[] = Array.from(grouped.entries())
    .map(([date, data]) => ({
      date,
      totalFlights: data.total,
      weatherCancellations: data.cancelled,
      cancellationRate: (data.cancelled / data.total) * 100,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return trends;
}

/**
 * Get optimal training windows based on historical data
 */
export async function getOptimalTrainingWindows(
  schoolId: string,
  startDate: Date,
  endDate: Date
): Promise<OptimalTrainingWindow[]> {
  const monthlyPatterns = await getMonthlyWeatherPatterns(schoolId, startDate, endDate);

  const windows: OptimalTrainingWindow[] = monthlyPatterns
    .filter(p => p.totalChecks > 0)
    .map(pattern => {
      const safeRate = (pattern.safeCount / pattern.totalChecks) * 100;
      let recommendation: OptimalTrainingWindow['recommendation'];
      let reasoning: string;

      if (safeRate >= 80) {
        recommendation = 'EXCELLENT';
        reasoning = `High safe weather rate (${safeRate.toFixed(1)}%) with good visibility and ceiling conditions.`;
      } else if (safeRate >= 65) {
        recommendation = 'GOOD';
        reasoning = `Good weather conditions (${safeRate.toFixed(1)}% safe rate). Some marginal days expected.`;
      } else if (safeRate >= 50) {
        recommendation = 'FAIR';
        reasoning = `Moderate weather conditions (${safeRate.toFixed(1)}% safe rate). Plan for some cancellations.`;
      } else {
        recommendation = 'POOR';
        reasoning = `Challenging weather conditions (${safeRate.toFixed(1)}% safe rate). High cancellation risk.`;
      }

      return {
        month: pattern.month,
        monthName: pattern.monthName,
        recommendation,
        reasoning,
        avgSafeRate: safeRate,
      };
    });

  return windows;
}

/**
 * Generate predictive insights
 */
export async function generateWeatherInsights(
  schoolId: string,
  startDate: Date,
  endDate: Date
): Promise<WeatherInsight[]> {
  const insights: WeatherInsight[] = [];
  const monthlyPatterns = await getMonthlyWeatherPatterns(schoolId, startDate, endDate);
  const optimalWindows = await getOptimalTrainingWindows(schoolId, startDate, endDate);

  // Best training time insight
  const bestMonth = optimalWindows
    .filter(w => w.recommendation === 'EXCELLENT' || w.recommendation === 'GOOD')
    .sort((a, b) => b.avgSafeRate - a.avgSafeRate)[0];

  if (bestMonth) {
    insights.push({
      type: 'BEST_TRAINING_TIME',
      title: 'Optimal Training Window',
      description: `${bestMonth.monthName} offers the best weather conditions for flight training.`,
      recommendation: `Schedule intensive training programs during ${bestMonth.monthName} for maximum completion rates.`,
      confidence: bestMonth.avgSafeRate,
    });
  }

  // Seasonal pattern insight
  const worstMonth = optimalWindows
    .filter(w => w.recommendation === 'POOR' || w.recommendation === 'FAIR')
    .sort((a, b) => a.avgSafeRate - b.avgSafeRate)[0];

  if (worstMonth) {
    insights.push({
      type: 'SEASONAL_PATTERN',
      title: 'Challenging Weather Period',
      description: `${worstMonth.monthName} typically has more challenging weather conditions.`,
      recommendation: `Plan for increased cancellations and consider flexible scheduling during ${worstMonth.monthName}.`,
      confidence: 100 - worstMonth.avgSafeRate,
    });
  }

  // Weather improvement prediction (simplified - would use ML in production)
  const recentPatterns = monthlyPatterns
    .filter(p => p.totalChecks > 0)
    .slice(-3); // Last 3 months with data

  if (recentPatterns.length >= 2) {
    const latest = recentPatterns[recentPatterns.length - 1];
    const previous = recentPatterns[recentPatterns.length - 2];
    
    if (latest.avgSafeRate > previous.avgSafeRate) {
      insights.push({
        type: 'WEATHER_IMPROVEMENT',
        title: 'Improving Weather Conditions',
        description: `Weather conditions have improved from ${previous.monthName} to ${latest.monthName}.`,
        recommendation: 'Current trend suggests favorable conditions for upcoming flights.',
        confidence: Math.min(85, latest.avgSafeRate),
      });
    }
  }

  return insights;
}

/**
 * Generate weather report for a student
 */
export async function generateStudentWeatherReport(
  studentId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  studentName: string;
  totalFlights: number;
  weatherCancellations: number;
  cancellationRate: number;
  avgWeatherConditions: {
    visibility: number;
    ceiling: number;
    windSpeed: number;
  };
  bestTrainingMonths: string[];
  recommendations: string[];
}> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { firstName: true, lastName: true, schoolId: true },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  const flights = await prisma.flight.findMany({
    where: {
      studentId,
      scheduledStart: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      weatherChecks: {
        orderBy: { checkTime: 'desc' },
        take: 1, // Latest check per flight
      },
    },
  });

  const totalFlights = flights.length;
  const weatherCancellations = flights.filter(f => f.status === 'WEATHER_CANCELLED').length;
  const cancellationRate = totalFlights > 0 ? (weatherCancellations / totalFlights) * 100 : 0;

  // Calculate average weather conditions
  const weatherChecks = flights
    .flatMap(f => f.weatherChecks)
    .filter(wc => wc.visibility !== null && wc.ceiling !== null && wc.windSpeed !== null);

  const avgVisibility = weatherChecks.length > 0
    ? weatherChecks.reduce((sum, wc) => sum + (wc.visibility || 0), 0) / weatherChecks.length
    : 0;

  const avgCeiling = weatherChecks.length > 0
    ? weatherChecks.reduce((sum, wc) => sum + (wc.ceiling || 0), 0) / weatherChecks.length
    : 0;

  const avgWindSpeed = weatherChecks.length > 0
    ? weatherChecks.reduce((sum, wc) => sum + (wc.windSpeed || 0), 0) / weatherChecks.length
    : 0;

  // Get best training months for this school
  const optimalWindows = await getOptimalTrainingWindows(
    student.schoolId,
    startDate,
    endDate
  );
  const bestTrainingMonths = optimalWindows
    .filter(w => w.recommendation === 'EXCELLENT' || w.recommendation === 'GOOD')
    .map(w => w.monthName);

  // Generate recommendations
  const recommendations: string[] = [];
  if (cancellationRate > 30) {
    recommendations.push('Consider scheduling flights during historically better weather months.');
  }
  if (avgVisibility < 5) {
    recommendations.push('Visibility conditions have been challenging. Plan for potential delays.');
  }
  if (bestTrainingMonths.length > 0) {
    recommendations.push(`Best training months: ${bestTrainingMonths.join(', ')}`);
  }

  return {
    studentName: `${student.firstName} ${student.lastName}`,
    totalFlights,
    weatherCancellations,
    cancellationRate,
    avgWeatherConditions: {
      visibility: avgVisibility,
      ceiling: avgCeiling,
      windSpeed: avgWindSpeed,
    },
    bestTrainingMonths,
    recommendations,
  };
}


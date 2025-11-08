import { TrainingLevel, FlightType, AircraftType } from '@prisma/client';
import { WeatherData } from './weather-providers/types';
import { getWeatherAdapter } from './weather-providers/adapter';

// Re-export WeatherData for backward compatibility
export type { WeatherData };

export interface WeatherMinimums {
  visibility: number; // statute miles
  ceiling: number; // feet AGL
  maxWind: number; // knots
  maxCrosswind: number; // knots
  maxGust: number; // knots
  allowPrecipitation: boolean;
}

export interface WeatherCheckResult {
  result: 'SAFE' | 'MARGINAL' | 'UNSAFE';
  confidence: number;
  reasons: string[];
}

/**
 * Get weather minimums based on training level, aircraft type, and flight type
 */
export function getWeatherMinimums(
  trainingLevel: TrainingLevel,
  aircraftType: AircraftType,
  flightType: FlightType
): WeatherMinimums {
  let baseMinimums: WeatherMinimums;

  // Base minimums by training level
  switch (trainingLevel) {
    case 'EARLY_STUDENT':
      baseMinimums = {
        visibility: 10,
        ceiling: 3000,
        maxWind: 8,
        maxCrosswind: 5,
        maxGust: 0,
        allowPrecipitation: false,
      };
      break;
    case 'MID_STUDENT':
      baseMinimums = {
        visibility: 5,
        ceiling: 1500,
        maxWind: 12,
        maxCrosswind: 8,
        maxGust: 5,
        allowPrecipitation: true,
      };
      break;
    case 'ADVANCED_STUDENT':
      baseMinimums = {
        visibility: 3,
        ceiling: 1000,
        maxWind: 15,
        maxCrosswind: 10,
        maxGust: 8,
        allowPrecipitation: true,
      };
      break;
    case 'PRIVATE_PILOT':
      baseMinimums = {
        visibility: 3,
        ceiling: 1000,
        maxWind: 20,
        maxCrosswind: 15,
        maxGust: 10,
        allowPrecipitation: true,
      };
      break;
    case 'INSTRUMENT_RATED':
      baseMinimums = {
        visibility: 0.5, // IMC
        ceiling: 200,
        maxWind: 25,
        maxCrosswind: 20,
        maxGust: 15,
        allowPrecipitation: true,
      };
      break;
    default:
      baseMinimums = {
        visibility: 3,
        ceiling: 1000,
        maxWind: 15,
        maxCrosswind: 10,
        maxGust: 8,
        allowPrecipitation: true,
      };
  }

  // Adjust for solo flights (stricter)
  if (flightType === 'SOLO_SUPERVISED' || flightType === 'SOLO_UNSUPERVISED') {
    baseMinimums.visibility += 1;
    baseMinimums.ceiling += 500;
    baseMinimums.maxWind -= 2;
    baseMinimums.maxCrosswind -= 2;
  }

  // Adjust for aircraft limitations
  if (aircraftType.crosswindLimit < baseMinimums.maxCrosswind) {
    baseMinimums.maxCrosswind = aircraftType.crosswindLimit;
  }
  if (aircraftType.maxWindSpeed < baseMinimums.maxWind) {
    baseMinimums.maxWind = aircraftType.maxWindSpeed;
  }

  return baseMinimums;
}

/**
 * Check if weather is safe for flight
 */
export function checkWeatherSafety(
  weather: WeatherData,
  minimums: WeatherMinimums
): WeatherCheckResult {
  const reasons: string[] = [];
  let unsafeCount = 0;
  let marginalCount = 0;

  // Check visibility
  if (weather.visibility.value < minimums.visibility) {
    reasons.push(
      `Visibility ${weather.visibility.value} SM below minimum ${minimums.visibility} SM`
    );
    unsafeCount++;
  } else if (weather.visibility.value < minimums.visibility * 1.2) {
    reasons.push(`Visibility ${weather.visibility.value} SM is marginal`);
    marginalCount++;
  }

  // Check ceiling
  const ceiling = weather.clouds[0]?.altitude || 99999;
  if (ceiling < minimums.ceiling) {
    reasons.push(
      `Ceiling ${ceiling} ft below minimum ${minimums.ceiling} ft`
    );
    unsafeCount++;
  } else if (ceiling < minimums.ceiling * 1.2) {
    reasons.push(`Ceiling ${ceiling} ft is marginal`);
    marginalCount++;
  }

  // Check wind speed
  if (weather.wind.speed > minimums.maxWind) {
    reasons.push(
      `Wind speed ${weather.wind.speed} kt exceeds maximum ${minimums.maxWind} kt`
    );
    unsafeCount++;
  } else if (weather.wind.speed > minimums.maxWind * 0.9) {
    reasons.push(`Wind speed ${weather.wind.speed} kt is marginal`);
    marginalCount++;
  }

  // Check gusts
  if (weather.wind.gust && weather.wind.gust > minimums.maxGust) {
    reasons.push(
      `Wind gusts ${weather.wind.gust} kt exceed maximum ${minimums.maxGust} kt`
    );
    unsafeCount++;
  }

  // Check precipitation
  if (!minimums.allowPrecipitation && weather.conditions?.some(c => 
    ['RA', 'SN', 'TS', 'SH'].includes(c)
  )) {
    reasons.push('Precipitation present but not allowed for this training level');
    unsafeCount++;
  }

  // Determine result
  let result: 'SAFE' | 'MARGINAL' | 'UNSAFE';
  if (unsafeCount > 0) {
    result = 'UNSAFE';
  } else if (marginalCount > 0 || reasons.length > 0) {
    result = 'MARGINAL';
  } else {
    result = 'SAFE';
  }

  // Calculate confidence (higher = more confident)
  const confidence = result === 'SAFE' ? 95 : result === 'MARGINAL' ? 70 : 90;

  return {
    result,
    confidence,
    reasons: reasons.length > 0 ? reasons : ['Weather conditions are safe for flight'],
  };
}

/**
 * Fetch current weather using the provider adapter
 * This function now uses the adapter pattern with fallback logic
 * @param airportCode - Airport ICAO code (e.g., "KAUS")
 * @param schoolId - Optional school ID to check WeatherAPI.com settings
 */
export async function fetchFAAWeather(
  airportCode: string,
  schoolId?: string
): Promise<WeatherData | null> {
  const adapter = getWeatherAdapter();
  return adapter.getCurrentWeather(airportCode, schoolId);
}


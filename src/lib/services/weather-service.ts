import { TrainingLevel, FlightType, AircraftType } from '@prisma/client';

export interface WeatherData {
  station: string;
  time: Date;
  wind: {
    direction: number;
    speed: number;
    gust?: number;
    units: 'knots';
  };
  visibility: {
    value: number;
    units: 'statute miles';
  };
  clouds: Array<{
    cover: string;
    altitude: number;
  }>;
  temperature: number;
  dewpoint: number;
  altimeter: number;
  conditions?: string[];
}

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
 * Fetch current weather from FAA Aviation Weather Center
 */
export async function fetchFAAWeather(airportCode: string): Promise<WeatherData | null> {
  try {
    // FAA METAR endpoint
    const url = `https://aviationweather.gov/api/data/metar?ids=${airportCode}&format=json`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`FAA API returned ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      return null;
    }

    const metar = data[0];
    return parseMETAR(metar.rawOb || metar.rawText);
  } catch (error) {
    console.error('Error fetching FAA weather:', error);
    return null;
  }
}

/**
 * Parse METAR string into WeatherData
 */
function parseMETAR(metarString: string): WeatherData | null {
  try {
    // Simplified METAR parser
    // Full implementation would use a proper METAR library
    const parts = metarString.split(' ');
    
    // Extract station code
    const station = parts[0];
    
    // Extract wind (e.g., "18008KT" or "18008G15KT")
    const windMatch = metarString.match(/(\d{3})(\d{2,3})(G(\d{2,3}))?KT/);
    const wind = {
      direction: windMatch ? parseInt(windMatch[1]) : 0,
      speed: windMatch ? parseInt(windMatch[2]) : 0,
      gust: windMatch?.[4] ? parseInt(windMatch[4]) : undefined,
      units: 'knots' as const,
    };

    // Extract visibility (e.g., "10SM")
    const visMatch = metarString.match(/(\d+)(SM|M)/);
    const visibility = {
      value: visMatch ? parseInt(visMatch[1]) : 10,
      units: 'statute miles' as const,
    };

    // Extract clouds (e.g., "FEW250", "SCT1000", "BKN030")
    const cloudMatches = metarString.matchAll(/(FEW|SCT|BKN|OVC)(\d{3})/g);
    const clouds = Array.from(cloudMatches).map(match => ({
      cover: match[1],
      altitude: parseInt(match[2]) * 100, // Convert to feet
    }));

    // Extract temperature (e.g., "23/14")
    const tempMatch = metarString.match(/(\d{2})\/(\d{2})/);
    const temperature = tempMatch ? parseInt(tempMatch[1]) : 20;
    const dewpoint = tempMatch ? parseInt(tempMatch[2]) : 10;

    // Extract altimeter (e.g., "A3012")
    const altMatch = metarString.match(/A(\d{4})/);
    const altimeter = altMatch ? parseFloat(altMatch[1]) / 100 : 30.12;

    // Extract conditions
    const conditions: string[] = [];
    if (metarString.includes('RA')) conditions.push('RA');
    if (metarString.includes('SN')) conditions.push('SN');
    if (metarString.includes('TS')) conditions.push('TS');
    if (metarString.includes('SH')) conditions.push('SH');

    return {
      station,
      time: new Date(),
      wind,
      visibility,
      clouds: clouds.length > 0 ? clouds : [{ cover: 'CLR', altitude: 99999 }],
      temperature,
      dewpoint,
      altimeter,
      conditions: conditions.length > 0 ? conditions : undefined,
    };
  } catch (error) {
    console.error('Error parsing METAR:', error);
    return null;
  }
}


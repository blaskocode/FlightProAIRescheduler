import { WeatherData } from './weather-providers/types';
import { getWeatherAdapter } from './weather-providers/adapter';
import { WeatherCheckResult } from './weather-service';
import { getAirportCoordinates } from '@/lib/utils/airport-coordinates';

export interface RouteWaypoint {
  airportCode: string;
  latitude: number;
  longitude: number;
  order: number; // 0 = departure, 1+ = waypoints, last = destination
}

export interface RouteWeatherCheck {
  waypoint: RouteWaypoint;
  weather: WeatherData | null;
  checkResult?: WeatherCheckResult;
  checked: boolean;
  error?: string;
}

export interface RouteWeatherResult {
  route: string;
  waypoints: RouteWaypoint[];
  checks: RouteWeatherCheck[];
  overallResult: 'SAFE' | 'MARGINAL' | 'UNSAFE';
  confidence: number;
  reasons: string[];
  unsafeWaypoints: string[];
  marginalWaypoints: string[];
}

/**
 * Parse route string into waypoints
 * Format: "KAUS-KHYI-KAUS" or "KAUS->KHYI->KAUS"
 */
export function parseRoute(routeString: string): string[] {
  // Remove whitespace and split by dash or arrow
  const cleaned = routeString.trim().replace(/\s+/g, '');
  const waypoints = cleaned.split(/[->]+/).filter(wp => wp.length > 0);
  
  // Validate all waypoints are 4-character ICAO codes
  const validWaypoints = waypoints.filter(wp => /^[A-Z]{4}$/.test(wp.toUpperCase()));
  
  if (validWaypoints.length < 2) {
    throw new Error('Route must contain at least 2 valid airport codes');
  }
  
  return validWaypoints.map(wp => wp.toUpperCase());
}

/**
 * Check weather for all waypoints in a route
 */
export async function checkRouteWeather(
  routeString: string,
  schoolId?: string,
  minimums?: any // WeatherMinimums from weather-service
): Promise<RouteWeatherResult> {
  const adapter = getWeatherAdapter();
  
  // Parse route
  const airportCodes = parseRoute(routeString);
  
  // Get waypoint coordinates
  const waypoints: RouteWaypoint[] = await Promise.all(
    airportCodes.map(async (code, index) => {
      const coords = await getAirportCoordinates(code);
      return {
        airportCode: code,
        latitude: coords.latitude,
        longitude: coords.longitude,
        order: index,
      };
    })
  );
  
  // Check weather for each waypoint
  const checks: RouteWeatherCheck[] = await Promise.all(
    waypoints.map(async (waypoint) => {
      try {
        const weather = await adapter.getCurrentWeather(waypoint.airportCode, schoolId);
        
        return {
          waypoint,
          weather,
          checked: true,
        };
      } catch (error: any) {
        return {
          waypoint,
          weather: null,
          checked: false,
          error: error.message || 'Failed to fetch weather',
        };
      }
    })
  );
  
  // Aggregate results
  const unsafeWaypoints: string[] = [];
  const marginalWaypoints: string[] = [];
  const reasons: string[] = [];
  let unsafeCount = 0;
  let marginalCount = 0;
  
  // If minimums provided, check each waypoint
  if (minimums) {
    const { checkWeatherSafety } = await import('./weather-service');
    
    checks.forEach((check) => {
      if (check.weather) {
        const result = checkWeatherSafety(check.weather, minimums);
        check.checkResult = result;
        
        if (result.result === 'UNSAFE') {
          unsafeWaypoints.push(check.waypoint.airportCode);
          unsafeCount++;
          reasons.push(`${check.waypoint.airportCode}: ${result.reasons.join(', ')}`);
        } else if (result.result === 'MARGINAL') {
          marginalWaypoints.push(check.waypoint.airportCode);
          marginalCount++;
          reasons.push(`${check.waypoint.airportCode}: ${result.reasons.join(', ')}`);
        }
      } else if (check.error) {
        reasons.push(`${check.waypoint.airportCode}: Weather data unavailable`);
        marginalCount++; // Treat missing data as marginal
      }
    });
  }
  
  // Determine overall result
  let overallResult: 'SAFE' | 'MARGINAL' | 'UNSAFE';
  if (unsafeCount > 0) {
    overallResult = 'UNSAFE';
  } else if (marginalCount > 0 || checks.some(c => !c.weather)) {
    overallResult = 'MARGINAL';
  } else {
    overallResult = 'SAFE';
  }
  
  // Calculate confidence
  const totalChecks = checks.length;
  const successfulChecks = checks.filter(c => c.weather).length;
  const confidence = totalChecks > 0 
    ? Math.round((successfulChecks / totalChecks) * 100)
    : 0;
  
  return {
    route: routeString,
    waypoints,
    checks,
    overallResult,
    confidence,
    reasons: reasons.length > 0 ? reasons : ['All waypoints have safe weather conditions'],
    unsafeWaypoints,
    marginalWaypoints,
  };
}

/**
 * Interpolate waypoints along a route (for long routes)
 * This calculates intermediate points between departure and destination
 */
export function interpolateWaypoints(
  departure: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  maxDistance: number = 100 // nautical miles
): Array<{ latitude: number; longitude: number }> {
  // Calculate distance using Haversine formula
  const R = 3440; // Earth radius in nautical miles
  const dLat = (destination.latitude - departure.latitude) * Math.PI / 180;
  const dLon = (destination.longitude - departure.longitude) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(departure.latitude * Math.PI / 180) *
    Math.cos(destination.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  // If distance is less than maxDistance, no interpolation needed
  if (distance <= maxDistance) {
    return [];
  }
  
  // Calculate number of intermediate points needed
  const numPoints = Math.ceil(distance / maxDistance) - 1;
  const waypoints: Array<{ latitude: number; longitude: number }> = [];
  
  for (let i = 1; i <= numPoints; i++) {
    const fraction = i / (numPoints + 1);
    waypoints.push({
      latitude: departure.latitude + (destination.latitude - departure.latitude) * fraction,
      longitude: departure.longitude + (destination.longitude - departure.longitude) * fraction,
    });
  }
  
  return waypoints;
}


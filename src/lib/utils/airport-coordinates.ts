import { prisma } from '@/lib/prisma';

/**
 * Common airport coordinates lookup (fallback for airports not in School table)
 */
const COMMON_AIRPORTS: Record<string, { latitude: number; longitude: number }> = {
  KAUS: { latitude: 30.1945, longitude: -97.6699 }, // Austin-Bergstrom
  KDAL: { latitude: 32.8471, longitude: -96.8518 }, // Dallas Love Field
  KHOU: { latitude: 29.6454, longitude: -95.2789 }, // Houston Hobby
  KDFW: { latitude: 32.8998, longitude: -97.0403 }, // Dallas/Fort Worth
  KIAH: { latitude: 29.9844, longitude: -95.3414 }, // Houston Intercontinental
  KSAT: { latitude: 29.5337, longitude: -98.4698 }, // San Antonio International
  KELP: { latitude: 31.8072, longitude: -106.3778 }, // El Paso International
  KPHX: { latitude: 33.4342, longitude: -112.0080 }, // Phoenix Sky Harbor
  KHYI: { latitude: 30.0618, longitude: -97.9614 }, // San Marcos Regional
  KORD: { latitude: 41.9786, longitude: -87.9048 }, // Chicago O'Hare
  KLAX: { latitude: 33.9425, longitude: -118.4081 }, // Los Angeles
  KJFK: { latitude: 40.6413, longitude: -73.7781 }, // New York JFK
  KATL: { latitude: 33.6407, longitude: -84.4277 }, // Atlanta
  KDEN: { latitude: 39.8561, longitude: -104.6737 }, // Denver
};

/**
 * Get airport coordinates from School table or fallback lookup
 */
export async function getAirportCoordinates(
  airportCode: string
): Promise<{ latitude: number; longitude: number }> {
  // Try to find in School table first
  const school = await prisma.school.findUnique({
    where: { airportCode: airportCode.toUpperCase() },
    select: { latitude: true, longitude: true },
  });

  if (school) {
    return {
      latitude: school.latitude,
      longitude: school.longitude,
    };
  }

  // Fallback to common airports lookup
  const coordinates = COMMON_AIRPORTS[airportCode.toUpperCase()];
  if (coordinates) {
    return coordinates;
  }

  // Default to 0,0 if not found (shouldn't happen in production)
  console.warn(`Airport coordinates not found for ${airportCode}, using 0,0`);
  return { latitude: 0, longitude: 0 };
}


import { prisma } from '@/lib/prisma';

export interface WeatherImpactMetrics {
  totalFlights: number;
  weatherCancellations: number;
  cancellationRate: number;
  successfulReschedules: number;
  rescheduleRate: number;
  avgRescheduleTime: number; // hours
  revenueProtected: number; // estimated
  revenueLost: number; // estimated
}

export interface AircraftUtilization {
  tailNumber: string;
  scheduledHours: number;
  flownHours: number;
  utilizationRate: number;
  maintenanceHours: number;
  downtimeHours: number;
}

export interface InstructorEfficiency {
  id: string;
  name: string;
  scheduledHours: number;
  actualHours: number;
  studentCount: number;
  efficiency: number; // actualHours / scheduledHours
  completionRate: number; // % of flights completed
}

export interface StudentProgressMetrics {
  onTrack: number;
  delayed: number;
  atRisk: number;
  avgCompletionRate: number;
}

export interface MetricsSummary {
  weatherImpact: WeatherImpactMetrics;
  resourceUtilization: {
    aircraft: AircraftUtilization[];
    instructors: InstructorEfficiency[];
  };
  studentProgress: StudentProgressMetrics;
  period: {
    startDate: Date;
    endDate: Date;
  };
}

/**
 * Calculate weather impact metrics
 */
export async function calculateWeatherImpact(
  schoolId: string,
  startDate: Date,
  endDate: Date
): Promise<WeatherImpactMetrics> {
  // Get all flights in period
  const allFlights = await prisma.flight.findMany({
    where: {
      schoolId,
      scheduledStart: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      rescheduleRequests: {
        where: {
          status: 'ACCEPTED',
        },
      },
    },
  });

  const totalFlights = allFlights.length;
  const weatherCancellations = allFlights.filter(
    f => f.status === 'WEATHER_CANCELLED'
  ).length;

  // Get successful reschedules
  const successfulReschedules = allFlights.filter(f => {
    return f.rescheduleRequests.some(rr => rr.status === 'ACCEPTED');
  }).length;

  // Calculate average reschedule time
  const rescheduleRequests = await prisma.rescheduleRequest.findMany({
    where: {
      flight: {
        schoolId,
        scheduledStart: { gte: startDate, lte: endDate },
      },
      status: 'ACCEPTED',
    },
    include: {
      flight: true,
    },
  });

  let totalRescheduleTime = 0;
  let rescheduleCount = 0;

  for (const request of rescheduleRequests) {
    const originalFlight = await prisma.flight.findUnique({
      where: { id: request.flightId },
    });
    
    if (originalFlight && request.acceptedAt) {
      const timeDiff = request.acceptedAt.getTime() - originalFlight.scheduledStart.getTime();
      totalRescheduleTime += timeDiff / (1000 * 60 * 60); // Convert to hours
      rescheduleCount++;
    }
  }

  const avgRescheduleTime = rescheduleCount > 0 ? totalRescheduleTime / rescheduleCount : 0;

  // Estimate revenue (simplified - would need actual pricing data)
  const avgFlightPrice = 200; // Placeholder
  const revenueProtected = successfulReschedules * avgFlightPrice;
  const revenueLost = (weatherCancellations - successfulReschedules) * avgFlightPrice;

  return {
    totalFlights,
    weatherCancellations,
    cancellationRate: totalFlights > 0 ? (weatherCancellations / totalFlights) * 100 : 0,
    successfulReschedules,
    rescheduleRate: weatherCancellations > 0 ? (successfulReschedules / weatherCancellations) * 100 : 0,
    avgRescheduleTime,
    revenueProtected,
    revenueLost,
  };
}

/**
 * Calculate aircraft utilization
 */
export async function calculateAircraftUtilization(
  schoolId: string,
  startDate: Date,
  endDate: Date
): Promise<AircraftUtilization[]> {
  const aircraft = await prisma.aircraft.findMany({
    where: { schoolId },
    include: {
      flights: {
        where: {
          scheduledStart: { gte: startDate, lte: endDate },
        },
      },
      squawks: {
        where: {
          reportedAt: { gte: startDate, lte: endDate },
          severity: 'GROUNDING',
        },
      },
    },
  });

  return aircraft.map(ac => {
    const scheduledFlights = ac.flights.filter(f => 
      ['SCHEDULED', 'CONFIRMED', 'COMPLETED'].includes(f.status)
    );
    
    const completedFlights = ac.flights.filter(f => f.status === 'COMPLETED');
    
    // Calculate hours (simplified - would use actual flight duration)
    const scheduledHours = scheduledFlights.reduce((sum, f) => {
      const duration = (f.scheduledEnd.getTime() - f.scheduledStart.getTime()) / (1000 * 60 * 60);
      return sum + duration;
    }, 0);

    const flownHours = completedFlights.reduce((sum, f) => {
      const duration = (f.scheduledEnd.getTime() - f.scheduledStart.getTime()) / (1000 * 60 * 60);
      return sum + duration;
    }, 0);

    // Estimate maintenance hours (simplified)
    const maintenanceHours = ac.squawks.length * 4; // 4 hours per grounding squawk
    const downtimeHours = maintenanceHours;

    const utilizationRate = scheduledHours > 0 ? (flownHours / scheduledHours) * 100 : 0;

    return {
      tailNumber: ac.tailNumber,
      scheduledHours: Math.round(scheduledHours * 10) / 10,
      flownHours: Math.round(flownHours * 10) / 10,
      utilizationRate: Math.round(utilizationRate * 10) / 10,
      maintenanceHours: Math.round(maintenanceHours * 10) / 10,
      downtimeHours: Math.round(downtimeHours * 10) / 10,
    };
  });
}

/**
 * Calculate instructor efficiency
 */
export async function calculateInstructorEfficiency(
  schoolId: string,
  startDate: Date,
  endDate: Date
): Promise<InstructorEfficiency[]> {
  const instructors = await prisma.instructor.findMany({
    where: { schoolId },
    include: {
      flights: {
        where: {
          scheduledStart: { gte: startDate, lte: endDate },
        },
      },
      preferredByStudents: true,
    },
  });

  return instructors.map(inst => {
    const scheduledFlights = inst.flights.filter(f =>
      ['SCHEDULED', 'CONFIRMED', 'COMPLETED'].includes(f.status)
    );
    
    const completedFlights = inst.flights.filter(f => f.status === 'COMPLETED');

    const scheduledHours = scheduledFlights.reduce((sum, f) => {
      const duration = (f.scheduledEnd.getTime() - f.scheduledStart.getTime()) / (1000 * 60 * 60);
      return sum + duration;
    }, 0);

    const actualHours = completedFlights.reduce((sum, f) => {
      const duration = (f.scheduledEnd.getTime() - f.scheduledStart.getTime()) / (1000 * 60 * 60);
      return sum + duration;
    }, 0);

    const efficiency = scheduledHours > 0 ? (actualHours / scheduledHours) * 100 : 0;
    const completionRate = scheduledFlights.length > 0 
      ? (completedFlights.length / scheduledFlights.length) * 100 
      : 0;

    return {
      id: inst.id,
      name: `${inst.firstName} ${inst.lastName}`,
      scheduledHours: Math.round(scheduledHours * 10) / 10,
      actualHours: Math.round(actualHours * 10) / 10,
      studentCount: inst.preferredByStudents.length,
      efficiency: Math.round(efficiency * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
    };
  });
}

/**
 * Calculate student progress metrics
 */
export async function calculateStudentProgress(
  schoolId: string
): Promise<StudentProgressMetrics> {
  const students = await prisma.student.findMany({
    where: { schoolId },
    include: {
      progress: {
        include: {
          lesson: true,
        },
      },
    },
  });

  let onTrack = 0;
  let delayed = 0;
  let atRisk = 0;
  let totalCompletionRate = 0;

  students.forEach(student => {
    const totalLessons = student.progress.length;
    const completedLessons = student.progress.filter(p => p.status === 'COMPLETED').length;
    const completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    
    totalCompletionRate += completionRate;

    // Determine status (simplified logic)
    if (completionRate >= 80) {
      onTrack++;
    } else if (completionRate >= 50) {
      delayed++;
    } else {
      atRisk++;
    }
  });

  const avgCompletionRate = students.length > 0 ? totalCompletionRate / students.length : 0;

  return {
    onTrack,
    delayed,
    atRisk,
    avgCompletionRate: Math.round(avgCompletionRate * 10) / 10,
  };
}

/**
 * Get comprehensive metrics summary
 */
export async function getMetricsSummary(
  schoolId: string,
  startDate: Date,
  endDate: Date
): Promise<MetricsSummary> {
  const [weatherImpact, aircraftUtilization, instructorEfficiency, studentProgress] = await Promise.all([
    calculateWeatherImpact(schoolId, startDate, endDate),
    calculateAircraftUtilization(schoolId, startDate, endDate),
    calculateInstructorEfficiency(schoolId, startDate, endDate),
    calculateStudentProgress(schoolId),
  ]);

  return {
    weatherImpact,
    resourceUtilization: {
      aircraft: aircraftUtilization,
      instructors: instructorEfficiency,
    },
    studentProgress,
    period: {
      startDate,
      endDate,
    },
  };
}


import { prisma } from '@/lib/prisma';

export type MaintenanceType =
  | '100_HOUR_INSPECTION'
  | 'ANNUAL_INSPECTION'
  | 'OIL_CHANGE'
  | 'PITOT_STATIC_CHECK'
  | 'ELT_BATTERY'
  | 'TRANSPONDER_CHECK';

export interface MaintenanceSchedule {
  aircraftId: string;
  tailNumber: string;
  maintenanceType: MaintenanceType;
  lastCompleted: Date | null;
  nextDue: Date | null;
  nextDueHobbs: number | null;
  currentHobbs: number;
  hoursRemaining: number | null;
  daysRemaining: number | null;
  status: 'CURRENT' | 'DUE_SOON' | 'DUE' | 'OVERDUE';
  alertLevel: 'NONE' | 'WARNING' | 'URGENT' | 'CRITICAL';
}

export interface MaintenanceHistory {
  id: string;
  aircraftId: string;
  tailNumber: string;
  maintenanceType: MaintenanceType;
  completedDate: Date;
  completedHobbs: number;
  cost: number | null;
  notes: string | null;
  performedBy: string | null;
}

/**
 * Maintenance intervals (in hours or months)
 */
const MAINTENANCE_INTERVALS: Record<MaintenanceType, { hours?: number; months?: number }> = {
  '100_HOUR_INSPECTION': { hours: 100 },
  'ANNUAL_INSPECTION': { months: 12 },
  'OIL_CHANGE': { hours: 50 },
  'PITOT_STATIC_CHECK': { months: 24 },
  'ELT_BATTERY': { months: 12 },
  'TRANSPONDER_CHECK': { months: 24 },
};

/**
 * Calculate next maintenance due date for an aircraft
 */
export async function calculateMaintenanceSchedule(
  aircraftId: string
): Promise<MaintenanceSchedule[]> {
  const aircraft = await prisma.aircraft.findUnique({
    where: { id: aircraftId },
    include: {
      squawks: {
        where: {
          status: 'RESOLVED',
        },
        orderBy: { resolvedAt: 'desc' },
      },
    },
  });

  if (!aircraft) {
    throw new Error('Aircraft not found');
  }

  const schedules: MaintenanceSchedule[] = [];
  const now = new Date();
  const currentHobbs = aircraft.hobbsTime || 0;

  // Calculate schedule for each maintenance type
  for (const [type, interval] of Object.entries(MAINTENANCE_INTERVALS)) {
    const maintenanceType = type as MaintenanceType;
    let lastCompleted: Date | null = null;
    let nextDue: Date | null = null;
    let nextDueHobbs: number | null = null;
    let hoursRemaining: number | null = null;
    let daysRemaining: number | null = null;

    // Find last completion from squawks or use lastInspection
    if (maintenanceType === '100_HOUR_INSPECTION' || maintenanceType === 'ANNUAL_INSPECTION') {
      lastCompleted = aircraft.lastInspection || null;
    } else {
      // For other types, check squawks for maintenance history
      const relevantSquawk = aircraft.squawks.find(s => 
        s.maintenanceLog?.includes(maintenanceType)
      );
      if (relevantSquawk?.resolvedAt) {
        lastCompleted = relevantSquawk.resolvedAt;
      }
    }

    // Calculate next due date
    if (interval.hours) {
      // Time-based maintenance (Hobbs hours)
      const lastHobbs = lastCompleted 
        ? await getHobbsAtDate(aircraftId, lastCompleted)
        : 0;
      nextDueHobbs = lastHobbs + interval.hours;
      hoursRemaining = nextDueHobbs - currentHobbs;

      // Estimate date based on average flight hours per month (simplified)
      const avgHoursPerMonth = 20; // Placeholder - would calculate from actual data
      const monthsUntilDue = hoursRemaining / avgHoursPerMonth;
      nextDue = new Date(now.getTime() + monthsUntilDue * 30 * 24 * 60 * 60 * 1000);
      daysRemaining = Math.floor(monthsUntilDue * 30);
    } else if (interval.months && lastCompleted) {
      // Calendar-based maintenance
      nextDue = new Date(lastCompleted);
      nextDue.setMonth(nextDue.getMonth() + interval.months);
      daysRemaining = Math.floor((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    } else if (interval.months && !lastCompleted) {
      // No history - use nextInspectionDue or default to 12 months from now
      nextDue = aircraft.nextInspectionDue || new Date(now.getTime() + interval.months * 30 * 24 * 60 * 60 * 1000);
      daysRemaining = Math.floor((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Determine status
    let status: 'CURRENT' | 'DUE_SOON' | 'DUE' | 'OVERDUE' = 'CURRENT';
    let alertLevel: 'NONE' | 'WARNING' | 'URGENT' | 'CRITICAL' = 'NONE';

    if (interval.hours) {
      // Time-based
      if (hoursRemaining !== null) {
        if (hoursRemaining <= 0) {
          status = 'OVERDUE';
          alertLevel = 'CRITICAL';
        } else if (hoursRemaining <= 10) {
          status = 'DUE';
          alertLevel = 'URGENT';
        } else if (hoursRemaining <= interval.hours * 0.1) {
          status = 'DUE_SOON';
          alertLevel = 'WARNING';
        }
      }
    } else {
      // Calendar-based
      if (daysRemaining !== null) {
        if (daysRemaining < 0) {
          status = 'OVERDUE';
          alertLevel = 'CRITICAL';
        } else if (daysRemaining <= 7) {
          status = 'DUE';
          alertLevel = 'URGENT';
        } else if (daysRemaining <= 30) {
          status = 'DUE_SOON';
          alertLevel = 'WARNING';
        }
      }
    }

    schedules.push({
      aircraftId: aircraft.id,
      tailNumber: aircraft.tailNumber,
      maintenanceType,
      lastCompleted,
      nextDue,
      nextDueHobbs,
      currentHobbs,
      hoursRemaining,
      daysRemaining,
      status,
      alertLevel,
    });
  }

  return schedules;
}

/**
 * Get Hobbs time at a specific date (simplified - would need flight history)
 */
async function getHobbsAtDate(aircraftId: string, date: Date): Promise<number> {
  // Simplified: use current Hobbs minus estimated hours since date
  // In production, would calculate from actual flight logs
  const aircraft = await prisma.aircraft.findUnique({
    where: { id: aircraftId },
  });
  
  if (!aircraft) return 0;

  const daysSince = (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  const avgHoursPerDay = 0.5; // Placeholder
  const estimatedHoursSince = daysSince * avgHoursPerDay;
  
  return Math.max(0, (aircraft.hobbsTime || 0) - estimatedHoursSince);
}

/**
 * Get all aircraft with maintenance due soon
 */
export async function getAircraftDueForMaintenance(
  schoolId?: string,
  thresholdDays: number = 30
): Promise<MaintenanceSchedule[]> {
  const aircraft = await prisma.aircraft.findMany({
    where: {
      schoolId: schoolId || undefined,
      status: {
        not: 'GROUNDED',
      },
    },
  });

  const allSchedules: MaintenanceSchedule[] = [];

  for (const ac of aircraft) {
    const schedules = await calculateMaintenanceSchedule(ac.id);
    // Filter to only those due soon or overdue
    const dueSchedules = schedules.filter(s => 
      s.status !== 'CURRENT' ||
      (s.daysRemaining !== null && s.daysRemaining <= thresholdDays) ||
      (s.hoursRemaining !== null && s.hoursRemaining <= thresholdDays * 0.5) // Rough estimate
    );
    allSchedules.push(...dueSchedules);
  }

  return allSchedules.sort((a, b) => {
    // Sort by urgency
    const urgencyOrder = { 'OVERDUE': 0, 'DUE': 1, 'DUE_SOON': 2, 'CURRENT': 3 };
    const urgencyDiff = urgencyOrder[a.status] - urgencyOrder[b.status];
    if (urgencyDiff !== 0) return urgencyDiff;

    // Then by days/hours remaining
    const aRemaining = a.daysRemaining ?? a.hoursRemaining ?? 999;
    const bRemaining = b.daysRemaining ?? b.hoursRemaining ?? 999;
    return aRemaining - bRemaining;
  });
}

/**
 * Proactively block aircraft for maintenance
 * Should be called 2 weeks before maintenance is due
 */
export async function blockAircraftForMaintenance(
  aircraftId: string,
  maintenanceType: MaintenanceType,
  scheduledDate: Date,
  estimatedDurationHours: number = 8
): Promise<void> {
  const aircraft = await prisma.aircraft.findUnique({
    where: { id: aircraftId },
    include: {
      flights: {
        where: {
          scheduledStart: {
            gte: scheduledDate,
            lte: new Date(scheduledDate.getTime() + estimatedDurationHours * 60 * 60 * 1000),
          },
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
        },
      },
    },
  });

  if (!aircraft) {
    throw new Error('Aircraft not found');
  }

  // Cancel or reschedule flights during maintenance window
  for (const flight of aircraft.flights) {
    await prisma.flight.update({
      where: { id: flight.id },
      data: {
        status: 'MAINTENANCE_CANCELLED',
      },
    });

    // Trigger AI rescheduling for cancelled flights
    try {
      const { generateRescheduleSuggestions } = await import('./ai-reschedule-service');
      await generateRescheduleSuggestions(flight.id);
    } catch (error) {
      console.error('Error triggering reschedule for maintenance:', error);
    }
  }

  // Set maintenance until date
  const maintenanceUntil = new Date(scheduledDate.getTime() + estimatedDurationHours * 60 * 60 * 1000);
  await prisma.aircraft.update({
    where: { id: aircraftId },
    data: {
      status: 'MAINTENANCE',
      maintenanceUntil,
    },
  });
}

/**
 * Complete maintenance and release aircraft
 */
export async function completeMaintenance(
  aircraftId: string,
  maintenanceType: MaintenanceType,
  completedDate: Date,
  completedHobbs: number,
  cost: number | null = null,
  notes: string | null = null,
  performedBy: string | null = null
): Promise<void> {
  const aircraft = await prisma.aircraft.findUnique({
    where: { id: aircraftId },
  });

  if (!aircraft) {
    throw new Error('Aircraft not found');
  }

  // Update aircraft maintenance fields
  const updates: any = {
    status: 'AVAILABLE',
    maintenanceUntil: null,
    hobbsTime: completedHobbs,
  };

  if (maintenanceType === '100_HOUR_INSPECTION' || maintenanceType === 'ANNUAL_INSPECTION') {
    updates.lastInspection = completedDate;
    // Calculate next inspection due
    if (maintenanceType === '100_HOUR_INSPECTION') {
      updates.nextInspectionDue = null; // Will be calculated from Hobbs
    } else {
      const nextAnnual = new Date(completedDate);
      nextAnnual.setFullYear(nextAnnual.getFullYear() + 1);
      updates.nextInspectionDue = nextAnnual;
    }
  }

  await prisma.aircraft.update({
    where: { id: aircraftId },
    data: updates,
  });

  // Create maintenance history entry (using Squawk model)
  await prisma.squawk.create({
    data: {
      aircraftId,
      reportedBy: performedBy || 'system',
      severity: 'MINOR', // Maintenance is planned, not a squawk
      status: 'RESOLVED',
      title: `${maintenanceType} Completed`,
      description: notes || `Maintenance completed: ${maintenanceType}`,
      resolvedAt: completedDate,
      resolutionNotes: `Completed: ${maintenanceType}. Hobbs: ${completedHobbs}. Cost: ${cost || 'N/A'}`,
      maintenanceLog: JSON.stringify({
        type: maintenanceType,
        completedDate,
        completedHobbs,
        cost,
        performedBy,
      }),
      actualCost: cost,
    },
  });
}

/**
 * Get maintenance history for an aircraft
 */
export async function getMaintenanceHistory(
  aircraftId: string
): Promise<MaintenanceHistory[]> {
  const aircraft = await prisma.aircraft.findUnique({
    where: { id: aircraftId },
    include: {
      squawks: {
        where: {
          status: 'RESOLVED',
          maintenanceLog: {
            not: null,
          },
        },
        orderBy: { resolvedAt: 'desc' },
      },
    },
  });

  if (!aircraft) {
    throw new Error('Aircraft not found');
  }

  const history: MaintenanceHistory[] = [];

  // Add inspection history
  if (aircraft.lastInspection) {
    history.push({
      id: 'inspection',
      aircraftId: aircraft.id,
      tailNumber: aircraft.tailNumber,
      maintenanceType: aircraft.nextInspectionDue ? 'ANNUAL_INSPECTION' : '100_HOUR_INSPECTION',
      completedDate: aircraft.lastInspection,
      completedHobbs: aircraft.hobbsTime || 0,
      cost: null,
      notes: null,
      performedBy: null,
    });
  }

  // Add squawk-based maintenance history
  for (const squawk of aircraft.squawks) {
    if (squawk.maintenanceLog) {
      try {
        const log = JSON.parse(squawk.maintenanceLog);
        history.push({
          id: squawk.id,
          aircraftId: aircraft.id,
          tailNumber: aircraft.tailNumber,
          maintenanceType: log.type as MaintenanceType,
          completedDate: squawk.resolvedAt || new Date(),
          completedHobbs: log.completedHobbs || 0,
          cost: squawk.actualCost,
          notes: squawk.resolutionNotes,
          performedBy: log.performedBy || null,
        });
      } catch (error) {
        // Skip invalid JSON
      }
    }
  }

  return history.sort((a, b) => b.completedDate.getTime() - a.completedDate.getTime());
}


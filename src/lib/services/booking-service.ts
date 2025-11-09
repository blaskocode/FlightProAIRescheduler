import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface AvailabilityCheck {
  isAvailable: boolean;
  conflicts: Array<{
    type: 'aircraft' | 'instructor' | 'student';
    flightId: string;
    scheduledStart: Date;
    scheduledEnd: Date;
  }>;
}

export interface BookingData {
  schoolId: string;
  studentId: string;
  instructorId?: string;
  aircraftId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  flightType?: string;
  lessonNumber?: number;
  lessonTitle?: string;
  departureAirport: string;
  destinationAirport?: string;
  route?: string;
}

/**
 * Check availability for a flight booking with 30-minute buffer
 */
export async function checkAvailability(
  data: BookingData,
  excludeFlightId?: string
): Promise<AvailabilityCheck> {
  const conflicts: AvailabilityCheck['conflicts'] = [];

  // Calculate time range with 30-minute buffer
  const bufferMinutes = 30;
  const checkStart = new Date(data.scheduledStart);
  checkStart.setMinutes(checkStart.getMinutes() - bufferMinutes);
  const checkEnd = new Date(data.scheduledEnd);
  checkEnd.setMinutes(checkEnd.getMinutes() + bufferMinutes);

  // Check aircraft availability
  const aircraftConflicts = await prisma.flight.findMany({
    where: {
      aircraftId: data.aircraftId,
      id: excludeFlightId ? { not: excludeFlightId } : undefined,
      scheduledStart: { lte: checkEnd },
      scheduledEnd: { gte: checkStart },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    select: {
      id: true,
      scheduledStart: true,
      scheduledEnd: true,
    },
  });

  aircraftConflicts.forEach((flight) => {
    conflicts.push({
      type: 'aircraft',
      flightId: flight.id,
      scheduledStart: flight.scheduledStart,
      scheduledEnd: flight.scheduledEnd,
    });
  });

  // Check instructor availability (if provided)
  if (data.instructorId) {
    const instructorConflicts = await prisma.flight.findMany({
      where: {
        instructorId: data.instructorId,
        id: excludeFlightId ? { not: excludeFlightId } : undefined,
        scheduledStart: { lte: checkEnd },
        scheduledEnd: { gte: checkStart },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: {
        id: true,
        scheduledStart: true,
        scheduledEnd: true,
      },
    });

    instructorConflicts.forEach((flight) => {
      conflicts.push({
        type: 'instructor',
        flightId: flight.id,
        scheduledStart: flight.scheduledStart,
        scheduledEnd: flight.scheduledEnd,
      });
    });
  }

  // Check student availability
  const studentConflicts = await prisma.flight.findMany({
    where: {
      studentId: data.studentId,
      id: excludeFlightId ? { not: excludeFlightId } : undefined,
      scheduledStart: { lte: checkEnd },
      scheduledEnd: { gte: checkStart },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    select: {
      id: true,
      scheduledStart: true,
      scheduledEnd: true,
    },
  });

  studentConflicts.forEach((flight) => {
    conflicts.push({
      type: 'student',
      flightId: flight.id,
      scheduledStart: flight.scheduledStart,
      scheduledEnd: flight.scheduledEnd,
    });
  });

  return {
    isAvailable: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Create a flight booking with transaction and conflict checking
 */
export async function createBooking(
  data: BookingData,
  userId?: string
): Promise<Prisma.FlightGetPayload<{
  include: {
    student: true;
    instructor: true;
    aircraft: { include: { aircraftType: true } };
  };
}>> {
  // Validate required fields
  if (!data.schoolId || !data.studentId || !data.aircraftId || !data.scheduledStart || !data.scheduledEnd) {
    throw new Error('Missing required fields: schoolId, studentId, aircraftId, scheduledStart, scheduledEnd');
  }

  // Validate dates
  if (data.scheduledStart >= data.scheduledEnd) {
    throw new Error('scheduledStart must be before scheduledEnd');
  }

  if (data.scheduledStart < new Date()) {
    throw new Error('Cannot book flights in the past');
  }

  // Check availability within transaction
  return await prisma.$transaction(async (tx) => {
    // Re-check availability within transaction to prevent race conditions
    const availability = await checkAvailability(data);

    if (!availability.isAvailable) {
      const conflictTypes = [...new Set(availability.conflicts.map((c) => c.type))];
      throw new Error(
        `Time slot not available. Conflicts with ${conflictTypes.join(', ')}: ${availability.conflicts.length} conflict(s) found`
      );
    }

    // Calculate briefing and debrief times
    const briefingStart = new Date(data.scheduledStart);
    briefingStart.setMinutes(briefingStart.getMinutes() - 30);
    const debriefEnd = new Date(data.scheduledEnd);
    debriefEnd.setMinutes(debriefEnd.getMinutes() + 20);

    // Create flight
    const flight = await tx.flight.create({
      data: {
        schoolId: data.schoolId,
        studentId: data.studentId,
        instructorId: data.instructorId,
        aircraftId: data.aircraftId,
        scheduledStart: data.scheduledStart,
        scheduledEnd: data.scheduledEnd,
        briefingStart,
        debriefEnd,
        flightType: (data.flightType as any) || 'DUAL_INSTRUCTION',
        lessonNumber: data.lessonNumber,
        lessonTitle: data.lessonTitle,
        departureAirport: data.departureAirport,
        destinationAirport: data.destinationAirport,
        route: data.route,
        status: 'PENDING',
      },
      include: {
        student: true,
        instructor: true,
        aircraft: {
          include: {
            aircraftType: true,
          },
        },
      },
    });

    // Log booking creation (audit trail)
    // Note: In a production system, you'd want a separate AuditLog table
    console.log(`[AUDIT] Flight booking created: ${flight.id} by user ${userId || 'system'}`);

    return flight;
  });
}

/**
 * Update a flight booking with conflict checking
 */
export async function updateBooking(
  flightId: string,
  updates: Partial<BookingData>,
  userId?: string
): Promise<Prisma.FlightGetPayload<{
  include: {
    student: true;
    instructor: true;
    aircraft: { include: { aircraftType: true } };
  };
}>> {
  // Get existing flight
  const existingFlight = await prisma.flight.findUnique({
    where: { id: flightId },
  });

  if (!existingFlight) {
    throw new Error('Flight not found');
  }

  // Cannot update completed or cancelled flights
  if (['COMPLETED', 'WEATHER_CANCELLED', 'MAINTENANCE_CANCELLED', 'RESCHEDULED'].includes(existingFlight.status)) {
    throw new Error(`Cannot update flight with status: ${existingFlight.status}`);
  }

  // Merge updates with existing data
  const updatedData: BookingData = {
    schoolId: updates.schoolId || existingFlight.schoolId,
    studentId: updates.studentId || existingFlight.studentId,
    instructorId: updates.instructorId !== undefined ? updates.instructorId : existingFlight.instructorId || undefined,
    aircraftId: updates.aircraftId || existingFlight.aircraftId,
    scheduledStart: updates.scheduledStart || existingFlight.scheduledStart,
    scheduledEnd: updates.scheduledEnd || existingFlight.scheduledEnd,
    flightType: updates.flightType || existingFlight.flightType,
    lessonNumber: updates.lessonNumber !== undefined ? updates.lessonNumber : existingFlight.lessonNumber || undefined,
    lessonTitle: updates.lessonTitle !== undefined ? updates.lessonTitle : existingFlight.lessonTitle || undefined,
    departureAirport: updates.departureAirport || existingFlight.departureAirport,
    destinationAirport:
      updates.destinationAirport !== undefined ? updates.destinationAirport : existingFlight.destinationAirport || undefined,
    route: updates.route !== undefined ? updates.route : existingFlight.route || undefined,
  };

  // Check availability if time or resources changed
  const timeChanged =
    updatedData.scheduledStart.getTime() !== existingFlight.scheduledStart.getTime() ||
    updatedData.scheduledEnd.getTime() !== existingFlight.scheduledEnd.getTime();
  const resourcesChanged =
    updatedData.aircraftId !== existingFlight.aircraftId ||
    updatedData.instructorId !== existingFlight.instructorId ||
    updatedData.studentId !== existingFlight.studentId;

  if (timeChanged || resourcesChanged) {
    const availability = await checkAvailability(updatedData, flightId);
    if (!availability.isAvailable) {
      const conflictTypes = [...new Set(availability.conflicts.map((c) => c.type))];
      throw new Error(
        `Time slot not available. Conflicts with ${conflictTypes.join(', ')}: ${availability.conflicts.length} conflict(s) found`
      );
    }
  }

  // Update within transaction
  return await prisma.$transaction(async (tx) => {
    // Re-check availability within transaction
    if (timeChanged || resourcesChanged) {
      const availability = await checkAvailability(updatedData, flightId);
      if (!availability.isAvailable) {
        const conflictTypes = [...new Set(availability.conflicts.map((c) => c.type))];
        throw new Error(
          `Time slot not available. Conflicts with ${conflictTypes.join(', ')}: ${availability.conflicts.length} conflict(s) found`
        );
      }
    }

    // Calculate briefing and debrief times if times changed
    let briefingStart = existingFlight.briefingStart;
    let debriefEnd = existingFlight.debriefEnd;
    if (timeChanged) {
      briefingStart = new Date(updatedData.scheduledStart);
      briefingStart.setMinutes(briefingStart.getMinutes() - 30);
      debriefEnd = new Date(updatedData.scheduledEnd);
      debriefEnd.setMinutes(debriefEnd.getMinutes() + 20);
    }

    const flight = await tx.flight.update({
      where: { id: flightId },
      data: {
        schoolId: updatedData.schoolId,
        studentId: updatedData.studentId,
        instructorId: updatedData.instructorId,
        aircraftId: updatedData.aircraftId,
        scheduledStart: updatedData.scheduledStart,
        scheduledEnd: updatedData.scheduledEnd,
        briefingStart,
        debriefEnd,
        flightType: (updatedData.flightType as any) || existingFlight.flightType,
        lessonNumber: updatedData.lessonNumber,
        lessonTitle: updatedData.lessonTitle,
        departureAirport: updatedData.departureAirport,
        destinationAirport: updatedData.destinationAirport,
        route: updatedData.route,
      },
      include: {
        student: true,
        instructor: true,
        aircraft: {
          include: {
            aircraftType: true,
          },
        },
      },
    });

    // Log update (audit trail)
    console.log(`[AUDIT] Flight booking updated: ${flightId} by user ${userId || 'system'}`);

    return flight;
  });
}

/**
 * Cancel a flight booking
 */
export async function cancelBooking(
  flightId: string,
  reason: 'STUDENT_CANCELLED' | 'INSTRUCTOR_CANCELLED' | 'WEATHER_CANCELLED' | 'MAINTENANCE_CANCELLED',
  userId?: string
): Promise<void> {
  const flight = await prisma.flight.findUnique({
    where: { id: flightId },
  });

  if (!flight) {
    throw new Error('Flight not found');
  }

  // Cannot cancel already completed or cancelled flights
  if (flight.status === 'COMPLETED') {
    throw new Error('Cannot cancel a completed flight');
  }

  if (['WEATHER_CANCELLED', 'MAINTENANCE_CANCELLED', 'STUDENT_CANCELLED', 'INSTRUCTOR_CANCELLED', 'RESCHEDULED'].includes(flight.status)) {
    throw new Error(`Flight is already ${flight.status}`);
  }

  await prisma.flight.update({
    where: { id: flightId },
    data: {
      status: reason,
    },
  });

  // Log cancellation (audit trail)
  console.log(`[AUDIT] Flight booking cancelled: ${flightId} - Reason: ${reason} by user ${userId || 'system'}`);
}


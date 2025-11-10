import { prisma } from '@/lib/prisma';
import { createBooking, BookingData } from './booking-service';
import { sendNotification } from './notification-service';

/**
 * Discovery Flight Service
 * 
 * Handles discovery flight bookings from non-authenticated users.
 */

export interface DiscoveryFlightBooking {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  schoolId: string;
  preferredDate: Date;
  preferredTime?: string; // e.g., "09:00"
  notes?: string;
}

export interface DiscoveryFlightRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  flightId: string;
  schoolId: string;
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'CONVERTED';
  convertedToStudentId?: string;
  surveySent: boolean;
  surveyCompleted: boolean;
  enrollmentOfferSent: boolean;
  createdAt: Date;
}

/**
 * Create a discovery flight booking
 * Creates a temporary student record and assigns an available instructor
 */
export async function createDiscoveryFlightBooking(
  data: DiscoveryFlightBooking
): Promise<{ flight: any; discoveryRecord: DiscoveryFlightRecord }> {
  // Get school
  const school = await prisma.school.findUnique({
    where: { id: data.schoolId },
  });

  if (!school) {
    throw new Error('School not found');
  }

  // Check if email already exists as a student
  let student = await prisma.student.findUnique({
    where: { email: data.email },
  });

  // If student doesn't exist, create a temporary student record
  if (!student) {
    student = await prisma.student.create({
      data: {
        schoolId: data.schoolId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        firebaseUid: `discovery_${Date.now()}_${Math.random().toString(36).substring(7)}`, // Temporary UID
        trainingLevel: 'EARLY_STUDENT',
      },
    });
  }

  // Find available instructor for the preferred date/time
  const preferredDateTime = new Date(data.preferredDate);
  if (data.preferredTime) {
    const [hours, minutes] = data.preferredTime.split(':').map(Number);
    preferredDateTime.setHours(hours, minutes, 0, 0);
  } else {
    // Default to 10 AM
    preferredDateTime.setHours(10, 0, 0, 0);
  }

  const scheduledEnd = new Date(preferredDateTime);
  scheduledEnd.setHours(scheduledEnd.getHours() + 1); // 1-hour discovery flight

  // Find available instructors
  const instructors = await prisma.instructor.findMany({
    where: { schoolId: data.schoolId },
    include: {
      flights: {
        where: {
          scheduledStart: {
            gte: new Date(preferredDateTime.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
            lte: new Date(scheduledEnd.getTime() + 2 * 60 * 60 * 1000), // 2 hours after
          },
          status: {
            in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
          },
        },
      },
    },
  });

  // Find instructor with no conflicts
  let assignedInstructor = instructors.find(
    (inst) => inst.flights.length === 0
  );

  // If no instructor is completely free, pick the one with the least conflicts
  if (!assignedInstructor) {
    assignedInstructor = instructors.sort(
      (a, b) => a.flights.length - b.flights.length
    )[0];
  }

  // Find available aircraft
  const aircraft = await prisma.aircraft.findFirst({
    where: {
      schoolId: data.schoolId,
      status: 'AVAILABLE',
    },
    include: {
      aircraftType: true,
    },
  });

  if (!aircraft) {
    throw new Error('No available aircraft for discovery flight');
  }

  // Create flight booking
  const bookingData: BookingData = {
    schoolId: data.schoolId,
    studentId: student.id,
    instructorId: assignedInstructor?.id,
    aircraftId: aircraft.id,
    scheduledStart: preferredDateTime,
    scheduledEnd,
    flightType: 'DISCOVERY_FLIGHT',
    departureAirport: school.airportCode,
    lessonTitle: 'Discovery Flight',
  };

  const flight = await createBooking(bookingData);

  // Create discovery flight record
  const discoveryRecord = await prisma.discoveryFlight.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      flightId: flight.id,
      schoolId: data.schoolId,
      status: 'SCHEDULED',
      notes: data.notes || null,
    },
  });

  // Send confirmation email
  try {
    await sendNotification({
      recipientId: student.id,
      type: 'FLIGHT_REMINDER',
      subject: 'Discovery Flight Scheduled',
      message: `
        <h2>Discovery Flight Confirmed</h2>
        <p>Hi ${data.firstName},</p>
        <p>Your discovery flight has been scheduled:</p>
        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
          <strong>Date & Time:</strong> ${preferredDateTime.toLocaleString()}<br/>
          <strong>Instructor:</strong> ${assignedInstructor ? `${assignedInstructor.firstName} ${assignedInstructor.lastName}` : 'TBD'}<br/>
          <strong>Aircraft:</strong> ${aircraft.tailNumber}<br/>
          <strong>Location:</strong> ${school.name} (${school.airportCode})
        </div>
        <p>We look forward to flying with you!</p>
      `.trim(),
      flightId: flight.id,
    });
  } catch (error) {
    console.error('Error sending discovery flight confirmation:', error);
    // Don't fail the booking if email fails
  }

  return { flight, discoveryRecord: discoveryRecord as DiscoveryFlightRecord };
}

/**
 * Convert discovery flight to student account
 */
export async function convertDiscoveryToStudent(
  discoveryFlightId: string,
  firebaseUid: string
): Promise<{ student: any; discoveryRecord: DiscoveryFlightRecord }> {
  const discovery = await prisma.discoveryFlight.findUnique({
    where: { id: discoveryFlightId },
    include: { 
      flight: { 
        include: { 
          student: true,
          school: true,
        } 
      } 
    },
  });

  if (!discovery) {
    throw new Error('Discovery flight not found');
  }

  // Update student with Firebase UID
  const student = await prisma.student.update({
    where: { id: discovery.flight.studentId },
    data: {
      firebaseUid,
    },
  });

  // Update discovery record
  const discoveryRecord = await prisma.discoveryFlight.update({
    where: { id: discoveryFlightId },
    data: {
      status: 'CONVERTED',
      convertedToStudentId: student.id,
    },
  });

  // Send enrollment offer email
  try {
    await sendNotification({
      recipientId: student.id,
      type: 'FLIGHT_REMINDER',
      subject: 'Welcome to Flight Training!',
      message: `
        <h2>Welcome to Flight Training!</h2>
        <p>Hi ${discovery.firstName},</p>
        <p>Thank you for your discovery flight! We'd love to have you join our flight training program.</p>
        <p>Your account has been created. You can now book regular flight lessons and track your progress.</p>
        <p>Ready to start your journey to becoming a pilot?</p>
      `.trim(),
    });
  } catch (error) {
    console.error('Error sending enrollment offer:', error);
  }

  return { student, discoveryRecord: discoveryRecord as DiscoveryFlightRecord };
}

/**
 * Get discovery flight conversion metrics
 */
export async function getDiscoveryFlightMetrics(
  schoolId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  total: number;
  scheduled: number;
  completed: number;
  converted: number;
  conversionRate: number;
  cancelled: number;
}> {
  const discoveries = await prisma.discoveryFlight.findMany({
    where: {
      schoolId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const total = discoveries.length;
  const scheduled = discoveries.filter((d) => d.status === 'SCHEDULED').length;
  const completed = discoveries.filter((d) => d.status === 'COMPLETED').length;
  const converted = discoveries.filter((d) => d.status === 'CONVERTED').length;
  const cancelled = discoveries.filter((d) => d.status === 'CANCELLED').length;
  const conversionRate = completed > 0 ? (converted / completed) * 100 : 0;

  return {
    total,
    scheduled,
    completed,
    converted,
    conversionRate,
    cancelled,
  };
}


import { prisma } from '@/lib/prisma';

export interface StudentCurrencyStatus {
  studentId: string;
  studentName: string;
  lastFlightDate: Date | null;
  daysSinceLastFlight: number;
  soloCurrentUntil: Date | null;
  soloDaysRemaining: number | null;
  status: 'CURRENT' | 'WARNING' | 'URGENT' | 'CRITICAL' | 'EXPIRED';
  nextThreshold: number | null; // Days until next threshold
  recommendations: string[];
}

export interface InstructorCurrencyStatus {
  instructorId: string;
  instructorName: string;
  lastInstructionalFlight: Date | null;
  daysSinceLastFlight: number;
  status: 'CURRENT' | 'WARNING' | 'URGENT' | 'CRITICAL' | 'EXPIRED';
  nextThreshold: number | null;
  recommendations: string[];
}

/**
 * Calculate student currency status
 */
export async function getStudentCurrencyStatus(
  studentId: string
): Promise<StudentCurrencyStatus> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  const now = new Date();
  let daysSinceLastFlight = 0;
  let status: 'CURRENT' | 'WARNING' | 'URGENT' | 'CRITICAL' | 'EXPIRED' = 'CURRENT';
  let nextThreshold: number | null = null;
  const recommendations: string[] = [];

  if (student.lastFlightDate) {
    daysSinceLastFlight = Math.floor(
      (now.getTime() - student.lastFlightDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  } else {
    daysSinceLastFlight = 999; // Never flown
    status = 'EXPIRED';
    recommendations.push('Schedule your first flight lesson');
    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      lastFlightDate: null,
      daysSinceLastFlight,
      soloCurrentUntil: null,
      soloDaysRemaining: null,
      status,
      nextThreshold: null,
      recommendations,
    };
  }

  // Determine status based on days since last flight
  if (daysSinceLastFlight >= 90) {
    status = 'EXPIRED';
    recommendations.push('Flight currency expired. Schedule a flight review before solo flight.');
    nextThreshold = null;
  } else if (daysSinceLastFlight >= 85) {
    status = 'CRITICAL';
    nextThreshold = 90 - daysSinceLastFlight;
    recommendations.push(`Currency expires in ${nextThreshold} days. Schedule a flight immediately.`);
  } else if (daysSinceLastFlight >= 75) {
    status = 'URGENT';
    nextThreshold = 90 - daysSinceLastFlight;
    recommendations.push(`Currency expires in ${nextThreshold} days. Schedule a flight soon.`);
  } else if (daysSinceLastFlight >= 60) {
    status = 'WARNING';
    nextThreshold = 90 - daysSinceLastFlight;
    recommendations.push(`Currency expires in ${nextThreshold} days. Plan ahead to maintain currency.`);
  } else {
    status = 'CURRENT';
    nextThreshold = 90 - daysSinceLastFlight;
  }

  // Check solo currency
  let soloDaysRemaining: number | null = null;
  if (student.soloCurrentUntil) {
    soloDaysRemaining = Math.floor(
      (student.soloCurrentUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (soloDaysRemaining <= 0) {
      recommendations.push('Solo currency expired. Complete 3 landings within 90 days to regain solo privileges.');
    } else if (soloDaysRemaining <= 7) {
      recommendations.push(`Solo currency expires in ${soloDaysRemaining} days. Schedule a flight with 3 landings.`);
    }
  }

  return {
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`,
    lastFlightDate: student.lastFlightDate,
    daysSinceLastFlight,
    soloCurrentUntil: student.soloCurrentUntil,
    soloDaysRemaining,
    status,
    nextThreshold,
    recommendations,
  };
}

/**
 * Calculate instructor currency status
 */
export async function getInstructorCurrencyStatus(
  instructorId: string
): Promise<InstructorCurrencyStatus> {
  const instructor = await prisma.instructor.findUnique({
    where: { id: instructorId },
  });

  if (!instructor) {
    throw new Error('Instructor not found');
  }

  const now = new Date();
  let daysSinceLastFlight = 0;
  let status: 'CURRENT' | 'WARNING' | 'URGENT' | 'CRITICAL' | 'EXPIRED' = 'CURRENT';
  let nextThreshold: number | null = null;
  const recommendations: string[] = [];

  if (instructor.lastInstructionalFlight) {
    daysSinceLastFlight = Math.floor(
      (now.getTime() - instructor.lastInstructionalFlight.getTime()) / (1000 * 60 * 60 * 24)
    );
  } else {
    daysSinceLastFlight = 999;
    status = 'EXPIRED';
    recommendations.push('Schedule an instructional flight to maintain currency');
    return {
      instructorId: instructor.id,
      instructorName: `${instructor.firstName} ${instructor.lastName}`,
      lastInstructionalFlight: null,
      daysSinceLastFlight,
      status,
      nextThreshold: null,
      recommendations,
    };
  }

  // Determine status (90-day rule for instructors)
  if (daysSinceLastFlight >= 90) {
    status = 'EXPIRED';
    recommendations.push('Instructional currency expired. Cannot provide instruction until currency is regained.');
    nextThreshold = null;
  } else if (daysSinceLastFlight >= 75) {
    status = 'URGENT';
    nextThreshold = 90 - daysSinceLastFlight;
    recommendations.push(`Currency expires in ${nextThreshold} days. Schedule an instructional flight.`);
  } else if (daysSinceLastFlight >= 60) {
    status = 'WARNING';
    nextThreshold = 90 - daysSinceLastFlight;
    recommendations.push(`Currency expires in ${nextThreshold} days. Plan ahead to maintain currency.`);
  } else {
    status = 'CURRENT';
    nextThreshold = 90 - daysSinceLastFlight;
  }

  return {
    instructorId: instructor.id,
    instructorName: `${instructor.firstName} ${instructor.lastName}`,
    lastInstructionalFlight: instructor.lastInstructionalFlight,
    daysSinceLastFlight,
    status,
    nextThreshold,
    recommendations,
  };
}

/**
 * Get all students approaching currency expiry
 */
export async function getStudentsApproachingExpiry(
  schoolId?: string,
  threshold: number = 30 // Days before expiry to include
): Promise<StudentCurrencyStatus[]> {
  const now = new Date();
  const thresholdDate = new Date(now.getTime() - (90 - threshold) * 24 * 60 * 60 * 1000);

  const students = await prisma.student.findMany({
    where: {
      schoolId: schoolId || undefined,
      lastFlightDate: {
        not: null,
        lte: thresholdDate,
      },
    },
  });

  const statuses = await Promise.all(
    students.map(student => getStudentCurrencyStatus(student.id))
  );

  // Filter to only those approaching expiry (WARNING, URGENT, CRITICAL, EXPIRED)
  return statuses.filter(s => s.status !== 'CURRENT');
}

/**
 * Get all instructors approaching currency expiry
 */
export async function getInstructorsApproachingExpiry(
  schoolId?: string,
  threshold: number = 30
): Promise<InstructorCurrencyStatus[]> {
  const now = new Date();
  const thresholdDate = new Date(now.getTime() - (90 - threshold) * 24 * 60 * 60 * 1000);

  const instructors = await prisma.instructor.findMany({
    where: {
      schoolId: schoolId || undefined,
      lastInstructionalFlight: {
        not: null,
        lte: thresholdDate,
      },
    },
  });

  const statuses = await Promise.all(
    instructors.map(instructor => getInstructorCurrencyStatus(instructor.id))
  );

  return statuses.filter(s => s.status !== 'CURRENT');
}

/**
 * Prioritize at-risk students for scheduling
 * Returns students sorted by currency urgency
 */
export async function getPrioritizedAtRiskStudents(
  schoolId?: string
): Promise<StudentCurrencyStatus[]> {
  const atRiskStudents = await getStudentsApproachingExpiry(schoolId, 90);
  
  // Sort by status priority: EXPIRED > CRITICAL > URGENT > WARNING
  const priorityOrder = {
    'EXPIRED': 0,
    'CRITICAL': 1,
    'URGENT': 2,
    'WARNING': 3,
    'CURRENT': 4,
  };

  return atRiskStudents.sort((a, b) => {
    const priorityDiff = priorityOrder[a.status] - priorityOrder[b.status];
    if (priorityDiff !== 0) return priorityDiff;
    // If same priority, sort by days since last flight (more days = higher priority)
    return b.daysSinceLastFlight - a.daysSinceLastFlight;
  });
}


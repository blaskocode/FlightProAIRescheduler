import { Worker } from 'bullmq';
import { connection, weatherCheckQueue, currencyCheckQueue, maintenanceReminderQueue, rescheduleExpirationQueue } from './queues';
import { processWeatherCheck, WeatherCheckJobData } from './weather-check.job';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/services/notification-service';

// Weather Check Worker
export const weatherCheckWorker = new Worker<WeatherCheckJobData>(
  'weather-check',
  async (job) => {
    return processWeatherCheck(job);
  },
  {
    connection,
    concurrency: 5,
  }
);

// Currency Check Worker
export const currencyCheckWorker = new Worker(
  'currency-check',
  async (job) => {
    const now = new Date();
    const results = {
      studentsChecked: 0,
      studentsWarned: 0,
      instructorsChecked: 0,
      instructorsWarned: 0,
    };

    try {
      // Check student currency (90-day rule)
      const students = await prisma.student.findMany({
        where: {
          lastFlightDate: {
            not: null,
          },
        },
        include: {
          school: true,
        },
      });

      for (const student of students) {
        if (!student.lastFlightDate) continue;

        results.studentsChecked++;
        const daysSinceLastFlight = Math.floor(
          (now.getTime() - student.lastFlightDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Update days since last flight
        await prisma.student.update({
          where: { id: student.id },
          data: { daysSinceLastFlight: daysSinceLastFlight },
        });

        // Send warnings at thresholds
        if (daysSinceLastFlight >= 90) {
          // Not current - send critical warning
          await sendNotification({
            recipientId: student.id,
            type: 'CURRENCY_WARNING',
            subject: '⚠️ Flight Currency Expired',
            message: `Your flight currency has expired. You last flew ${daysSinceLastFlight} days ago. You must complete a flight review before solo flight.`,
          });
          results.studentsWarned++;
        } else if (daysSinceLastFlight >= 85) {
          // Critical warning - 5 days until expiration
          await sendNotification({
            recipientId: student.id,
            type: 'CURRENCY_WARNING',
            subject: '⚠️ Flight Currency Expiring Soon',
            message: `Your flight currency expires in ${90 - daysSinceLastFlight} days. Schedule a flight soon to maintain currency.`,
          });
          results.studentsWarned++;
        } else if (daysSinceLastFlight >= 75) {
          // Urgent warning - 15 days until expiration
          await sendNotification({
            recipientId: student.id,
            type: 'CURRENCY_WARNING',
            subject: 'Flight Currency Expiring Soon',
            message: `Your flight currency expires in ${90 - daysSinceLastFlight} days. Consider scheduling a flight.`,
          });
          results.studentsWarned++;
        } else if (daysSinceLastFlight >= 60) {
          // Early warning - 30 days until expiration
          await sendNotification({
            recipientId: student.id,
            type: 'CURRENCY_WARNING',
            subject: 'Flight Currency Reminder',
            message: `Your flight currency expires in ${90 - daysSinceLastFlight} days. Plan ahead to maintain currency.`,
          });
          results.studentsWarned++;
        }
      }

      // Check instructor currency (90-day rule for instructional flights)
      const instructors = await prisma.instructor.findMany({
        where: {
          lastInstructionalFlight: {
            not: null,
          },
        },
      });

      for (const instructor of instructors) {
        if (!instructor.lastInstructionalFlight) continue;

        results.instructorsChecked++;
        const daysSinceLastFlight = Math.floor(
          (now.getTime() - instructor.lastInstructionalFlight.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Send warnings at thresholds
        // Note: Notification system currently only supports students
        // For instructors, we log the warning (can be extended later)
        if (daysSinceLastFlight >= 90) {
          // Not current - log critical warning
          console.log(`⚠️ Instructor ${instructor.email} currency expired: ${daysSinceLastFlight} days since last instructional flight`);
          // TODO: Extend notification system to support instructors
          results.instructorsWarned++;
        } else if (daysSinceLastFlight >= 75) {
          // Urgent warning
          console.log(`⚠️ Instructor ${instructor.email} currency expiring: ${90 - daysSinceLastFlight} days remaining`);
          // TODO: Extend notification system to support instructors
          results.instructorsWarned++;
        }
      }

      return results;
    } catch (error: any) {
      console.error('Error in currency check:', error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 3,
  }
);

// Maintenance Reminder Worker
export const maintenanceReminderWorker = new Worker(
  'maintenance-reminder',
  async (job) => {
    const now = new Date();
    const results = {
      aircraftChecked: 0,
      remindersSent: 0,
    };

    try {
      // Check aircraft maintenance due dates
      const aircraft = await prisma.aircraft.findMany({
        include: {
          school: true,
        },
      });

      for (const ac of aircraft) {
        results.aircraftChecked++;

        // Check 100-hour inspection
        if (ac.nextInspectionDue) {
          const daysUntilInspection = Math.floor(
            (ac.nextInspectionDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Alert at 90% of interval (e.g., 90 hours for 100-hour inspection)
          const hoursRemaining = (ac.nextInspectionDue.getTime() - now.getTime()) / (1000 * 60 * 60);
          const inspectionInterval = 100; // 100-hour inspection
          const percentRemaining = (hoursRemaining / inspectionInterval) * 100;

          if (percentRemaining <= 10 && daysUntilInspection <= 14) {
            // Send maintenance alert to admins (would need admin notification system)
            // For now, log it
            console.log(`Maintenance alert: ${ac.tailNumber} needs inspection in ${daysUntilInspection} days`);
            results.remindersSent++;
          }
        }

        // Check annual inspection
        // Note: Annual inspection would be tracked separately, but for now we use nextInspectionDue
        // In production, you'd have separate fields for 100-hour vs annual
      }

      return results;
    } catch (error: any) {
      console.error('Error in maintenance reminder:', error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 2,
  }
);

// Reschedule Expiration Worker
export const rescheduleExpirationWorker = new Worker(
  'reschedule-expiration',
  async (job) => {
    const now = new Date();
    const results = {
      requestsChecked: 0,
      requestsExpired: 0,
      flightsRestored: 0,
    };

    try {
      // Find all pending reschedule requests that have expired
      const expiredRequests = await prisma.rescheduleRequest.findMany({
        where: {
          status: { in: ['PENDING_STUDENT', 'PENDING_INSTRUCTOR'] },
          expiresAt: {
            lte: now,
          },
        },
        include: {
          flight: true,
        },
      });

      results.requestsChecked = expiredRequests.length;

      for (const request of expiredRequests) {
        // Mark request as expired
        await prisma.rescheduleRequest.update({
          where: { id: request.id },
          data: {
            status: 'EXPIRED',
          },
        });

        results.requestsExpired++;

        // If flight was cancelled due to weather/maintenance, we keep it cancelled
        // (Don't restore to SCHEDULED as the original issue may still exist)
        // But we could optionally notify the student that the reschedule window expired

        // Notify student that reschedule request expired
        try {
          await sendNotification({
            recipientId: request.studentId,
            type: 'RESCHEDULE_SUGGESTION', // Using existing type (could add RESCHEDULE_EXPIRED to enum later)
            subject: 'Reschedule Request Expired',
            message: `Your reschedule request for flight on ${new Date(request.flight.scheduledStart).toLocaleDateString()} has expired. Please contact your instructor to reschedule.`,
            flightId: request.flightId,
            metadata: {
              rescheduleRequestId: request.id,
              expired: true,
            },
          });
        } catch (error) {
          console.error(`Error sending expiration notification for request ${request.id}:`, error);
        }
      }

      return results;
    } catch (error: any) {
      console.error('Error in reschedule expiration check:', error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 2,
  }
);

// Error handling
weatherCheckWorker.on('completed', (job) => {
  console.log(`Weather check job ${job.id} completed`);
});

weatherCheckWorker.on('failed', (job, err) => {
  console.error(`Weather check job ${job?.id} failed:`, err);
});

rescheduleExpirationWorker.on('completed', (job) => {
  console.log(`Reschedule expiration job ${job.id} completed`);
});

rescheduleExpirationWorker.on('failed', (job, err) => {
  console.error(`Reschedule expiration job ${job?.id} failed:`, err);
});


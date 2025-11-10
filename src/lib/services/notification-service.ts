import { Resend } from 'resend';
import { ref, push } from 'firebase/database';
import { database } from '@/lib/firebase';
import { prisma } from '@/lib/prisma';
import { sendSMS, generateSMSMessage } from './sms-service';

/**
 * Check if current time is within quiet hours
 */
function isInQuietHours(start: string, end: string): boolean {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
  
  const [startHour, startMin] = start.split(':').map(Number);
  const startTime = startHour * 60 + startMin;
  
  const [endHour, endMin] = end.split(':').map(Number);
  const endTime = endHour * 60 + endMin;
  
  // Handle quiet hours that span midnight
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }
  
  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Determine if notification should be sent based on preferences
 */
function shouldSendNotification(
  channel: 'email' | 'sms' | 'push',
  legacyEnabled: boolean,
  eventTypeEnabled: boolean | undefined,
  channelEnabled: boolean | undefined,
  inQuietHours: boolean,
  timingPrefs: any
): boolean {
  // If in quiet hours and not immediate, don't send
  if (inQuietHours && !timingPrefs?.immediate) {
    return false;
  }
  
  // Check event-specific preference first
  if (eventTypeEnabled !== undefined) {
    return eventTypeEnabled;
  }
  
  // Check channel preference
  if (channelEnabled !== undefined) {
    return channelEnabled;
  }
  
  // Fall back to legacy setting
  return legacyEnabled;
}

/**
 * Get Resend client instance (lazy initialization)
 * Only initializes when actually needed, preventing build-time errors
 */
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured. Email notifications will be disabled.');
    return null;
  }
  return new Resend(apiKey);
}

export interface NotificationData {
  recipientId: string;
  type: 'WEATHER_ALERT' | 'WEATHER_CONFLICT' | 'RESCHEDULE_SUGGESTION' | 'RESCHEDULE_CONFIRMED' | 'FLIGHT_REMINDER' | 'CURRENCY_WARNING' | 'MAINTENANCE_ALERT' | 'SQUAWK_REPORTED';
  subject: string;
  message: string;
  flightId?: string;
  metadata?: any;
}

/**
 * Send notification via email and in-app
 */
export async function sendNotification(data: NotificationData) {
  try {
    // Get recipient - use select to avoid fetching missing columns
    const student = await prisma.student.findUnique({
      where: { id: data.recipientId },
      select: {
        id: true,
        email: true,
        firstName: true,
        phone: true,
        emailNotifications: true,
        smsOptIn: true,
        phoneVerified: true,
        schoolId: true,
        notificationPreferences: true,
      },
    });

    if (!student) {
      throw new Error('Recipient not found');
    }

    // Check notification preferences
    const prefs = (student.notificationPreferences as any) || {};
    const eventTypeKey = data.type.toLowerCase().replace(/_/g, '');
    const eventPrefs = prefs.eventTypes?.[eventTypeKey] || {};
    
    // Check quiet hours
    const quietHours = prefs.timing?.quietHours;
    const inQuietHours = quietHours?.enabled && isInQuietHours(quietHours.start, quietHours.end);
    
    // Determine if we should send based on preferences
    const shouldSendEmail = shouldSendNotification('email', student.emailNotifications, eventPrefs.email, prefs.channels?.email, inQuietHours, prefs.timing);
    const shouldSendSMS = shouldSendNotification('sms', student.smsOptIn && student.phoneVerified, eventPrefs.sms, prefs.channels?.sms, inQuietHours, prefs.timing);
    const shouldSendPush = shouldSendNotification('push', true, eventPrefs.push, prefs.channels?.push, inQuietHours, prefs.timing);

    // Send email if enabled
    if (shouldSendEmail) {
      try {
        const resend = getResendClient();
        if (!resend) {
          console.warn('Resend client not available. Skipping email notification.');
        } else {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@flightpro.com',
            to: student.email,
            subject: data.subject,
            html: data.message,
          });
          
          // Save email notification
          await prisma.notification.create({
            data: {
              recipientId: data.recipientId,
              type: data.type,
              channel: 'EMAIL',
              subject: data.subject,
              message: data.message,
              flightId: data.flightId,
              metadata: data.metadata,
              sentAt: new Date(),
            },
          });
        }
      } catch (error) {
        console.error('Error sending email:', error);
      }
    }

    // Send SMS if enabled and opted in
    if (shouldSendSMS && student.phone) {
      try {
        const smsMessage = generateSMSMessage(data.type, {
          studentName: student.firstName,
          ...data.metadata,
        });

        const smsResult = await sendSMS({
          to: student.phone,
          message: smsMessage,
          recipientId: data.recipientId,
          notificationType: data.type,
        });

        if (smsResult.success) {
          // Save SMS notification
          await prisma.notification.create({
            data: {
              recipientId: data.recipientId,
              type: data.type,
              channel: 'SMS',
              subject: data.subject,
              message: smsMessage,
              flightId: data.flightId,
              metadata: data.metadata,
              sentAt: new Date(),
            },
          });

          // Track SMS cost
          if (smsResult.cost && smsResult.messageId) {
            await prisma.sMSCost.create({
              data: {
                schoolId: student.schoolId,
                recipientId: data.recipientId,
                phoneNumber: student.phone,
                messageId: smsResult.messageId,
                cost: smsResult.cost,
                notificationType: data.type,
              },
            });
          }
        } else {
          console.error('Error sending SMS:', smsResult.error);
        }
      } catch (error) {
        console.error('Error sending SMS:', error);
      }
    }

    // Send in-app notification via Firebase
    if (shouldSendPush && database) {
      try {
        const notificationsRef = ref(database, `notifications/${data.recipientId}`);
        await push(notificationsRef, {
          type: data.type,
          subject: data.subject,
          message: data.message,
          flightId: data.flightId,
          metadata: data.metadata,
          createdAt: new Date().toISOString(),
          read: false,
        });
      } catch (error) {
        console.error('Error sending in-app notification:', error);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

/**
 * Generate weather conflict email
 */
export function generateWeatherConflictEmail(data: {
  student: any;
  flight: any;
  weatherCheck: any;
  forecastConfidence?: {
    confidence: number;
    tier: 'HIGH' | 'MEDIUM' | 'LOW';
    trend: 'IMPROVING' | 'WORSENING' | 'STABLE';
    recommendation: 'AUTO_RESCHEDULE' | 'ALERT' | 'MONITOR';
  };
}): NotificationData {
  const confidenceInfo = data.forecastConfidence
    ? `<br/><strong>Forecast Confidence:</strong> ${data.forecastConfidence.confidence}% (${data.forecastConfidence.tier})<br/>
       <strong>Trend:</strong> ${data.forecastConfidence.trend}<br/>
       <strong>Recommendation:</strong> ${data.forecastConfidence.recommendation === 'AUTO_RESCHEDULE' ? 'Auto-reschedule suggested' : data.forecastConfidence.recommendation === 'ALERT' ? 'Monitor closely' : 'Continue monitoring'}`
    : '';

  return {
    recipientId: data.student.id,
    type: 'WEATHER_CONFLICT',
    subject: `Weather Alert - Flight ${new Date(data.flight.scheduledStart).toLocaleDateString()} May Need Rescheduling`,
    message: `
      <h2>Weather Alert</h2>
      <p>Hi ${data.student.firstName},</p>
      <p>We're monitoring weather conditions for your upcoming flight lesson:</p>
      <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
        <strong>Flight Details:</strong><br/>
        Date: ${new Date(data.flight.scheduledStart).toLocaleString()}<br/>
        Aircraft: ${data.flight.aircraft?.tailNumber || 'TBD'}<br/>
        Instructor: ${data.flight.instructor ? `${data.flight.instructor.firstName} ${data.flight.instructor.lastName}` : 'TBD'}<br/>
        ${confidenceInfo}
        Lesson: ${data.flight.lessonTitle || 'Flight Lesson'}
      </div>
      <div style="background: #fff3cd; padding: 20px; margin: 20px 0;">
        <strong>⚠️ Weather Concern (${data.weatherCheck.confidence}% confidence):</strong><br/>
        ${(data.weatherCheck.reasons as string[]).join('<br/>')}
      </div>
      <p>We'll continue monitoring and will send rescheduling options if conditions don't improve.</p>
    `,
    flightId: data.flight.id,
    metadata: {
      weatherCheckId: data.weatherCheck.id,
      confidence: data.weatherCheck.confidence,
    },
  };
}


import { Resend } from 'resend';
import { ref, push } from 'firebase/database';
import { database } from '@/lib/firebase';
import { prisma } from '@/lib/prisma';
import { sendSMS, generateSMSMessage } from './sms-service';

const resend = new Resend(process.env.RESEND_API_KEY);

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
    // Get recipient
    const student = await prisma.student.findUnique({
      where: { id: data.recipientId },
    });

    if (!student) {
      throw new Error('Recipient not found');
    }

    // Send email if enabled
    if (student.emailNotifications) {
      try {
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
      } catch (error) {
        console.error('Error sending email:', error);
      }
    }

    // Send SMS if enabled and opted in
    if (student.smsNotifications && student.smsOptIn && student.phoneVerified && student.phone) {
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
    if (database) {
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


/**
 * SMS Service using Twilio
 * 
 * Handles SMS notifications with opt-in/opt-out support and cost tracking
 */

interface SMSOptions {
  to: string;
  message: string;
  recipientId?: string;
  notificationType?: string;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  cost?: number;
  error?: string;
}

/**
 * Send SMS via Twilio
 * Note: Requires TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables
 */
export async function sendSMS(options: SMSOptions): Promise<SMSResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio not configured. Skipping SMS send.');
    return {
      success: false,
      error: 'Twilio not configured',
    };
  }

  try {
    // Format phone number (ensure E.164 format)
    const formattedTo = formatPhoneNumber(options.to);
    if (!formattedTo) {
      return {
        success: false,
        error: 'Invalid phone number format',
      };
    }

    // Send SMS via Twilio API
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: formattedTo,
          Body: options.message,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Failed to send SMS',
      };
    }

    // Calculate cost (approximate - Twilio pricing varies by country)
    // US/Canada: ~$0.0075 per SMS
    const cost = calculateSMSCost(formattedTo);

    return {
      success: true,
      messageId: data.sid,
      cost,
    };
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}

/**
 * Format phone number to E.164 format
 */
function formatPhoneNumber(phone: string): string | null {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // If starts with 1 and has 11 digits, it's US/Canada
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // If has 10 digits, assume US and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If already starts with +, return as is
  if (phone.startsWith('+')) {
    return phone;
  }

  return null;
}

/**
 * Calculate SMS cost (approximate)
 * Twilio pricing varies by country, this is a simplified estimate
 */
function calculateSMSCost(phoneNumber: string): number {
  // US/Canada: ~$0.0075 per SMS
  if (phoneNumber.startsWith('+1')) {
    return 0.0075;
  }

  // Default estimate for other countries
  return 0.01;
}

/**
 * Verify phone number using Twilio Lookup API
 */
export async function verifyPhoneNumber(phoneNumber: string): Promise<{
  valid: boolean;
  formatted?: string;
  countryCode?: string;
  error?: string;
}> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return {
      valid: false,
      error: 'Twilio not configured',
    };
  }

  try {
    const formatted = formatPhoneNumber(phoneNumber);
    if (!formatted) {
      return {
        valid: false,
        error: 'Invalid phone number format',
      };
    }

    const response = await fetch(
      `https://lookups.twilio.com/v1/PhoneNumbers/${encodeURIComponent(formatted)}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        },
      }
    );

    if (!response.ok) {
      return {
        valid: false,
        error: 'Phone number lookup failed',
      };
    }

    const data = await response.json();

    return {
      valid: true,
      formatted: data.phone_number,
      countryCode: data.country_code,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Phone verification failed',
    };
  }
}

/**
 * Generate SMS message from notification data
 * Keeps messages under 160 characters for single SMS
 */
export function generateSMSMessage(
  type: string,
  data: {
    studentName?: string;
    flightDate?: Date;
    flightTime?: string;
    aircraft?: string;
    instructor?: string;
    reason?: string;
    [key: string]: any;
  }
): string {
  const templates: Record<string, (d: any) => string> = {
    WEATHER_ALERT: (d) =>
      `FlightPro: Weather alert for ${formatDate(d.flightDate)}. Check app for details.`,
    WEATHER_CONFLICT: (d) =>
      `FlightPro: Weather conflict detected for ${formatDate(d.flightDate)}. Reschedule options available in app.`,
    RESCHEDULE_SUGGESTION: (d) =>
      `FlightPro: New reschedule options for your flight. Check app to select.`,
    RESCHEDULE_CONFIRMED: (d) =>
      `FlightPro: Flight rescheduled to ${formatDate(d.flightDate)} ${d.flightTime || ''}. Confirmed!`,
    FLIGHT_REMINDER: (d) =>
      `FlightPro: Reminder - Flight tomorrow at ${d.flightTime || 'TBD'}. Aircraft: ${d.aircraft || 'TBD'}`,
    CURRENCY_WARNING: (d) =>
      `FlightPro: Currency warning - ${d.reason || 'Action needed'}. Check app for details.`,
    MAINTENANCE_ALERT: (d) =>
      `FlightPro: Maintenance alert - ${d.reason || 'Aircraft unavailable'}. Check app.`,
    SQUAWK_REPORTED: (d) =>
      `FlightPro: Squawk reported for ${d.aircraft || 'aircraft'}. Check app for status.`,
  };

  const template = templates[type];
  if (!template) {
    return `FlightPro: You have a new notification. Check the app for details.`;
  }

  let message = template(data);

  // Ensure message is under 160 characters
  if (message.length > 160) {
    message = message.substring(0, 157) + '...';
  }

  return message;
}

function formatDate(date?: Date): string {
  if (!date) return 'TBD';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}


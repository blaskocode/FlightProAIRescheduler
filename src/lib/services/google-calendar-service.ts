/**
 * Google Calendar Service
 * 
 * Handles bidirectional sync between Flight Schedule Pro and Google Calendar
 */

interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: string;
  attendees?: Array<{ email: string }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
}

interface CalendarSyncConfig {
  accessToken: string;
  refreshToken: string;
  calendarId: string;
  syncEnabled: boolean;
}

/**
 * Create a Google Calendar event from a flight
 */
export function createCalendarEventFromFlight(flight: {
  id: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  lessonTitle?: string | null;
  student: { firstName: string; lastName: string; email: string };
  instructor?: { firstName: string; lastName: string; email: string } | null;
  aircraft: { tailNumber: string };
  departureAirport: string;
  destinationAirport?: string | null;
}): GoogleCalendarEvent {
  const start = new Date(flight.scheduledStart);
  const end = new Date(flight.scheduledEnd);
  
  const summary = `Flight Lesson: ${flight.lessonTitle || 'Flight Training'}`;
  const description = `
Flight Details:
- Student: ${flight.student.firstName} ${flight.student.lastName}
- Instructor: ${flight.instructor ? `${flight.instructor.firstName} ${flight.instructor.lastName}` : 'TBD'}
- Aircraft: ${flight.aircraft.tailNumber}
- Departure: ${flight.departureAirport}
${flight.destinationAirport ? `- Destination: ${flight.destinationAirport}` : ''}
- Flight ID: ${flight.id}
  `.trim();

  const attendees = [
    { email: flight.student.email },
  ];
  
  if (flight.instructor?.email) {
    attendees.push({ email: flight.instructor.email });
  }

  return {
    summary,
    description,
    start: {
      dateTime: start.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: 'UTC',
    },
    location: flight.departureAirport,
    attendees,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 24 hours before
        { method: 'popup', minutes: 60 }, // 1 hour before
      ],
    },
  };
}

/**
 * Create or update event in Google Calendar
 */
export async function syncFlightToCalendar(
  flight: any,
  config: CalendarSyncConfig
): Promise<{ eventId: string; webhookId?: string }> {
  const event = createCalendarEventFromFlight(flight);
  const calendarId = config.calendarId || 'primary';

  // If flight already has a calendar event ID, update it
  if (flight.calendarEventId) {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${flight.calendarEventId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to update calendar event: ${error.error?.message || 'Unknown error'}`);
    }

    const updatedEvent = await response.json();
    return { eventId: updatedEvent.id };
  }

  // Otherwise, create new event
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create calendar event: ${error.error?.message || 'Unknown error'}`);
  }

  const createdEvent = await response.json();
  return { eventId: createdEvent.id };
}

/**
 * Delete event from Google Calendar
 */
export async function deleteCalendarEvent(
  eventId: string,
  config: CalendarSyncConfig
): Promise<void> {
  const calendarId = config.calendarId || 'primary';

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    const error = await response.json();
    throw new Error(`Failed to delete calendar event: ${error.error?.message || 'Unknown error'}`);
  }
}

/**
 * Get events from Google Calendar for a date range
 * Used to import availability
 */
export async function getCalendarEvents(
  config: CalendarSyncConfig,
  startDate: Date,
  endDate: Date
): Promise<GoogleCalendarEvent[]> {
  const calendarId = config.calendarId || 'primary';

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
    `timeMin=${startDate.toISOString()}&timeMax=${endDate.toISOString()}&singleEvents=true&orderBy=startTime`,
    {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch calendar events: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to refresh token: ${error.error || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Check for conflicts between flight times and Google Calendar events
 */
export async function checkCalendarConflicts(
  config: CalendarSyncConfig,
  startDate: Date,
  endDate: Date
): Promise<Array<{ start: Date; end: Date; summary: string }>> {
  const events = await getCalendarEvents(config, startDate, endDate);
  
  return events
    .filter((event) => event.start?.dateTime)
    .map((event) => ({
      start: new Date(event.start.dateTime),
      end: new Date(event.end.dateTime),
      summary: event.summary || 'Untitled Event',
    }));
}


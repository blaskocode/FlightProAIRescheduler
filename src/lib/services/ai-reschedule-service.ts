import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { fetchFAAWeather } from './weather-service';

// Lazy initialization to avoid build-time errors when API key is not available
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({
      apiKey,
    });
  }
  return openaiClient;
}

export interface RescheduleSuggestion {
  slot: string; // ISO datetime
  instructorId: string;
  aircraftId: string;
  priority: number;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  weatherForecast: string;
}

export interface RescheduleResponse {
  suggestions: RescheduleSuggestion[];
  alternativeAircraft?: Array<{
    aircraft: string;
    note: string;
  }>;
  priorityFactors: {
    studentCurrency: string;
    trainingMilestone: string;
    rescheduleHistory: string;
  };
}

/**
 * Generate AI-powered reschedule suggestions
 */
export async function generateRescheduleSuggestions(
  flightId: string
): Promise<RescheduleResponse> {
  // Fetch flight with all related data
  // Use select to avoid fetching missing columns like smsNotifications
  const flight = await prisma.flight.findUnique({
    where: { id: flightId },
    select: {
      id: true,
      schoolId: true,
      studentId: true,
      instructorId: true,
      aircraftId: true,
      scheduledStart: true,
      scheduledEnd: true,
      departureAirport: true,
      destinationAirport: true,
      route: true,
      flightType: true,
      status: true,
      lessonNumber: true,
      lessonTitle: true,
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          trainingLevel: true,
          currentStage: true,
          availability: true,
          preferredInstructorId: true,
          lastFlightDate: true,
          schoolId: true,
          school: {
            select: {
              id: true,
              name: true,
              airportCode: true,
            },
          },
        },
      },
      instructor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          availability: true,
          schoolId: true,
        },
      },
      aircraft: {
        select: {
          id: true,
          tailNumber: true,
          aircraftType: {
            select: {
              id: true,
              make: true,
              model: true,
              category: true,
            },
          },
        },
      },
      school: {
        select: {
          id: true,
          name: true,
          airportCode: true,
        },
      },
    },
  });

  if (!flight) {
    throw new Error('Flight not found');
  }

  // Gather availability data
  const studentAvailability = flight.student.availability || [];
  const instructorAvailability = flight.instructor?.availability || [];

  // Get available instructors
  const availableInstructors = await prisma.instructor.findMany({
    where: {
      schoolId: flight.schoolId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      availability: true,
      schoolId: true,
    },
  });

  // Get available aircraft
  const availableAircraft = await prisma.aircraft.findMany({
    where: {
      schoolId: flight.schoolId,
      status: 'AVAILABLE',
    },
    include: {
      aircraftType: true,
    },
  });

  // Build context for AI
  const context = {
    canceledFlight: {
      id: flight.id,
      student: {
        name: `${flight.student.firstName} ${flight.student.lastName}`,
        trainingLevel: flight.student.trainingLevel,
        progressStage: flight.student.currentStage,
        availability: studentAvailability,
      },
      instructor: flight.instructor
        ? {
            name: `${flight.instructor.firstName} ${flight.instructor.lastName}`,
            availability: instructorAvailability,
          }
        : null,
      aircraft: {
        tailNumber: flight.aircraft.tailNumber,
        type: `${flight.aircraft.aircraftType.make} ${flight.aircraft.aircraftType.model}`,
      },
      originalTime: flight.scheduledStart.toISOString(),
      weatherReason: 'Weather conflict detected',
    },
    constraints: {
      studentAvailability: studentAvailability,
      instructorAvailability: availableInstructors.map((i) => ({
        id: i.id,
        name: `${i.firstName} ${i.lastName}`,
        availability: i.availability,
      })),
      aircraftSchedule: availableAircraft.map((a) => ({
        id: a.id,
        tailNumber: a.tailNumber,
        type: `${a.aircraftType.make} ${a.aircraftType.model}`,
      })),
      minimumGap: '30 minutes between flights',
      preferredInstructor: flight.student.preferredInstructorId !== null,
      trainingContinuity: `Lesson ${flight.lessonNumber} of Stage ${flight.student.currentStage}`,
    },
    optimizationGoals: [
      'Minimize training delay',
      'Maintain instructor continuity',
      'Ensure aircraft availability',
      `Consider student currency (last flight ${flight.student.lastFlightDate ? new Date(flight.student.lastFlightDate).toLocaleDateString() : 'never'})`,
    ],
    routeWeather: flight.route ? {
      route: flight.route,
      // Route weather will be checked separately and added to context if available
      note: 'Route weather should be checked for cross-country flights',
    } : null,
  };

  // Build route weather info string if available
  const routeWeatherInfo = context.routeWeather
    ? `\n\nROUTE WEATHER:\n- Route: ${context.routeWeather.route}\n- Note: ${context.routeWeather.note}`
    : '';

  // Generate AI prompt
  const prompt = `You are an intelligent flight school scheduler. A flight lesson has been canceled due to weather.

CANCELED FLIGHT:
- Student: ${context.canceledFlight.student.name} (${context.canceledFlight.student.trainingLevel})
- Instructor: ${context.canceledFlight.instructor?.name || 'TBD'}
- Aircraft: ${context.canceledFlight.aircraft.tailNumber} (${context.canceledFlight.aircraft.type})
- Original Time: ${new Date(context.canceledFlight.originalTime).toLocaleString()}
- Reason: ${context.canceledFlight.weatherReason}

STUDENT CONTEXT:
- Current Stage: ${context.canceledFlight.student.progressStage}
- Current Lesson: ${context.canceledFlight.student.trainingLevel}
- Last Flight: ${flight.student.lastFlightDate ? new Date(flight.student.lastFlightDate).toLocaleDateString() : 'Never'}

AVAILABILITY CONSTRAINTS:
- Student Available: ${JSON.stringify(context.constraints.studentAvailability)}
- Instructors Available: ${JSON.stringify(context.constraints.instructorAvailability)}
- Aircraft Available: ${JSON.stringify(context.constraints.aircraftSchedule)}

GOALS:
1. Minimize training delay
2. Maintain instructor continuity if possible
3. Ensure all resources (student, instructor, aircraft) are available
4. Consider student currency
5. Respect 30-minute buffer between flights

TASK:
Generate 3 optimal reschedule options, ranked by preference. For each option, provide:
1. Suggested date/time (ISO format)
2. Instructor ID
3. Aircraft ID
4. Reasoning (why this is a good option)
5. Confidence level (high/medium/low)
6. Weather forecast at that time

Respond ONLY in JSON format with this structure:
{
  "suggestions": [
    {
      "slot": "ISO datetime",
      "instructorId": "id",
      "aircraftId": "id",
      "priority": 1,
      "reasoning": "bullet points",
      "confidence": "high/medium/low",
      "weatherForecast": "brief description"
    }
  ],
  "priorityFactors": {
    "studentCurrency": "description",
    "trainingMilestone": "description",
    "rescheduleHistory": "description"
  }
}
${routeWeatherInfo}`;

  try {
    // Use environment variable or default to gpt-4
    const model = process.env.OPENAI_MODEL || 'gpt-4';
    
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a flight school scheduling assistant. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from AI');
    }

    const aiResponse = JSON.parse(responseText) as RescheduleResponse;

    // Validate and enhance suggestions with actual weather forecasts
    const validatedSuggestions = await Promise.all(
      aiResponse.suggestions.map(async (suggestion, index) => {
        // Check weather for suggested time
        const suggestedDate = new Date(suggestion.slot);
        const weather = await fetchFAAWeather(flight.departureAirport, flight.schoolId);
        
        return {
          ...suggestion,
          weatherForecast: weather
            ? `Visibility ${weather.visibility.value} SM, Ceiling ${weather.clouds[0]?.altitude || 'unlimited'} ft, Winds ${weather.wind.speed} kt`
            : suggestion.weatherForecast,
        };
      })
    );

    return {
      ...aiResponse,
      suggestions: validatedSuggestions,
    };
  } catch (error) {
    console.error('AI reschedule generation failed:', error);
    // Fallback to rule-based suggestions
    return generateFallbackSuggestions(flight, availableInstructors, availableAircraft);
  }
}

/**
 * Fallback rule-based rescheduling if AI fails
 */
function generateFallbackSuggestions(
  flight: any,
  instructors: any[],
  aircraft: any[]
): RescheduleResponse {
  const suggestions: RescheduleSuggestion[] = [];
  const tomorrow = new Date(flight.scheduledStart);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(flight.scheduledStart.getHours(), 0, 0, 0);

  // Generate 3 simple suggestions
  for (let i = 0; i < 3; i++) {
    const date = new Date(tomorrow);
    date.setDate(date.getDate() + i);
    
    const instructor = instructors[i % instructors.length] || instructors[0];
    const aircraftOption = aircraft[i % aircraft.length] || aircraft[0];

    suggestions.push({
      slot: date.toISOString(),
      instructorId: instructor.id,
      aircraftId: aircraftOption.id,
      priority: i + 1,
      reasoning: `Same time slot, ${i === 0 ? 'next day' : `${i + 1} days later`}`,
      confidence: 'medium',
      weatherForecast: 'Check weather forecast',
    });
  }

  return {
    suggestions,
    priorityFactors: {
      studentCurrency: 'Last flight date unknown',
      trainingMilestone: `Stage ${flight.student.currentStage}`,
      rescheduleHistory: 'First reschedule',
    },
  };
}


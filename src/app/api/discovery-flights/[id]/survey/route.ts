import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/services/notification-service';

/**
 * POST /api/discovery-flights/[id]/survey
 * Submit post-flight survey and trigger enrollment offer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { responses } = body; // Survey responses as JSON

    const discovery = await prisma.discoveryFlight.findUnique({
      where: { id },
      include: {
        flight: {
          include: {
            student: true,
            school: true,
          },
        },
      },
    });

    if (!discovery) {
      return NextResponse.json({ error: 'Discovery flight not found' }, { status: 404 });
    }

    // Update discovery record with survey response
    await prisma.discoveryFlight.update({
      where: { id },
      data: {
        surveySent: true,
        surveyCompleted: true,
        surveyResponse: responses,
      },
    });

    // Send enrollment offer email
    try {
      await sendNotification({
        recipientId: discovery.flight.studentId,
        type: 'FLIGHT_REMINDER',
        subject: 'Ready to Start Your Flight Training Journey?',
        message: `
          <h2>Thank You for Your Discovery Flight!</h2>
          <p>Hi ${discovery.firstName},</p>
          <p>We hope you enjoyed your discovery flight experience!</p>
          <p>Based on your interest, we'd love to help you start your journey to becoming a pilot.</p>
          <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
            <h3>Special Enrollment Offer</h3>
            <p>Sign up for our flight training program and receive:</p>
            <ul>
              <li>Personalized training plan</li>
              <li>Progress tracking dashboard</li>
              <li>AI-powered rescheduling for weather conflicts</li>
              <li>Access to our full curriculum</li>
            </ul>
          </div>
          <p>Ready to take the next step? Create your account to get started!</p>
        `.trim(),
        flightId: discovery.flightId,
        metadata: {
          discoveryFlightId: id,
          enrollmentOffer: true,
        },
      });

      await prisma.discoveryFlight.update({
        where: { id },
        data: { enrollmentOfferSent: true },
      });
    } catch (error) {
      console.error('Error sending enrollment offer:', error);
      // Don't fail if email fails
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error submitting survey:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


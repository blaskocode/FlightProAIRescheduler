/**
 * Script to verify weather checks were created successfully
 * 
 * Usage: npx tsx scripts/verify-weather-checks.ts
 */

import { prisma } from '../src/lib/prisma';

async function verifyWeatherChecks() {
  try {
    console.log('Checking recent weather checks...\n');

    // Get the most recent weather checks (last 10)
    const recentChecks = await prisma.weatherCheck.findMany({
      take: 10,
      orderBy: {
        checkTime: 'desc',
      },
      select: {
        id: true,
        flightId: true,
        checkType: true,
        checkTime: true,
        location: true,
        result: true,
        confidence: true,
        reasons: true,
        visibility: true,
        ceiling: true,
        windSpeed: true,
        windGust: true,
        flight: {
          select: {
            id: true,
            scheduledStart: true,
            status: true,
            student: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    console.log(`Found ${recentChecks.length} recent weather checks:\n`);

    for (const check of recentChecks) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Weather Check ID: ${check.id}`);
      console.log(`Flight ID: ${check.flightId}`);
      console.log(`Student: ${check.flight.student.firstName} ${check.flight.student.lastName} (${check.flight.student.email})`);
      console.log(`Scheduled: ${new Date(check.flight.scheduledStart).toLocaleString()}`);
      console.log(`Check Time: ${new Date(check.checkTime).toLocaleString()}`);
      console.log(`Check Type: ${check.checkType}`);
      console.log(`Location: ${check.location}`);
      console.log(`Result: ${check.result}`);
      console.log(`Confidence: ${check.confidence}%`);
      
      if (check.reasons && Array.isArray(check.reasons) && check.reasons.length > 0) {
        console.log(`Reasons: ${check.reasons.join(', ')}`);
      }
      
      console.log(`Weather Conditions:`);
      console.log(`  Visibility: ${check.visibility} SM`);
      console.log(`  Ceiling: ${check.ceiling} ft`);
      console.log(`  Wind Speed: ${check.windSpeed} knots`);
      if (check.windGust) {
        console.log(`  Wind Gust: ${check.windGust} knots`);
      }
      console.log(`Flight Status: ${check.flight.status}`);
      console.log('');
    }

    // Check for any reschedule requests created from weather checks
    const rescheduleRequests = await prisma.rescheduleRequest.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
        status: {
          in: ['PENDING_STUDENT', 'PENDING_INSTRUCTOR'],
        },
      },
      select: {
        id: true,
        flightId: true,
        status: true,
        createdAt: true,
        flight: {
          select: {
            scheduledStart: true,
            student: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Reschedule Requests Created (last hour): ${rescheduleRequests.length}\n`);

    if (rescheduleRequests.length > 0) {
      for (const request of rescheduleRequests) {
        console.log(`  - Request ID: ${request.id}`);
        console.log(`    Flight: ${request.flight.student.firstName} ${request.flight.student.lastName}`);
        console.log(`    Scheduled: ${new Date(request.flight.scheduledStart).toLocaleString()}`);
        console.log(`    Status: ${request.status}`);
        console.log(`    Created: ${new Date(request.createdAt).toLocaleString()}`);
        console.log('');
      }
    }

    // Summary
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Summary:`);
    console.log(`  Total recent checks: ${recentChecks.length}`);
    console.log(`  UNSAFE results: ${recentChecks.filter(c => c.result === 'UNSAFE').length}`);
    console.log(`  MARGINAL results: ${recentChecks.filter(c => c.result === 'MARGINAL').length}`);
    console.log(`  SAFE results: ${recentChecks.filter(c => c.result === 'SAFE').length}`);
    console.log(`  Reschedule requests: ${rescheduleRequests.length}`);

  } catch (error: any) {
    console.error('Error verifying weather checks:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyWeatherChecks();


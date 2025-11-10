import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface VerificationResult {
  passed: boolean;
  message: string;
  details?: any;
}

async function verifyRescheduleWorkflow() {
  console.log('🔍 Verifying Reschedule Workflow Database Changes...\n');
  console.log('=' .repeat(60));

  const results: VerificationResult[] = [];

  // 1. Check for rescheduled flights
  console.log('\n1️⃣ Checking for Rescheduled Flights...');
  const rescheduledFlights = await prisma.flight.findMany({
    where: {
      status: 'RESCHEDULED',
    },
    include: {
      student: { select: { email: true, firstName: true, lastName: true } },
      instructor: { select: { email: true, firstName: true, lastName: true } },
      rescheduledTo: {
        select: {
          id: true,
          scheduledStart: true,
          status: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  });

  if (rescheduledFlights.length > 0) {
    results.push({
      passed: true,
      message: `✅ Found ${rescheduledFlights.length} rescheduled flight(s)`,
      details: rescheduledFlights.map((f) => ({
        id: f.id,
        originalTime: f.scheduledStart,
        student: `${f.student?.firstName} ${f.student?.lastName}`,
        instructor: `${f.instructor?.firstName} ${f.instructor?.lastName}`,
        newFlights: f.rescheduledTo.length,
      })),
    });

    console.log(`   ✅ Found ${rescheduledFlights.length} rescheduled flight(s)`);
    rescheduledFlights.forEach((flight) => {
      console.log(`   - Flight ${flight.id.substring(0, 8)}...`);
      console.log(`     Student: ${flight.student?.firstName} ${flight.student?.lastName}`);
      console.log(`     Original Time: ${flight.scheduledStart.toLocaleString()}`);
      console.log(`     New Flights Created: ${flight.rescheduledTo.length}`);
      if (flight.rescheduledTo.length > 0) {
        flight.rescheduledTo.forEach((newFlight) => {
          console.log(`       → New Flight: ${newFlight.scheduledStart.toLocaleString()} (${newFlight.status})`);
        });
      }
    });
  } else {
    results.push({
      passed: false,
      message: '❌ No rescheduled flights found',
    });
    console.log('   ❌ No rescheduled flights found');
  }

  // 2. Check for new confirmed flights (from reschedules)
  console.log('\n2️⃣ Checking for New Flights (from Reschedules)...');
  const newRescheduledFlights = await prisma.flight.findMany({
    where: {
      rescheduledFromId: { not: null },
    },
    include: {
      student: { select: { email: true, firstName: true, lastName: true } },
      instructor: { select: { email: true, firstName: true, lastName: true } },
      rescheduledFrom: {
        select: {
          id: true,
          scheduledStart: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  if (newRescheduledFlights.length > 0) {
    const confirmed = newRescheduledFlights.filter((f) => f.status === 'CONFIRMED' || f.status === 'RESCHEDULE_CONFIRMED');
    results.push({
      passed: true,
      message: `✅ Found ${newRescheduledFlights.length} new flight(s) from reschedules (${confirmed.length} confirmed)`,
      details: newRescheduledFlights.map((f) => ({
        id: f.id,
        status: f.status,
        newTime: f.scheduledStart,
        originalFlightId: f.rescheduledFromId,
        student: `${f.student?.firstName} ${f.student?.lastName}`,
      })),
    });

    console.log(`   ✅ Found ${newRescheduledFlights.length} new flight(s) from reschedules`);
    console.log(`   - Confirmed: ${confirmed.length}`);
    newRescheduledFlights.forEach((flight) => {
      console.log(`   - Flight ${flight.id.substring(0, 8)}...`);
      console.log(`     Status: ${flight.status}`);
      console.log(`     Student: ${flight.student?.firstName} ${flight.student?.lastName}`);
      console.log(`     New Time: ${flight.scheduledStart.toLocaleString()}`);
      console.log(`     From Original: ${flight.rescheduledFrom?.id.substring(0, 8)}...`);
    });
  } else {
    results.push({
      passed: false,
      message: '❌ No new flights from reschedules found',
    });
    console.log('   ❌ No new flights from reschedules found');
  }

  // 3. Check RescheduleRequest table
  console.log('\n3️⃣ Checking Reschedule Requests...');
  const rescheduleRequests = await prisma.rescheduleRequest.findMany({
    where: {
      status: { in: ['PENDING_INSTRUCTOR', 'ACCEPTED'] },
    },
    include: {
      flight: {
        select: {
          id: true,
          scheduledStart: true,
          student: { select: { email: true, firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  });

    if (rescheduleRequests.length > 0) {
      const accepted = rescheduleRequests.filter((r) => r.status === 'ACCEPTED');
      const pending = rescheduleRequests.filter((r) => r.status === 'PENDING_INSTRUCTOR');

      results.push({
        passed: true,
        message: `✅ Found ${rescheduleRequests.length} reschedule request(s) (${accepted.length} accepted, ${pending.length} pending)`,
      details: {
        total: rescheduleRequests.length,
        accepted: accepted.length,
        pending: pending.length,
        requests: rescheduleRequests.map((r) => ({
          id: r.id,
          status: r.status,
          flightId: r.flightId,
          selectedOption: r.selectedOption,
          createdAt: r.createdAt,
        })),
      },
    });

    console.log(`   ✅ Found ${rescheduleRequests.length} reschedule request(s)`);
    console.log(`   - Accepted/Confirmed: ${accepted.length}`);
    console.log(`   - Pending Instructor: ${pending.length}`);
    rescheduleRequests.slice(0, 5).forEach((req) => {
      console.log(`   - Request ${req.id.substring(0, 8)}...`);
      console.log(`     Status: ${req.status}`);
      console.log(`     Selected Option: ${req.selectedOption !== null ? `Option ${req.selectedOption + 1}` : 'None'}`);
      console.log(`     Flight: ${req.flight?.student?.firstName} ${req.flight?.student?.lastName}`);
    });
  } else {
    results.push({
      passed: false,
      message: '❌ No reschedule requests found',
    });
    console.log('   ❌ No reschedule requests found');
  }

  // 4. Check WeatherCheck table
  console.log('\n4️⃣ Checking Weather Check Logs...');
  const weatherChecks = await prisma.weatherCheck.findMany({
    where: {
      result: { in: ['UNSAFE', 'MARGINAL'] },
    },
    include: {
      flight: {
        select: {
          id: true,
          scheduledStart: true,
          student: { select: { email: true, firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  if (weatherChecks.length > 0) {
    results.push({
      passed: true,
      message: `✅ Found ${weatherChecks.length} weather check(s) with unsafe/marginal results`,
      details: weatherChecks.map((wc) => ({
        id: wc.id,
        result: wc.result,
        reason: wc.reason,
        flightId: wc.flightId,
        checkedAt: wc.createdAt,
      })),
    });

    console.log(`   ✅ Found ${weatherChecks.length} weather check(s) with unsafe/marginal results`);
    weatherChecks.slice(0, 5).forEach((check) => {
      console.log(`   - Check ${check.id.substring(0, 8)}...`);
      console.log(`     Result: ${check.result}`);
      console.log(`     Reason: ${check.reason || 'N/A'}`);
      console.log(`     Flight: ${check.flight?.student?.firstName} ${check.flight?.student?.lastName}`);
      console.log(`     Checked: ${check.createdAt.toLocaleString()}`);
    });
  } else {
    results.push({
      passed: false,
      message: '⚠️  No unsafe/marginal weather checks found (this is okay if weather is good)',
    });
    console.log('   ⚠️  No unsafe/marginal weather checks found');
  }

  // 5. Check Notification table
  console.log('\n5️⃣ Checking Notifications...');
  const notifications = await prisma.notification.findMany({
    where: {
      type: { in: ['RESCHEDULE_SUGGESTION', 'RESCHEDULE_CONFIRMED', 'WEATHER_ALERT', 'WEATHER_CONFLICT'] },
    },
    include: {
      recipient: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  if (notifications.length > 0) {
    const byType = notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    results.push({
      passed: true,
      message: `✅ Found ${notifications.length} notification(s)`,
      details: {
        total: notifications.length,
        byType,
        recent: notifications.slice(0, 5).map((n) => ({
          id: n.id,
          type: n.type,
          recipient: n.recipient?.email || 'Unknown',
          sentAt: n.createdAt,
          sent: n.sentAt !== null,
        })),
      },
    });

    console.log(`   ✅ Found ${notifications.length} notification(s)`);
    console.log('   By Type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`     - ${type}: ${count}`);
    });
    notifications.slice(0, 5).forEach((notif) => {
      console.log(`   - ${notif.type} to ${notif.recipient?.email || 'Unknown'}`);
      console.log(`     Sent: ${notif.sentAt ? notif.sentAt.toLocaleString() : 'Not sent yet'}`);
    });
  } else {
    results.push({
      passed: false,
      message: '⚠️  No notifications found (may not be configured)',
    });
    console.log('   ⚠️  No notifications found');
  }

  // 6. Check AuditLog table (if it exists)
  console.log('\n6️⃣ Checking Audit Logs...');
  try {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: { in: ['flight.rescheduled', 'reschedule.accepted', 'reschedule.confirmed'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (auditLogs.length > 0) {
      results.push({
        passed: true,
        message: `✅ Found ${auditLogs.length} audit log entry/entries`,
        details: auditLogs.map((log) => ({
          id: log.id,
          action: log.action,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          createdAt: log.createdAt,
        })),
      });

      console.log(`   ✅ Found ${auditLogs.length} audit log entry/entries`);
      auditLogs.slice(0, 5).forEach((log) => {
        console.log(`   - ${log.action} on ${log.resourceType} (${log.resourceId?.substring(0, 8)}...)`);
        console.log(`     At: ${log.createdAt.toLocaleString()}`);
      });
    } else {
      results.push({
        passed: false,
        message: '⚠️  No audit logs found (table may not exist or no actions logged)',
      });
      console.log('   ⚠️  No audit logs found');
    }
  } catch (error: any) {
    if (error.message?.includes('does not exist') || error.message?.includes('Unknown model')) {
      results.push({
        passed: false,
        message: '⚠️  AuditLog table does not exist (this is optional)',
      });
      console.log('   ⚠️  AuditLog table does not exist (this is optional)');
    } else {
      throw error;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 VERIFICATION SUMMARY\n');

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${index + 1}. ${result.message}`);
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`\n📈 Results: ${passed}/${total} checks passed\n`);

  if (passed === total) {
    console.log('🎉 All verifications passed! The reschedule workflow is working correctly.\n');
  } else if (passed >= total - 2) {
    console.log('✅ Most verifications passed. Some optional features may not be configured.\n');
  } else {
    console.log('⚠️  Some verifications failed. Review the details above.\n');
  }

  await prisma.$disconnect();
}

verifyRescheduleWorkflow()
  .catch((error) => {
    console.error('❌ Error during verification:', error);
    process.exit(1);
  });


import { NextRequest, NextResponse } from 'next/server';
import { weatherCheckQueue } from '@/lib/jobs/queues';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/weather/refresh/status
 * Check the status of weather refresh jobs
 * Query params: jobIds (comma-separated list of job IDs)
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    
    if (authUser.role !== 'admin' && authUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Accept either jobIds (legacy) or flightIds (new approach)
    const jobIdsParam = request.nextUrl.searchParams.get('jobIds');
    const flightIdsParam = request.nextUrl.searchParams.get('flightIds');
    
    if (!jobIdsParam && !flightIdsParam) {
      return NextResponse.json(
        { error: 'jobIds or flightIds parameter required' },
        { status: 400 }
      );
    }

    // Track by flight IDs if provided, otherwise use job IDs (legacy)
    const flightIds = flightIdsParam ? flightIdsParam.split(',').filter(Boolean) : null;
    const jobIds = jobIdsParam ? jobIdsParam.split(',').filter(Boolean) : null;
    
    console.log(`Checking status. Flight IDs: ${flightIds?.length || 0}, Job IDs: ${jobIds?.length || 0}`);
    
    // Get jobs from queue lists and filter by flight IDs or job IDs
    // Get more jobs to ensure we find the ones we're tracking
    const maxJobsToCheck = 1000; // Check up to 1000 jobs in each state
    const [completedJobs, failedJobs, waitingJobs, activeJobs] = await Promise.all([
      weatherCheckQueue.getCompleted(0, maxJobsToCheck),
      weatherCheckQueue.getFailed(0, maxJobsToCheck),
      weatherCheckQueue.getWaiting(0, maxJobsToCheck),
      weatherCheckQueue.getActive(0, maxJobsToCheck),
    ]);

    console.log(`Queue state counts:`, {
      completed: completedJobs.length,
      failed: failedJobs.length,
      waiting: waitingJobs.length,
      active: activeJobs.length,
    });

    // Filter jobs by flight IDs if provided, otherwise by job IDs
    const filterJob = (job: any): boolean => {
      if (flightIds) {
        // Match by flight ID in job.data
        // BullMQ jobs store data in job.data, but we need to check the structure
        const jobFlightId = job.data?.flightId || job.opts?.data?.flightId;
        if (jobFlightId && flightIds.includes(jobFlightId)) {
          return true;
        }
        // Also check if the job name or ID contains the flight ID (for debugging)
        const jobIdStr = String(job.id || '');
        if (jobIdStr.startsWith('weather-check-')) {
          // Custom job ID format: weather-check-{flightId}-{timestamp}
          for (const flightId of flightIds) {
            if (jobIdStr.includes(flightId)) {
              return true;
            }
          }
        }
        return false;
      } else if (jobIds) {
        // Match by job ID (legacy)
        const jobId = String(job.id || '');
        return jobIds.includes(jobId);
      }
      return false;
    };
    
    // Debug: Log sample job structures and check all waiting jobs
    if (waitingJobs.length > 0 && flightIds) {
      console.log(`\n=== DEBUG: Job Matching ===`);
      console.log(`Looking for ${flightIds.length} flight IDs:`, flightIds);
      console.log(`Total waiting jobs: ${waitingJobs.length}`);
      
      // Check first 5 waiting jobs
      for (let i = 0; i < Math.min(5, waitingJobs.length); i++) {
        const job = waitingJobs[i];
        const jobData = job.data || {};
        const jobFlightId = jobData.flightId;
        const matches = jobFlightId && flightIds.includes(jobFlightId);
        
        console.log(`Job ${i + 1}:`, {
          id: job.id,
          flightId: jobFlightId,
          matches: matches,
          dataKeys: Object.keys(jobData),
          fullData: jobData,
        });
      }
      
      // Also check if any jobs match by checking all waiting jobs
      const allFlightIdsInWaiting = waitingJobs
        .map(j => j.data?.flightId)
        .filter(Boolean);
      console.log(`Unique flight IDs in waiting jobs:`, [...new Set(allFlightIdsInWaiting)]);
      console.log(`=== END DEBUG ===\n`);
    }

    const matchingCompleted = completedJobs.filter(filterJob);
    const matchingFailed = failedJobs.filter(filterJob);
    const matchingWaiting = waitingJobs.filter(filterJob);
    const matchingActive = activeJobs.filter(filterJob);

    console.log(`Matching jobs:`, {
      completed: matchingCompleted.length,
      failed: matchingFailed.length,
      waiting: matchingWaiting.length,
      active: matchingActive.length,
    });

    // Count unique flights (not jobs) - there may be multiple jobs per flight from previous runs
    // IMPORTANT: A flight can be in multiple states (e.g., one job completed, another failed)
    // We prioritize: completed > active > waiting > failed
    const getUniqueFlightIds = (jobs: any[]): Set<string> => {
      const flightIds = new Set<string>();
      for (const job of jobs) {
        const flightId = job.data?.flightId;
        if (flightId) {
          flightIds.add(flightId);
        }
      }
      return flightIds;
    };

    const completedFlightIds = getUniqueFlightIds(matchingCompleted);
    const failedFlightIds = getUniqueFlightIds(matchingFailed);
    const waitingFlightIds = getUniqueFlightIds(matchingWaiting);
    const activeFlightIds = getUniqueFlightIds(matchingActive);
    
    // Remove flights from failed/waiting/active if they're also in completed
    // (A flight should only be counted once, in its highest priority state)
    const allCompleted = new Set(completedFlightIds);
    const allActive = new Set([...activeFlightIds].filter(id => !allCompleted.has(id)));
    const allWaiting = new Set([...waitingFlightIds].filter(id => !allCompleted.has(id) && !allActive.has(id)));
    const allFailed = new Set([...failedFlightIds].filter(id => !allCompleted.has(id) && !allActive.has(id) && !allWaiting.has(id)));

    // Count states by unique flights (not total jobs)
    // Use the deduplicated sets to avoid double-counting
    const counts = {
      completed: allCompleted.size,
      active: allActive.size,
      waiting: allWaiting.size,
      failed: allFailed.size,
      delayed: 0, // Delayed jobs are typically in waiting
      not_found: 0, // We'll calculate this based on total expected
      error: 0,
    };
    
    // Calculate total expected flights
    const totalExpected = flightIds ? flightIds.length : (jobIds?.length || 0);
    const totalFound = counts.completed + counts.failed + counts.active + counts.waiting;
    counts.not_found = Math.max(0, totalExpected - totalFound);
    
    // Log which flights were found
    const matchedCount = counts.completed + counts.failed + counts.active + counts.waiting;
    console.log(`Matched ${matchedCount} out of ${totalExpected} unique flights (found ${matchingCompleted.length + matchingFailed.length + matchingActive.length + matchingWaiting.length} total jobs)`);

    return NextResponse.json({
      total: totalExpected,
      counts,
      debug: {
        completedJobsCount: completedJobs.length,
        failedJobsCount: failedJobs.length,
        activeJobsCount: activeJobs.length,
        waitingJobsCount: waitingJobs.length,
        flightIdsProvided: flightIds?.length || 0,
        jobIdsProvided: jobIds?.length || 0,
        matchingCompleted: matchingCompleted.length,
        matchingFailed: matchingFailed.length,
        matchingActive: matchingActive.length,
        matchingWaiting: matchingWaiting.length,
      },
    });
  } catch (error: any) {
    console.error('Error checking weather refresh status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


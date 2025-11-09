/**
 * Script to clear all failed weather check jobs from BullMQ
 * 
 * Usage: npx tsx scripts/clear-failed-weather-jobs.ts
 */

import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Use the same Redis connection as the app
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Create queue instance with same name as the app
const weatherCheckQueue = new Queue('weather-check', { 
  connection,
});

async function clearFailedJobs() {
  try {
    console.log('Fetching failed jobs...');
    
    // Get all failed jobs (check up to 2000 to be safe)
    const failedJobs = await weatherCheckQueue.getFailed(0, 2000);
    
    console.log(`Found ${failedJobs.length} failed jobs`);
    
    if (failedJobs.length === 0) {
      console.log('No failed jobs to clear.');
      return;
    }
    
    // Remove all failed jobs
    let removedCount = 0;
    let errorCount = 0;
    
    for (const job of failedJobs) {
      try {
        await job.remove();
        removedCount++;
        if (removedCount % 50 === 0) {
          console.log(`Removed ${removedCount}/${failedJobs.length} jobs...`);
        }
      } catch (error: any) {
        errorCount++;
        console.error(`Error removing job ${job.id}:`, error.message);
      }
    }
    
    console.log(`\nSuccessfully removed ${removedCount} failed jobs.`);
    if (errorCount > 0) {
      console.log(`Encountered ${errorCount} errors during removal.`);
    }
    
    // Verify cleanup
    const remainingFailed = await weatherCheckQueue.getFailed(0, 100);
    console.log(`Remaining failed jobs: ${remainingFailed.length}`);
    
    // Also check other states for completeness
    const [completed, waiting, active] = await Promise.all([
      weatherCheckQueue.getCompleted(0, 10),
      weatherCheckQueue.getWaiting(0, 10),
      weatherCheckQueue.getActive(0, 10),
    ]);
    
    console.log(`\nQueue state summary:`);
    console.log(`  Completed: ${completed.length} (showing first 10)`);
    console.log(`  Waiting: ${waiting.length} (showing first 10)`);
    console.log(`  Active: ${active.length} (showing first 10)`);
    console.log(`  Failed: ${remainingFailed.length} (after cleanup)`);
    
  } catch (error: any) {
    console.error('Error clearing failed jobs:', error);
    process.exit(1);
  } finally {
    // Close the queue connection
    await weatherCheckQueue.close();
    await connection.quit();
    process.exit(0);
  }
}

clearFailedJobs();


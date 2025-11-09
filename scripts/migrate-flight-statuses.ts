/**
 * Migration script to update existing SCHEDULED flights to PENDING
 * Run this after updating the Prisma schema
 * 
 * Usage: npx tsx scripts/migrate-flight-statuses.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateFlightStatuses() {
  try {
    console.log('🔄 Starting flight status migration...');

    // Count flights with SCHEDULED status
    const scheduledCount = await prisma.flight.count({
      where: { status: 'SCHEDULED' as any },
    });

    console.log(`📊 Found ${scheduledCount} flights with SCHEDULED status`);

    if (scheduledCount === 0) {
      console.log('✅ No flights to migrate');
      return;
    }

    // Update all SCHEDULED flights to PENDING
    const result = await prisma.$executeRaw`
      UPDATE "Flight"
      SET status = 'PENDING'
      WHERE status = 'SCHEDULED'
    `;

    console.log(`✅ Successfully migrated ${result} flights to PENDING status`);

    // Verify migration
    const remainingScheduled = await prisma.flight.count({
      where: { status: 'SCHEDULED' as any },
    });

    if (remainingScheduled > 0) {
      console.warn(`⚠️  Warning: ${remainingScheduled} flights still have SCHEDULED status`);
    } else {
      console.log('✅ Migration completed successfully!');
    }
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateFlightStatuses()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });


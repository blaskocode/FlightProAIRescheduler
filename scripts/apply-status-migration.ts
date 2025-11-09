/**
 * Apply the flight status migration directly to the database
 * This adds the new enum values and updates existing data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('🔄 Applying flight status migration...');

    // Step 1: Add new enum values
    console.log('📝 Adding new enum values...');
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "FlightStatus" ADD VALUE IF NOT EXISTS 'PENDING';
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "FlightStatus" ADD VALUE IF NOT EXISTS 'RESCHEDULE_PENDING';
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "FlightStatus" ADD VALUE IF NOT EXISTS 'RESCHEDULE_CONFIRMED';
    `);

    // Step 2: Update existing data
    console.log('📊 Updating existing flights...');
    const result = await prisma.$executeRawUnsafe(`
      UPDATE "Flight" SET status = 'PENDING' WHERE status = 'SCHEDULED';
    `);

    console.log(`✅ Migration completed! Updated ${result} flights.`);
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });


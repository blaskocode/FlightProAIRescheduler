/**
 * Add missing calendar columns to Flight table
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addColumns() {
  try {
    console.log('🔄 Adding calendar columns to Flight table...');

    // Add calendarEventId column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Flight" ADD COLUMN IF NOT EXISTS "calendarEventId" TEXT;
    `);

    // Add calendarSyncedAt column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Flight" ADD COLUMN IF NOT EXISTS "calendarSyncedAt" TIMESTAMP(3);
    `);

    console.log('✅ Columns added successfully!');
  } catch (error) {
    console.error('❌ Error adding columns:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addColumns()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });


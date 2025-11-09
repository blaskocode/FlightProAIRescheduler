/**
 * Add all missing columns to Flight table
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addColumns() {
  try {
    console.log('🔄 Adding missing columns to Flight table...');

    // Add cancellationPrediction column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Flight" ADD COLUMN IF NOT EXISTS "cancellationPrediction" DOUBLE PRECISION;
    `);

    // Add predictionConfidence column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Flight" ADD COLUMN IF NOT EXISTS "predictionConfidence" DOUBLE PRECISION;
    `);

    // Add predictionMadeAt column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Flight" ADD COLUMN IF NOT EXISTS "predictionMadeAt" TIMESTAMP(3);
    `);

    console.log('✅ All columns added successfully!');
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


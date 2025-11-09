-- Step 1: Add new enum values (PENDING, RESCHEDULE_PENDING, RESCHEDULE_CONFIRMED)
ALTER TYPE "FlightStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "FlightStatus" ADD VALUE IF NOT EXISTS 'RESCHEDULE_PENDING';
ALTER TYPE "FlightStatus" ADD VALUE IF NOT EXISTS 'RESCHEDULE_CONFIRMED';

-- Step 2: Update all SCHEDULED flights to PENDING
UPDATE "Flight" SET status = 'PENDING' WHERE status = 'SCHEDULED';

-- Step 3: Remove SCHEDULED from enum (PostgreSQL doesn't support removing enum values directly)
-- We'll need to recreate the enum. This is a more complex operation.
-- For now, we'll leave SCHEDULED in the enum but it won't be used.
-- In production, you may want to recreate the enum type entirely.


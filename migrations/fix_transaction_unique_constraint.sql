-- Fix Transaction table unique constraint to be composite (user_id, reference)
-- This allows the same reference from BillStack to exist for different users

-- Drop the old single-column unique constraint if it exists
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_reference_key";

-- Add the new composite unique constraint (if not already there)
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_user_id_reference_key" UNIQUE(user_id, reference);

-- Verify the constraint was applied
-- SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'Transaction' AND constraint_type = 'UNIQUE';

-- Fix Transaction table unique constraint to handle BillStack's reused references
-- 
-- BillStack behavior: Sends same reference for different transactions (low precision)
-- Solution: Use (user_id, reference, amount) composite key
-- 
-- Idempotency logic (app-level): Check for reference+amount within 60 seconds
-- - Same reference + amount within 60s = duplicate/retry (skip)
-- - Same reference + different amount = new transaction (process)
-- - Same amount + different reference = new transaction (process)
--
-- Database constraint: Prevent (user_id, reference, amount) duplicates
-- This catches programming errors but doesn't enforce the 60s window (that's app-level)

-- Drop old constraints if they exist
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_reference_key";
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_user_id_reference_key";
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_user_id_reference_amount_created_at_key";

-- Add the new 3-column composite unique constraint
-- Prevents exact duplicate: same user + reference + amount
-- Different amounts with same reference = allowed (separate transactions)
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_user_id_reference_amount_key" UNIQUE(user_id, reference, amount);

-- Verify the constraint was applied
-- SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'Transaction' AND constraint_type = 'UNIQUE';

-- Fix Transaction table unique constraint to handle BillStack's reused references
-- BillStack sends the same reference for different transactions
-- Solution: Use composite unique key on (user_id, reference, amount, created_at)
-- This way, the same reference with different amounts or timestamps is treated as a new transaction

-- Drop old constraints if they exist
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_reference_key";
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_user_id_reference_key";

-- Add the new 4-column composite unique constraint
-- This ensures idempotency: same user + reference + amount + timestamp = duplicate (skip)
-- But: same reference with different amount/timestamp = new transaction (process)
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_user_id_reference_amount_created_at_key" UNIQUE(user_id, reference, amount, created_at);

-- Verify the constraint was applied
-- SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'Transaction' AND constraint_type = 'UNIQUE';

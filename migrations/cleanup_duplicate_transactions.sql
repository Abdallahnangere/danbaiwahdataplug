-- Cleanup duplicate transactions before adding unique constraint
-- Keep only the FIRST occurrence (earliest created_at) of each user_id + reference + amount
-- Delete all other duplicates

-- Step 1: Identify and delete duplicate transactions
-- Keep rows with the earliest created_at for each user_id + reference + amount combination
DELETE FROM "Transaction"
WHERE id NOT IN (
  -- Subquery: select the ID of the FIRST (earliest) transaction for each unique combination
  SELECT DISTINCT ON (user_id, reference, amount) id
  FROM "Transaction"
  ORDER BY user_id, reference, amount, created_at ASC
);

-- Step 2: Drop old constraints if they exist
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_reference_key";
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_user_id_reference_key";
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_user_id_reference_amount_created_at_key";
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_user_id_reference_amount_key";

-- Step 3: Add the new 3-column composite unique constraint
-- This prevents duplicates: same user + reference + amount
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_user_id_reference_amount_key" UNIQUE(user_id, reference, amount);

-- Verify: Check that duplicates are gone and constraint is applied
-- SELECT 
--   user_id, reference, amount, COUNT(*) as count
-- FROM "Transaction"
-- GROUP BY user_id, reference, amount
-- HAVING COUNT(*) > 1;  -- Should return 0 rows if cleanup worked

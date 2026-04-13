-- Tier System SQL Migration for Danbaiwa Data Plug
-- This script adds support for user tiers (USER vs AGENT) with tier-specific pricing

-- Step 1: Ensure User table has role column
-- This adds the role column if it doesn't exist, or validates it if it does
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "role" VARCHAR(50) DEFAULT 'USER';

-- Step 2: Create check constraint to ensure valid roles
ALTER TABLE "User"
DROP CONSTRAINT IF EXISTS "User_role_check",
ADD CONSTRAINT "User_role_check" CHECK ("role" IN ('USER', 'AGENT', 'ADMIN'));

-- Step 3: Ensure DataPlan table has agentPrice column
-- This stores the special pricing for agents on this plan
ALTER TABLE "DataPlan"
ADD COLUMN IF NOT EXISTS "agentPrice" DECIMAL(10, 2);

-- Step 4: Ensure DataPlan table has userPrice column  
-- This stores optional explicit user pricing (defaults to price if null)
ALTER TABLE "DataPlan"
ADD COLUMN IF NOT EXISTS "userPrice" DECIMAL(10, 2);

-- Step 5: Create index on User.role for faster queries
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

-- Step 6: Create index on DataPlan.agentPrice for efficient agent price lookups
CREATE INDEX IF NOT EXISTS "DataPlan_agentPrice_idx" ON "DataPlan"("agentPrice") WHERE "agentPrice" IS NOT NULL;

-- Optional: Migrate existing users to USER role if they don't have one
-- UPDATE "User" SET "role" = 'USER' WHERE "role" IS NULL;

-- Verify migration
-- SELECT COUNT(*) as user_count, COUNT(DISTINCT role) as role_types FROM "User";
-- SELECT COUNT(*) as plan_count, COUNT(DISTINCT CASE WHEN "agentPrice" IS NOT NULL THEN 1 END) as plans_with_agent_pricing FROM "DataPlan";

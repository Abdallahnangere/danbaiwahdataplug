-- Add BillStack fields to User table
-- Run this SQL in your Neon database console
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billstack_reference" VARCHAR(255) UNIQUE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "account_number" VARCHAR(255);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "account_name" VARCHAR(255);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bank_name" VARCHAR(255);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bank_id" VARCHAR(255);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billstack_created_at" TIMESTAMP;

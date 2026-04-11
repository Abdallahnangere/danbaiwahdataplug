-- DANBAIWA DATA PLUG - PostgreSQL Initialization Script
-- This script initializes the Neon PostgreSQL database with schema
-- Run this ONLY on fresh databases, or use Prisma migrations for production
--
-- Note: Prisma now manages schema creation via migrations.
-- Use: npx prisma migrate deploy
--
-- This SQL file is included for reference and manual setup if needed.

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============ ENUMS ============

CREATE TYPE "UserRole" AS ENUM ('USER', 'AGENT', 'ADMIN');
CREATE TYPE "TransactionType" AS ENUM (
  'DATA_PURCHASE',
  'AIRTIME_PURCHASE',
  'CABLE_SUBSCRIPTION',
  'ELECTRICITY_PAYMENT',
  'EXAMPIN_PURCHASE',
  'DEPOSIT',
  'WALLET_FUNDING',
  'REWARD_CREDIT'
);
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'COMPLETED');
CREATE TYPE "ApiSource" AS ENUM ('API_A', 'API_B');
CREATE TYPE "Network" AS ENUM ('MTN', 'GLO', 'AIRTEL', 'NINEMOBILE');
CREATE TYPE "RewardStatus" AS ENUM ('IN_PROGRESS', 'EARNED', 'CLAIMED');

-- ============ USERS TABLE ============

CREATE TABLE "User" (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  "fullName" VARCHAR(255) NOT NULL,
  phone VARCHAR(11) NOT NULL UNIQUE,
  "pinHash" VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  role "UserRole" NOT NULL DEFAULT 'USER',
  tier VARCHAR(50) NOT NULL DEFAULT 'user',
  balance INTEGER NOT NULL DEFAULT 0,
  "isBanned" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_phone ON "User"(phone);
CREATE INDEX idx_user_role ON "User"(role);
CREATE INDEX idx_user_createdAt ON "User"("createdAt");

-- ============ VIRTUAL ACCOUNTS TABLE ============

CREATE TABLE "VirtualAccount" (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  "userId" VARCHAR(255) NOT NULL UNIQUE,
  "accountNumber" VARCHAR(20) NOT NULL,
  "bankName" VARCHAR(50) NOT NULL,
  "accountName" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_virtualaccount_userid FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE INDEX idx_virtualaccount_userId ON "VirtualAccount"("userId");

-- ============ ACCOUNT TABLE ============

CREATE TABLE "Account" (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  "userId" VARCHAR(255) NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_account_userid FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE INDEX idx_account_userId ON "Account"("userId");

-- ============ PLANS TABLE ============

CREATE TABLE "Plan" (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  network "Network" NOT NULL,
  "sizeLabel" VARCHAR(50) NOT NULL,
  validity VARCHAR(50) NOT NULL,
  price INTEGER NOT NULL,
  "agentPrice" INTEGER NOT NULL DEFAULT 0,
  "apiSource" "ApiSource" NOT NULL,
  "externalPlanId" INTEGER NOT NULL,
  "externalNetworkId" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_plan_external UNIQUE ("apiSource", "externalPlanId", "externalNetworkId")
);

CREATE INDEX idx_plan_network ON "Plan"(network);
CREATE INDEX idx_plan_isActive ON "Plan"("isActive");
CREATE INDEX idx_plan_apiSource ON "Plan"("apiSource");

-- ============ CABLE PLANS TABLE ============

CREATE TABLE "CablePlan" (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  "planId" INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_cable_plan UNIQUE (provider, "planId")
);

CREATE INDEX idx_cableplan_provider ON "CablePlan"(provider);

-- ============ DISCO TABLE ============

CREATE TABLE "Disco" (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  "externalId" INTEGER NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_disco_externalId ON "Disco"("externalId");

-- ============ TRANSACTIONS TABLE ============

CREATE TABLE "Transaction" (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  "userId" VARCHAR(255),
  type "TransactionType" NOT NULL,
  method VARCHAR(50),
  amount INTEGER NOT NULL,
  status "TransactionStatus" NOT NULL DEFAULT 'PENDING',
  reference VARCHAR(255) NOT NULL UNIQUE,
  "externalReference" VARCHAR(255),
  description TEXT,
  phone VARCHAR(20),
  "guestPhone" VARCHAR(20),
  "planId" VARCHAR(255),
  "apiUsed" "ApiSource",
  metadata JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_transaction_userId FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE SET NULL,
  CONSTRAINT fk_transaction_planId FOREIGN KEY ("planId") REFERENCES "Plan"(id) ON DELETE SET NULL
);

CREATE INDEX idx_transaction_userId ON "Transaction"("userId");
CREATE INDEX idx_transaction_type ON "Transaction"(type);
CREATE INDEX idx_transaction_status ON "Transaction"(status);
CREATE INDEX idx_transaction_createdAt ON "Transaction"("createdAt");
CREATE INDEX idx_transaction_phone ON "Transaction"(phone);
CREATE INDEX idx_transaction_reference ON "Transaction"(reference);

-- ============ REWARDS TABLE ============

CREATE TABLE "Reward" (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reward_type ON "Reward"(type);

-- ============ USER REWARDS TABLE ============

CREATE TABLE "UserReward" (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  "userId" VARCHAR(255) NOT NULL,
  "rewardId" VARCHAR(255) NOT NULL,
  status "RewardStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "claimedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_reward UNIQUE ("userId", "rewardId"),
  CONSTRAINT fk_userreward_userId FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  CONSTRAINT fk_userreward_rewardId FOREIGN KEY ("rewardId") REFERENCES "Reward"(id) ON DELETE CASCADE
);

CREATE INDEX idx_userreward_userId ON "UserReward"("userId");
CREATE INDEX idx_userreward_status ON "UserReward"(status);

-- ============ SEED DATA ============

-- Insert DISCOs
INSERT INTO "Disco" (id, name, slug, "externalId") VALUES
  ('disco_1', 'Ikeja Electric', 'ikeja-electric', 1),
  ('disco_2', 'Eko Electric', 'eko-electric', 2),
  ('disco_3', 'Abuja Electric', 'abuja-electric', 3),
  ('disco_4', 'Kano Electric', 'kano-electric', 4),
  ('disco_5', 'Enugu Electric', 'enugu-electric', 5),
  ('disco_6', 'Port Harcourt Electric', 'portharcourt-electric', 6),
  ('disco_7', 'Ibadan Electric', 'ibadan-electric', 7),
  ('disco_8', 'Kaduna Electric', 'kaduna-electric', 8),
  ('disco_9', 'Jos Electric', 'jos-electric', 9),
  ('disco_10', 'Benin Electric', 'benin-electric', 10),
  ('disco_11', 'Yola Electric', 'yola-electric', 11);

-- Insert Cable Plans
INSERT INTO "CablePlan" (id, provider, "planId", name, amount) VALUES
  ('cable_1', 'DSTV', 1, 'DStv Padi', 2500),
  ('cable_2', 'DSTV', 2, 'DStv Yanga', 3500),
  ('cable_3', 'DSTV', 3, 'DStv Confam', 6200),
  ('cable_4', 'DSTV', 4, 'DStv Premium', 24500),
  ('cable_5', 'GOTV', 5, 'GOtv Smallie', 1100),
  ('cable_6', 'GOTV', 6, 'GOtv Jinja', 2250),
  ('cable_7', 'GOTV', 7, 'GOtv Jolli', 3300),
  ('cable_8', 'GOTV', 8, 'GOtv Max', 4850),
  ('cable_9', 'STARTIME', 9, 'Startimes Nova', 1950),
  ('cable_10', 'STARTIME', 10, 'Startimes Nova+ Plus', 3500),
  ('cable_11', 'STARTIME', 11, 'Startimes Smart', 5000);

-- Insert Rewards
INSERT INTO "Reward" (id, type, title, description, amount) VALUES
  ('reward_1', 'FIRST_DEPOSIT_2K', 'First Deposit Bonus', 'Bonus credit for first deposit of ₦2,000+', 50),
  ('reward_2', 'DEPOSIT_10K_UPGRADE', 'Agent Upgrade Bonus', 'Upgrade to Agent status with ₦10,000+ deposit', 100);

-- ============ SAMPLE DATA (Optional) ============
-- Uncomment below to seed with test users and data plans
-- WARNING: Only use for development testing

/*
-- Sample Data Plans (MTN - API_A from SMEPlug)
INSERT INTO "Plan" (id, name, network, "sizeLabel", validity, price, "agentPrice", "apiSource", "externalPlanId", "externalNetworkId", "isActive") VALUES
  ('plan_mtn_1gb', 'MTN 1GB', 'MTN', '1GB', '7 days', 200, 190, 'API_A', 5, 1, true),
  ('plan_mtn_2gb', 'MTN 2GB', 'MTN', '2GB', '30 days', 400, 380, 'API_A', 200, 1, true),
  ('plan_mtn_5gb', 'MTN 5GB', 'MTN', '5GB', '30 days', 900, 850, 'API_A', 205, 1, true),
  ('plan_glo_1gb', 'GLO 1GB', 'GLO', '1GB', '7 days', 180, 170, 'API_A', 206, 2, true),
  ('plan_glo_2gb', 'GLO 2GB', 'GLO', '2GB', '30 days', 350, 330, 'API_A', 207, 2, true);

-- Sample Test User (Password: 123456 hashed)
-- PIN: 123456 → bcryptjs hash: $2a$12$xyz...
INSERT INTO "User" (id, "fullName", phone, "pinHash", email, role, balance) VALUES
  ('user_test_1', 'Test User', '08012345678', NULL, 'test@example.com', 'USER', 50000);

INSERT INTO "VirtualAccount" (id, "userId", "accountNumber", "bankName", "accountName") VALUES
  ('va_test_1', 'user_test_1', '1234567890', '9PSB', 'Test User');

INSERT INTO "Account" (id, "userId", balance) VALUES
  ('acc_test_1', 'user_test_1', 50000);
*/

-- ============ SUMMARY ============
-- Tables created:
-- - User (11 fields)
-- - VirtualAccount (5 fields)
-- - Account (3 fields)
-- - Plan (11 fields)
-- - CablePlan (6 fields)
-- - Disco (5 fields)
-- - Transaction (15 fields)
-- - Reward (5 fields)
-- - UserReward (6 fields)
--
-- Indexes created: 20+
-- Foreign keys: 7
-- Unique constraints: 5
-- Enums: 6
--
-- Database is ready for use!
-- Note: This script should NOT be run manually in production.
-- Use Prisma migrations instead: npx prisma migrate deploy
-- ====================================================================
-- DANBAIWA DATA PLUG - Complete Database Schema & Seed Script
-- For Neon PostgreSQL
-- Copy & paste this entire script into: Neon Console → SQL Editor
-- ====================================================================
-- Enable required extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ====================================================================
-- 1. DROP EXISTING OBJECTS (Safe Cleanup)
-- ====================================================================
DROP TABLE IF EXISTS wallet_fundings CASCADE;
DROP TABLE IF EXISTS user_rewards CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS admin_auth CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS cable_plans CASCADE;
DROP TABLE IF EXISTS data_plans CASCADE;
DROP TABLE IF EXISTS discos CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop enums
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "TransactionType" CASCADE;
DROP TYPE IF EXISTS "TransactionStatus" CASCADE;
DROP TYPE IF EXISTS "ApiSource" CASCADE;

-- ====================================================================
-- 2. CREATE ENUMS
-- ====================================================================
CREATE TYPE "UserRole" AS ENUM ('USER', 'AGENT', 'ADMIN');
CREATE TYPE "TransactionType" AS ENUM ('data', 'airtime', 'electricity', 'cable', 'exampin');
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'success', 'failed');
CREATE TYPE "ApiSource" AS ENUM ('API_A', 'API_B');

-- ====================================================================
-- 3. CREATE TABLES
-- ====================================================================

-- Users Table
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  "fullName" TEXT NOT NULL,
  "pinHash" TEXT,
  role "UserRole" NOT NULL DEFAULT 'USER',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "isBanned" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);

-- Accounts Table (Wallet Management)
CREATE TABLE accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL UNIQUE,
  balance FLOAT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_accounts_user ON accounts("userId");

-- Data Plans Table
CREATE TABLE data_plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  size TEXT NOT NULL,
  network TEXT NOT NULL,
  price FLOAT NOT NULL,
  validity TEXT NOT NULL,
  "externalPlanId" TEXT NOT NULL,
  "apiSource" "ApiSource" NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("apiSource", "externalPlanId")
);

CREATE INDEX idx_data_plans_network ON data_plans(network);
CREATE INDEX idx_data_plans_active ON data_plans("isActive");

-- Cable Plans Table
CREATE TABLE cable_plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  provider TEXT NOT NULL,
  package TEXT NOT NULL,
  price FLOAT NOT NULL,
  "externalId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, "externalId")
);

CREATE INDEX idx_cable_plans_provider ON cable_plans(provider);
CREATE INDEX idx_cable_plans_active ON cable_plans("isActive");

-- DISCOs Table (Electricity Distributors)
CREATE TABLE discos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL UNIQUE,
  "discoId" TEXT NOT NULL UNIQUE,
  "externalId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_discos_active ON discos("isActive");

-- Transactions Table (All Services)
CREATE TABLE transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  type "TransactionType" NOT NULL,
  service TEXT NOT NULL,
  amount FLOAT NOT NULL,
  status "TransactionStatus" NOT NULL DEFAULT 'pending',
  "externalId" TEXT,
  reference TEXT NOT NULL UNIQUE,
  metadata JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_transactions_user ON transactions("userId");
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created ON transactions("createdAt");
CREATE INDEX idx_transactions_reference ON transactions(reference);

-- Admin Auth Table
CREATE TABLE admin_auth (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL UNIQUE,
  "totalTransactions" INTEGER DEFAULT 0,
  "totalVolume" FLOAT DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_admin_auth_user ON admin_auth("userId");

-- Rewards Table
CREATE TABLE rewards (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  amount FLOAT NOT NULL,
  type TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Rewards Table
CREATE TABLE user_rewards (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  "rewardId" TEXT NOT NULL,
  "claimedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "rewardId"),
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY ("rewardId") REFERENCES rewards(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_rewards_user ON user_rewards("userId");

-- Wallet Fundings Table
CREATE TABLE wallet_fundings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  amount FLOAT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  "externalRef" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_wallet_fundings_user ON wallet_fundings("userId");
CREATE INDEX idx_wallet_fundings_status ON wallet_fundings(status);

-- ====================================================================
-- 4. SEED DATA - DATA PLANS
-- ====================================================================

INSERT INTO data_plans (name, size, network, price, validity, "externalPlanId", "apiSource", "isActive")
VALUES
  ('500MB Weekly', '500MB', 'MTN', 300, 'Weekly', '423', 'API_A', TRUE),
  ('1GB Weekly', '1GB', 'MTN', 450, 'Weekly', '424', 'API_A', TRUE),
  ('2GB Weekly', '2GB', 'MTN', 900, 'Weekly', '425', 'API_A', TRUE),
  ('3GB Weekly', '3GB', 'MTN', 1200, 'Weekly', '426', 'API_A', TRUE),
  ('5GB Monthly', '5GB', 'MTN', 1500, 'Monthly', '176', 'API_A', TRUE),
  ('1GB Daily', '1GB', 'MTN', 220, 'Daily', '498', 'API_A', TRUE),
  ('2.5GB Daily', '2.5GB', 'MTN', 550, 'Daily', '453', 'API_A', TRUE),
  ('7GB Monthly', '7GB', 'MTN', 3500, 'Monthly', '21', 'API_A', TRUE),
  ('10GB Monthly', '10GB', 'MTN', 4500, 'Monthly', '22', 'API_A', TRUE),
  ('20GB Monthly', '20GB', 'MTN', 7500, 'Monthly', '25', 'API_A', TRUE),
  ('25GB Monthly', '25GB', 'MTN', 9000, 'Monthly', '26', 'API_A', TRUE),
  ('36GB Monthly', '36GB', 'MTN', 11000, 'Monthly', '27', 'API_A', TRUE),
  ('75GB Monthly', '75GB', 'MTN', 18000, 'Monthly', '28', 'API_A', TRUE),
  ('5GB (API B)', '5GB', 'MTN', 1500, '14-30 Days', '85', 'API_B', TRUE),
  ('5GB Plus (API B)', '5GB', 'MTN', 1600, '21-30 Days', '86', 'API_B', TRUE);

-- ====================================================================
-- 5. SEED DATA - CABLE PLANS
-- ====================================================================

INSERT INTO cable_plans (provider, package, price, "externalId", "isActive")
VALUES
  ('DSTV', 'DSTV Padi', 3950, 'dstv_padi', TRUE),
  ('DSTV', 'DSTV Yanga', 7700, 'dstv_yanga', TRUE),
  ('DSTV', 'DSTV Family', 12500, 'dstv_family', TRUE),
  ('DSTV', 'DSTV Compact', 18900, 'dstv_compact', TRUE),
  ('GOtv', 'GOtv Lite', 2950, 'gotv_lite', TRUE),
  ('GOtv', 'GOtv Plus', 5900, 'gotv_plus', TRUE),
  ('GOtv', 'GOtv Max', 11900, 'gotv_max', TRUE),
  ('Startimes', 'Startimes Basic', 1900, 'startimes_basic', TRUE),
  ('Startimes', 'Startimes Smart', 4900, 'startimes_smart', TRUE),
  ('Startimes', 'Startimes Premium', 9900, 'startimes_premium', TRUE),
  ('Startimes', 'Startimes Max', 14900, 'startimes_max', TRUE);

-- ====================================================================
-- 6. SEED DATA - DISCOS (Electricity Distributors)
-- ====================================================================

INSERT INTO discos (name, "discoId", "externalId", "isActive")
VALUES
  ('Abuja Electric Distribution Company', 'AEDC', '1', TRUE),
  ('Benin Electricity Distribution Company', 'BEDC', '2', TRUE),
  ('Eko Electricity Distribution Company', 'EKEDC', '3', TRUE),
  ('Enugu Electricity Distribution Company', 'EEDC', '4', TRUE),
  ('Ibadan Electricity Distribution Company', 'IBEDC', '5', TRUE),
  ('Ikeja Electric Distribution Company', 'IKEDC', '6', TRUE),
  ('Jos Electricity Distribution Company', 'JEDC', '7', TRUE),
  ('Kaduna Electricity Distribution Company', 'KADC', '8', TRUE),
  ('Port Harcourt Electricity Distribution Company', 'PHEDC', '9', TRUE),
  ('Udu Electricity Distribution Company', 'UDUDC', '10', TRUE),
  ('Yola Electricity Distribution Company', 'YEDC', '11', TRUE);

-- ====================================================================
-- 7. SEED DATA - DEMO USER
-- ====================================================================

INSERT INTO users (id, phone, email, "fullName", role, "isActive")
VALUES
  (gen_random_uuid()::TEXT, '08101234567', 'demo@danbaiwa.com', 'Demo User', 'USER', TRUE);

-- Insert corresponding account with ₦10,000 balance
INSERT INTO accounts ("userId", balance)
SELECT id, 10000 FROM users WHERE phone = '08101234567' LIMIT 1;

-- ====================================================================
-- 8. SEED DATA - ADMIN USER
-- ====================================================================

INSERT INTO users (id, phone, email, "fullName", role, "isActive")
VALUES
  (gen_random_uuid()::TEXT, '08000000001', 'admin@danbaiwa.com', 'Admin User', 'ADMIN', TRUE);

-- ====================================================================
-- 9. SEED DATA - REWARDS
-- ====================================================================

INSERT INTO rewards (title, description, amount, type, "isActive")
VALUES
  ('Welcome Bonus', 'Get ₦100 on your first signup', 100, 'signup', TRUE),
  ('First Purchase', 'Get ₦200 on your first purchase', 200, 'first_purchase', TRUE),
  ('Loyalty Bonus', 'Get ₦500 after 5 purchases', 500, 'loyalty', TRUE);

-- ====================================================================
-- 10. VERIFICATION QUERIES
-- ====================================================================
-- Uncomment and run individually to verify setup:

-- SELECT COUNT(*) as total_users FROM users;
-- SELECT COUNT(*) as total_data_plans FROM data_plans;
-- SELECT COUNT(*) as total_cable_plans FROM cable_plans;
-- SELECT COUNT(*) as total_discos FROM discos;
-- SELECT COUNT(*) as total_rewards FROM rewards;
-- SELECT phone, balance FROM accounts JOIN users ON accounts."userId" = users.id;

-- ====================================================================
-- ✅ SETUP COMPLETE!
-- ====================================================================
-- Your database is now ready for DANBAIWA DATA PLUG with:
-- • 15 data plans (MTN via API_A & API_B)
-- • 11 cable plans (DSTV, GOtv, Startimes)
-- • 11 DISCOs (electricity distributors)
-- • 3 reward types
-- • 1 demo user (phone: 08101234567, balance: ₦10,000)
-- • 1 admin user (phone: 08000000001)
-- ===================================================================

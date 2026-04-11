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

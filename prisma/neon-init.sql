-- Neon PostgreSQL Initialization Script for Danbaiwa Data Plug
-- Copy and paste this entire script into your Neon dashboard SQL editor
-- Then run it to create all tables and seed initial data

-- ============================================================================
-- 1. CREATE USERS TABLE
-- ============================================================================
CREATE TABLE "User" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  "pin" TEXT,
  balance NUMERIC(15, 2) DEFAULT 0,
  role TEXT DEFAULT 'USER',
  tier TEXT DEFAULT 'user',
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "User_phone_idx" ON "User"(phone);
CREATE INDEX "User_email_idx" ON "User"(email);

-- ============================================================================
-- 2. CREATE DATA PLANS TABLE
-- ============================================================================
CREATE TABLE "DataPlan" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "networkId" INTEGER NOT NULL,
  "networkName" TEXT NOT NULL,
  "sizeLabel" TEXT NOT NULL,
  validity TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  "userPrice" NUMERIC(10, 2),
  "agentPrice" NUMERIC(10, 2),
  "apiAId" INTEGER,
  "apiBId" INTEGER,
  "activeApi" TEXT DEFAULT 'A',
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "DataPlan_networkId_idx" ON "DataPlan"("networkId");
CREATE INDEX "DataPlan_isActive_idx" ON "DataPlan"("isActive");

-- ============================================================================
-- 3. CREATE DATA TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE "DataTransaction" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  phone TEXT NOT NULL,
  "networkId" INTEGER NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  "providerUsed" TEXT NOT NULL,
  "providerRef" TEXT,
  "providerResponse" TEXT,
  status TEXT DEFAULT 'pending',
  "balanceBefore" NUMERIC(10, 2),
  "balanceAfter" NUMERIC(10, 2),
  "customerRef" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DataTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DataTransaction_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DataPlan"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "DataTransaction_userId_idx" ON "DataTransaction"("userId");
CREATE INDEX "DataTransaction_planId_idx" ON "DataTransaction"("planId");
CREATE INDEX "DataTransaction_status_idx" ON "DataTransaction"(status);

-- ============================================================================
-- 4. SEED DATA PLANS (12 plans across 4 networks)
-- ============================================================================

-- MTN Plans
INSERT INTO "DataPlan" (id, name, "networkId", "networkName", "sizeLabel", validity, price, "userPrice", "agentPrice", "apiAId", "activeApi", "isActive")
VALUES 
  ('mtn-1gb-daily', '1GB Daily', 1, 'MTN', '1GB', '24hrs', 500, 500, 450, 1, 'A', true),
  ('mtn-2gb-daily', '2GB Daily', 1, 'MTN', '2GB', '24hrs', 900, 900, 800, 2, 'A', true),
  ('mtn-5gb-weekly', '5GB Weekly', 1, 'MTN', '5GB', '7 days', 2000, 2000, 1800, 3, 'A', true),
  ('mtn-10gb-monthly', '10GB Monthly', 1, 'MTN', '10GB', '30 days', 4000, 4000, 3500, 4, 'A', true);

-- Glo Plans
INSERT INTO "DataPlan" (id, name, "networkId", "networkName", "sizeLabel", validity, price, "userPrice", "agentPrice", "apiAId", "activeApi", "isActive")
VALUES 
  ('glo-1gb-daily', '1GB Daily', 2, 'Glo', '1GB', '24hrs', 450, 450, 400, 5, 'A', true),
  ('glo-2gb-daily', '2GB Daily', 2, 'Glo', '2GB', '24hrs', 800, 800, 700, 6, 'A', true),
  ('glo-5gb-weekly', '5GB Weekly', 2, 'Glo', '5GB', '7 days', 1800, 1800, 1600, 7, 'A', true);

-- 9mobile Plans
INSERT INTO "DataPlan" (id, name, "networkId", "networkName", "sizeLabel", validity, price, "userPrice", "agentPrice", "apiAId", "activeApi", "isActive")
VALUES 
  ('9m-1gb-daily', '1GB Daily', 3, '9mobile', '1GB', '24hrs', 400, 400, 350, 8, 'A', true),
  ('9m-2gb-daily', '2GB Daily', 3, '9mobile', '2GB', '24hrs', 750, 750, 680, 9, 'A', true);

-- Airtel Plans
INSERT INTO "DataPlan" (id, name, "networkId", "networkName", "sizeLabel", validity, price, "userPrice", "agentPrice", "apiAId", "activeApi", "isActive")
VALUES 
  ('airtel-1gb-daily', '1GB Daily', 4, 'Airtel', '1GB', '24hrs', 420, 420, 370, 10, 'A', true),
  ('airtel-2gb-daily', '2GB Daily', 4, 'Airtel', '2GB', '24hrs', 820, 820, 750, 11, 'A', true);

-- ============================================================================
-- 5. VERIFY DATA
-- ============================================================================
-- Run these queries to verify the setup:
-- SELECT COUNT(*) AS "Total Plans" FROM "DataPlan";
-- SELECT "networkName", COUNT(*) FROM "DataPlan" GROUP BY "networkName";
-- SELECT * FROM "DataPlan" WHERE price = 500 AND "networkName" = 'MTN';

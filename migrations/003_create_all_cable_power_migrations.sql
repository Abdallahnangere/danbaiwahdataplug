-- ═════════════════════════════════════════════════════════════════════════════════
-- CONSOLIDATED MIGRATION: Cable & Power Services (All 4 Migrations Combined)
-- ═════════════════════════════════════════════════════════════════════════════════

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────────
-- Migration 1: Create cable_transactions table
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cable_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  provider_id TEXT,
  ident TEXT UNIQUE,
  provider TEXT, -- e.g., "DSTV", "GOTV", "STARTIMES"
  provider_name TEXT,
  smart_card_number TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  amount NUMERIC(15,2) NOT NULL,
  amount_received NUMERIC(15,2),
  status TEXT DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED
  response_code TEXT,
  response_message TEXT,
  plan_code TEXT,
  plan_name TEXT,
  renewal_date TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cable_user_id    ON cable_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cable_status     ON cable_transactions(status);
CREATE INDEX IF NOT EXISTS idx_cable_provider   ON cable_transactions(provider);
CREATE INDEX IF NOT EXISTS idx_cable_created_at ON cable_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cable_smart_card ON cable_transactions(smart_card_number);

-- Trigger for auto-update updated_at
CREATE OR REPLACE FUNCTION update_cable_transactions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cable_transactions_timestamp ON cable_transactions;

CREATE TRIGGER cable_transactions_timestamp
BEFORE UPDATE ON cable_transactions
FOR EACH ROW
EXECUTE FUNCTION update_cable_transactions_timestamp();

-- ─────────────────────────────────────────────────────────────────────────────────
-- Migration 2: Create power_transactions table
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS power_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  provider_id TEXT,
  ident TEXT UNIQUE,
  provider TEXT, -- e.g., "EKEDC", "IBADANELECTRICITY", "ENUGU", etc.
  provider_name TEXT,
  meter_number TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  amount NUMERIC(15,2) NOT NULL,
  amount_received NUMERIC(15,2),
  meter_type TEXT, -- PREPAID, POSTPAID
  status TEXT DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED
  response_code TEXT,
  response_message TEXT,
  token TEXT, -- For prepaid
  units TEXT, -- Units purchased
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_power_user_id    ON power_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_power_status     ON power_transactions(status);
CREATE INDEX IF NOT EXISTS idx_power_provider   ON power_transactions(provider);
CREATE INDEX IF NOT EXISTS idx_power_created_at ON power_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_power_meter      ON power_transactions(meter_number);

-- Trigger for auto-update updated_at
CREATE OR REPLACE FUNCTION update_power_transactions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS power_transactions_timestamp ON power_transactions;

CREATE TRIGGER power_transactions_timestamp
BEFORE UPDATE ON power_transactions
FOR EACH ROW
EXECUTE FUNCTION update_power_transactions_timestamp();

-- ─────────────────────────────────────────────────────────────────────────────────
-- Migration 3: Create cable_plans table
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cable_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- DSTV, GOTV, STARTIMES
  "planName" TEXT NOT NULL,
  "planCode" TEXT UNIQUE NOT NULL,
  price NUMERIC(15,2) NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cable_plans_provider ON cable_plans(provider);
CREATE INDEX IF NOT EXISTS idx_cable_plans_active   ON cable_plans("isActive");

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_cable_plans_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cable_plans_timestamp ON cable_plans;

CREATE TRIGGER cable_plans_timestamp
BEFORE UPDATE ON cable_plans
FOR EACH ROW
EXECUTE FUNCTION update_cable_plans_timestamp();

-- ─────────────────────────────────────────────────────────────────────────────────
-- Migration 4: Create power_plans table
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS power_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- EKEDC, IBADANELECTRICITY, ABUJA, ENUGU, KANO, etc.
  "planName" TEXT NOT NULL,
  "meterType" TEXT NOT NULL, -- PREPAID, POSTPAID
  price NUMERIC(15,2) NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_power_plans_provider    ON power_plans(provider);
CREATE INDEX IF NOT EXISTS idx_power_plans_meter_type  ON power_plans("meterType");
CREATE INDEX IF NOT EXISTS idx_power_plans_active      ON power_plans("isActive");

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_power_plans_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS power_plans_timestamp ON power_plans;

CREATE TRIGGER power_plans_timestamp
BEFORE UPDATE ON power_plans
FOR EACH ROW
EXECUTE FUNCTION update_power_plans_timestamp();

-- ═════════════════════════════════════════════════════════════════════════════════
-- End of Consolidated Migration Script
-- ═════════════════════════════════════════════════════════════════════════════════

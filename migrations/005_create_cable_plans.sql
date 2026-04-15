-- Migration: Create cable_plans table

CREATE TABLE IF NOT EXISTS cable_plans (
  id UUID PRIMARY KEY,
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

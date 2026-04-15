-- Migration: Create power_plans table

CREATE TABLE IF NOT EXISTS power_plans (
  id UUID PRIMARY KEY,
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

-- Migration: Create power_transactions table

CREATE TABLE IF NOT EXISTS power_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
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

-- Add trigger to auto-update updated_at
ALTER TABLE power_transactions
ADD CONSTRAINT power_transactions_updated_at_trigger
CHECK (true); -- PostgreSQL will use trigger function

CREATE OR REPLACE FUNCTION update_power_transactions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS power_transactions_timestamp ON power_transactions;

CREATE TRIGGER power_transactions_timestamp
BEFORE UPDATE ON power_transactions
FOR EACH ROW
EXECUTE FUNCTION update_power_transactions_timestamp();

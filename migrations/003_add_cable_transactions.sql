-- Migration: Create cable_transactions table

CREATE TABLE IF NOT EXISTS cable_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
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

-- Add trigger to auto-update updated_at
ALTER TABLE cable_transactions
ADD CONSTRAINT cable_transactions_updated_at_trigger
CHECK (true); -- PostgreSQL will use trigger function

CREATE OR REPLACE FUNCTION update_cable_transactions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS cable_transactions_timestamp ON cable_transactions;

CREATE TRIGGER cable_transactions_timestamp
BEFORE UPDATE ON cable_transactions
FOR EACH ROW
EXECUTE FUNCTION update_cable_transactions_timestamp();

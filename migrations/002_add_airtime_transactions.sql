-- Airtime Transactions Table Migration
-- Stores all airtime purchase transactions

CREATE TABLE IF NOT EXISTS airtime_transactions (
  id                  SERIAL PRIMARY KEY,
  user_id             TEXT NOT NULL,
  provider_id         INTEGER,
  ident               TEXT UNIQUE,
  network             INTEGER NOT NULL,
  network_name        TEXT,
  mobile_number       TEXT NOT NULL,
  amount              NUMERIC(10,2) NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending',
  api_response        TEXT,
  description         TEXT,
  balance_before      TEXT,
  balance_after       TEXT,
  provider_created_at TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_airtime_user_id    ON airtime_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_airtime_status     ON airtime_transactions(status);
CREATE INDEX IF NOT EXISTS idx_airtime_network    ON airtime_transactions(network);
CREATE INDEX IF NOT EXISTS idx_airtime_created_at ON airtime_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_airtime_mobile     ON airtime_transactions(mobile_number);

-- Set up foreign key to User table
ALTER TABLE airtime_transactions
ADD CONSTRAINT fk_airtime_user_id FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE CASCADE;

-- Add any missing env vars to .env.local
-- PROVIDER_B_BASE_URL=        # base URL for airtime provider (e.g., https://api.provider.com)
-- PROVIDER_B_TOKEN=           # bearer token for airtime provider authentication

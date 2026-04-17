-- Create Transaction table for webhook deposits and wallet transactions
CREATE TABLE IF NOT EXISTS "Transaction" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL,
  reference VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'deposit',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  -- Composite unique constraint: same user + reference + amount + timestamp = idempotent
  -- This handles BillStack reusing references for different transactions
  UNIQUE(user_id, reference, amount, created_at)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transaction_user_id ON "Transaction"(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_reference ON "Transaction"(reference);
CREATE INDEX IF NOT EXISTS idx_transaction_created_at ON "Transaction"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_status ON "Transaction"(status);
CREATE INDEX IF NOT EXISTS idx_transaction_user_created ON "Transaction"(user_id, created_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_transaction_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS transaction_timestamp_trigger ON "Transaction";
CREATE TRIGGER transaction_timestamp_trigger
BEFORE UPDATE ON "Transaction"
FOR EACH ROW
EXECUTE FUNCTION update_transaction_timestamp();

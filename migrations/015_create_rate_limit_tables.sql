BEGIN;

CREATE TABLE IF NOT EXISTS "RateLimitBucket" (
  key text PRIMARY KEY,
  count integer NOT NULL,
  reset_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "AuthRateLimitBucket" (
  key text PRIMARY KEY,
  count integer NOT NULL,
  reset_at timestamptz NOT NULL
);

COMMIT;


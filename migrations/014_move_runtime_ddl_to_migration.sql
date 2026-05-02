BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.saved_beneficiaries (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  service text NOT NULL DEFAULT 'DATA',
  network_id integer,
  network_name text,
  phone text NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, service, network_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_saved_beneficiaries_user_service_created_at
  ON public.saved_beneficiaries(user_id, service, created_at DESC);

CREATE TABLE IF NOT EXISTS public.billstack_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'billstack',
  event_ref text,
  signature text,
  signature_valid boolean,
  request_headers jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload jsonb,
  raw_body text,
  processing_status text NOT NULL DEFAULT 'RECEIVED',
  processing_error text,
  user_id text,
  credited_amount numeric(14,2),
  received_at timestamptz NOT NULL DEFAULT NOW(),
  processed_at timestamptz,
  account_number text,
  merchant_reference text,
  wiaxy_ref text,
  idempotency_key text
);

ALTER TABLE public.billstack_webhook_events
  ADD COLUMN IF NOT EXISTS account_number text;
ALTER TABLE public.billstack_webhook_events
  ADD COLUMN IF NOT EXISTS merchant_reference text;
ALTER TABLE public.billstack_webhook_events
  ADD COLUMN IF NOT EXISTS wiaxy_ref text;
ALTER TABLE public.billstack_webhook_events
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE INDEX IF NOT EXISTS idx_billstack_webhook_events_received_at
  ON public.billstack_webhook_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_billstack_webhook_events_status
  ON public.billstack_webhook_events(processing_status);
CREATE INDEX IF NOT EXISTS idx_billstack_webhook_events_event_ref
  ON public.billstack_webhook_events(event_ref);
CREATE INDEX IF NOT EXISTS idx_billstack_webhook_events_idempotency_key
  ON public.billstack_webhook_events(idempotency_key);

CREATE TABLE IF NOT EXISTS public.webhook_credit_idempotency (
  provider text NOT NULL,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider, idempotency_key)
);

COMMIT;

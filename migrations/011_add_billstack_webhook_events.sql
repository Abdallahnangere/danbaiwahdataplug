BEGIN;

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
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_billstack_webhook_events_received_at
  ON public.billstack_webhook_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_billstack_webhook_events_event_ref
  ON public.billstack_webhook_events(event_ref);
CREATE INDEX IF NOT EXISTS idx_billstack_webhook_events_status
  ON public.billstack_webhook_events(processing_status);

COMMIT;

BEGIN;

-- Canonical structured layer (non-destructive): keeps existing tables untouched.
-- This allows phased app migration while preserving historical data.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ledger_direction') THEN
    CREATE TYPE ledger_direction AS ENUM ('CREDIT', 'DEBIT');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ledger_source_type') THEN
    CREATE TYPE ledger_source_type AS ENUM ('DEPOSIT', 'DATA', 'AIRTIME', 'CABLE', 'POWER', 'ADJUSTMENT');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.safe_numeric(input_text text)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cleaned text;
BEGIN
  IF input_text IS NULL OR btrim(input_text) = '' THEN
    RETURN NULL;
  END IF;
  cleaned := regexp_replace(input_text, '[^0-9.\-]', '', 'g');
  IF cleaned IS NULL OR btrim(cleaned) = '' THEN
    RETURN NULL;
  END IF;
  RETURN cleaned::numeric;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS public.financial_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  direction ledger_direction NOT NULL,
  source_type ledger_source_type NOT NULL,
  source_id text NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  status text NOT NULL,
  event_time timestamptz NOT NULL DEFAULT NOW(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT financial_ledger_unique_source_event UNIQUE (source_type, source_id, direction)
);

CREATE INDEX IF NOT EXISTS idx_financial_ledger_user_time
  ON public.financial_ledger(user_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_source
  ON public.financial_ledger(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_status
  ON public.financial_ledger(status);

CREATE TABLE IF NOT EXISTS public.service_orders (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  service_type ledger_source_type NOT NULL,
  target_identifier text NOT NULL,
  provider text,
  plan_or_product text,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  status text NOT NULL,
  provider_ref text,
  request_ref text,
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_orders_user_time
  ON public.service_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_orders_type_status
  ON public.service_orders(service_type, status);
CREATE INDEX IF NOT EXISTS idx_service_orders_request_ref
  ON public.service_orders(request_ref);

-- Backfill canonical service orders from legacy tables.
INSERT INTO public.service_orders (
  id, user_id, service_type, target_identifier, provider, plan_or_product, amount,
  status, provider_ref, request_ref, raw_response, created_at, updated_at
)
SELECT
  dt.id,
  dt."userId",
  'DATA'::ledger_source_type,
  dt.phone,
  dt."providerUsed",
  dt."planId",
  dt.amount::numeric(14,2),
  COALESCE(dt.status, 'PENDING'),
  dt."providerRef",
  dt."customerRef",
  CASE WHEN dt."providerResponse" IS NOT NULL THEN jsonb_build_object('providerResponse', dt."providerResponse") ELSE '{}'::jsonb END,
  COALESCE(dt."createdAt", NOW())::timestamptz,
  COALESCE(dt."updatedAt", dt."createdAt", NOW())::timestamptz
FROM public."DataTransaction" dt
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.service_orders (
  id, user_id, service_type, target_identifier, provider, plan_or_product, amount,
  status, provider_ref, request_ref, raw_response, created_at, updated_at
)
SELECT
  CONCAT('AIR-', at.id::text),
  at.user_id,
  'AIRTIME'::ledger_source_type,
  at.mobile_number,
  COALESCE(at.network_name, at.network::text),
  NULL,
  at.amount::numeric(14,2),
  COALESCE(at.status, 'PENDING'),
  at.ident,
  at.ident,
  CASE WHEN at.api_response IS NOT NULL THEN jsonb_build_object('api_response', at.api_response, 'description', at.description) ELSE '{}'::jsonb END,
  COALESCE(at.created_at, NOW()),
  COALESCE(at.updated_at, at.created_at, NOW())
FROM public.airtime_transactions at
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.service_orders (
  id, user_id, service_type, target_identifier, provider, plan_or_product, amount,
  status, provider_ref, request_ref, raw_response, created_at, updated_at
)
SELECT
  CONCAT('CBL-', ct.id::text),
  ct.user_id,
  'CABLE'::ledger_source_type,
  ct.smart_card_number,
  ct.provider,
  ct.plan_code,
  ct.amount::numeric(14,2),
  COALESCE(ct.status, 'PENDING'),
  ct.provider_id,
  ct.ident,
  CASE WHEN ct.response_message IS NOT NULL THEN jsonb_build_object('response_message', ct.response_message, 'response_code', ct.response_code) ELSE '{}'::jsonb END,
  COALESCE(ct.created_at, NOW()),
  COALESCE(ct.updated_at, ct.created_at, NOW())
FROM public.cable_transactions ct
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.service_orders (
  id, user_id, service_type, target_identifier, provider, plan_or_product, amount,
  status, provider_ref, request_ref, raw_response, created_at, updated_at
)
SELECT
  CONCAT('PWR-', pt.id::text),
  pt.user_id,
  'POWER'::ledger_source_type,
  pt.meter_number,
  pt.provider,
  pt.meter_type,
  pt.amount::numeric(14,2),
  COALESCE(pt.status, 'PENDING'),
  pt.provider_id,
  pt.ident,
  CASE
    WHEN pt.response_message IS NOT NULL OR pt.token IS NOT NULL OR pt.units IS NOT NULL
      THEN jsonb_build_object('response_message', pt.response_message, 'response_code', pt.response_code, 'token', pt.token, 'units', pt.units)
    ELSE '{}'::jsonb
  END,
  COALESCE(pt.created_at, NOW()),
  COALESCE(pt.updated_at, pt.created_at, NOW())
FROM public.power_transactions pt
ON CONFLICT (id) DO NOTHING;

-- Backfill canonical ledger credits (deposits).
INSERT INTO public.financial_ledger (
  user_id, direction, source_type, source_id, amount, status, event_time, metadata
)
SELECT
  t.user_id,
  'CREDIT'::ledger_direction,
  'DEPOSIT'::ledger_source_type,
  t.id::text,
  t.amount::numeric(14,2),
  t.status,
  t.created_at::timestamptz,
  jsonb_build_object('reference', t.reference, 'type', t.type)
FROM public."Transaction" t
JOIN public."User" u ON u.id = t.user_id
WHERE t.amount > 0
ON CONFLICT (source_type, source_id, direction) DO NOTHING;

-- Backfill successful debits for services.
INSERT INTO public.financial_ledger (
  user_id, direction, source_type, source_id, amount, status, event_time, metadata
)
SELECT
  so.user_id,
  'DEBIT'::ledger_direction,
  so.service_type,
  so.id,
  so.amount,
  so.status,
  so.created_at,
  jsonb_build_object('provider', so.provider, 'request_ref', so.request_ref)
FROM public.service_orders so
WHERE UPPER(so.status) = 'SUCCESS'
ON CONFLICT (source_type, source_id, direction) DO NOTHING;

-- Build a view for clean balance reconciliation from canonical ledger.
CREATE OR REPLACE VIEW public.user_balance_rebuild_audit AS
SELECT
  u.id AS user_id,
  u.balance::numeric(14,2) AS current_balance,
  COALESCE(SUM(
    CASE
      WHEN fl.direction = 'CREDIT' THEN fl.amount
      WHEN fl.direction = 'DEBIT' THEN -fl.amount
      ELSE 0
    END
  ), 0)::numeric(14,2) AS ledger_balance,
  (u.balance::numeric(14,2) - COALESCE(SUM(
    CASE
      WHEN fl.direction = 'CREDIT' THEN fl.amount
      WHEN fl.direction = 'DEBIT' THEN -fl.amount
      ELSE 0
    END
  ), 0)::numeric(14,2))::numeric(14,2) AS discrepancy
FROM public."User" u
LEFT JOIN public.financial_ledger fl ON fl.user_id = u.id
GROUP BY u.id, u.balance;

COMMIT;

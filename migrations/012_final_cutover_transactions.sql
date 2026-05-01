BEGIN;

-- Final canonical tables
CREATE TABLE IF NOT EXISTS public.data_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  network_id integer NOT NULL,
  network_name text NOT NULL,
  size_label text NOT NULL,
  validity text NOT NULL,
  user_price numeric(14,2) NOT NULL,
  agent_price numeric(14,2),
  api_a_id integer,
  api_b_id integer,
  api_c_id integer,
  active_api text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

INSERT INTO public.data_plans (
  id, name, network_id, network_name, size_label, validity, user_price, agent_price,
  api_a_id, api_b_id, api_c_id, active_api, is_active, created_at, updated_at
)
SELECT
  dp.id,
  dp.name,
  dp."networkId",
  dp."networkName",
  dp."sizeLabel",
  dp.validity,
  COALESCE(dp."userPrice", dp.price)::numeric(14,2),
  dp."agentPrice"::numeric(14,2),
  dp."apiAId",
  dp."apiBId",
  dp."apiCId",
  dp."activeApi",
  COALESCE(dp."isActive", true),
  COALESCE(dp."createdAt", NOW())::timestamptz,
  COALESCE(dp."updatedAt", dp."createdAt", NOW())::timestamptz
FROM public."DataPlan" dp
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  network_id = EXCLUDED.network_id,
  network_name = EXCLUDED.network_name,
  size_label = EXCLUDED.size_label,
  validity = EXCLUDED.validity,
  user_price = EXCLUDED.user_price,
  agent_price = EXCLUDED.agent_price,
  api_a_id = EXCLUDED.api_a_id,
  api_b_id = EXCLUDED.api_b_id,
  api_c_id = EXCLUDED.api_c_id,
  active_api = EXCLUDED.active_api,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

CREATE TABLE IF NOT EXISTS public.transactions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('DEPOSIT','DATA','AIRTIME')),
  status text NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  target text,
  network_id integer,
  network_name text,
  plan_id text,
  provider text,
  reference text,
  provider_ref text,
  provider_response text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  balance_before numeric(14,2),
  balance_after numeric(14,2),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_time ON public.transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category_status ON public.transactions(category, status);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON public.transactions(reference);

-- Backfill DEPOSIT
INSERT INTO public.transactions (
  id, user_id, category, status, amount, reference, created_at, updated_at, metadata
)
SELECT
  CONCAT('DEP-', t.id::text),
  t.user_id,
  'DEPOSIT',
  COALESCE(t.status, 'SUCCESS'),
  t.amount::numeric(14,2),
  t.reference,
  t.created_at::timestamptz,
  COALESCE(t.updated_at, t.created_at)::timestamptz,
  jsonb_build_object('type', t.type)
FROM public."Transaction" t
JOIN public."User" u ON u.id = t.user_id
ON CONFLICT (id) DO NOTHING;

-- Backfill DATA
INSERT INTO public.transactions (
  id, user_id, category, status, amount, target, network_id, plan_id, provider,
  reference, provider_ref, provider_response, balance_before, balance_after, created_at, updated_at
)
SELECT
  CONCAT('DAT-', dt.id),
  dt."userId",
  'DATA',
  COALESCE(dt.status, 'PENDING'),
  dt.amount::numeric(14,2),
  dt.phone,
  dt."networkId",
  dt."planId",
  dt."providerUsed",
  dt."customerRef",
  dt."providerRef",
  dt."providerResponse",
  dt."balanceBefore"::numeric(14,2),
  dt."balanceAfter"::numeric(14,2),
  COALESCE(dt."createdAt", NOW())::timestamptz,
  COALESCE(dt."updatedAt", dt."createdAt", NOW())::timestamptz
FROM public."DataTransaction" dt
ON CONFLICT (id) DO NOTHING;

-- Backfill AIRTIME
INSERT INTO public.transactions (
  id, user_id, category, status, amount, target, network_id, network_name, provider,
  reference, provider_ref, provider_response, balance_before, balance_after, created_at, updated_at, metadata
)
SELECT
  CONCAT('AIR-', at.id::text),
  at.user_id,
  'AIRTIME',
  COALESCE(at.status, 'PENDING'),
  at.amount::numeric(14,2),
  at.mobile_number,
  at.network,
  at.network_name,
  at.network_name,
  at.ident,
  at.ident,
  at.description,
  public.safe_numeric(at.balance_before)::numeric(14,2),
  public.safe_numeric(at.balance_after)::numeric(14,2),
  COALESCE(at.created_at, NOW()),
  COALESCE(at.updated_at, at.created_at, NOW()),
  CASE WHEN at.api_response IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('api_response', at.api_response) END
FROM public.airtime_transactions at
ON CONFLICT (id) DO NOTHING;

-- Remove legacy tables
DROP TABLE IF EXISTS public.service_orders CASCADE;
DROP TABLE IF EXISTS public.financial_ledger CASCADE;
DROP VIEW IF EXISTS public.user_balance_rebuild_audit CASCADE;
DROP TABLE IF EXISTS public.airtime_transactions CASCADE;
DROP TABLE IF EXISTS public."DataTransaction" CASCADE;
DROP TABLE IF EXISTS public."Transaction" CASCADE;
DROP TABLE IF EXISTS public.cable_transactions CASCADE;
DROP TABLE IF EXISTS public.power_transactions CASCADE;
DROP TABLE IF EXISTS public.cable_plans CASCADE;
DROP TABLE IF EXISTS public.power_plans CASCADE;
DROP TABLE IF EXISTS public."DataPlan" CASCADE;

COMMIT;

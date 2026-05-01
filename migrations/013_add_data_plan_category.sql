BEGIN;

ALTER TABLE public.data_plans
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'SME'
CHECK (category IN ('SME', 'GIFTING', 'CORPORATE'));

UPDATE public.data_plans
SET category = 'SME'
WHERE category IS NULL OR category = '';

CREATE INDEX IF NOT EXISTS idx_data_plans_category_network
ON public.data_plans(category, network_id, user_price);

COMMIT;

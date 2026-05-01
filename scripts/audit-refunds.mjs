import { neon } from '@neondatabase/serverless';
const db = neon(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_4Juszq9nIWpk@ep-rapid-flower-amdw7k6j-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

const summary = await db(`
  SELECT category, status, COUNT(*)::int AS count, COALESCE(SUM(amount),0)::numeric(14,2) AS total
  FROM public.transactions
  WHERE category IN ('DATA','AIRTIME')
  GROUP BY category, status
  ORDER BY category, status
`);

const suspicious = await db(`
  SELECT id, user_id, category, status, amount, balance_before, balance_after, reference, created_at
  FROM public.transactions
  WHERE category IN ('DATA','AIRTIME')
    AND (
      (status = 'FAILED' AND balance_after IS NOT NULL)
      OR (status = 'SUCCESS' AND balance_after IS NULL)
      OR (status = 'PENDING' AND created_at < NOW() - INTERVAL '2 days')
    )
  ORDER BY created_at DESC
  LIMIT 50
`);

const dupRefs = await db(`
  SELECT reference, category, COUNT(*)::int AS cnt
  FROM public.transactions
  WHERE category IN ('DATA','AIRTIME') AND reference IS NOT NULL
  GROUP BY reference, category
  HAVING COUNT(*) > 1
  ORDER BY cnt DESC
  LIMIT 20
`);

console.log('summary', JSON.stringify(summary));
console.log('suspicious_count', suspicious.length);
console.log('suspicious_sample', JSON.stringify(suspicious.slice(0, 10)));
console.log('duplicate_refs_count', dupRefs.length);
console.log('duplicate_refs_sample', JSON.stringify(dupRefs.slice(0, 10)));

# Database Setup Guide

Complete guide for setting up PostgreSQL for **DANBAIWA DATA PLUG**.

---

## Quick Setup

```bash
# 1. Set DATABASE_URL in .env.local
DATABASE_URL=postgresql://username:password@host:port/database

# 2. Generate Prisma Client
npx prisma generate

# 3. Push schema to database
npx prisma db push

# 4. Your database is ready!
```

---

## Database Providers

### Option 1: Neon (Recommended - Free Tier)

**Easiest for development**

1. Visit [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Create new project
4. Copy "Prisma" connection string
5. Paste to `DATABASE_URL` in `.env.local`

**Example URL:**
```
postgresql://user:password@ep-autumn-meadow-443210.us-east-1.neon.tech/neondb?sslmode=require
```

### Option 2: Railway (Simple Setup)

1. Visit [railway.app](https://railway.app)
2. Login with GitHub
3. Create new project → PostgreSQL
4. Copy generated connection URL
5. Paste to `DATABASE_URL`

### Option 3: Vercel Postgres

1. Vercel Dashboard → Storage → Create Postgres
2. Copy connection string
3. Paste to `DATABASE_URL`

---

## Database Schema

### Tables Created

**users** (Authentication)
```sql
id TEXT PRIMARY KEY
phone TEXT UNIQUE
email TEXT
fullName TEXT
pinHash TEXT
role (USER | AGENT | ADMIN)
isActive BOOLEAN
isBanned BOOLEAN
createdAt TIMESTAMP
updatedAt TIMESTAMP
```

**accounts** (Wallet)
```sql
id TEXT PRIMARY KEY
userId TEXT FK users
balance FLOAT
createdAt TIMESTAMP
updatedAt TIMESTAMP
```

**data_plans** (15 plans)
```sql
id TEXT PRIMARY KEY
name TEXT
size TEXT
network TEXT
price FLOAT
validity TEXT
externalPlanId TEXT
apiSource (API_A | API_B)
isActive BOOLEAN
```

**cable_plans** (11 plans)
```sql
id TEXT PRIMARY KEY
provider (DSTV | GOtv | Startimes)
package TEXT
price FLOAT
externalId TEXT
isActive BOOLEAN
```

**discos** (11 Electricity Distributors)
```sql
id TEXT PRIMARY KEY
name TEXT
discoId TEXT
externalId TEXT
isActive BOOLEAN
```

**transactions** (All Services)
```sql
id TEXT PRIMARY KEY
userId TEXT FK users
type (data | airtime | electricity | cable | exampin)
service TEXT
amount FLOAT
status (pending | success | failed)
externalId TEXT
reference TEXT
metadata JSONB
createdAt TIMESTAMP
updatedAt TIMESTAMP
```

### Additional Tables
- **admin_auth** - Admin user management
- **rewards** - Reward types and amounts
- **user_rewards** - Track user rewards
- **wallet_fundings** - Wallet funding requests

---

## Seed Data

Automatically created when you push schema:

**15 Data Plans:**
- 500MB - 75GB MTN plans
- Weekly, Daily, Monthly validity periods
- Via SMEPlug (API_A) and Saiful (API_B)

**11 Cable Plans:**
- DSTV: 4 plans (Padi, Yanga, Family, Compact)
- GOtv: 3 plans (Lite, Plus, Max)
- Startimes: 4 plans (Basic, Smart, Premium, Max)

**11 DISCOs:**
- AEDC, BEDC, EKEDC, EEDC, IBEDC, IKEDC, JEDC, KADC, PHEDC, UDUDC, YEDC

**3 Rewards:**
- Welcome Bonus (₦100)
- First Purchase Bonus (₦200)
- Loyalty Bonus (₦500)

**Demo Users:**
- Demo User: phone=08101234567, balance=₦10,000
- Admin User: phone=08000000001

---

## Database Initialization Steps

### Step 1: Set DATABASE_URL

Create `.env.local` in project root:

```bash
DATABASE_URL=postgresql://user:password@host:port/database_name
JWT_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
SMEPLUG_API_KEY=your-key
SMEPLUG_BASE_URL=https://smeplug.ng/api/v1
SAIFUL_API_KEY=your-key
SAIFUL_BASE_URL=https://app.saifulegendconnect.com/api
```

### Step 2: Generate Prisma Client

```bash
npx prisma generate
```

This creates the Prisma Client that your app uses to query the database.

### Step 3: Push Schema to Database

```bash
npx prisma db push
```

This:
- Creates all tables in your database
- Adds all indexes for performance
- Creates enums for type safety
- Seeds initial data (plans, DISCOs, etc.)

### Step 4: Verify Schema

```bash
npx prisma studio
```

This opens a visual database browser at `http://localhost:5555`

---

## Managing the Database

### View Database with Prisma Studio

```bash
npx prisma studio
```

- Browse all tables
- Add/edit/delete records
- View relationships visually
- Great for development

### Update Schema

If you modify `/prisma/schema.prisma`:

```bash
# Create a migration
npx prisma migrate dev --name my_migration_name

# Or just push changes
npx prisma db push
```

### Reset Database (Caution!)

```bash
# WARNING: Deletes all data!
npx prisma migrate reset
```

This will:
1. Drop all tables
2. Re-create schema from scratch
3. Re-seed with initial data
4. Useful for development testing

---

## Production Database Setup

### On Vercel

1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add `DATABASE_URL` from your PostgreSQL provider
5. Redeploy

Vercel will automatically:
- Use the database URL from environment variables
- Initialize Prisma Client on first deploy
- Run your schema on the production database

### Connecting to Neon Production

```bash
# Get production connection URL from Neon dashboard
# Add to Vercel environment variables
# No additional steps needed!
```

---

## Troubleshooting

### "Cannot find module 'postgres'"

```
Error during npx prisma generate
```

**Fix:**
1. Check `DATABASE_URL` in `.env.local`
2. Ensure format: `postgresql://`
3. Test URL works in database provider dashboard
4. Add `.env.local` to `.gitignore`

### "Connection refused"

```
Error: connect ECONNREFUSED
```

**Fix:**
1. Database URL is invalid
2. Check copy-paste for typos
3. Verify database provider is running
4. Check network connectivity

### "Schema validation failed"

```
Error: Column "X" already exists
```

**Fix:**
1. Run: `npx prisma migrate reset`
2. This resets the entire schema
3. All data will be lost (dev only!)

### "Insufficient permissions"

```
Error: permission denied for schema public
```

**Fix:**
1. Use a different database user role
2. Contact your database provider
3. Or switch to Neon (handles permissions automatically)

---

## Best Practices

✅ **DO:**
- Use Neon for free tier PostgreSQL
- Run `npx prisma studio` to inspect data
- Use migrations in production
- Backup production database regularly
- Test migrations on staging first

❌ **DON'T:**
- Don't commit `.env.local` to Git
- Don't use weak passwords for database
- Don't expose DATABASE_URL in logs
- Don't reset production database
- Don't share database credentials

---

## Next Steps

Once database is set up:

1. ✅ Database schema created
2. ✅ Seed data loaded
3. 👉 Run development server: `npm run dev`
4. 👉 Test data purchase flow
5. 👉 Verify admin panel works
6. 👉 Deploy to production

---

## Related Documentation

- [ENV_SETUP.md](./ENV_SETUP.md) - Environment variables guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Deployment checklist
- [README.md](./README.md) - Full project documentation

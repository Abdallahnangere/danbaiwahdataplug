# Database Setup Guide

## Overview

DANBAIWA DATA PLUG uses PostgreSQL (hosted on Neon) with Prisma ORM for type-safe database access. The database handles user accounts, transactions, plans, rewards, and virtual accounts.

## Prerequisites

- Node.js 18+ installed
- `npm` or `yarn` package manager
- Neon PostgreSQL account (free at https://neon.tech)

## Setup Instructions

### 1. Create Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project
3. Select **PostgreSQL 15** (or latest stable version)
4. Copy your connection string (looks like: `postgresql://user:password@ep-xxx.us-east-1.neon.tech/dbname`)

### 2. Environment Configuration

Add your database URL to `.env.local`:

```bash
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.neon.tech/dbname"
```

**Note:** Never commit `.env.local` to Git. Use `.env.example` for documentation.

### 3. Install Dependencies

```bash
npm install
```

### 4. Generate Prisma Client

```bash
npx prisma generate
```

This generates the Prisma Client for type-safe database access.

### 5. Create Database Schema

```bash
npx prisma migrate deploy
```

If this is your first setup or you need to start fresh:

```bash
npx prisma migrate reset --force
```

This will:
- Drop all existing tables
- Run all migrations from `prisma/migrations/`
- Seed the database with initial data
- Generate Prisma Client

### 6. Verify Schema

To view your database structure:

```bash
npx prisma studio
```

This opens a web UI (http://localhost:5555) where you can:
- View all tables and records
- Create/edit/delete records
- Inspect relationships

## Database Schema

### Core Tables

#### Users
- **id**: Unique identifier (CUID)
- **phone**: User's Nigerian phone number (11 digits, e.g., 08012345678)
- **pinHash**: Hashed 6-digit PIN (bcryptjs, 12 rounds)
- **fullName**: User's full name
- **email**: Optional email address
- **role**: USER | AGENT | ADMIN
- **tier**: Tier level for pricing (user/agent)
- **balance**: Account balance in kobo (1 naira = 100 kobo)
- **isBanned**: Account ban status
- **isActive**: Account active status

#### Plans
- **id**: Unique identifier
- **name**: Display name (e.g., "MTN 1GB 7 Days")
- **network**: MTN | GLO | AIRTEL | NINEMOBILE
- **price**: Price in naira
- **agentPrice**: Special agent pricing
- **apiSource**: API_A (SMEPlug) | API_B (Saiful)
- **externalPlanId**: ID from external API
- **externalNetworkId**: Network ID from external API
- **isActive**: Active status

#### Transactions
- **id**: Unique identifier
- **userId**: Reference to User (nullable for guests)
- **type**: Transaction type (DATA_PURCHASE, AIRTIME_PURCHASE, etc.)
- **amount**: Amount in naira
- **status**: PENDING | SUCCESS | FAILED | COMPLETED
- **reference**: Unique reference for idempotency
- **externalReference**: Third-party API reference
- **metadata**: JSON field for service-specific data

#### VirtualAccounts
- **userId**: Reference to User (one-to-one)
- **accountNumber**: Bank account number
- **bankName**: Bank name (9PSB, SAFEHAVEN, etc.)
- **accountName**: Account holder name

#### Rewards
- **id**: Unique identifier
- **type**: Reward type (FIRST_DEPOSIT_2K, etc.)
- **title**: Display title
- **amount**: Reward amount in naira

#### UserRewards
- **userId**: Reference to User
- **rewardId**: Reference to Reward
- **status**: IN_PROGRESS | EARNED | CLAIMED
- **claimedAt**: When reward was claimed

## Data Flow Examples

### User Registration Flow
1. User creates account with phone + PIN
2. PIN is hashed with bcryptjs (12 rounds)
3. User record created
4. Virtual account created via Wiaxy
5. VirtualAccount record linked to User

### Data Purchase Flow
1. User looks up by phone number
2. PIN verified
3. Balance checked
4. Plan retrieved
5. Transaction created with PENDING status
6. API called (SMEPlug or Saiful)
7. Transaction updated to SUCCESS/FAILED
8. Balance decremented

### Reward Claiming Flow
1. User makes deposit >= ₦2,000
2. Transaction created with type=DEPOSIT
3. Reward system checks user's UserReward records
4. If qualification met, balance incremented
5. UserReward status updated to EARNED

## Indexes and Optimization

The schema includes indexes on:
- `users.phone` - Fast phone-based lookups
- `transactions.userId` - User transaction history
- `transactions.createdAt` - Time-based queries
- `plans.network` - Filter by network
- And more for frequently queried fields

## Recovery and Maintenance

### View Database Logs
```bash
# Via Neon console → Logs tab
```

### Reset Database
```bash
# WARNING: This deletes all data
npx prisma migrate reset --force
```

### Backup/Restore
Neon provides automatic backups. Access via Neon console.

### Migration Best Practices
When schema changes are needed:

```bash
# Create migration
npx prisma migrate dev --name your_migration_name

# Review the generated SQL
# Commit migrations to Git

# Apply on production
npx prisma migrate deploy
```

## Troubleshooting

### Connection Error
**Problem**: `Error: Can't reach database server`
- Verify DATABASE_URL is correct
- Check Neon project is active
- Verify IP whitelist (if applicable)

### Migration Failed
**Problem**: `migration already applied` or schema conflicts
```bash
npx prisma migrate resolve --rolled-back migration_name
npx prisma migrate deploy
```

### Type Errors in Code
**Problem**: `Property 'x' does not exist on type`
```bash
npx prisma generate
npm install
```

### Neon Connection Issues
- Use **Pooler** for serverless: `postgresql://...?sslmode=require`
- Use **Direct Connection** for servers
- See Neon docs for connection string format

## Monitoring

### Check Usage
```bash
npx prisma studio
# View record counts by table
```

### Query Performance
Use Neon's built-in analytics:
- Neon Console → Monitoring → Query Performance
- Identify slow queries
- Add indexes if needed

## Security Notes

1. **Never commit `.env.local`** - Use `.env.example` instead
2. **Row-Level Security (RLS)**: Currently not enforced in schema. Consider adding for multi-tenant features
3. **PIN Security**: Always hash with bcryptjs (12 rounds minimum)
4. **External API Keys**: Never log in plaintext, use environment variables
5. **Database Credentials**: Rotate periodically in Neon console

## Next Steps

1. ✅ Database setup complete
2. Generate sample data (optional):
   ```bash
   npm run seed
   ```
3. Read `ENV_SETUP.md` for environment variables
4. Read `README.md` for architectural overview
5. Start development: `npm run dev`

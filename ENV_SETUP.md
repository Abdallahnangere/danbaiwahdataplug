# Environment Setup Guide

This document outlines all required and optional environment variables for DANBAIWA DATA PLUG.

## Quick Start

1. Copy the template:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your actual values (never commit this file)

3. Verify all required variables are set:
   ```bash
   npm run verify-env  # Optional: add this script to package.json
   ```

## Environment Variables

### 🔐 Core Authentication

#### JWT_SECRET
- **Required**: Yes
- **Type**: String
- **Description**: Secret key for signing JWT tokens (authentication)
- **Minimum Length**: 32 characters
- **Example**: `your-super-secret-jwt-key-min-32-chars-1234567890`
- **Notes**: 
  - Used for signing tokens (expires in 7 days)
  - Must be at least 32 characters for security
  - Keep secure, never share or commit

#### ADMIN_PASSWORD
- **Required**: Yes
- **Type**: String
- **Description**: Password for admin dashboard access
- **Minimum Length**: 8 characters
- **Example**: `secure-admin-password-123`
- **Notes**:
  - Used for X-Admin-Password header in admin API calls
  - Not hashed (sent as-is), so keep secure
  - Change regularly in production

### 🗄️ Database

#### DATABASE_URL
- **Required**: Yes
- **Type**: PostgreSQL Connection String
- **Description**: Neon PostgreSQL database connection
- **Format**: `postgresql://user:password@host/dbname`
- **Example With Pooler**: `postgresql://user:password@ep-xyz.us-east-1.neon.tech/dbname?sslmode=require`
- **Where to Get**:
  1. Go to https://console.neon.tech
  2. Create new project
  3. Copy connection string from "Connection details"
- **Notes**:
  - Include `?sslmode=require` for Neon
  - Use Pooler endpoint for serverless apps
  - Never commit to Git

### 🚀 Application

#### NEXT_PUBLIC_APP_URL
- **Required**: Yes
- **Type**: URL
- **Description**: Public URL of your application
- **Example**: 
  - Development: `http://localhost:3000`
  - Production: `https://app.danbaiwa.com`
- **Notes**:
  - `NEXT_PUBLIC_` prefix means it's exposed to client
  - Used in emails, redirects, virtual account references
  - Must be publicly accessible for webhook callbacks

### 📊 Saiful API Integration

Saiful handles: Data, Airtime, Electricity, Cable, Exam PINs

#### SAIFUL_API_KEY
- **Required**: Yes
- **Type**: String (API Key)
- **Description**: API authentication key for Saiful
- **Where to Get**: Contact Saiful support or admin dashboard
- **Example**: `saiful_live_xxxxx` or `saiful_test_xxxxx`
- **Notes**:
  - Keep separate test and live keys
  - Store in Vercel secrets, not .env

#### SAIFUL_API_URL
- **Required**: Yes
- **Type**: URL
- **Description**: Base URL for Saiful API
- **Example**:
  - Development: `https://api-staging.saiful.ng`
  - Production: `https://api.saiful.ng`
- **Notes**:
  - Ensure correct environment (staging vs live)
  - Include base path if applicable

### 📱 SMEPlug API Integration

SMEPlug handles: Data purchases (Alternative to Saiful)

#### SMEPLUG_API_KEY
- **Required**: Yes
- **Type**: String (API Key)
- **Description**: API authentication key for SMEPlug
- **Where to Get**: SMEPlug dashboard or support
- **Example**: `sk_live_xxxxx` or `sk_test_xxxxx`
- **Notes**:
  - Used for data purchases when `apiSource = API_A`
  - Keep test and live keys separate

#### SMEPLUG_BASE_URL
- **Required**: Yes
- **Type**: URL
- **Description**: Base URL for SMEPlug API
- **Example**: `https://api.smeplug.ng/api/v1`
- **Notes**:
  - Version in URL may change

### 💳 Wiaxy Integration

Wiaxy handles: Virtual account creation, payment processing

#### WIAXY_SECRET_KEY
- **Required**: Yes
- **Type**: String (Secret Key)
- **Description**: Secret key for Wiaxy authentication
- **Where to Get**: Wiaxy/BillStack dashboard
- **Example**: `sk_live_xxxxx` or `sk_test_xxxxx`
- **Notes**:
  - Used for VM creation and webhook signature verification
  - Use Bearer token auth in API calls
  - Keep secure

#### WIAXY_BASE_URL
- **Required**: Yes
- **Type**: URL
- **Description**: Base URL for Wiaxy API
- **Example**: `https://api.billstack.co/v2`
- **Notes**:
  - Endpoint path varies by operation

#### WIAXY_WEBHOOK_SECRET
- **Optional**: No (Required for production)
- **Type**: String
- **Description**: Secret for verifying webhook signatures
- **Where to Get**: Wiaxy dashboard → Webhooks → Copy signing key
- **Notes**:
  - Used to verify requests from Wiaxy
  - Must match Wiaxy dashboard setting
  - HMAC-SHA256 signature verification

## Example .env.local

```bash
# Database
DATABASE_URL=postgresql://user:password@ep-xyz.us-east-1.neon.tech/danbaiwa_db?sslmode=require

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-here-1234567890ab
ADMIN_PASSWORD=secure-admin-password-123

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# APIs
SAIFUL_API_KEY=saiful_test_abc123xyz789
SAIFUL_API_URL=https://api-staging.saiful.ng

SMEPLUG_API_KEY=sk_test_abc123xyz789
SMEPLUG_BASE_URL=https://api.smeplug.ng/api/v1

WIAXY_SECRET_KEY=sk_test_abc123xyz789
WIAXY_BASE_URL=https://api.billstack.co/v2
WIAXY_WEBHOOK_SECRET=whsec_test_abc123xyz789
```

## Example .env.example

This is the template committed to Git (containing no secrets):

```bash
# Database
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
ADMIN_PASSWORD=your-secure-admin-password

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Saiful API (Data, Airtime, Electricity, Cable, Exam PIN)
SAIFUL_API_KEY=your-saiful-api-key
SAIFUL_API_URL=https://api.saiful.ng

# SMEPlug API (Alternative Data Provider)
SMEPLUG_API_KEY=your-smeplug-api-key
SMEPLUG_BASE_URL=https://api.smeplug.ng/api/v1

# Wiaxy (Virtual Accounts & Payment Gateway)
WIAXY_SECRET_KEY=your-wiaxy-secret-key
WIAXY_BASE_URL=https://api.billstack.co/v2
WIAXY_WEBHOOK_SECRET=your-wiaxy-webhook-secret
```

## Setup by Environment

### Local Development

```bash
# .env.local
DATABASE_URL=postgresql://localhost/danbaiwa_dev
JWT_SECRET=dev-secret-key-at-least-32-characters-long-12345678
ADMIN_PASSWORD=dev-admin-password
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Use staging/test API keys
SAIFUL_API_KEY=saiful_test_...
SMEPLUG_API_KEY=sk_test_...
WIAXY_SECRET_KEY=sk_test_...
```

### Staging/Testing

```bash
# .env.staging
DATABASE_URL=postgresql://user:pass@staging-db.neon.tech/danbaiwa_staging
JWT_SECRET=staging-secret-key-min-32-chars-unique-random-value
ADMIN_PASSWORD=staging-admin-password-secure
NEXT_PUBLIC_APP_URL=https://staging.danbaiwa.com

# Use testing API keys (if available) or staging live keys
SAIFUL_API_KEY=saiful_test_...
SMEPLUG_API_KEY=sk_test_...
WIAXY_SECRET_KEY=sk_test_...
```

### Production

```bash
# Set via Vercel Dashboard (NOT in .env file)
DATABASE_URL=postgresql://user:pass@prod-db.neon.tech/danbaiwa_prod
JWT_SECRET=production-secret-very-long-random-string-change-regularly
ADMIN_PASSWORD=production-admin-password-change-regularly
NEXT_PUBLIC_APP_URL=https://app.danbaiwa.com

# Use live API keys only
SAIFUL_API_KEY=saiful_live_...
SMEPLUG_API_KEY=sk_live_...
WIAXY_SECRET_KEY=sk_live_...
WIAXY_WEBHOOK_SECRET=whsec_live_...
```

## Vercel Deployment

### Setting Environment Variables

1. **Push code to GitHub** (without .env.local)
2. **Go to Vercel Dashboard** → Your Project
3. **Settings** → **Environment Variables**
4. **Add** each variable as key-value pair
5. Select environment(s): Production / Preview / Development
6. **Save and redeploy**

### Example Vercel Dashboard

| Key | Value (Production) | Development |
|-----|-------------------|-------------|
| DATABASE_URL | `postgresql://...prod...` | `postgresql://...test...` |
| JWT_SECRET | `long-random-prod-secret` | `dev-secret` |
| ADMIN_PASSWORD | `prod-password` | `dev-password` |
| SAIFUL_API_KEY | `saiful_live_...` | `saiful_test_...` |

## Validation Checklist

Before deploying, verify:

- [ ] `DATABASE_URL` is correct and accessible
- [ ] `JWT_SECRET` is at least 32 characters
- [ ] `ADMIN_PASSWORD` is secure (8+ characters)
- [ ] `NEXT_PUBLIC_APP_URL` is publicly accessible
- [ ] `SAIFUL_API_KEY` and `SAIFUL_API_URL` match environment
- [ ] `SMEPLUG_API_KEY` and `SMEPLUG_BASE_URL` match environment
- [ ] `WIAXY_SECRET_KEY` and `WIAXY_BASE_URL` are correct
- [ ] All API keys are from the same environment (test or live)
- [ ] No sensitive values in `.env.example`
- [ ] `.env.local` is in `.gitignore`
- [ ] Database connection is tested (run migrations)

## Troubleshooting

### "Database connection failed"
1. Verify `DATABASE_URL` format is correct
2. Check credentials (user, password)
3. Verify Neon project is active
4. Try connection string with Pooler endpoint

### "API key rejected"
1. Verify key is not expired
2. Check key is for correct environment (test vs live)
3. Verify API URL is correct for that key
4. Check key has required permissions (contact provider)

### "Webhook verification failed"
1. Verify `WIAXY_WEBHOOK_SECRET` matches Wiaxy dashboard
2. Check webhook URL in Wiaxy is set to: `{NEXT_PUBLIC_APP_URL}/api/wiaxy/webhook`
3. Verify signature algorithm is HMAC-SHA256

### "JWT token rejected"
1. Verify `JWT_SECRET` hasn't changed since token was issued
2. Clear cookies and try login again
3. Check token expiry (7 days)

## Security Best Practices

1. **Never commit secrets**: Add `.env.local` to `.gitignore`
2. **Rotate keys**: Change `JWT_SECRET` and `ADMIN_PASSWORD` quarterly
3. **Use strong values**: Min 32 chars for secrets, random + complex
4. **Staging vs Production**: Keep separate API keys
5. **Monitor access**: Log who accesses admin dashboard
6. **Vercel secrets**: Use Vercel's secret management for production
7. **Backup credentials**: Store in secure password manager

## Reference

- Neon Docs: https://neon.tech/docs
- Prisma Docs: https://www.prisma.io/docs
- Next.js Env Docs: https://nextjs.org/docs/basic-features/environment-variables
- Vercel Env Docs: https://vercel.com/docs/concepts/projects/environment-variables
# Environment Variables Setup Guide

Complete guide for setting up environment variables for **DANBAIWA DATA PLUG**.

---

## Quick Reference

```bash
# .env.local file
DATABASE_URL=postgresql://user:password@host:port/database_name
JWT_SECRET=your-64-character-random-secret-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
SMEPLUG_API_KEY=your-smeplug-api-key
SMEPLUG_BASE_URL=https://smeplug.ng/api/v1
SAIFUL_API_KEY=your-saiful-api-key
SAIFUL_BASE_URL=https://app.saifulegendconnect.com/api
```

---

## Detailed Setup

### 1. DATABASE_URL

**Required:** ✅ Yes  
**Environment:** Production & Development  
**Type:** PostgreSQL Connection String

**Description:**
Connection string for your PostgreSQL database (used by Prisma ORM).

**Format:**
```
postgresql://username:password@host:port/database_name
```

**How to Get:**

**Option A: Neon (Recommended - Free Tier)**
1. Visit [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Create a new project
4. Copy the connection string under "Connection String"
5. Use the "Prisma" format
6. Paste to `DATABASE_URL`

**Option B: Railway**
1. Visit [railway.app](https://railway.app)
2. Create new project → PostgreSQL
3. Copy the connection URL
4. Paste to `DATABASE_URL`

**Option C: Vercel Postgres**
1. Go to Vercel Dashboard
2. Select your project
3. Storage → Create Postgres Database
4. Copy connection string
5. Paste to `DATABASE_URL`

**Vercel Setup:**
```bash
vercel env add DATABASE_URL
# Paste your connection string
# Select: ✓ Production ✓ Preview ✓ Development
```

---

### 2. JWT_SECRET

**Required:** ✅ Yes  
**Environment:** Production & Development  
**Type:** Encryption Secret

**Description:**
Secret key for signing JWT authentication tokens.

**Requirements:**
- Minimum 32 characters (recommended: 64+)
- Random and unique
- Same across all environments
- Never share or commit to Git

**How to Generate:**

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

**Vercel Setup:**
```bash
vercel env add JWT_SECRET
# Paste your generated secret
# Select: ✓ Production ✓ Preview ✓ Development
```

---

### 3. NEXT_PUBLIC_APP_URL

**Required:** ✅ Yes  
**Environment:** Production & Development  
**Type:** URL String

**Description:**
Public URL of your deployed application (used for redirects and links).

**Format:**
```
http://localhost:3000          # Development
https://your-domain.com        # Production
```

**Examples:**
```
# Local Development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production (Vercel)
NEXT_PUBLIC_APP_URL=https://danbaiwa-data-plug.vercel.app

# With Custom Domain
NEXT_PUBLIC_APP_URL=https://danbaiwa.ng
```

---

### 4. SMEPLUG_API_KEY

**Required:** ✅ Yes  
**Environment:** Production & Development  
**Type:** API Key String

**Description:**
API key from SME Plug for data and airtime purchases.

**How to Get:**
1. Visit [smeplug.ng](https://smeplug.ng)
2. Register for a merchant account
3. Navigate to API Settings
4. Copy your API key
5. Paste to `SMEPLUG_API_KEY`

---

### 5. SMEPLUG_BASE_URL

**Required:** ✅ Yes  
**Environment:** Production & Development  
**Type:** URL String

**Description:**
Base URL for SME Plug API endpoints.

**Value:**
```
https://smeplug.ng/api/v1
```

---

### 6. SAIFUL_API_KEY

**Required:** ✅ Yes  
**Environment:** Production & Development  
**Type:** API Key String

**Description:**
API key from Saiful Legend Connect for electricity, cable, and exam PINs.

**How to Get:**
1. Contact Saiful support or visit [saifulegendconnect.com](https://saifulegendconnect.com)
2. Register as a merchant
3. Get your API credentials
4. Paste to `SAIFUL_API_KEY`

---

### 7. SAIFUL_BASE_URL

**Required:** ✅ Yes  
**Environment:** Production & Development  
**Type:** URL String

**Description:**
Base URL for Saiful API endpoints.

**Value:**
```
https://app.saifulegendconnect.com/api
```

---

## Vercel Production Setup

### Step 1: Add Variables to Vercel

In your Vercel dashboard:

1. Select your project
2. Go to **Settings** → **Environment Variables**
3. Click **Add New**
4. For each variable:
   - **Name:** `VARIABLE_NAME`
   - **Value:** `your_value_here`
   - **Environments:** Check all three (Production, Preview, Development)
   - Click **Add**

### Step 2: Deploy

Push your code to GitHub:
```bash
git push origin main
```

Vercel will automatically deploy and use the variables.

### Step 3: Verify

Visit your deployed app and test:
- Homepage loads
- Data purchase form works
- Admin panel accessible

---

## Local Development Setup

### Step 1: Create `.env.local`

In your project root:
```bash
cp .env.example .env.local
# Or create manually
touch .env.local
```

### Step 2: Add Variables

Edit `.env.local` and add all 7 variables:

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your-generated-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
SMEPLUG_API_KEY=your-key-here
SMEPLUG_BASE_URL=https://smeplug.ng/api/v1
SAIFUL_API_KEY=your-key-here
SAIFUL_BASE_URL=https://app.saifulegendconnect.com/api
```

### Step 3: Restart Development Server

```bash
npm run dev
```

Changes to `.env.local` require a restart.

---

## Validation Commands

### Check if Variables are Loaded

```bash
# During development
npm run dev
# Environment variables are loaded automatically from .env.local

# In production
# Verify in Vercel dashboard → Settings → Environment Variables
```

### Test Database Connection

```bash
npx prisma db execute --stdin < /dev/null
# Should not error if DATABASE_URL is valid
```

### Test API Keys

Each API is tested when you use the service:
- Data purchase → Tests SMEPLUG keys
- Electricity payment → Tests SAIFUL keys
- Cable subscription → Tests SAIFUL keys

---

## Troubleshooting

### "Cannot find module 'postgres'"
```
Fix: DATABASE_URL is missing or invalid
1. Check DATABASE_URL in .env.local
2. Ensure it starts with "postgresql://"
3. Test connection manually in database provider dashboard
```

### "Invalid JWT_SECRET"
```
Fix: JWT_SECRET is too short or not set
1. Regenerate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
2. Paste to .env.local
3. Restart development server
```

### "API authentication failed"
```
Fix: SMEPLUG_API_KEY or SAIFUL_API_KEY is incorrect
1. Verify keys in dashboard
2. Check for leading/trailing spaces
3. Regenerate keys if needed
4. Update .env.local
5. Restart server
```

### "Vercel build fails"
```
Fix: Variables not set in Vercel
1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Verify all 7 variables are present
4. Check values match what you copied
5. Redeploy
```

---

## Security Best Practices

✅ **DO:**
- Generate JWT_SECRET randomly
- Use unique API keys for each environment
- Keep .env.local out of Git (.gitignore it)
- Rotate API keys regularly
- Use environment-specific keys

❌ **DON'T:**
- Share API keys via email or Slack
- Commit .env.local to Git
- Use same keys for dev and production
- Use weak or predictable secrets
- Log or print API keys

---

## Quick Deployment Checklist

- [ ] All 7 variables added to Vercel
- [ ] DATABASE_URL tested and connects
- [ ] API keys verified in dashboards
- [ ] JWT_SECRET is 64+ characters
- [ ] NEXT_PUBLIC_APP_URL matches domain
- [ ] Vercel deployment triggered
- [ ] App loads at deployed URL
- [ ] Data purchase test successful
- [ ] Admin panel accessible
# Environment Variables Setup Guide

This guide explains every environment variable needed for **DANBAIWA DATA PLUG** application deployment on Vercel and local development.

---

## Table of Contents
1. [Database Configuration](#database-configuration)
2. [JWT Authentication](#jwt-authentication)
3. [Payment Gateway (TBD)](#payment-gateway) 
4. [Third-Party APIs](#third-party-apis)
5. [Public Configuration](#public-configuration)
6. [Vercel Deployment](#vercel-deployment)
7. [Testing & Validation](#testing--validation)

---

## Database Configuration

### `DATABASE_URL`
**Required:** ✅ Yes  
**Environment:** Production & Development  
**Type:** PostgreSQL Connection String

**Description:**
The complete PostgreSQL connection string for your database. This is used by Prisma ORM to connect to your database.

**Format:**
```
postgresql://username:password@host:port/database_name
```

**Example:**
```
postgresql://postgres:mypassword123@db.example.com:5432/danbaiwa_data_plug
```

**How to Get:**
1. **For Vercel (Recommended):** Use [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
   - Go to Vercel Dashboard → Storage → Create new Postgres Database
   - Copy the "Prisma" connection string
   - Connect to your project and Vercel will auto-populate the variable

2. **For Other PostgreSQL Providers:**
   - **Neon**: [neon.tech](https://neon.tech) - Free tier available
   - **Supabase**: [supabase.com](https://supabase.com) - PostgreSQL + Auth
   - **Railway**: [railway.app](https://railway.app)
   - **Self-hosted**: Set up your own PostgreSQL server

**Vercel Setup:**
```bash
vercel env add DATABASE_URL
# Paste your PostgreSQL connection string
# Select: Production, Preview, Development
```

---

## JWT Authentication

### `JWT_SECRET`
**Required:** ✅ Yes  
**Environment:** Production & Development  
**Type:** Encryption Secret

**Description:**
A cryptographic secret used to sign and verify JWT tokens. This must be:
- **At least 32 characters long** (recommended: 64+ characters)
- **Unique and random**
- **Never shared or committed to Git**
- The same across all environments for token verification

**Example:**
```
your_super_secret_jwt_key_min_32_chars_random_string_here_1a2b3c4d5e6f7g8h9i
```

**How to Generate Securely:**

**Option 1: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2: Using OpenSSL**
```bash
openssl rand -hex 32
```

**Option 3: Online Generator** (use with caution, only for testing)
- Visit: [generate-random.org](https://www.random.org/strings/)
- Generate: 64 characters, alphanumeric

**Vercel Setup:**
```bash
vercel env add JWT_SECRET
# Paste your generated secret (64+ chars)
# Select: Production, Preview, Development
```

**Important:**
- Delete console history after entering the secret
- Never hardcode in your application
- Rotate periodically in production

---

## Admin Protection

### `ADMIN_PASSWORD`
**Required:** ✅ Yes  
**Environment:** Production & Development  
**Type:** Password String

**Description:**
A secure password that protects access to admin panel API endpoints. All admin API requests must include this password in the `X-Admin-Password` header. This is an additional layer of security beyond JWT authentication.

**Format:**
```
Strong password (12+ characters, mix of uppercase, lowercase, numbers, symbols)
```

**Example:**
```
AdmP@ss2024#Secure!
```

**How to Generate Securely:**

**Option 1: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

**Option 2: Using a Password Manager**
- Generate a strong 16+ character password
- Store in your password manager (1Password, Bitwarden, etc.)

**Usage:**
When making requests to admin API endpoints, include the header:
```bash
curl -H "X-Admin-Password: your_admin_password" \
  https://sydatasub.vercel.app/api/admin/users
```

**Vercel Setup:**
```bash
vercel env add ADMIN_PASSWORD
# Paste your strong admin password
# Select: Production, Preview, Development
```

**Important:**
- Use a strong password (12+ chars, mixed case, numbers, symbols)
- Never share this password
- Different from user passwords
- Change periodically in production
- Store securely in password manager

---

## Wiaxy/BillStack Payment Gateway

Wiaxy (BillStack) is the payment processing service for virtual account creation and fund collection. You need a Wiaxy account to get these credentials.

### `WIAXY_BASE_URL`
**Required:** ✅ Yes  
**Environment:** Production & Development  
**Type:** API Endpoint URL

**Description:**
The base URL for Wiaxy/BillStack API endpoints. This is where all virtual account creation requests are sent.

**Production URL:**
```
https://api.billstack.co/v2
```

**Vercel Setup:**
```bash
vercel env add WIAXY_BASE_URL
# Paste: https://api.billstack.co/v2
# Select: Production, Preview, Development
```

---

### `WIAXY_SECRET_KEY`
**Required:** ✅ Yes  
**Environment:** Production & Development  
**Type:** API Key (Bearer Token)

**Description:**
Your Wiaxy API Secret Key used for server-side authentication. This should be kept **confidential** and used in the `Authorization: Bearer` header for all API requests.

**How to Get:**
1. Visit [Wiaxy Dashboard](https://dashboard.billstack.co)
2. Log in to your account
3. Go to Settings → API Keys or developer section
4. Copy your API Secret Key

**Format:**
```
Bearer token format (starts with typical API key prefix)
```

**Vercel Setup:**
```bash
vercel env add WIAXY_SECRET_KEY
# Paste your Wiaxy API secret key
# Select: Production, Preview, Development
```

**Important:**
- Keep this key secret - never commit to Git
- This key is used in Authorization headers
- Different from webhook signature verification

---

### `WIAXY_BANK`
**Required:** ✅ Yes (Optional - defaults to PALMPAY)  
**Environment:** Production & Development  
**Type:** Bank Code

**Description:**
The default bank to use when creating virtual accounts. This determines which bank issues the account number for users.

**Supported Banks:**
- `9PSB` - 9 Payment Service Bank
- `SAFEHAVEN` - Safe Haven Microfinance Bank
- `PROVIDUS` - Providus Bank
- `BANKLY` - Bankly (formerly Integrated Payroll and MIS Solutions Limited)
- `PALMPAY` - Palmpay (Recommended for reliability)

**Default Value:**
```
PALMPAY
```

**Recommendation:**
Use `PALMPAY` for best reliability and lowest fees.

**Vercel Setup:**
```bash
vercel env add WIAXY_BANK
# Paste one of: 9PSB, SAFEHAVEN, PROVIDUS, BANKLY, PALMPAY
# Select: Production, Preview, Development
```

---

### `WIAXY_WEBHOOK_URL`
**Required:** ✅ Yes (For Webhook Configuration)  
**Environment:** Production only (once deployed)  
**Type:** URL

**Description:**
The public URL of your webhook endpoint. This must be set in the Wiaxy dashboard to receive payment notifications.

**Format:**
```
https://yourdomain.com/api/wiaxy/webhook
```

**Examples:**
```
Development:  https://abc123.ngrok.io/api/wiaxy/webhook (using ngrok for local testing)
Production:   https://yourdomain.com/api/wiaxy/webhook
```

**How to Configure:**
1. Get this URL after deploying to Vercel
2. Log in to Wiaxy Dashboard
3. Go to Settings → Webhooks
4. Add webhook URL: `https://yourdomain.com/api/wiaxy/webhook`
5. Test webhook delivery from dashboard

**Note:**
- This is configured in Wiaxy dashboard, not necessarily as an env variable
- Your webhook endpoint is at `POST /api/wiaxy/webhook`
- Include the `/api/wiaxy/webhook` path exactly

---

## Third-Party APIs

### SME Plug API Configuration

**API Purpose:** Provides data and airtime services

#### `SMEPLUG_API_KEY`
**Required:** ✅ Yes  
**Environment:** Production & Development  
**Type:** API Key

**Description:**
Your SME Plug API authentication key for server-side API calls.

**How to Get:**
1. Visit [smeplug.ng](https://smeplug.ng)
2. Create an account or log in
3. Go to Settings/API Keys
4. Copy your API Key

**Vercel Setup:**
```bash
vercel env add SMEPLUG_API_KEY
# Paste your SME Plug API key
# Select: Production, Preview, Development
```

---

#### `SMEPLUG_BASE_URL`
**Required:** ✅ Yes  
**Environment:** Production & Development  
**Type:** API Endpoint URL

**Description:**
The base URL for SME Plug API endpoints. This is where all API requests are sent.

**Production URL:**
```
https://smeplug.ng/api/v1
```

**Vercel Setup:**
```bash
vercel env add SMEPLUG_BASE_URL
# Paste: https://smeplug.ng/api/v1
# Select: Production, Preview, Development
```

---

### Saiful Legend Connect API Configuration

**API Purpose:** Alternative provider for data and airtime services

#### `SAIFUL_API_KEY`
**Required:** ✅ Yes  
**Environment:** Production & Development  
**Type:** API Key

**Description:**
Your Saiful Legend Connect API authentication key.

**How to Get:**
1. Visit [saifulegendconnect.com](https://app.saifulegendconnect.com)
2. Create an account or log in
3. Navigate to API Settings
4. Generate/copy your API Key

**Vercel Setup:**
```bash
vercel env add SAIFUL_API_KEY
# Paste your Saiful API key
# Select: Production, Preview, Development
```

---

#### `SAIFUL_BASE_URL`
**Required:** ✅ Yes  
**Environment:** Production & Development  
**Type:** API Endpoint URL

**Description:**
The base URL for Saiful Legend Connect API.

**Production URL:**
```
https://app.saifulegendconnect.com/api
```

**Vercel Setup:**
```bash
vercel env add SAIFUL_BASE_URL
# Paste: https://app.saifulegendconnect.com/api
# Select: Production, Preview, Development
```

---

## Public Configuration

### `NEXT_PUBLIC_APP_URL`
**Required:** ✅ Yes  
**Environment:** Production & Development  
**Type:** Application URL (Public)

**Description:**
The public URL of your application. The `NEXT_PUBLIC_` prefix means this variable is exposed to the browser. It's used for:
- Building absolute URLs for redirects
- Email/SMS links
- API callback URLs
- Webhook configuration

**Examples:**
```
Development:  http://localhost:3000
Staging:      https://staging.sydatasub.com
Production:   https://sydatasub.com
```

**Important:**
- **Development:** `http://localhost:3000`
- **Vercel Preview:** Auto-generated (usually `https://branch--reponame.vercel.app`)
- **Production:** Your actual domain (e.g., `https://sydatasub.com`)

**Vercel Setup:**
```bash
# For Production
vercel env add NEXT_PUBLIC_APP_URL
# Paste: https://your-domain.com
# Select: Production only

# For Preview/Development (optional auto-handled by Vercel)
vercel env add NEXT_PUBLIC_APP_URL
# Paste: https://yourdomain.vercel.app (if custom preview domain)
```

---

## Vercel Deployment

### Step-by-Step Vercel Env Setup

#### Option 1: Using Vercel Dashboard (Recommended)

1. **Go to Your Vercel Project:**
   ```
   https://vercel.com/dashboard
   ```

2. **Select Project:** Click on `sydatasub`

3. **Open Settings:**
   - Click "Settings" tab → "Environment Variables"

4. **Add Each Variable:**
   ```
   Add Variable:
   - Name: DATABASE_URL
   - Value: postgresql://...
   - Environments: ✓ Production  ✓ Preview  ✓ Development
   - Add
   ```

5. **Repeat for all variables** (see [Complete Variables List](#complete-variables-list))

6. **Redeploy:** 
   - Trigger a new deployment for changes to take effect
   - Push to GitHub or click "Redeploy" on latest commit

#### Option 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
cd sy-data-sub
vercel link

# Add environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
# ... repeat for all variables

# Deploy
vercel deploy --prod
```

---

## Complete Variables List

**Quick Reference Table:**

| Variable | Required | Environment | Type | Example |
|----------|----------|-------------|------|---------|
| `DATABASE_URL` | ✅ | All | String | `postgresql://...` |
| `JWT_SECRET` | ✅ | All | String | 64+ char random string |
| `ADMIN_PASSWORD` | ✅ | All | String | Strong password 12+ chars |
| `WIAXY_BASE_URL` | ✅ | All | URL | `https://api.billstack.co/v2` |
| `WIAXY_SECRET_KEY` | ✅ | All | String | API Secret Key |
| `WIAXY_BANK` | ✅ | All | String | PALMPAY (or 9PSB, SAFEHAVEN, PROVIDUS, BANKLY) |
| `SMEPLUG_API_KEY` | ✅ | All | String | API key |
| `SMEPLUG_BASE_URL` | ✅ | All | URL | https://smeplug.ng/api/v1 |
| `SAIFUL_API_KEY` | ✅ | All | String | API key |
| `SAIFUL_BASE_URL` | ✅ | All | URL | https://app.saifulegendconnect.com/api |
| `NEXT_PUBLIC_APP_URL` | ✅ | All | URL | https://danbaiwa-data-plug.com |

---

## Testing & Validation

### Verify Variables Are Set

After deploying to Vercel, verify variables are working:

```bash
# 1. Check local .env.local
cat .env.local
# All variables should be filled

# 2. Check Vercel Dashboard
# Visit: https://vercel.com/dashboard → Project → Settings → Environment Variables
# All variables should be listed

# 3. Test in Production
# Visit your app: https://sydatasub.com
# Try a data purchase to verify Flutterwave integration
```

### Common Issues & Solutions

**Issue: "Environment variable not found"**
- ✓ Verify variable is added in Vercel Settings
- ✓ Redeploy after adding variables
- ✓ Check variable name spelling matches exactly

**Issue: "Database connection error"**
- ✓ Verify DATABASE_URL format is correct
- ✓ Check PostgreSQL service is running
- ✓ Verify credentials are correct

**Issue: "Payment gateway errors"**
- ✓ Verify Wiaxy API keys are correct
- ✓ Check if using test vs. live keys consistently
- ✓ Ensure webhook endpoint is configured in Wiaxy dashboard
- ✓ Verify signature verification header matches (x-wiaxy-signature)

**Issue: "Virtual account creation fails"**
- ✓ Ensure WIAXY_SECRET_KEY is correct
- ✓ Check WIAXY_BASE_URL is set to correct endpoint
- ✓ Verify WIAXY_BANK is one of: 9PSB, SAFEHAVEN, PROVIDUS, BANKLY, PALMPAY
- ✓ Check Wiaxy API status page for service issues

**Issue: "JWT token errors"**
- ✓ Ensure JWT_SECRET is at least 32 characters
- ✓ Same JWT_SECRET must be used across all instances
- ✓ Don't change JWT_SECRET in production (invalidates existing tokens)

---

## Security Best Practices

✅ **DO:**
- Store all secrets in Vercel Environment Variables (never in code)
- Use strong, random secrets (min 32 chars for JWT_SECRET)
- Keep .env.local in .gitignore
- Rotate secrets periodically in production
- Use different secrets for dev/staging/production

❌ **DON'T:**
- Commit `.env.local` or any `.env` files to Git
- Hardcode secrets in application code
- Share environment variables via email/chat
- Use the same secrets across environments
- Log sensitive data in console

---

## Support & Resources

- **Wiaxy/BillStack Docs:** https://developers.billstack.co
- **Wiaxy Dashboard:** https://dashboard.billstack.co
- **Vercel Docs:** https://vercel.com/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Next.js Docs:** https://nextjs.org/docs

---

**Last Updated:** April 9, 2026  
**Version:** 2.0.0 (Updated with Wiaxy/BillStack Integration)

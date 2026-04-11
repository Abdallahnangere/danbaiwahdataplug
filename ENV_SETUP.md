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

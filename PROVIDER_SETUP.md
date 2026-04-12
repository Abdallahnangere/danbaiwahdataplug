# Environment Setup & Provider Configuration

## Getting the API Keys

### 1. Smeplug API Keys (MTN, Glo, 9mobile)

**Sign up and get API key:**

1. Visit: https://smeplug.com
2. Create account (you'll need a business email)
3. Complete KYC verification
4. Go to Dashboard → API Settings
5. Generate API Key
6. Copy the **Bearer Token** (this is your API key)

**Test Data:**
- API Endpoint: `https://api.smeplug.com`
- Test account available in dashboard
- Documentation: https://smeplug.com/developers

**Rate Limits:**
- Development: 10 requests/minute
- Production: Based on plan

---

### 2. Saiful API Keys (Airtel)

**Sign up and get API key:**

1. Visit: https://saiful.net
2. Create developer account
3. Verify email
4. Go to Developer Console → API Keys
5. Create new API key
6. Copy the **Secret Key**

**Test Data:**
- Endpoint: `https://api.saiful.net`
- Test network: Test Airtel
- Documentation: https://saiful.net/developers

---

### 3. Flutterwave API Keys (Payment Processing)

**Sign up and get API key:**

1. Visit: https://flutterwave.com
2. Create account
3. Complete account verification
4. Go to Settings → API
5. Copy **Public Key** and **Secret Key**
6. For webhooks, get **Webhook Hash**

**Keys you'll need:**
```
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST...
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST...
FLUTTERWAVE_WEBHOOK_SECRET=whsec_...
```

**Webhook Setup:**
1. Go to Settings → Webhooks
2. Add URL: `https://yourdomain.com/api/flutterwave/webhook`
3. Select events: `charge.completed`, `charge.failed`
4. Get webhook secret

**Test Cards:**
```
Visa (Success):
4242 4242 4242 4242
Exp: Any future date
CVV: Any 3 digits

Mastercard (Success):
5531 8866 5440 6670
Exp: Any future date
CVV: Any 3 digits

Failed Transaction:
5143 0000 0000 0002
Exp: Any future date
CVV: Any 3 digits
```

---

### 4. Authentication & Admin Setup

**NextAuth Configuration:**

Generate secure secret:
```bash
openssl rand -base64 32
```

Use this as `NEXTAUTH_SECRET`

**Admin Credentials:**

Create admin account:
1. Sign up through normal signup flow
2. Update in database:
```sql
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'admin@example.com';
```

Or create manually:
```bash
npx tsx scripts/create-admin.ts --email admin@example.com --pin 1234
```

---

## Complete .env Configuration File

```env
# ============================================
# DATABASE
# ============================================
DATABASE_URL=postgresql://user:password@localhost:5432/myapp

# ============================================
# AUTHENTICATION
# ============================================
NEXTAUTH_SECRET=your-32-character-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# ============================================
# SMEPLUG (MTN, GLO, 9MOBILE)
# ============================================
SMEPLUG_API_KEY=your_smeplug_bearer_token_here
SMEPLUG_BASE_URL=https://api.smeplug.com

# ============================================
# SAIFUL (AIRTEL)
# ============================================
SAIFUL_API_KEY=your_saiful_secret_key_here
SAIFUL_BASE_URL=https://api.saiful.net

# ============================================
# FLUTTERWAVE (PAYMENT PROCESSING)
# ============================================
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_YOUR_PUBLIC_KEY
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST_YOUR_SECRET_KEY
FLUTTERWAVE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
FLUTTERWAVE_BASE_URL=https://api.flutterwave.com/v3

# ============================================
# ADMIN SETTINGS
# ============================================
ADMIN_SECRET_KEY=your_admin_secret_here
ADMIN_EMAIL=admin@example.com

# ============================================
# EMAIL SERVICE (OPTIONAL)
# ============================================
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_sendgrid_key_here

# For Nodemailer
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your_email@gmail.com
# EMAIL_PASS=your_app_password

# ============================================
# RATE LIMITING
# ============================================
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================
# LOGGING & MONITORING
# ============================================
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn_here

# ============================================
# ANALYTICS
# ============================================
ANALYTICS_ID=your_google_analytics_id

# ============================================
# APPLICATION
# ============================================
NODE_ENV=development
APP_NAME=MyDataApp
APP_URL=http://localhost:3000
```

---

## Provider Setup Steps

### Step 1: Set Up Smeplug

Create `.env.local` variable:
```env
SMEPLUG_API_KEY=sk_live_your_key_here
```

Test the integration:
```bash
curl -X GET https://api.smeplug.com/api/v1/plans/data \
  -H "Authorization: Bearer sk_live_your_key_here"
```

### Step 2: Set Up Saiful

```env
SAIFUL_API_KEY=sk_live_your_saiful_key
```

Test:
```bash
curl -X GET https://api.saiful.net/api/v1/plans/data \
  -H "Authorization: Bearer sk_live_your_saiful_key"
```

### Step 3: Configure Flutterwave

1. Get your keys from dashboard
2. Add to `.env.local`:
```env
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_xxx
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST_xxx
```

3. Test webhook:
```bash
# In Flutterwave dashboard, under Webhooks
# Add endpoint: https://yourdomain.com/api/flutterwave/webhook
# Test webhook from dashboard
```

### Step 4: Test Database Connection

```bash
# Test PostgreSQL connection
psql "postgresql://user:password@localhost:5432/myapp"

# Run migrations
npx prisma migrate deploy

# Verify migrations
npx prisma studio  # Opens UI to view database
```

---

## Verification Checklist

### Providers Working ✓

```bash
# Test Smeplug
npx tsx scripts/test-smeplug.ts

# Test Saiful
npx tsx scripts/test-saiful.ts

# Test Flutterwave
npx tsx scripts/test-flutterwave.ts
```

### Database ✓

- [ ] PostgreSQL running
- [ ] DATABASE_URL correct
- [ ] Migrations applied
- [ ] Can connect with prisma studio

### Authentication ✓

- [ ] NEXTAUTH_SECRET is 32+ characters
- [ ] NEXTAUTH_URL points to correct domain
- [ ] Can sign up and login

### Environment Variables ✓

```bash
# Verify all required variables are set
node -e "console.log(process.env.DATABASE_URL ? '✓' : '✗ DATABASE_URL')"
node -e "console.log(process.env.NEXTAUTH_SECRET ? '✓' : '✗ NEXTAUTH_SECRET')"
node -e "console.log(process.env.SMEPLUG_API_KEY ? '✓' : '✗ SMEPLUG_API_KEY')"
```

---

## Troubleshooting

### "Invalid API Key" Error

**Smeplug:**
- Verify API key format (should start with `sk_`)
- Check account isn't in demo mode
- Ensure account is verified/KYC complete
- Request new key if unsure

**Saiful:**
- Verify you copied the full secret key
- Check account is activated
- Request new key through dashboard

**Flutterwave:**
- Verify you're using TEST keys in development
- Check key hasn't been regenerated (old key is inactive)
- Webhook secret is different from API key

### Database Connection Failed

```bash
# Check PostgreSQL is running
psql --version

# Verify DATABASE_URL format
# Should be: postgresql://user:password@host:port/dbname

# Test connection directly
psql $DATABASE_URL

# Common issues:
# - Wrong password
# - Database doesn't exist (create it first)
# - PostgreSQL not running
# - Firewall blocking port 5432
```

### Authentication Not Working

```bash
# Check NEXTAUTH_SECRET
echo $NEXTAUTH_SECRET | wc -c  # Should be >= 33 (32 + newline)

# Verify NEXTAUTH_URL
echo $NEXTAUTH_URL  # Should match your domain

# Clear auth cookies and retry
# Cookies in localStorage: look for `next-auth`
```

---

## Local Testing Setup

### Using Docker for PostgreSQL

```bash
# Create Docker container with PostgreSQL
docker run --name postgres \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=myapp \
  -p 5432:5432 \
  -d postgres:15-alpine

# Connection string
postgresql://user:password@localhost:5432/myapp
```

### Testing Data Endpoints

```bash
# Get networks
curl http://localhost:3000/api/data/networks

# Get plans for MTN
curl "http://localhost:3000/api/data/plans/{network_id}"

# Test authenticated endpoint (need to login first, get token)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/transactions
```

---

## Security Notes

### Never Commit Secrets!

```bash
# Good - .env.local is ignored
SMEPLUG_API_KEY=sk_live_xxxxx

# Bad - Would expose key if committed
git add .env.production  # DON'T DO THIS

# Check git won't commit secrets
git status | grep ".env"  # Should be empty
```

### Rotate Keys Regularly

1. **Smeplug:** Generate new key monthly, keep old for 1 week
2. **Saiful:** Rotate quarterly
3. **Flutterwave:** Rotate every 90 days

### Webhook Security

Validate webhook signatures:

```typescript
// lib/webhooks.ts
export function verifyFlutterwaveWebhook(
  signature: string,
  body: string,
  secret: string
) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return hash === signature;
}
```

---

## Production Migration

When moving from development → production:

1. **Generate new production keys**
   - Request live API keys from each provider
   - These are different from test keys

2. **Update environment variables**
   ```env
   # Remove "TEST" and use live keys
   SMEPLUG_API_KEY=sk_live_xxxxx  # Not sk_test
   SAIFUL_API_KEY=sk_live_xxxxx
   FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_LIVE_xxxxx
   ```

3. **Update webhook URLs**
   ```env
   FLUTTERWAVE_WEBHOOK_URL=https://yourdomain.com/api/flutterwave/webhook
   ```

4. **Run in production mode**
   ```bash
   NODE_ENV=production npm start
   ```

5. **Monitor transactions**
   - First day: Low transaction volume
   - Watch for errors in logs
   - Verify refund process works

---

## Next Steps

1. ✅ Create accounts with all providers
2. ✅ Get API keys
3. ✅ Configure `.env.local`
4. ✅ Test database connection
5. ✅ Run `npm run dev`
6. ✅ Test each API endpoint
7. ✅ Deploy to staging
8. ✅ Deploy to production

Everything should work once you have all the API keys configured! 🎉

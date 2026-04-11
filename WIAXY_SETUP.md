# Wiaxy Payment Integration: Quick Setup Guide

## 5-Minute Setup for Developers

### 1. Get Wiaxy Credentials

```bash
# Visit Wiaxy Dashboard
https://dashboard.billstack.co

# Sign up or log in
# Go to: Settings → API Keys
# Copy your API Secret Key
```

### 2. Update Environment Variables

Add these to `.env.local`:

```bash
# Wiaxy Configuration
WIAXY_BASE_URL=https://api.billstack.co/v2
WIAXY_SECRET_KEY=your_api_secret_key_here
WIAXY_BANK=PALMPAY
```

### 3. Files Already Integrated

- ✅ `lib/wiaxy.ts` - API client
- ✅ `app/api/wiaxy/webhook/route.ts` - Webhook handler
- ✅ `app/api/auth/signup/route.ts` - Real account creation

### 4. Test Locally

```bash
# 1. Start your app
npm run dev

# 2. Sign up a new user (POST /api/auth/signup)
# You should get a real virtual account from Wiaxy

# 3. Check logs for success message:
# [WIAXY] Account created successfully
```

### 5. Deploy to Production

```bash
# 1. Add env vars to Vercel
vercel env add WIAXY_BASE_URL
vercel env add WIAXY_SECRET_KEY
vercel env add WIAXY_BANK

# 2. Trigger redeploy
vercel deploy --prod

# 3. Get your webhook URL
# Format: https://yourdomain.com/api/wiaxy/webhook

# 4. Configure in Wiaxy Dashboard
# Settings → Webhooks → Add Webhook
# Paste: https://yourdomain.com/api/wiaxy/webhook
# Save
```

### 6. Verify Integration

```bash
# Call the health check
curl https://yourdomain.com/api/wiaxy/webhook

# Response should be:
# {"message":"Wiaxy webhook endpoint active","timestamp":"..."}
```

## What Happens Now

### User Signup Flow
```
User posts name, phone, PIN
    ↓
createVirtualAccount() called
    ↓
Wiaxy API creates real account
    ↓
Account details returned
    ↓
Stored in database
    ↓
User receives:
  - Account Number
  - Bank Name
  - Account Name
```

### Payment Flow
```
Customer sends funds to account number
    ↓
Wiaxy detects payment
    ↓
Sends webhook notification
    ↓
/api/wiaxy/webhook receives it
    ↓
Signature verified [MD5 hash]
    ↓
Transaction recorded
    ↓
User balance credited
    ↓
Database updated
```

## Available Banks

Choose one for `WIAXY_BANK`:

| Bank | Code | Notes |
|------|------|-------|
| Palmpay | PALMPAY | ⭐ Recommended (best reliability) |
| Providus Bank | PROVIDUS | Fast processing |
| Safe Haven | SAFEHAVEN | Alternative option |
| 9 Payment Service Bank | 9PSB | Popular choice |
| Bankly | BANKLY | Good coverage |

## API Response Examples

### Successful Account Creation
```json
{
  "status": true,
  "message": "Virtual account created successfully",
  "data": {
    "reference": "user-123-abc",
    "account": [
      {
        "account_number": "9700123456",
        "account_name": "DANBAIWA/JOHN DOE",
        "bank_name": "Palmpay",
        "bank_id": "999999",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### Webhook Payment Notification
```json
{
  "event": "PAYMENT_NOTIFIFICATION",
  "data": {
    "amount": "50000",
    "reference": "user-123-abc",
    "merchant_reference": "user-123-abc",
    "wiaxy_ref": "TXN-ABC-123",
    "account": {
      "account_number": "9700123456",
      "account_name": "DANBAIWA/JOHN DOE",
      "bank_name": "Palmpay"
    },
    "payer": {
      "account_number": "1234567890",
      "first_name": "Jane",
      "last_name": "Smith"
    }
  }
}
```

## Troubleshooting

### "Account creation failed"
- [ ] Check `WIAXY_SECRET_KEY` is correct
- [ ] Check `WIAXY_BASE_URL` is `https://api.billstack.co/v2`
- [ ] Check internet connection
- [ ] Verify Wiaxy service is up: https://status.billstack.co

### "Webhook signature invalid"
- [ ] Verify `WIAXY_SECRET_KEY` matches what's in Wiaxy dashboard
- [ ] Check header is exactly `x-wiaxy-signature`
- [ ] Ensure header value is MD5 hash of secret key

### "Transaction not found" error
- [ ] Webhook `merchant_reference` must match user ID
- [ ] Check database connection
- [ ] Verify transaction record is being created

## Monitoring

Check logs in Vercel:

```bash
# View deployment logs
vercel logs --tail

# Look for:
# [WIAXY] Account created successfully - ✅ Working
# [WIAXY WEBHOOK] Valid payload received - ✅ Webhook received
# [API] User balance updated - ✅ Payment processed
```

## Support

- **Docs:** See `WIAXY_INTEGRATION.md` for full documentation
- **Wiaxy Support:** support@billstack.co
- **Dashboard:** https://dashboard.billstack.co
- **Status Page:** https://status.billstack.co

---

**Ready to integrate?** Follow the 5 steps above and you're done!

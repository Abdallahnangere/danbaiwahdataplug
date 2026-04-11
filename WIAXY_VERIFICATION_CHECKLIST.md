# Wiaxy Integration - Verification Checklist

Use this checklist to verify the Wiaxy payment integration is working correctly.

## ✅ Code Implementation Verification

### Files Created
- [ ] `lib/wiaxy.ts` exists (341 lines)
- [ ] `app/api/wiaxy/webhook/route.ts` exists (128 lines)
- [ ] `WIAXY_INTEGRATION.md` exists (comprehensive docs)
- [ ] `WIAXY_SETUP.md` exists (quick start)
- [ ] `WIAXY_INTEGRATION_SUMMARY.md` exists (summary)

### Files Modified
- [ ] `app/api/auth/signup/route.ts` includes Wiaxy import
- [ ] `app/api/auth/signup/route.ts` calls `createVirtualAccount()`
- [ ] `ENV_SETUP.md` documents `WIAXY_*` variables
- [ ] No references to Flutterwave in environment docs

### Code Quality Check
- [ ] No TypeScript errors in `lib/wiaxy.ts`
- [ ] No TypeScript errors in `app/api/wiaxy/webhook/route.ts`
- [ ] No TypeScript errors in `app/api/auth/signup/route.ts`
- [ ] All imports resolve correctly
- [ ] All required types are defined

## ✅ Environment Setup

### Local Development (.env.local)
```bash
WIAXY_BASE_URL=https://api.billstack.co/v2
WIAXY_SECRET_KEY=____your_key_here____
WIAXY_BANK=PALMPAY
```

- [ ] `WIAXY_BASE_URL` is set to production endpoint
- [ ] `WIAXY_SECRET_KEY` is your actual Wiaxy API key
- [ ] `WIAXY_BANK` is one of: PALMPAY, 9PSB, SAFEHAVEN, PROVIDUS, BANKLY
- [ ] `.env.local` is NOT committed to Git
- [ ] Variables are loaded by Next.js on startup

### Vercel Production
- [ ] `WIAXY_BASE_URL` saved in Vercel
- [ ] `WIAXY_SECRET_KEY` saved in Vercel
- [ ] `WIAXY_BANK` saved in Vercel
- [ ] All set to Production environment
- [ ] Deployment triggered after adding variables

## ✅ Local Testing

### Test 1: Virtual Account Creation

```bash
# 1. Start dev server
npm run dev

# 2. Make signup request
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "08012345678",
    "pin": "123456",
    "confirmPin": "123456",
    "acceptTerms": true
  }'

# 3. Check response for:
# - "message": "Account created successfully"
# - "virtualAccount": { "accountNumber": "970...", "bankName": "Palmpay" }
# - "user": { "id": "...", "phone": "08012345678", "balance": 10000 }

# 4. Check logs for:
# [WIAXY] Account created successfully
# [SIGNUP] Wiaxy account created {userId, accountNumber, bank}
```

Expected Response:
```json
{
  "message": "Account created successfully",
  "user": {
    "id": "user-id-here",
    "phone": "08012345678",
    "fullName": "Test User",
    "balance": 10000
  },
  "virtualAccount": {
    "accountNumber": "9700123456",
    "bankName": "Palmpay"
  }
}
```

- [ ] Received account number (not placeholder)
- [ ] Received bank name from Wiaxy
- [ ] User balance includes signup bonus (10000)
- [ ] No errors in console
- [ ] Log shows `[WIAXY] Account created successfully`

### Test 2: Database Verification

```bash
# 1. Check VirtualAccount was created
SELECT * FROM "VirtualAccount" ORDER BY "createdAt" DESC LIMIT 1;

# 2. Verify:
# - accountNumber is real (from Wiaxy, e.g., 9700123456)
# - bankName matches response
# - userId is the created user
# - flwRef contains user ID or reference
```

- [ ] VirtualAccount record exists
- [ ] `accountNumber` is real (not placeholder)
- [ ] `bankName` is correct
- [ ] `createdAt` is recent

### Test 3: Webhook Signature Verification

```bash
# 1. With ngrok running on localhost:3000
ngrok http 3000

# 2. Get your ngrok URL (e.g., https://abc123.ngrok.io)

# 3. Calculate MD5 hash of WIAXY_SECRET_KEY:
# Linux/Mac: echo -n "your_secret_key" | md5sum
# Windows (PowerShell): (echo -n "your_secret_key") | md5sum

# 4. Send test webhook
curl -X POST https://abc123.ngrok.io/api/wiaxy/webhook \
  -H "x-wiaxy-signature: {md5_hash_from_step_3}" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_NOTIFIFICATION",
    "data": {
      "type": "PAYMENT",
      "reference": "user-id-from-test-1",
      "merchant_reference": "user-id-from-test-1",
      "wiaxy_ref": "test-ref-123",
      "amount": "5000",
      "created_at": "2024-01-15T10:35:00Z",
      "account": {
        "account_number": "9700123456",
        "account_name": "DANBAIWA/Test User",
        "bank_name": "Palmpay",
        "created_at": "2024-01-15T10:30:00Z"
      },
      "payer": {
        "account_number": "1234567890",
        "first_name": "Jane",
        "last_name": "Smith",
        "createdAt": "2024-01-15T10:35:00Z"
      }
    }
  }'

# 5. Expected response:
# { "success": true, "message": "Payment processed successfully", "transactionId": "..." }
```

- [ ] Webhook accepted (200 OK)
- [ ] Response includes `success: true`
- [ ] Log shows `[WIAXY WEBHOOK] Valid payload received`

### Test 4: Webhook Processing

```bash
# After sending webhook in Test 3:

# 1. Check Transaction was created
SELECT * FROM "Transaction" ORDER BY "createdAt" DESC LIMIT 1;

# 2. Verify:
# - userId matches the user from Test 1
# - type = "DEPOSIT"
# - method = "WIAXY"
# - amount = 5000
# - status = "COMPLETED"
# - externalReference contains wiaxy_ref

# 3. Check User balance was updated
SELECT balance FROM "User" WHERE id = 'user-id-from-test-1';

# 4. Verify:
# - balance increased by 5000
# - New balance visible in database
```

- [ ] Transaction record created
- [ ] `type` is "DEPOSIT"
- [ ] `method` is "WIAXY"
- [ ] `amount` is 5000
- [ ] `status` is "COMPLETED"
- [ ] User balance increased by 5000

### Test 5: Invalid Webhook Rejection

```bash
# Test that invalid webhook is rejected

# 1. Send webhook with WRONG signature
curl -X POST http://localhost:3000/api/wiaxy/webhook \
  -H "x-wiaxy-signature: wrong_signature_hash" \
  -H "Content-Type: application/json" \
  -d '{...webhook payload...}'

# 2. Expected response: 401 Unauthorized
```

- [ ] Webhook rejected (401)
- [ ] Log shows `[WIAXY WEBHOOK] Invalid signature`
- [ ] No transaction created

## ✅ Production Verification

### Pre-Deployment
- [ ] All local tests pass (Test 1-5)
- [ ] No TypeScript errors: `npx next build`
- [ ] Environment variables ready for Vercel

### Post-Deployment to Vercel

```bash
# 1. Verify deployment successful
vercel logs --tail

# 2. Create new account on production
curl -X POST https://yourdomain.com/api/auth/signup ...

# 3. Check logs for:
# [WIAXY] Account created successfully
# [SIGNUP] Wiaxy account created

# 4. Health check
curl https://yourdomain.com/api/wiaxy/webhook
# Should return: {"message":"Wiaxy webhook endpoint active",...}
```

- [ ] App deploys without errors
- [ ] New users receive real Wiaxy accounts
- [ ] Webhook endpoint is accessible
- [ ] Logs show successful operations

### Webhook Configuration in Wiaxy

1. Log in to [Wiaxy Dashboard](https://dashboard.billstack.co)
2. Navigate to: Settings → Webhooks (or similar)
3. Add webhook URL: `https://yourdomain.com/api/wiaxy/webhook`
4. Test webhook delivery from dashboard
5. Verify signature verification passes

- [ ] Webhook URL configured in Wiaxy
- [ ] Test webhook received successfully
- [ ] Signature verification passed
- [ ] Transaction recorded in database

## ✅ Error Recovery Tests

### Test 1: Wiaxy API Unavailable
- [ ] Signup succeeds with fallback placeholder account
- [ ] Log shows: `[SIGNUP] Wiaxy account creation failed`
- [ ] User still receives account (placeholder format)
- [ ] Balance still credited with signup bonus

### Test 2: Invalid Bank Code
- [ ] Change `WIAXY_BANK` to invalid value (e.g., "INVALID")
- [ ] Signup fails gracefully
- [ ] Fallback placeholder account created
- [ ] Error logged properly

### Test 3: Missing Environment Variables
- [ ] Remove `WIAXY_SECRET_KEY` from `.env.local`
- [ ] Signup fails gracefully
- [ ] Fallback placeholder account created
- [ ] Warning logged

### Test 4: Duplicate Webhook
- [ ] Send same webhook twice
- [ ] First: Transaction created, balance updated
- [ ] Second: Returns success but transaction NOT created again
- [ ] Balance NOT incremented twice
- [ ] Log shows: `[API] Transaction already processed`

## ✅ Performance Tests

- [ ] Signup response time < 5 seconds
- [ ] Webhook processing < 1 second
- [ ] 100 concurrent signups - all succeed
- [ ] No database errors in logs

## ✅ Security Tests

- [ ] Webhook with invalid signature rejected
- [ ] Webhook without signature header rejected
- [ ] API key not logged in console
- [ ] Database connection secure
- [ ] No sensitive data in error messages

## ✅ Documentation Tests

- [ ] WIAXY_INTEGRATION.md covers all features
- [ ] WIAXY_SETUP.md provides working quick start
- [ ] ENV_SETUP.md correctly documents all variables
- [ ] All code has inline comments explaining functionality
- [ ] Examples in docs match actual implementations

## 📋 Troubleshooting During Testing

### "Account creation failed"
1. Check `WIAXY_SECRET_KEY` is correct
2. Check `WIAXY_BASE_URL` is `https://api.billstack.co/v2`
3. Check internet connectivity
4. Check Wiaxy API status: https://status.billstack.co

### "Webhook signature verification failed"
1. Verify `WIAXY_SECRET_KEY` is correct
2. Ensure header is exactly `x-wiaxy-signature`
3. Verify MD5 hash calculation is correct
4. Check secret key doesn't have extra spaces

### "Transaction not found"
1. Verify `merchant_reference` in webhook matches user ID
2. Check database connection
3. Verify user exists in database
4. Check transaction table exists

### "User not found for merchant reference"
1. Use correct user ID in webhook `merchant_reference`
2. Verify user was created in Test 1
3. Check user ID in webhook matches database record

## ✅ Final Verification

- [ ] All 5 local tests pass
- [ ] All error recovery tests pass
- [ ] Production deployment successful
- [ ] Webhook configured in Wiaxy
- [ ] Real payment received and processed
- [ ] User balance correctly updated
- [ ] Documentation is accurate and complete
- [ ] No critical errors in logs

---

## Status: ✅ READY FOR PRODUCTION

If all checkboxes are checked, the Wiaxy integration is ready for production use!

**Next Steps:**
1. Get Wiaxy API credentials
2. Add to environment variables
3. Test locally (Tests 1-5)
4. Deploy to Vercel
5. Configure webhook in Wiaxy
6. Monitor first week of transactions


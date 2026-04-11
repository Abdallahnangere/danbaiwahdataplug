# Wiaxy/BillStack Payment Gateway Integration

## Overview

This document describes the complete integration of Wiaxy/BillStack payment gateway for virtual account creation and payment collection in DANBAIWA DATA PLUG.

## Architecture

```
User Signup
    ↓
POST /api/auth/signup
    ↓
createVirtualAccount() [lib/wiaxy.ts]
    ↓
Wiaxy API: POST /v2/thirdparty/generateVirtualAccount/
    ↓
Virtual Account Created (Account Number + Bank Name)
    ↓
Stored in VirtualAccount Table
    ↓
User receives dedicated account for deposits
    ↓
Funds transferred to account
    ↓
Wiaxy Webhook: POST /api/wiaxy/webhook
    ↓
Transaction Recorded + Balance Updated
```

## Files Created/Modified

### 1. New Files
- **`lib/wiaxy.ts`** - Wiaxy API client with:
  - `createVirtualAccount()` - Creates reserved virtual accounts
  - `verifyWebhookSignature()` - MD5 signature verification
  - `parseWebhookPayload()` - Webhook payload validation
  - `extractPaymentInfo()` - Payment data extraction

- **`app/api/wiaxy/webhook/route.ts`** - Webhook handler for payment notifications:
  - Signature verification
  - Transaction recording
  - User balance updates
  - Duplicate prevention

### 2. Modified Files
- **`app/api/auth/signup/route.ts`**:
  - Added Wiaxy import
  - Replaced placeholder account creation with real Wiaxy API call
  - Added fallback to placeholder if Wiaxy fails
  - Enhanced error handling and logging

## Environment Variables

Add the following to your `.env.local`:

```bash
# Wiaxy/BillStack Configuration
WIAXY_BASE_URL=https://api.billstack.co/v2
WIAXY_SECRET_KEY=your_wiaxy_api_key_here
WIAXY_BANK=PALMPAY              # Default bank: 9PSB, SAFEHAVEN, PROVIDUS, BANKLY, PALMPAY
WIAXY_WEBHOOK_URL=https://yourdomain.com/api/wiaxy/webhook
```

### Getting Credentials

1. Sign up at [Wiaxy/BillStack Dashboard](https://dashboard.billstack.co)
2. Navigate to Settings → API Keys
3. Copy your API Secret Key
4. Set Webhook URL in dashboard to your production endpoint
5. Configure preferred bank for account creation

## API Integration Details

### 1. Virtual Account Creation

**Endpoint:** `POST /v2/thirdparty/generateVirtualAccount/`

**Request Headers:**
```javascript
{
  "Authorization": "Bearer <WIAXY_SECRET_KEY>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```javascript
{
  "email": "user@danbaiwa.app",
  "reference": "user-id-123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "08012345678",
  "bank": "PALMPAY"  // Options: 9PSB, SAFEHAVEN, PROVIDUS, BANKLY, PALMPAY
}
```

**Success Response (200):**
```javascript
{
  "status": true,
  "message": "Virtual account created successfully",
  "data": {
    "reference": "user-id-123",
    "account": [
      {
        "account_number": "9700123456",
        "account_name": "DANBAIWA/JOHN DOE",
        "bank_name": "Palmpay",
        "bank_id": "999999",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "meta": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@danbaiwa.app"
    }
  }
}
```

**Error Response:**
```javascript
{
  "status": false,
  "message": "Error description",
  "data": null
}
```

### 2. Webhook Notifications

**Endpoint:** `POST /api/wiaxy/webhook`

**Authentication:** 
- Header: `x-wiaxy-signature`
- Value: MD5 hash of `WIAXY_SECRET_KEY`

**Webhook Payload Structure:**
```javascript
{
  "event": "PAYMENT_NOTIFIFICATION",
  "data": {
    "type": "PAYMENT",
    "reference": "user-id-123",
    "merchant_reference": "user-id-123",
    "wiaxy_ref": "wiaxy-ref-12345",
    "amount": "5000",
    "created_at": "2024-01-15T10:35:00Z",
    "account": {
      "account_number": "9700123456",
      "account_name": "DANBAIWA/JOHN DOE",
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
}
```

## Webhook Security

### Signature Verification

All webhook payloads are signed with MD5. Verification process:

1. Extract `x-wiaxy-signature` header from request
2. Calculate: `MD5(WIAXY_SECRET_KEY)`
3. Compare with header value
4. Reject if mismatch

**Implementation:**
```typescript
import crypto from "crypto";

export function verifyWebhookSignature(signature: string): boolean {
  const expectedSignature = crypto
    .createHash("md5")
    .update(WIAXY_SECRET_KEY)
    .digest("hex");

  return signature === expectedSignature;
}
```

## Webhook Processing Flow

### 1. Signature Verification
- Verifies request authenticity
- Rejects unauthorized calls
- Logs verification failures

### 2. Payload Validation
- Checks required fields presence
- Validates event type
- Parses JSON safely

### 3. Duplicate Prevention
- Checks if transaction already processed using `externalReference`
- Returns success for duplicates (idempotent)
- Prevents double-crediting

### 4. Transaction Recording
```
Input: Wiaxy webhook payment notification
  ↓
Find User: by merchant_reference (user ID)
  ↓
Create Transaction:
  - userId: found user ID
  - type: "DEPOSIT"
  - method: "WIAXY"
  - amount: from webhook
  - status: "COMPLETED"
  - externalReference: wiaxy_ref (for duplicate detection)
  ↓
Update User Balance: increment by amount
  ↓
Store Metadata: account details, payer info, bank name
  ↓
Return: Success response with new balance
```

## Database Updates

### VirtualAccount Table
```sql
-- Existing table, now populated with real Wiaxy accounts
CREATE TABLE "VirtualAccount" (
  "id" Text PRIMARY KEY,
  "userId" Text NOT NULL,
  "accountNumber" Text NOT NULL,
  "bankName" Text,
  "flwRef" Text,  -- Now stores Wiaxy reference
  "orderRef" Text,
  "createdAt" DateTime DEFAULT now(),
  "updatedAt" DateTime,
  UNIQUE("accountNumber")
);
```

### Transaction Table
```sql
-- Receives webhook payment data
CREATE TABLE "Transaction" (
  "id" Text PRIMARY KEY,
  "userId" Text NOT NULL,
  "type" Enum,  -- DEPOSIT, PAYMENT, etc.
  "method" Text,  -- "WIAXY" for Wiaxy payments
  "amount" Int NOT NULL,
  "status" Enum,  -- COMPLETED for successful payments
  "externalReference" Text,  -- Wiaxy reference, used for dedup
  "reference" Text,
  "metadata" Json,  -- Stores wiaxy_ref, account details, payer info
  "createdAt" DateTime DEFAULT now()
);
```

## Error Handling

### Virtual Account Creation Errors

| Error | Cause | Recovery |
|-------|-------|----------|
| Network timeout | Wiaxy API unreachable | Fallback to placeholder account |
| Invalid credentials | Wrong API key | Check `WIAXY_SECRET_KEY` environment variable |
| Rate limit exceeded | Too many requests | Retry with exponential backoff |
| Invalid bank code | Unsupported bank | Verify `WIAXY_BANK` is in: 9PSB, SAFEHAVEN, PROVIDUS, BANKLY, PALMPAY |

**Fallback Behavior:**
If Wiaxy account creation fails, a placeholder account is created:
- Account number: `DBDA-{userId.slice(0,8)}`
- Bank: `DANBAIWA WALLET`
- Users can still receive payments once real account is created later

### Webhook Processing Errors

| Error | Response | Action |
|-------|----------|--------|
| Invalid signature | 401 Unauthorized | Request rejected, security threat logged |
| Missing payload fields | 400 Bad Request | Request rejected, malformed data logged |
| User not found | 404 Not Found | Request rejected, investigation needed |
| Database error | 500 Internal Error | Request rejected, error logged, may be retried |
| Duplicate transaction | 200 OK | Request succeeds (idempotent), not processed again |

## Testing Webhook Locally

### Using ngrok for Local Development

```bash
# Start ngrok tunnel (exposes localhost to internet)
ngrok http 3000

# Get your public URL (e.g., https://abc123.ngrok.io)

# Set webhook URL in Wiaxy dashboard
https://abc123.ngrok.io/api/wiaxy/webhook

# Test webhook
curl -X POST https://abc123.ngrok.io/api/wiaxy/webhook \
  -H "x-wiaxy-signature: $(echo -n 'WIAXY_SECRET_KEY' | md5sum | cut -d' ' -f1)" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_NOTIFIFICATION",
    "data": {
      "reference": "test-user-123",
      "merchant_reference": "test-user-123",
      "wiaxy_ref": "test-ref-123",
      "amount": "5000",
      "created_at": "2024-01-15T10:35:00Z",
      "account": {
        "account_number": "9700123456",
        "account_name": "TEST USER",
        "bank_name": "Palmpay",
        "created_at": "2024-01-15T10:30:00Z"
      },
      "payer": {
        "account_number": "1234567890",
        "first_name": "Test",
        "last_name": "Payer",
        "createdAt": "2024-01-15T10:35:00Z"
      }
    }
  }'
```

## Production Setup Checklist

- [ ] Obtain `WIAXY_SECRET_KEY` from Wiaxy dashboard
- [ ] Set `WIAXY_BASE_URL` to production endpoint
- [ ] Configure `WIAXY_BANK` (recommend PALMPAY for reliability)
- [ ] Set `WIAXY_WEBHOOK_URL` in Wiaxy dashboard to production endpoint
- [ ] Add all environment variables to production `.env.local` or CI/CD secrets
- [ ] Test account creation in staging environment
- [ ] Test webhook receipt with Wiaxy test events
- [ ] Verify signature verification with production key
- [ ] Enable database transaction logging
- [ ] Set up monitoring/alerting for webhook failures
- [ ] Document rollback procedure if issues arise
- [ ] Schedule Wiaxy support contact info for emergency issues

## Monitoring & Logging

### Logs to Watch

**Successful Account Creation:**
```
[WIAXY] Creating virtual account {reference, email, phone, bank}
[WIAXY] Account created successfully {reference, account_number, bank_name}
```

**Account Creation Failure:**
```
[WIAXY] Account creation error {message, response.status}
```

**Successful Webhook:**
```
[WIAXY WEBHOOK] Valid payload received {reference, merchant_reference, amount}
[API] Processing Wiaxy payment {reference, merchantReference, amount}
[API] Transaction created {transactionId, userId, amount}
[API] User balance updated {userId, newBalance, amount}
```

**Webhook Failures:**
```
[WIAXY WEBHOOK] Invalid signature {status}
[WIAXY WEBHOOK] Missing required fields {fields}
[API] User not found for merchant reference {merchantReference}
[API] Transaction already processed {reference, transactionId}
```

## Rollback Procedure

If Wiaxy integration has issues:

1. Set `WIAXY_SECRET_KEY=""` to disable real account creation
2. Existing users continue with their virtual accounts
3. New users get placeholder accounts
4. Revert to previous deployment if critical issues arise
5. Contact Wiaxy support for investigation
6. Test in staging before re-enabling

## Future Enhancements

1. **Multiple Bank Support** - Admin can configure different banks per region
2. **Account Reconciliation** - Automated daily reconciliation against Wiaxy
3. **Webhook Retry Logic** - Automatic retry on temporary failures
4. **Payment Splitting** - Support for multi-recipient payments
5. **Real-time Balance Sync** - Periodic balance verification from Wiaxy
6. **Advanced Reporting** - Transaction reports, settlement tracking
7. **Account Lockdown** - Automatic account freeze on suspicious activity

## Support & Troubleshooting

### Common Issues

**Q: Virtual account creation returns 401**
A: Check that `WIAXY_SECRET_KEY` is correct and not expired

**Q: Webhook signature verification fails**
A: Ensure `WIAXY_SECRET_KEY` in webhook verification matches your actual key

**Q: Payments received but balance not updated**
A: Check webhook logs for "Transaction already processed" or database errors

**Q: Users created with placeholder accounts instead of real accounts**
A: Wiaxy API call failed - check network connectivity, API key, and Wiaxy status page

### Wiaxy Support
- Dashboard: https://dashboard.billstack.co
- Documentation: https://developers.billstack.co
- API Status: https://status.billstack.co
- Email: support@billstack.co

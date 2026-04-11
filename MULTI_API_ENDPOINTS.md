# Multi-API Feature - API Endpoints Reference

## 📡 API Endpoints

### Admin Plans Management

#### GET /api/admin/plans
Get all plans

```bash
curl -X GET https://your-app.com/api/admin/plans \
  -H "X-Admin-Password: your-admin-password"
```

**Response:**
```json
[
  {
    "id": "plan_1",
    "name": "MTN 1GB",
    "network": "MTN",
    "sizeLabel": "1GB",
    "validity": "30 days",
    "price": 220,
    "apiSource": "API_A",
    "externalPlanId": 101,
    "externalNetworkId": 2,
    "isActive": true
  },
  {
    "id": "plan_2",
    "name": "MTN 1GB Premium",
    "network": "MTN",
    "sizeLabel": "1GB",
    "validity": "30 days",
    "price": 250,
    "apiSource": "API_B",
    "externalPlanId": 202,
    "externalNetworkId": 4,
    "isActive": true
  }
]
```

#### POST /api/admin/plans
Create new plan

```bash
curl -X POST https://your-app.com/api/admin/plans \
  -H "Content-Type: application/json" \
  -H "X-Admin-Password: your-admin-password" \
  -d '{
    "name": "Airtel 2GB",
    "network": "AIRTEL",
    "sizeLabel": "2GB",
    "validity": "30 days",
    "price": 400,
    "apiSource": "API_B",
    "externalPlanId": 303,
    "externalNetworkId": 3
  }'
```

**Response:**
```json
{
  "id": "plan_3",
  "name": "Airtel 2GB",
  "network": "AIRTEL",
  "sizeLabel": "2GB",
  "validity": "30 days",
  "price": 400,
  "apiSource": "API_B",
  "externalPlanId": 303,
  "externalNetworkId": 3,
  "isActive": true
}
```

#### PATCH /api/admin/plans/[id]
Update plan (including API source)

```bash
curl -X PATCH https://your-app.com/api/admin/plans/plan_1 \
  -H "Content-Type: application/json" \
  -H "X-Admin-Password: your-admin-password" \
  -d '{
    "apiSource": "API_B",
    "price": 230
  }'
```

**Response:**
```json
{
  "id": "plan_1",
  "name": "MTN 1GB",
  "network": "MTN",
  "sizeLabel": "1GB",
  "validity": "30 days",
  "price": 230,
  "apiSource": "API_B",
  "externalPlanId": 101,
  "externalNetworkId": 2,
  "isActive": true
}
```

---

### User Data Purchase

#### GET /api/data/plans
Get all active plans

```bash
curl -X GET "https://your-app.com/api/data/plans?network=MTN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "plan_1",
      "name": "MTN 1GB",
      "network": "MTN",
      "sizeLabel": "1GB",
      "validity": "30 days",
      "price": 220,
      "apiSource": "API_A",
      "externalPlanId": 101,
      "externalNetworkId": 2,
      "isActive": true
    },
    {
      "id": "plan_2",
      "name": "MTN 1GB Premium",
      "network": "MTN",
      "sizeLabel": "1GB",
      "validity": "30 days",
      "price": 250,
      "apiSource": "API_B",
      "externalPlanId": 202,
      "externalNetworkId": 4,
      "isActive": true
    }
  ]
}
```

#### POST /api/data/purchase
Purchase data (authenticated user)

```bash
curl -X POST https://your-app.com/api/data/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "plan_1",
    "buyerPhone": "08012345678",
    "recipientPhone": "08087654321",
    "pin": "000000"
  }'
```

**Success Response (API_A routed):**
```json
{
  "success": true,
  "message": "Data delivered successfully",
  "reference": "DATA-user_123-1681234567890-abc123def",
  "transaction": {
    "id": "tx_123",
    "status": "SUCCESS",
    "amount": 220,
    "provider": "API_A",
    "timestamp": "2026-04-11T10:30:00Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Insufficient balance"
}
```

#### POST /api/data/guest-purchase
Purchase data without login

```bash
curl -X POST https://your-app.com/api/data/guest-purchase \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "plan_2",
    "phone": "08087654321",
    "isGuest": true
  }'
```

**Success Response (API_B routed):**
```json
{
  "success": true,
  "message": "Data delivered successfully",
  "reference": "GUEST-DATA-1681234567890-xyz789abc"
}
```

---

## 🧪 Testing the Feature

### Test Scenario 1: Verify API A and API B Plans Exist

**Step 1: Get plans from admin**
```bash
curl -X GET https://localhost:3000/api/admin/plans \
  -H "X-Admin-Password: YourAdminPassword"
```

**Expected Result:**
- Should show plans with `apiSource: "API_A"` and `apiSource: "API_B"`
- At least one plan with each API source

### Test Scenario 2: Purchase from API A Plan

**Step 1: Get all plans**
```bash
curl -X GET "https://localhost:3000/api/data/plans"
```

**Step 2: Identify an API_A plan**
- Look for `"apiSource": "API_A"`
- Copy the `id`

**Step 3: Make purchase**
```bash
curl -X POST https://localhost:3000/api/data/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "YOUR_API_A_PLAN_ID",
    "buyerPhone": "08000000000",
    "recipientPhone": "08012345678",
    "pin": "000000"
  }'
```

**Expected Result:**
- Transaction succeeds
- Logs show "[SMEPLUG REQUEST]" in console
- Data delivered via SME Plug

### Test Scenario 3: Purchase from API B Plan

**Step 1: Identify an API_B plan**
- Look for `"apiSource": "API_B"`
- Copy the `id`

**Step 2: Make purchase**
```bash
curl -X POST https://localhost:3000/api/data/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "YOUR_API_B_PLAN_ID",
    "buyerPhone": "08000000000",
    "recipientPhone": "08012345678",
    "pin": "000000"
  }'
```

**Expected Result:**
- Transaction succeeds
- Logs show "[SAIFUL REQUEST]" in console
- Data delivered via Saiful

### Test Scenario 4: Admin Changes API Source

**Step 1: Get plan ID of API_A plan**
```bash
curl -X GET https://localhost:3000/api/admin/plans \
  -H "X-Admin-Password: YourAdminPassword" | grep -A10 '"apiSource":"API_A"' | head -1
```

**Step 2: Switch to API_B**
```bash
curl -X PATCH https://localhost:3000/api/admin/plans/PLAN_ID \
  -H "Content-Type: application/json" \
  -H "X-Admin-Password: YourAdminPassword" \
  -d '{
    "apiSource": "API_B"
  }'
```

**Step 3: Verify change in GET response**
```bash
curl -X GET https://localhost:3000/api/admin/plans \
  -H "X-Admin-Password: YourAdminPassword" | grep -A5 '"id":"PLAN_ID"'
```

**Expected Result:**
- API source changes from `API_A` to `API_B`
- Next purchase from this plan uses `API_B`

---

## 🔍 Debugging

### Check Console Logs

When a purchase is made, you should see logs like:

**For API_A (SME Plug) purchases:**
```
[SMEPLUG REQUEST] {
  url: 'https://smeplug.ng/api/v1/data/purchase',
  body: { network_id: 2, plan_id: 101, phone: '08012345678' },
  timestamp: '2026-04-11T10:30:00.000Z',
  reference: 'DATA-user_123-...'
}
[SMEPLUG RESPONSE] {
  status: 200,
  data: { status: true, data: { msg: 'Data purchased successfully', reference: '...' } },
  timestamp: '2026-04-11T10:30:02.000Z',
  reference: 'DATA-user_123-...'
}
[SMEPLUG SUCCESS] {
  success: true,
  message: 'Data purchase successful',
  externalReference: '...'
}
```

**For API_B (Saiful) purchases:**
```
[SAIFUL REQUEST] {
  url: 'https://app.saifulegendconnect.com/api/airtime/request',
  body: { plan: 202, mobileNumber: '08012345678', network: 'MTN', reference: '...' },
  timestamp: '2026-04-11T10:31:00.000Z'
}
[SAIFUL RESPONSE] {
  status: 200,
  data: { status: 'success', message: 'Airtime purchased', reference: '...' },
  timestamp: '2026-04-11T10:31:02.000Z'
}
[SAIFUL SUCCESS] {
  success: true,
  message: 'Airtime purchased',
  externalReference: '...'
}
```

### Check Database

```sql
-- View all plans with their API source
SELECT id, name, network, price, "apiSource" FROM plans;

-- View transactions grouped by provider
SELECT "apiUsed", COUNT(*) as count, SUM(amount) as total
FROM transactions
WHERE status = 'SUCCESS'
GROUP BY "apiUsed";

-- View specific transaction details
SELECT id, reference, "apiUsed", status, amount, description
FROM transactions
WHERE reference = 'DATA-user_123-...'
ORDER BY "createdAt" DESC;
```

---

## ⚙️ Configuration Checklist

- [ ] SME Plug API credentials set (`SMEPLUG_API_KEY`, `SMEPLUG_BASE_URL`)
- [ ] Saiful API credentials set (`SAIFUL_API_KEY`, `SAIFUL_BASE_URL`)
- [ ] At least one plan created with `apiSource: "API_A"`
- [ ] At least one plan created with `apiSource: "API_B"`
- [ ] Admin can create plans via `/api/admin/plans`
- [ ] Admin can edit plan's `apiSource` via `PATCH /api/admin/plans/[id]`
- [ ] User plans endpoint returns `apiSource` field
- [ ] Purchases route to correct API based on `apiSource`
- [ ] Logs show which provider was called
- [ ] Database stores which provider was used

---

## 📊 Performance Notes

- Each plan stores which API to use (no runtime lookup needed)
- API routing happens in real-time (microseconds)
- No performance impact from dual-API support
- Logs track provider usage for analytics

---

**Documentation Version**: 1.0  
**Last Updated**: April 11, 2026  
**Status**: ✅ **PRODUCTION READY**

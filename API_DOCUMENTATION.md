# API Documentation

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Data APIs

### 1. Get Networks

**Endpoint:** `GET /api/data/networks`

**Authentication:** None

**Response:**
```json
{
  "networks": [
    {
      "id": "network_1",
      "name": "MTN",
      "active": true
    },
    {
      "id": "network_2",
      "name": "Airtel",
      "active": true
    }
  ]
}
```

---

### 2. Get Data Plans

**Endpoint:** `GET /api/data/plans/[networkId]`

**Authentication:** None

**Parameters:**
- `networkId` (path, required): Network ID

**Response:**
```json
{
  "plans": [
    {
      "id": "plan_1",
      "networkId": "network_1",
      "volume": "1GB",
      "validity": "30 days",
      "price": 500
    },
    {
      "id": "plan_2",
      "networkId": "network_1",
      "volume": "5GB",
      "validity": "30 days",
      "price": 2000
    }
  ]
}
```

---

### 3. Purchase Data (Authenticated Users)

**Endpoint:** `POST /api/data/purchase`

**Authentication:** Required

**Request Body:**
```json
{
  "planId": "plan_1",
  "phoneNumber": "09012345678"
}
```

**Response (Success):**
```json
{
  "message": "Data purchase initiated",
  "reference": "DTX20240115001234"
}
```

**Error Responses:**
- `400`: Invalid request or insufficient balance
- `401`: Unauthorized
- `404`: Plan not found
- `429`: Too many requests
- `500`: Server error

---

### 4. Purchase Data (Guest Users)

**Endpoint:** `POST /api/data/guest-purchase`

**Authentication:** None

**Request Body:**
```json
{
  "planId": "plan_1",
  "phoneNumber": "09012345678",
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "message": "Guest data purchase initiated",
  "reference": "DTX20240115001235"
}
```

---

## Airtime APIs

### 1. Purchase Airtime

**Endpoint:** `POST /api/airtime/purchase`

**Authentication:** Required

**Request Body:**
```json
{
  "networkId": "network_1",
  "amount": 500,
  "phoneNumber": "09012345678"
}
```

**Constraints:**
- Amount: 50 - 50,000
- Valid Nigerian phone number required
- Network must exist

**Response (Success):**
```json
{
  "message": "Airtime purchase initiated",
  "reference": "ATX20240115001234"
}
```

---

## Transaction APIs

### 1. Get Transactions

**Endpoint:** `GET /api/transactions`

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Filter by type (DATA_PURCHASE, AIRTIME_PURCHASE, etc.)

**Response:**
```json
{
  "transactions": [
    {
      "id": "tx_1",
      "type": "DATA_PURCHASE",
      "amount": 500,
      "status": "COMPLETED",
      "reference": "DTX20240115001234",
      "createdAt": "2024-01-15T10:30:00Z",
      "metadata": {
        "planId": "plan_1",
        "networkName": "MTN",
        "phoneNumber": "09012345678"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "pages": 3
  }
}
```

---

### 2. Get Transaction Status

**Endpoint:** `GET /api/transactions/status`

**Authentication:** Optional

**Query Parameters:**
- `reference` (required): Transaction reference

**Response:**
```json
{
  "transaction": {
    "id": "tx_1",
    "reference": "DTX20240115001234",
    "status": "COMPLETED",
    "amount": 500,
    "type": "DATA_PURCHASE",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 3. Check Single Transaction

**Endpoint:** `GET /api/transactions/[reference]`

**Authentication:** Required

**Parameters:**
- `reference` (path, required): Transaction reference

**Response:** Same as Get Transaction Status

---

### 4. Manual Verification

**Endpoint:** `POST /api/transactions/verify-manual`

**Authentication:** Required

**Request Body:**
```json
{
  "reference": "DTX20240115001234",
  "proofOfPayment": "https://example.com/proof.jpg"
}
```

**Response:**
```json
{
  "message": "Verification request submitted",
  "verificationId": "ver_123"
}
```

---

## Rewards APIs

### 1. Get Rewards

**Endpoint:** `GET /api/rewards`

**Authentication:** Required

**Response:**
```json
{
  "rewards": [
    {
      "id": "reward_1",
      "type": "REFERRAL",
      "amount": 1000,
      "claimed": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "expiresAt": "2024-04-15T10:30:00Z"
    },
    {
      "id": "reward_2",
      "type": "CASHBACK",
      "amount": 500,
      "claimed": true,
      "createdAt": "2024-01-10T08:15:00Z"
    }
  ],
  "total": 1500,
  "unclaimed": 1000
}
```

---

## Error Handling

All endpoints return errors in this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - User cannot access resource |
| 404 | Not Found |
| 429 | Too Many Requests - Rate limited |
| 500 | Server Error |

---

## Rate Limiting

All endpoints are rate-limited to prevent abuse:

- **Default:** 100 requests per hour per IP
- **Authenticated endpoints:** 1000 requests per hour per user

Rate limit status headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705344600
```

When limit exceeded: `429 Too Many Requests`

---

## Webhook Events

(To be implemented)

Events will be sent to configured webhook URL for:
- `transaction.completed`
- `transaction.failed`
- `reward.earned`
- `account.funded`

---

## Testing the APIs

### Using cURL

```bash
# Get networks
curl https://api.example.com/api/data/networks

# Buy data (requires authentication)
curl -X POST https://api.example.com/api/data/purchase \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "plan_1",
    "phoneNumber": "09012345678"
  }'
```

### Using Fetch (JavaScript)

```javascript
// Get networks
const response = await fetch('/api/data/networks');
const data = await response.json();

// Buy data
const response = await fetch('/api/data/purchase', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    planId: 'plan_1',
    phoneNumber: '09012345678'
  })
});
```

---

## API Versioning

Current API version: **v1**

Future versions will be accessible at `/api/v2/`, etc. Current version will remain supported for at least 12 months after a new version is released.

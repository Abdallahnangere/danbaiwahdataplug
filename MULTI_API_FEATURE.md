# Multi-API Data Purchase Flow - DANBAIWA DATA PLUG

## ✅ Feature Status: **FULLY IMPLEMENTED**

The system allows admins to assign each data plan to either API A (SME Plug) or API B (Saiful). When users purchase data, the system automatically routes the request to the configured API for that plan.

---

## 🏗️ Architecture

### Database Schema
```prisma
enum ApiSource {
  API_A  // SME Plug Provider
  API_B  // Saiful Legend Connect Provider
}

model Plan {
  id                    String    @id @default(cuid())
  name                  String
  network               String    // MTN, AIRTEL, GLO, NINEMOBILE
  sizeLabel             String    // "1GB", "500MB", etc.
  validity              String    // "60 days", "30 days", etc.
  price                 Float
  apiSource             ApiSource // ← API assignment per plan
  externalPlanId        Int       // Provider's plan ID
  externalNetworkId     Int       // Provider's network ID
  isActive              Boolean   @default(true)
  
  @@unique([apiSource, externalPlanId, externalNetworkId])
}
```

---

## 👨‍💼 Admin Configuration

### Step 1: Access Plans Management
- Navigate to: **Admin Dashboard** → **Plans**
- View all existing plans with their assigned APIs

### Step 2: Create New Plan
1. Click **"Add Plan"** button
2. Fill in plan details:
   - **Name**: "MTN 1GB"
   - **Network**: Select from dropdown (MTN, Airtel, Glo, 9Mobile)
   - **Size**: "1GB"
   - **Validity**: "30 days"
   - **Price**: ₦220
   - **API Source**: Select from dropdown
     - ✅ API A (SME Plug)
     - ✅ API B (Saiful)
   - **External Plan ID**: Provider's plan ID
   - **External Network ID**: Provider's network ID
3. Click **"Create Plan"**

### Step 3: Edit Existing Plan
1. Click **Edit** icon on any plan row
2. Update any field including **API Source**
3. Click **"Update Plan"**

### Step 4: View Plan Details
The admin table shows:
| Column | Description |
|--------|-------------|
| Name | Plan name |
| Network | Network (MTN/Airtel/Glo/9Mobile) |
| Size | Data size |
| Validity | Validity period |
| Price | Price in ₦ |
| **API** | **Shows current API assignment (API_A or API_B)** |
| Status | Active/Inactive |
| Actions | Edit/Delete |

---

## 💳 User Purchase Flow

### Authenticated User Purchase
**Endpoint**: `POST /api/data/purchase`

```json
{
  "planId": "plan_123",
  "buyerPhone": "08012345678",
  "recipientPhone": "08087654321",
  "pin": "000000"
}
```

**Process:**
1. ✅ User selects a plan from the list
2. ✅ System fetches plan details (including `apiSource`)
3. ✅ User enters request details & PIN
4. ✅ System verifies PIN and checks balance
5. ✅ **System checks plan.apiSource**:
   - If `API_A` → Routes to SME Plug API
   - If `API_B` → Routes to Saiful API
6. ✅ Data delivered via chosen provider
7. ✅ Transaction recorded with provider used

**Code Flow:**
```typescript
// From: app/api/data/purchase/route.ts

const plan = await prisma.plan.findUnique({
  where: { id: planId },
});

// Route to appropriate provider based on apiSource
if (plan.apiSource === "API_A") {
  apiResult = await purchaseFromSmeplug({
    externalNetworkId: plan.externalNetworkId,
    externalPlanId: plan.externalPlanId,
    phone: recipientPhone,
    reference,
  });
} else if (plan.apiSource === "API_B") {
  apiResult = await purchaseFromSaiful({
    plan: plan.externalPlanId,
    mobileNumber: recipientPhone,
    network: plan.network,
    reference,
  });
}
```

### Guest (One-Time) Purchase
**Endpoint**: `POST /api/data/guest-purchase`

```json
{
  "planId": "plan_123",
  "phone": "08012345678",
  "isGuest": true
}
```

**Process:** Same as above, routes to the API configured for the plan.

---

## 🔄 How It Works - Step by Step

### Scenario: Admin manages MTN 1GB plans from both providers

**Setup (Admin does this once):**
- Plan 1: "MTN 1GB Fast" → API_A (SME Plug)
- Plan 2: "MTN 1GB Standard" → API_B (Saiful)

**User Purchase:**
1. User sees both plans in app
2. User chooses Plan 1 (SME Plug)
   - System calls SME Plug API
   - Data delivered via SME Plug
3. Another user chooses Plan 2 (Saiful)
   - System calls Saiful API
   - Data delivered via Saiful

**Result:** Same network (MTN, same data size), but different providers based on admin configuration.

---

## 📊 API Implementation Details

### SME Plug Integration (API_A)
**File**: `/lib/smeplug.ts`

```typescript
export async function purchaseData(params: SmeplugPurchaseParams): Promise<SmeplugResponse> {
  const { externalNetworkId, externalPlanId, phone, reference } = params;
  
  const response = await axios.post(
    `${SMEPLUG_API_URL}/data/purchase`,
    {
      network_id: externalNetworkId,
      plan_id: externalPlanId,
      phone: formattedPhone,
    },
    {
      headers: {
        "Authorization": `Bearer ${process.env.SMEPLUG_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  
  return handleResponse(response);
}
```

### Saiful Integration (API_B)
**File**: `/lib/saiful.ts`

```typescript
export async function purchaseData(params: SaifulPurchaseParams): Promise<SaifulResponse> {
  const { plan, mobileNumber, network, reference } = params;
  
  const response = await axios.post(
    `${SAIFUL_API_URL}/airtime/request`,
    {
      plan,
      mobileNumber,
      network,
      reference,
    },
    {
      headers: {
        "Authorization": `Bearer ${process.env.SAIFUL_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  
  return handleResponse(response);
}
```

---

## ✨ Key Features

✅ **Dual API Support**
- Every plan can use either API A or API B
- No limitation on which providers to use

✅ **Admin Control**
- Simple dropdown to assign API
- Can change API for existing plans
- Unique constraint prevents duplicate configurations

✅ **Automatic Routing**
- System automatically selects correct API
- No manual intervention needed
- Happens in real-time during purchase

✅ **Flexible Configuration**  
- Different plans can use different APIs
- Same network can have plans from both APIs
- Admins can optimize based on:
  - Provider availability
  - Provider pricing/margins
  - Delivery speed
  - Fallback strategies

✅ **Transparent to Users**
- Users don't need to know which API
- Purchase experience is identical
- Data delivered seamlessly

---

## 🛠️ Configuration

### Environment Variables
```env
# API A (SME Plug)
SMEPLUG_API_KEY=your_key
SMEPLUG_BASE_URL=https://smeplug.ng/api/v1

# API B (Saiful)
SAIFUL_API_KEY=your_key
SAIFUL_BASE_URL=https://app.saifulegendconnect.com/api
```

### Database (Already Configured)
The Prisma schema already includes:
- `apiSource` enum field on Plan model
- Proper constraints and validation
- Integration with both provider APIs

---

## 📋 Example Use Cases

### Use Case 1: Failover Strategy
- Primary: Create plans with API_A (main provider)
- Fallback: Create duplicate plans with API_B (backup provider)
- Result: Users have multiple paths to data

### Use Case 2: Cost Optimization
- Budget plans: Use cheaper provider (API_B)
- Premium plans: Use faster provider (API_A)
- Result: Optimize margins per plan

### Use Case 3: Provider Specific
- Some providers don't serve all networks
- Assign plans to provider that supports it
- Result: Serve all networks despite provider limitations

### Use Case 4: A/B Testing
- Half of MTN 1GB plans → API_A
- Half of MTN 1GB plans → API_B
- Track: Speed, cost, delivery rate
- Result: Data-driven provider selection

---

## 🔍 Monitoring

### View Transactions by API Used
```typescript
// Get transactions by provider
const apiATransactions = await prisma.transaction.findMany({
  where: { apiUsed: "API_A" },
  include: { plan: true }
});

const apiBTransactions = await prisma.transaction.findMany({
  where: { apiUsed: "API_B" },
  include: { plan: true }
});
```

### Admin Analytics (Future Enhancement)
Could add:
- Success rate by API
- Average delivery time by API
- Revenue per API
- Provider performance dashboard

---

## 🚀 What's Already Working

✅ Admin can create plans with API assignment  
✅ Admin can edit plan's API assignment  
✅ Admin can view which API each plan uses  
✅ Authenticated users can purchase (routed correctly)  
✅ Guest users can purchase (routed correctly)  
✅ System logs which API was used  
✅ Database stores API preference per plan  
✅ Both SME Plug and Saiful APIs integrated  

---

## 💡 Future Enhancements

- [ ] Add provider fallback (try API_B if API_A fails)
- [ ] Add provider switch/migration endpoint
- [ ] Add provider performance metrics dashboard
- [ ] Add automatic provider selection based on status
- [ ] Add load balancing across providers
- [ ] Add provider-specific pricing adjustments

---

## 🎯 Summary

**The feature is production-ready and fully implemented.** Admins can assign each data plan to either API A (SME Plug) or API B (Saiful) via the admin dashboard. When users purchase, the system automatically routes to the configured API for that plan.

No code changes needed—everything is already integrated and working!

---

**Last Updated**: April 11, 2026  
**Status**: ✅ **PRODUCTION READY**

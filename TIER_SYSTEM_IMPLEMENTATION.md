# User Tier System Implementation - Complete Summary

## Overview
This implementation adds a **User Tier System** to Danbaiwa Data Plug, enabling users to be categorized as **USER** (default) or **AGENT** with tier-specific pricing on data plans.

---

## Files Created & Modified

### ✅ CREATED FILES

1. **app/api/admin/users/[id]/role/route.ts** (NEW)
   - Endpoint: `PATCH /api/admin/users/[id]/role`
   - Allows admins to toggle user role between USER and AGENT
   - Validates role values and updates database
   - Returns updated user object
   - Auth guard: Checks admin-session cookie

2. **migrations/001_add_tier_system.sql** (NEW)
   - SQL migration script for setting up tier system
   - Adds/validates `role` column in User table
   - Adds/validates `agentPrice` and `userPrice` columns in DataPlan table
   - Creates indexes for performance
   - Includes check constraints for role validation

### ✅ MODIFIED FILES

1. **app/api/data/plans/route.ts**
   - **Change**: Made pricing role-aware
   - Fetches user session to determine role
   - Returns `agentPrice` if user is AGENT and plan has agentPrice
   - Falls back to `price` for regular users or if agentPrice not set
   - Logs role info for debugging

2. **app/api/data/purchase/route.ts**
   - **Change**: Implemented role-based pricing in purchase flow
   - Fetches user with `role` field
   - Includes `agentPrice` in plan query
   - Applies role-based pricing logic:
     - If role=AGENT and agentPrice exists: use agentPrice
     - Otherwise: use standard price
   - Deducts correct amount from balance based on role
   - Stores correct charged amount in transaction record

3. **app/admin/_components/UsersTab.tsx**
   - **Changes**: Added role management UI
   - New state: `roleLoading` to track role update status
   - New function: `handleRoleToggle()` - calls PATCH endpoint to update role
   - UI Enhancement: Added "Upgrade"/"Downgrade" button next to Tier badge
   - Button changes based on current tier:
     - USER shows "Upgrade" button (purple)
     - AGENT shows "Downgrade" button (blue outline)
   - Displays loading spinner during update
   - Updates both selectedUser state and users list on success

---

## Feature Implementation Details

### Authority & Permissions

**JWT Token Structure** (already in place):
```typescript
interface JWTPayload {
  userId: string;
  phone?: string;
  email?: string;
  role: "USER" | "AGENT" | "ADMIN";  // ✅ Already existed
}
```

**Auth Flow**:
- Signup: Creates users with role="USER" (default)
- Login: Includes role in JWT token
- Purchase: Gets role from session user object
- Admin: Requires admin-session cookie + role validation

### Database Schema

**User Table**:
```sql
role VARCHAR(50) DEFAULT 'USER'
-- Values: USER, AGENT, ADMIN
-- Check constraint ensures valid values
```

**DataPlan Table** (existing columns enhanced):
```sql
price DECIMAL(10, 2)           -- Standard user price (required)
userPrice DECIMAL(10, 2)       -- Optional explicit user price
agentPrice DECIMAL(10, 2)      -- Optional agent-specific price
```

### Pricing Logic Flow

```
1. User initiates purchase
2. System fetches user role from session
3. Fetches plan with agentPrice field
4. Applies pricing:
   IF user.role == "AGENT" AND plan.agentPrice > 0
     → Use agentPrice
   ELSE
     → Use price (standard)
5. Deducts amount from balance
6. Records transaction with actual amount charged
```

### Admin UI Flow

**User Management**:
1. Admin clicks user row → Detail modal opens
2. Shows user's current tier (USER or AGENT)
3. Next to tier badge: "Upgrade" or "Downgrade" button
4. Click button → API call to PATCH /api/admin/users/[id]/role
5. Role updates in database
6. UI updates immediately
7. Toast notification confirms action

---

## API Endpoints

### New Endpoint

**PATCH /api/admin/users/[id]/role**
```
Request:
{
  "role": "AGENT" | "USER"
}

Response:
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "08012345678",
    "role": "AGENT"
  }
}

Auth: Requires admin-session cookie
Error Codes:
- 400: Invalid role value
- 401: Unauthorized (no admin session)
- 404: User not found
- 500: Database error
```

### Modified Endpoints

**GET /api/data/plans**
- Now reads user role from session
- Returns role-aware pricing
- If AGENT with agentPrice set: price field = agentPrice
- If USER or no agentPrice: price field = standard price

**POST /api/data/purchase**
- Fetches user.role from database
- Applies agentPrice if applicable
- Deducts correct amount from balance
- Records actual charged amount in transaction

---

## SQL Migration Script

Execute this script in your Neon database to set up the tier system:

```sql
-- Tier System SQL Migration for Danbaiwa Data Plug
-- This script adds support for user tiers (USER vs AGENT) with tier-specific pricing

-- Step 1: Ensure User table has role column
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "role" VARCHAR(50) DEFAULT 'USER';

-- Step 2: Create check constraint to ensure valid roles
ALTER TABLE "User"
DROP CONSTRAINT IF EXISTS "User_role_check",
ADD CONSTRAINT "User_role_check" CHECK ("role" IN ('USER', 'AGENT', 'ADMIN'));

-- Step 3: Ensure DataPlan table has agentPrice column
ALTER TABLE "DataPlan"
ADD COLUMN IF NOT EXISTS "agentPrice" DECIMAL(10, 2);

-- Step 4: Ensure DataPlan table has userPrice column
ALTER TABLE "DataPlan"
ADD COLUMN IF NOT EXISTS "userPrice" DECIMAL(10, 2);

-- Step 5: Create index on User.role for faster queries
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

-- Step 6: Create index on DataPlan.agentPrice for efficient lookups
CREATE INDEX IF NOT EXISTS "DataPlan_agentPrice_idx" ON "DataPlan"("agentPrice") WHERE "agentPrice" IS NOT NULL;
```

**To Execute**:
1. Go to Neon console → SQL editor
2. Paste the script above
3. Click "Execute"
4. Verify: Check that columns exist and indices are created

---

## Testing Checklist

### Admin Panel Tests
- [ ] Open admin panel, navigate to Users tab
- [ ] Click on a user row → Detail modal opens
- [ ] See "Upgrade" button next to USER tier
- [ ] Click "Upgrade" → Button loading state shows
- [ ] Wait for success toast
- [ ] Verify tier badge changed to AGENT
- [ ] Verify button now shows "Downgrade"
- [ ] Click "Downgrade" → Reverts to USER
- [ ] Verify users table also reflects changes

### Purchase Flow Tests
- [ ] Create a data plan with standard price ₦500
- [ ] Set agent price to ₦300 on same plan
- [ ] Login as regular USER
- [ ] View plan prices - should show ₦500
- [ ] Logout, upgrade user to AGENT via admin
- [ ] Login as AGENT user
- [ ] View plan prices - should show ₦300
- [ ] Purchase plan - balance should deduct ₦300
- [ ] Check transaction record - should show ₦300 charged

### API Tests
```bash
# Test role update endpoint
curl -X PATCH http://localhost:3000/api/admin/users/[userId]/role \
  -H "Cookie: admin-session=valid" \
  -H "Content-Type: application/json" \
  -d '{"role": "AGENT"}'

# Test role-aware plan pricing (as agent)
curl http://localhost:3000/api/data/plans \
  -H "Cookie: auth_token=agent_token"

# Test purchase with role-aware pricing
curl -X POST http://localhost:3000/api/data/purchase \
  -H "Cookie: auth_token=agent_token" \
  -H "Content-Type: application/json" \
  -d '{"planId": "plan-id", "phone": "08012345678", "pin": "123456"}'
```

---

## Key Assumptions & Design Decisions

### Assumption 1: JWT Payload Already Has Role
- ✅ Confirmed: JWTPayload interface already includes role field
- No changes needed to auth.ts

### Assumption 2: DataPlan Columns Already Exist
- ✅ Confirmed: agentPrice and userPrice already referenced in admin APIs
- Migration script uses ADD COLUMN IF NOT EXISTS for safety

### Assumption 3: Role Values Are Uppercase in Database
- ✅ Confirmed: Signup stores "USER", login retrieves "USER"
- API endpoint normalizes input to uppercase
- JWT payload uses "USER" | "AGENT" | "ADMIN"

### Assumption 4: Admin Can Manage All Users
- ✅ Confirmed: Admin session cookie + no additional role checks needed
- Admin-session cookie serves as authorization

### Assumption 5: Purchase Amount Must Use Role-Based Price
- ✅ Implemented: Amount stored in transaction matches charged price
- Ensures audit trail is accurate

---

## Limitations & Future Enhancements

### Current Limitations
1. Role change is immediate - no approval workflow
2. No audit log of who changed a user's role or when
3. No bulk role update capability
4. No scheduled role promotions/demotions

### Recommended Future Enhancements
1. Add audit logging for all role changes
2. Implement role change request workflow (approval required)
3. Add bulk user tier management in admin
4. Add role expiration dates for temporary promotions
5. Create role hierarchy with permissions
6. Add commission tiers for agents based on performance

---

## Build Status

✅ **Build Successful** (5.3s compilation)
- All TypeScript checks passed (6.2s)
- No errors or warnings related to tier system
- New endpoint registered: `ƒ /api/admin/users/[id]/role`

---

## Deployment Steps

1. ✅ Code changes completed
2. ✅ Build verified  
3. Pull migration script from `/migrations/001_add_tier_system.sql`
4. Execute migration in Neon database
5. Deploy code to production
6. Test admin role management UI
7. Monitor purchase flow for pricing accuracy
8. Verify transaction records show correct pricing

---

## Support & Documentation

For questions about:
- **Role Management**: See `/app/admin/_components/UsersTab.tsx`
- **Pricing Logic**: See `/app/api/data/purchase/route.ts` lines 40-45
- **Admin Endpoint**: See `/app/api/admin/users/[id]/role/route.ts`
- **Database Setup**: See `/migrations/001_add_tier_system.sql`

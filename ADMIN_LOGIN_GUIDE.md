# ADMIN LOGIN & DASHBOARD GUIDE — Complete A to Z

## 📋 Overview

The admin dashboard is now secured with **JWT role-based authentication**. Any user with `role="ADMIN"` can access admin endpoints. This guide walks you through the complete process.

---

## 🚀 STEP-BY-STEP: How to Create & Login as Admin

### **STEP 1: Create an Admin User in Database**

You need direct database access to create an admin account. Use Neon Console:

1. **Go to Neon Console**: https://console.neon.tech
2. **Select Your Project**: `sydatasub` (or your project name)
3. **Click "SQL Editor"**
4. **Run this SQL to create admin user**:

```sql
-- Create admin user
INSERT INTO "User" (
  id, 
  name, 
  phone, 
  "pin", 
  balance, 
  role, 
  "isActive", 
  "createdAt", 
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Admin User',
  '08000000000',           -- 11 digits starting with 0
  -- Hash of PIN "123456" with bcryptjs (salt:10)
  '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  0,
  'ADMIN',                 -- CRITICAL: Must be uppercase "ADMIN"
  true,
  NOW(),
  NOW()
);
```

**⚠️ IMPORTANT: You need the bcrypt hash of your PIN!**

### How to Hash a PIN

**Option A: Using Node.js (Recommended)**

In your project directory:

```bash
node -e "
const bcrypt = require('bcryptjs');
const pin = '123456';
bcrypt.hash(pin, 10).then(hash => console.log(hash));
"
```

Output: `$2a$10$...` (copy this entire string)

**Option B: Use Online Bcrypt Generator** (NOT for production!)
https://bcrypt-generator.com/
- Enter PIN: `123456`
- Salt Rounds: `10`
- Click "Hash"
- Copy the hash

**Option C: Use your App's Signup to Create Test Admin**

1. Sign up as a regular user with phone `08000000000`
2. Run SQL to update role:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE phone = '08000000000';
```

---

### **STEP 2: Verify Admin User Created**

Run this in Neon SQL Editor to confirm:

```sql
SELECT id, name, phone, role, "isActive" FROM "User" WHERE role = 'ADMIN';
```

✅ You should see your admin user listed with `role = ADMIN`

---

### **STEP 3: Login with Admin Account**

#### **Via Web App (Frontend)**

1. Go to: https://sydatasub.vercel.app/app/auth (or your deployment URL)
2. Click **"Sign In"** (or go to login screen)
3. Enter:
   - **Phone:** `08000000000` (or your admin phone)
   - **PIN:** `123456` (or your admin PIN)
4. Click **"Login"**
5. Wait for redirect to dashboard

✅ You're now logged in as a user (JWT token created with `role: "ADMIN"`)

---

### **STEP 4: Access Admin Dashboard**

#### **Via Web App (Frontend Portal)**

1. After login, you should see the app dashboard
2. Look for **"Admin"** link or button (usually in settings or bottom menu)
3. Click to access: `/admin` dashboard

✅ You should see admin interface (users, analytics, transactions, plans)

---

## 🔐 Under the Hood: How Admin Auth Works

### JWT Token Structure

When you login as admin, your JWT contains:

```typescript
{
  userId: "uuid-of-admin-user",
  phone: "08000000000",
  role: "ADMIN",           // ← This is the key!
  exp: 1713110400          // Expires in 7 days
}
```

### Every Admin API Route Verification

All admin endpoints check:

```typescript
const sessionUser = await getSessionUser(request);
if (!sessionUser || sessionUser.role !== "ADMIN") {
  return { error: "Unauthorized - Admin access required", status: 403 };
}
```

**Only users with `role === "ADMIN"` can access admin APIs**

---

## 📊 Admin Dashboard Features

### Available Admin Endpoints

**All endpoints require JWT with `role: "ADMIN"`**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/users` | GET | List all users |
| `/api/admin/users/[id]` | PATCH | Update user (adjust balance, change tier) |
| `/api/admin/users/[id]` | DELETE | Delete user |
| `/api/admin/analytics` | GET | Dashboard metrics (revenue, users, transactions) |
| `/api/admin/plans` | GET | List all data plans |
| `/api/admin/plans` | POST | Create new data plan |
| `/api/admin/plans/[id]` | PATCH | Update plan |
| `/api/admin/plans/[id]` | DELETE | Delete plan |
| `/api/admin/transactions/airtime` | GET | View airtime transactions |

---

## 🛠️ Advanced: Direct API Testing

### Test Admin Auth via cURL

```bash
# 1. Login (get JWT)
curl -X POST https://sydatasub.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "08000000000",
    "pin": "123456"
  }' \
  --cookie-jar cookies.txt

# 2. Call admin endpoint with JWT from cookie
curl https://sydatasub.vercel.app/api/admin/users \
  --cookie cookies.txt
```

### Test Admin Auth via Postman

1. **Request 1: Login**
   - Method: `POST`
   - URL: `https://sydatasub.vercel.app/api/auth/login`
   - Body (JSON):
   ```json
   {
     "phone": "08000000000",
     "pin": "123456"
   }
   ```
   - Click **Send**
   - ✅ Response: `{ message: "Login successful", user: {...} }`

2. **Request 2: Access Admin Endpoint**
   - Method: `GET`
   - URL: `https://sydatasub.vercel.app/api/admin/users`
   - Headers:
     - Cookies: (Automatically from previous request in Postman)
   - Click **Send**
   - ✅ Response: `[ { id: "...", name: "...", phone: "...", ... } ]`

---

## 🔒 Security: Admin Access Control

### What Changed

**Old (Insecure ❌):**
```typescript
// Just checked for cookie presence - could be forged
const adminSession = request.cookies.get("admin-session");
if (!adminSession) return { error: "Unauthorized" };
```

**New (Secure ✅):**
```typescript
// Verify JWT signature and role
const sessionUser = await getSessionUser(request);
if (!sessionUser || sessionUser.role !== "ADMIN") {
  return { error: "Unauthorized - Admin access required", status: 403 };
}
```

### Protections

✅ **Cannot impersonate admin** — JWT signed with secret key only server knows  
✅ **Cannot forge JWT** — Signatures verified with `jwtVerify()`  
✅ **Cannot escalate privileges** — Role checked on every endpoint  
✅ **Token expires** — Forced re-login after 7 days  
✅ **Secure cookies** — httpOnly, secure (https), sameSite  

---

## 🐛 Troubleshooting

### Problem: Login works but admin dashboard shows "Unauthorized"

**Cause**: User role is not "ADMIN"

**Fix**: Update in SQL:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE phone = '08000000000';
```

Verify:
```sql
SELECT phone, role FROM "User" WHERE phone = '08000000000';
```

Should show: `phone = '08000000000', role = 'ADMIN'`

---

### Problem: Admin API returns 403 Unauthorized

**Cause**: JWT role is not "ADMIN" or JWT expired

**Fix**:
1. Logout and login again
2. Check browser cookies: look for `auth_token`
3. If cookie missing: refresh page and re-login

---

### Problem: "Invalid phone or PIN" when logging in

**Cause**: Wrong credentials or user doesn't exist

**Fix**:
1. Verify phone number format: must be 11 digits starting with 0
2. Verify PIN is correct: `123456` (or whatever you set)
3. Verify user exists:
```sql
SELECT id, phone, role FROM "User" WHERE phone = '08000000000';
```

If user doesn't exist, create one (see STEP 1)

---

### Problem: Rate limiting blocks login attempts

**Cause**: Too many failed login attempts (5+ in 15 minutes)

**Fix**: Wait 15 minutes or restart server to clear rate limit

Note: Rate limit is in-memory, so it resets on server restart

---

## 📝 Checklists

### First-Time Admin Setup

- [ ] Create admin user in database (STEP 1)
- [ ] Verify admin user exists (STEP 2)
- [ ] Login with admin credentials (STEP 3)
- [ ] Access admin dashboard (STEP 4)
- [ ] Test each admin feature:
  - [ ] View users
  - [ ] Adjust user balance
  - [ ] View analytics
  - [ ] View data plans
  - [ ] View airtime transactions

### Daily Admin Tasks

- [ ] Check dashboard analytics
- [ ] Monitor transaction status
- [ ] Review user activity
- [ ] Adjust plans if needed
- [ ] Manage user tiers (user ↔ agent)

---

## 🚀 Production Deployment

### Before Going Live

1. **Create production admin account** in Neon production database
2. **Use strong PIN** — not `123456`!
3. **Share credentials securely** — never in Slack/email
4. **Test admin dashboard** in production environment
5. **Verify rate limiting** works as expected

### Production Admin Access

- Admin portal: `https://sydatasub.vercel.app/admin`
- Only accessible after JWT login with `role: "ADMIN"`
- Read: Users, Analytics, Plans, Transactions
- Write: Create/Update/Delete Plans, Adjust User Balances

---

## 🔄 Rate Limiting for Auth

### Login Rate Limit
- **Max Attempts**: 5
- **Time Window**: 15 minutes
- **Error**: 429 "Too many login attempts. Please try again later."

### Signup Rate Limit
- **Max Attempts**: 3
- **Time Window**: 1 hour
- **Error**: 429 "Too many signup attempts. Please try again later."

After successful login/signup, rate limit is reset (you get a fresh 5/3 attempts)

---

## 💡 Tips & Best Practices

1. **Keep admin PIN secure** — Don't share via insecure channels
2. **Use unique admin phone** — Different from regular users
3. **Monitor failed login attempts** — Sign of potential attacks
4. **Logout when done** — Especially on shared computers
5. **Don't hardcode admin credentials** — Always use database
6. **Rotate credentials** — Change admin PIN monthly
7. **Use strong PINs** — Avoid sequential (123456) or repeated (111111)

---

## 📞 Support

If you encounter issues:

1. Check this guide's **Troubleshooting** section
2. Verify user exists in database
3. Confirm `role = 'ADMIN'` in database
4. Check browser cookies for `auth_token`
5. Look at server logs for detailed errors
6. Try in incognito/private mode to clear any cached auth

---

**End of Admin Login Guide**

---

## 🎯 Quick Copy-Paste Commands

### Create admin user (bcrypt PIN hash for "123456")
```sql
INSERT INTO "User" (id, name, phone, "pin", balance, role, "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Admin User', '08000000000', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 0, 'ADMIN', true, NOW(), NOW());
```

### Convert regular user to admin
```sql
UPDATE "User" SET role = 'ADMIN' WHERE phone = '08000000000';
```

### Verify admin exists
```sql
SELECT id, phone, role FROM "User" WHERE role = 'ADMIN';
```

### Revert admin to regular user
```sql
UPDATE "User" SET role = 'USER' WHERE phone = '08000000000';
```

---

**Created**: April 14, 2026  
**Last Updated**: April 14, 2026

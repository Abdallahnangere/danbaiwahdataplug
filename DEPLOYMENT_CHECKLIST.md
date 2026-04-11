# Deployment Checklist - 15 Minutes to Production

Quick reference for deploying **DANBAIWA DATA PLUG** to Vercel in 15 minutes.

---

## 📋 Pre-Deployment Checklist

### Local Testing (5 min)

- [ ] Run `npm run dev` successfully
- [ ] Homepage loads at http://localhost:3000
- [ ] Sign up form works
- [ ] Login works with test credentials
- [ ] Admin panel accessible at `/admin`
- [ ] Data purchase test successful
- [ ] Browser console has no errors
- [ ] No TypeScript errors: `npx tsc --noEmit`

### Code Quality (2 min)

- [ ] All changes committed: `git status` is clean
- [ ] Branch is up to date with main
- [ ] No console.log or debug code
- [ ] `.env.local` not committed
- [ ] (Verify): `.gitignore` includes `.env*`

### API Credentials Ready (3 min)

- [ ] DATABASE_URL copied and tested
- [ ] JWT_SECRET generated and ready
- [ ] SMEPLUG_API_KEY obtained
- [ ] SAIFUL_API_KEY obtained
- [ ] All 7 variable values ready to paste

---

## 🚀 Deployment Steps (8 min)

### Step 1: Deploy to Vercel (2 min)

```bash
# Push to main branch
git push origin main
```

Then:
1. Visit [vercel.com](https://vercel.com)
2. Select your project (should auto-import from GitHub)
3. Click "Deploy" button
4. Wait for build to complete (~1-2 min)

**Status:** ✓ Build Started

### Step 2: Add Environment Variables (3 min)

In Vercel Dashboard:

1. Go to **Settings** → **Environment Variables**
2. Click **Add New** for each variable:

```
VARIABLE                VALUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. DATABASE_URL         postgresql://...
2. JWT_SECRET           your-64-char-secret
3. NEXT_PUBLIC_APP_URL  https://your-domain.com
4. SMEPLUG_API_KEY      your-smeplug-key
5. SMEPLUG_BASE_URL     https://smeplug.ng/api/v1
6. SAIFUL_API_KEY       your-saiful-key
7. SAIFUL_BASE_URL      https://app.saifulegendconnect.com/api
```

For each variable:
- Name: `VARIABLE_NAME`
- Value: `paste_your_value`
- Environments: ✓ Production ✓ Preview ✓ Development
- Click **Add**

**Status:** ✓ Variables Added

### Step 3: Trigger Redeploy (1 min)

1. Go to **Deployments** tab
2. Click the most recent deployment
3. Click **Redeploy**
4. Wait for ✓ "Ready" status

**Status:** ✓ Deployment Ready

### Step 4: Verify Deployment (2 min)

In browser:

- [ ] Visit your Vercel URL
- [ ] Homepage loads (check for logo, hero section)
- [ ] Mobile responsive (test in browser DevTools)
- [ ] Click "Sign Up" → Form opens
- [ ] Visit `/admin` → Admin panel loads
- [ ] Open browser console (F12) → No red errors

**Status:** ✓ Deployment Successful

---

## ✅ Post-Deployment Tests (2 min)

### Functionality Tests

- [ ] **Sign Up:** Create test account
- [ ] **Login:** Login with test account
- [ ] **Dashboard:** User dashboard displays
- [ ] **Data Plans:** Plans load from database
- [ ] **Admin:** Admin routes are protected
- [ ] **Errors:** Try invalid login, check error message

### Performance

- [ ] Page loads in < 2 seconds
- [ ] No layout shifts (CLS)
- [ ] Images load properly
- [ ] No 404 errors in network tab

### Security

- [ ] No sensitive vars in browser console
- [ ] JWT token stored in httpOnly cookie
- [ ] Admin routes require authentication
- [ ] API endpoints require valid JWT

---

## 🎯 7-Variable Quick Reference

| # | Variable | Value |
|---|----------|-------|
| 1 | DATABASE_URL | `postgresql://user:pass@host/db` |
| 2 | JWT_SECRET | Min 64 chars, random string |
| 3 | NEXT_PUBLIC_APP_URL | `https://your-domain.com` |
| 4 | SMEPLUG_API_KEY | From SME Plug dashboard |
| 5 | SMEPLUG_BASE_URL | `https://smeplug.ng/api/v1` |
| 6 | SAIFUL_API_KEY | From Saiful dashboard |
| 7 | SAIFUL_BASE_URL | `https://app.saifulegendconnect.com/api` |

---

## ⏱️ Timeline Breakdown

| Task | Time | Total |
|------|------|-------|
| Local Testing | 5 min | 5 min |
| Code Quality | 2 min | 7 min |
| Deploy to Vercel | 2 min | 9 min |
| Add Variables | 3 min | 12 min |
| Verify Deployment | 2 min | 14 min |
| Post-Test | 1 min | 15 min |

---

## 🆘 Common Issues & Fixes

### Build Fails

```
Error: Build failed
→ Check Vercel Logs
→ Usually: missing environment variable
→ Solution: Add variable and redeploy
```

### "Cannot find module 'postgres'"

```
Error during build
→ DATABASE_URL missing or invalid
→ Solution: Verify DATABASE_URL in Vercel
```

### API Returns 401 Unauthorized

```
After deployment, login fails
→ JWT_SECRET mismatch between local and production
→ Solution: Regenerate JWT_SECRET and add to Vercel
```

### "Invalid API Key"

```
Data purchase fails with auth error
→ SMEPLUG_API_KEY or SAIFUL_API_KEY wrong
→ Solution: Verify keys in Vercel environment
```

### Blank Page After Deploy

```
App loads but shows nothing
→ Check browser console for errors (F12)
→ Check Vercel deployment logs
→ Try hard refresh (Ctrl+Shift+R)
```

---

## 📊 Success Criteria

After deployment, your site should:

✅ Load in production without errors
✅ Display DANBAIWA branding correctly
✅ Support all 5 services (Data, Airtime, Electricity, Cable, Exam PINs)
✅ Allow user sign up and login
✅ Process transactions correctly
✅ Admin panel fully functional
✅ No sensitive data exposed
✅ All API calls return proper JSON responses

---

## 🔐 Security Final Check

- [ ] JWT_SECRET is strong (64+ chars, random)
- [ ] API keys are valid and active
- [ ] DATABASE_URL uses SSL/TLS (sslmode=require)
- [ ] `.env.local` not committed to Git
- [ ] No credentials in code or comments
- [ ] Admin routes are protected
- [ ] User input is validated
- [ ] Errors don't leak sensitive info

---

## 📞 Support Resources

Need help?

- **Database Help:** [neon.tech docs](https://neon.tech/docs)
- **Vercel Help:** [vercel.com/docs](https://vercel.com/docs)
- **Prisma Docs:** [prisma.io/docs](https://prisma.io/docs)
- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)

---

## 🎉 You're Deployed!

Your DANBAIWA DATA PLUG app is now live in production.

**Next Steps:**
1. Monitor Vercel logs for errors
2. Test all features in production
3. Set up custom domain (optional)
4. Configure error monitoring (Sentry, etc.)
5. Set up automated backups

---

## Deployment History

Record your deployments:

```
Date: ___________
URL: ____________
Status: ✓ Success / ✗ Failed
Issues: _________
```

Keep this for reference and troubleshooting.
# Quick Deployment Checklist

Fast reference checklist to deploy **DANBAIWA DATA PLUG** on Vercel in 15 minutes.

---

## 🚀 5-Minute Quick Start

### 1. **Set Up Environment Variables**
Copy your credentials and prepare them:

```
□ DATABASE_URL = postgresql://...
□ JWT_SECRET = (64+ char random string) 
□ SMEPLUG_API_KEY = your-key
□ SMEPLUG_BASE_URL = https://smeplug.ng/api/v1
□ SAIFUL_API_KEY = your-key
□ SAIFUL_BASE_URL = https://app.saifulegendconnect.com/api
□ NEXT_PUBLIC_APP_URL = https://danbaiwa-data-plug.vercel.app
```

**Note:** Payment gateway integration needs to be configured (Flutterwave has been removed)

### 2. **Connect to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Paste: `https://github.com/danbaiwa/danbaiwa-data-plug.git`
4. Click "Import"

### 3. **Add Environment Variables**
In Vercel Dashboard → Environment Variables:

For **each variable above**:
- Name: `VARIABLE_NAME`
- Value: `paste_your_value`
- Select: ✓ Production ✓ Preview ✓ Development
- Click: "Add"

⏱️ **Takes ~3 minutes**

### 4. **Deploy**
1. Click "Deploy" button
2. Wait for ✓ "Ready" status (2-5 minutes)
3. Click generated URL (e.g., `https://danbaiwa-data-plug.vercel.app`)

### 5. **Test**
- [ ] Homepage loads
- [ ] Can click "Sign Up"
- [ ] Admin panel works (`/admin`)
- [ ] No error messages

---

## 📋 Detailed Step-by-Step

### Step A: Gather Credentials (5 min)

| Service | Where to Get |
|---------|-------------|
| **Database** | Vercel Postgres or Neon.tech |
| **JWT Secret** | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| **SME Plug** | smeplug.ng → API Settings |
| **Saiful** | app.saifulegendconnect.com → API |
| **Payment Gateway** | ⚠️ TBD - Configure your chosen gateway |

### Step B: Vercel Setup (8 min)

```bash
1. Visit: https://vercel.com
2. Login with GitHub
3. Click: "Add New" → "Project"
4. Paste: https://github.com/danbaiwa/danbaiwa-data-plug.git
5. Click: "Import"
6. Wait for auto-detection (Framework: Next.js)
7. Click: "Continue"
```

### Step C: Add Environment Variables (3 min)

**In Vercel Settings → Environment Variables:**

```
Variable 1/7:
Name: DATABASE_URL
Value: postgresql://...
Environments: ✓ ✓ ✓
Click: Add

Variable 2/7:
Name: JWT_SECRET
Value: (64-char random)
Environments: ✓ ✓ ✓
Click: Add

... repeat for remaining 5 variables ...
```

**All 7 variables needed:**
1. DATABASE_URL
2. JWT_SECRET
3. SMEPLUG_API_KEY
4. SMEPLUG_BASE_URL
5. SAIFUL_API_KEY
6. SAIFUL_BASE_URL
7. NEXT_PUBLIC_APP_URL

### Step D: Deploy! (2 min)

Once variables added:
1. Scroll down → Click "Deploy"
2. Watch status turn ✓ "Ready" (usually 2-5 min)
3. Click URL → Your app is live! 🎉

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] **URL Loads** → `https://sydatasub.vercel.app`
- [ ] **Homepage Responsive** → Mobile/desktop both work
- [ ] **Sign Up Works** → Click button → Form loads
- [ ] **Admin Panel** → Visit `/admin` → Dashboard shows
- [ ] **No Errors** → Browser console clean (F12)
- [ ] **API Works** → Can logindanbaiwa-data-plugetwork tab)
- [ ] **Database Connected** → No "DB error" messages
- [ ] **Payments Ready** → Payment gateway integration status

---

## 🆘 Quick Fixes

**If build fails:**
```
→ Check: All 12 environment variables added
→ Try: Click "Redeploy" latest commit
```

**If app shows errors:**
```
→ Check: Vercel Logs (click deployment)
→ Look for: "error" in red
→ Fix: Usually missing env variable
```

**If database error:**
```
→ Check: DATABASE_URL value is correct (copy-paste exact)
→ Check: PostgreSQL service is running
```

**If payments not working:**
```
→ Check: Payment gateway keys verified
→ Check: Using TEST keys for testing, LIVE for production
```

---

## 📚 Full Documentation

For detailed info, read:
- **ENV_SETUP.md** ← Every variable explained in detail
- **VERCEL_DEPLOYMENT.md** ← Complete deployment guide
- **DATABASE_SETUP.md** ← Database configuration guide

---

## 🎯 Timeline

| Step | Time | Action |
|------|------|--------|
| 1️⃣ | 2 min | Prepare credentials |
| 2️⃣ | 3 min | Connect GitHub to Vercel |
| 3️⃣ | 3 min | Add 12 environment variables |
| 4️⃣ | 1 min | Click Deploy |
| 5️⃣ | 5 min | Wait for build (Vercel builds) |
| 6️⃣ | 2 min | Test and verify |
| **Total** | **~15 min** | **Live on Vercel!** 🚀 |

---

## 🚨 Important Notes

❌ **DON'T:**
- Commit `.env` or `.env.local` to Git
- Use same secrets for dev/staging/production
- Share environment variables via email/Slack
- Log secrets in console

✅ **DO:**
- Add variables only in Vercel Dashboard
- Use strong, random secrets (32+ chars)
- Keep a secure password manager backup
- Rotate secrets periodically in production

---

## 🆘 Need Help?

**If stuck:**
1. Check Vercel Logs → click deployment → scroll down for errors
2. Read ENV_SETUP.md → for each variable's purpose
3. Read VERCEL_DEPLOYMENT.md → for complete step-by-step
4. Check official docs:
   - Vercel: https://vercel.com/docs
   - Next.js: https://nextjs.org/docs
   - Flutterwave: https://developer.flutterwave.com

---

**Status:** ✅ Ready to Deploy  
**Build Passed:** ✅ TypeScript + Next.js  
**Estimated Deploy Time:** 15 minutes  
**Last Updated:** April 9, 2026

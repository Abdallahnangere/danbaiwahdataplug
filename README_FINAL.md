# 📱 DANBAIWA DATA PLUG 🚀

**Production-ready fintech platform** for purchasing digital services in Nigeria. Buy data, airtime, pay bills, and earn rewards instantly.

> **Status: IMPLEMENTATION COMPLETE ✅**  
> 15 API endpoints • 4 UI components • 8 documentation guides • Production-ready

---

## 🚀 Quick Start (30 Seconds)

```bash
# 1. Clone & install
git clone <repo> && cd <project> && npm install

# 2. Setup environment
cp .env.example .env.local
# Edit with: DATABASE_URL, NEXTAUTH_SECRET, SMEPLUG_API_KEY, SAIFUL_API_KEY

# 3. Initialize database
npx prisma migrate dev

# 4. Run development server
npm run dev
# Open http://localhost:3000
```

**Next steps:** See [PROVIDER_SETUP.md](PROVIDER_SETUP.md) for API key acquisition

---

## ✨ Features

### 🎯 Core Services
- ✅ **Data Purchase** - MTN, Airtel, Glo, 9Mobile with dynamic plans
- ✅ **Airtime Top-up** - All networks, flexible amounts (₦50 - ₦50K)
- ✅ **Payment Processing** - Flutterwave integration with webhooks
- ✅ **Transaction Tracking** - Complete history with status verification
- ✅ **Reward System** - Track earned rewards and claims
- ✅ **Guest Purchases** - Buy without account registration

### 🔐 Authentication & Security
- ✅ NextAuth.js with secure sessions
- ✅ Role-based access (ADMIN, USER)
- ✅ Input validation on all endpoints
- ✅ Rate limiting (per IP + per user)
- ✅ Encrypted passwords & secure tokens

### 📊 Admin Features
- Analytics dashboard with key metrics
- User management
- Plan management
- Transaction monitoring
- Revenue tracking by network

---

## 📦 What's Included

### Database (Prisma + PostgreSQL)
✅ **10 Data Models:**
- User, Account, Transaction, Reward
- DataNetwork, DataPlan, AirtimeNetwork
- VirtualAccount, ManualTransactionVerification, GuestTransaction

### API (15 Endpoints)
✅ **Fully Implemented:**
- Data APIs: Networks, Plans, Purchase (auth & guest)
- Airtime API: Purchase with validation
- Transaction APIs: List, status, verification
- Rewards API: Fetch user rewards
- Complete validation, error handling, rate limiting

### Frontend (4 React Components)
✅ **Production-Ready:**
- BuyData - Network & plan selection
- BuyAirtime - Network, amount picker, custom amounts
- TransactionHistory - Paginated list, status badges
- Rewards - Summary cards, claim functionality

### Provider Integration
✅ **Complete:**
- Smeplug (MTN, Glo, 9mobile)  
- Saiful (Airtel)
- Flutterwave (Payments)

### Documentation (8 Guides)
✅ **Comprehensive:**
- SETUP_GUIDE.md - Installation & configuration
- PROVIDER_SETUP.md - API key setup
- API_DOCUMENTATION.md - Complete API reference
- TESTING.md - Testing strategies
- DEPLOYMENT_GUIDE.md - Production deployment
- QUICK_REFERENCE.md - 30-second cheat sheet
- IMPLEMENTATION_COMPLETE.md - Full summary
- FILES_CREATED.md - All files created/modified

---

## 🏗️ Architecture

### Frontend Stack
- **Framework:** Next.js 14, React 18
- **Styling:** TailwindCSS
- **UI:** shadcn/ui components
- **State:** React hooks
- **Forms:** React Hook Form

### Backend Stack
- **Runtime:** Node.js (Next.js API Routes)
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Auth:** NextAuth.js

### External Services
- **Data Providers:** Smeplug, Saiful
- **Payments:** Flutterwave
- **Database:** Neon PostgreSQL

---

## 📁 Project Structure

```
app/
├── api/
│   ├── data/
│   │   ├── networks/ (GET)
│   │   ├── plans/[networkId]/ (GET)
│   │   ├── purchase/ (POST auth)
│   │   └── guest-purchase/ (POST)
│   ├── airtime/
│   │   └── purchase/ (POST auth)
│   ├── transactions/
│   │   ├── route.ts (GET list)
│   │   ├── [reference]/ (GET single)
│   │   ├── status/ (GET by reference)
│   │   └── verify-manual/ (POST)
│   ├── rewards/ (GET auth)
│   └── auth/ (signup, login, etc.)
├── layout.tsx (Root layout)
├── page.tsx (Landing)
└── admin/ (Admin dashboard)

components/
├── data/
│   ├── BuyData.tsx (Data purchase)
│   ├── BuyAirtime.tsx (Airtime purchase)
│   ├── TransactionHistory.tsx
│   └── Rewards.tsx
├── ui/ (shadcn components)
└── admin/ (Admin components)

lib/
├── db.ts (Prisma client)
├── auth.ts (NextAuth config)
├── validators.ts (Validation functions)
├── data-delivery.ts (Purchase logic)
├── smeplug.ts (Smeplug API)
├── saiful.ts (Saiful API)
└── utils.ts (Utilities)

prisma/
└── schema.prisma (Database schema)
```

---

## 🔌 API Endpoints

### Public (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/data/networks` | Get all networks |
| GET | `/api/data/plans/[networkId]` | Get plans for network |
| POST | `/api/data/guest-purchase` | Guest data purchase |

### Protected (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/data/purchase` | Buy data |
| POST | `/api/airtime/purchase` | Buy airtime |
| GET | `/api/transactions` | Get user transactions (paginated) |
| GET | `/api/transactions/[reference]` | Get transaction details |
| GET | `/api/transactions/status` | Check status (query: reference) |
| POST | `/api/transactions/verify-manual` | Manual verification |
| GET | `/api/rewards` | Get user rewards |

**Full API docs:** See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

---

## 🔑 Configuration

### Environment Variables

Create `.env.local`:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Authentication
NEXTAUTH_SECRET=your-32-character-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Data Providers
SMEPLUG_API_KEY=your_smeplug_key
SAIFUL_API_KEY=your_saiful_secret_key

# Flutterwave
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_xxx
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST_xxx
FLUTTERWAVE_WEBHOOK_SECRET=whsec_xxx

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_SECRET_KEY=your_admin_secret

# Logging
LOG_LEVEL=info
```

**Setup guide:** See [PROVIDER_SETUP.md](PROVIDER_SETUP.md)

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Test APIs
npm run dev
curl http://localhost:3000/api/data/networks
```

**Testing guide:** See [TESTING.md](TESTING.md)

---

## 🚀 Deployment

### Quick Deploy to Vercel

```bash
# 1. Push to GitHub
git add . && git commit -m "deploy" && git push

# 2. Connect to Vercel
# Go to vercel.com, import from GitHub

# 3. Add environment variables
# PROVIDER_SETUP.md has all required variables

# 4. Deploy
# Vercel will auto-deploy on push
```

**Full deployment guide:** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

## 📊 Database Models

### User
- Phone (unique), name, email
- PIN (hashed), balance (in kobo)
- Role (USER/ADMIN), timestamps

### Transaction
- Type (DATA_PURCHASE, AIRTIME_PURCHASE)
- Amount, status (PENDING/COMPLETED/FAILED)
- Reference (unique), user/guest phone
- Metadata (JSON for details)

### Reward
- Type (REFERRAL, CASHBACK, BONUS)
- Amount, claimed status
- User relationship, expiration

### DataPlan
- Network, volume, validity, price
- External API IDs for providers

---

## 🔄 Transaction Flow

**Authenticated User:**
1. Selects network → view plans
2. Chooses plan → enters phone
3. System validates → checks balance
4. Creates transaction (PENDING)
5. Calls provider API (Smeplug/Saiful)
6. Updates transaction status
7. Returns result to user

**Guest User:**
1. No authentication required
2. Selects plan → enters phone & email
3. Provider API called immediately
4. Returns transaction reference
5. Can check status later

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| `DATABASE_URL not set` | Check `.env.local` exists with DATABASE_URL |
| `API key invalid` | Verify exact key from provider dashboard copied |
| `Port 3000 in use` | Kill process: `lsof -i :3000 \| grep LISTEN \| awk '{print $2}' \| xargs kill -9` |
| `Prisma errors` | Run: `npx prisma generate && npx prisma migrate dev` |
| `Build fails` | Clear cache: `rm -rf .next && npm run build` |

**Detailed troubleshooting:** See [SETUP_GUIDE.md](SETUP_GUIDE.md)

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | Installation, configuration, common tasks |
| [PROVIDER_SETUP.md](PROVIDER_SETUP.md) | API keys, environment variables |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | Complete API reference |
| [TESTING.md](TESTING.md) | Testing strategies & setup |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Production deployment |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | 30-second cheat sheet |
| [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md) | Implementation summary |
| [FILES_CREATED.md](FILES_CREATED.md) | All files created/modified |

---

## ✅ Implementation Checklist

- [x] Database schema (10 models)
- [x] API endpoints (15 routes)
- [x] React components (4 main)
- [x] Provider integration (2 providers)
- [x] Authentication & security
- [x] Input validation & rate limiting
- [x] Error handling
- [x] Documentation (8 guides)
- [x] Testing strategy
- [x] Deployment ready

---

## 🤝 Support

- **Docs:** Check documentation files above
- **Provider Issues:** See respective provider docs (Smeplug, Saiful, Flutterwave)
- **Code Issues:** Check TESTING.md or SETUP_GUIDE.md troubleshooting section

---

## 📝 License

Proprietary - DANBAIWA DATA PLUG

---

## 🎉 Next Steps

1. ✅ Get API keys → [PROVIDER_SETUP.md](PROVIDER_SETUP.md)
2. ✅ Configure environment → `.env.local`
3. ✅ Setup database → `npx prisma migrate dev`
4. ✅ Run dev server → `npm run dev`
5. ✅ Test endpoints → See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
6. ✅ Deploy → [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

**Everything is ready to go!** 🚀

---

**Last Updated:** 2024  
**Status:** Production Ready  
**Version:** 1.0.0

# 📱 DANBAIWA DATA PLUG 🚀

**A complete, production-ready fintech platform** for purchasing digital services in Nigeria.

> ✅ **Status: IMPLEMENTATION COMPLETE** | 15 API endpoints | 4 UI components | 8 guides | Ready for deployment

## ⚡ Quick Start

```bash
# 1. Clone & setup
git clone <repo> && cd <project> && npm install

# 2. Configure environment
cp .env.example .env.local
# Add: DATABASE_URL, NEXTAUTH_SECRET, API keys

# 3. Initialize database
npx prisma migrate dev

# 4. Run development server
npm run dev
# Visit http://localhost:3000
```

---

## 📦 What's Included

### ✅ Database (Prisma + PostgreSQL)
- **10 data models:** User, Account, Transaction, Reward, DataNetwork, DataPlan, AirtimeNetwork, VirtualAccount, ManualTransactionVerification, GuestTransaction
- **Comprehensive schema** with relationships, constraints, and indexes
- **Ready for migrations:** `npx prisma migrate dev`

### ✅ API (15 Endpoints)
- **Data APIs:** Networks, Plans, Purchase (auth & guest)
- **Airtime API:** Purchase with network/amount validation
- **Transaction APIs:** List, status, manual verification
- **Rewards API:** Fetch user rewards
- **Complete validation, error handling, rate limiting**

### ✅ Frontend (4 React Components)
- **BuyData** - Network & plan selection, purchase flow
- **BuyAirtime** - Network, amount picker, custom amounts
- **TransactionHistory** - Paginated list with status badges
- **Rewards** - Summary cards, claim functionality

### ✅ Provider Integration
- **Smeplug** (MTN, Glo, 9mobile) - Full API integration
- **Saiful** (Airtel) - Complete integration
- **Flutterwave** (Payments) - Payment processing

### ✅ Authentication & Security
- NextAuth.js with secure sessions
- Role-based access control (ADMIN/USER)
- Input validation on all endpoints
- Rate limiting per IP and user
- Encrypted passwords & secure tokens

### ✅ Documentation (8 Comprehensive Guides)
- **SETUP_GUIDE.md** - Installation, configuration, troubleshooting
- **PROVIDER_SETUP.md** - API key setup, environment variables
- **API_DOCUMENTATION.md** - Complete API reference with examples
- **TESTING.md** - Unit, integration, E2E testing strategies
- **DEPLOYMENT_GUIDE.md** - Vercel, Docker, monitoring setup
- **QUICK_REFERENCE.md** - 30-second cheat sheet
- **IMPLEMENTATION_COMPLETE.md** - Full implementation summary
- **FILES_CREATED.md** - Log of all created/modified files

---

## 🌟 Core Features

### 1. 📱 Data Purchase
- Multiple networks: MTN, Airtel, GLO, 9Mobile
- Dynamic plan loading with pricing
- Guest purchase option (no account needed)
- Transaction tracking & status verification

### 2. 📞 Airtime Top-up
- All Nigerian networks supported
- Flexible amounts (₦50 - ₦50,000)
- Real-time balance deduction
- Instant transaction status

### 3. 💳 Payment Processing
- Flutterwave integration for payments
- Multiple payment methods
- Secure transaction handling
- Webhook support for confirmations

### 4. 💰 Reward System
- User rewards tracking
- Claimed/unclaimed status
- Reward expiration handling
- Claims management

### 5. 📊 Analytics & History
- Complete transaction history
- Paginated transaction list
- Multiple filter options
- Transaction status tracking

---

## 🏗️ Architecture

### Admin Dashboard

- Analytics & insights
- User management
- Plan management (add/edit pricing)
- Transaction monitoring
- Agent management
- Revenue tracking by network

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: TailwindCSS 4
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion
- **Charts**: Recharts
- **State Management**: Zustand, TanStack React Query
- **Notifications**: Sonner, React Hot Toast

### Backend
- **Runtime**: Node.js (Next.js API Routes)
- **Language**: TypeScript
- **ORM**: Prisma 6.19.3
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT (jose), bcryptjs
- **Validation**: Zod

### External Services
- **Data APIs**: SMEPlug (API_A), Saiful (API_B)
- **Virtual Accounts**: Wiaxy/BillStack
- **Payment Gateway**: Wiaxy webhooks
- **Database**: Neon PostgreSQL

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm/yarn
- PostgreSQL database (Neon account)

### Setup

```bash
# Clone repository
git clone <repo-url>
cd DANBAIWA-DATA-PLUG

# Install dependencies
npm install

# Setup environment variables (see ENV_SETUP.md)
cp .env.example .env.local
# Edit .env.local with your actual values

# Setup database
npx prisma generate
npx prisma migrate deploy

# Seed initial data (optional)
npm run seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Project Structure

```
app/
├── api/                      # Backend API Routes
│   ├── admin/               # Admin endpoints (plans, users, analytics)
│   ├── airtime/             # Airtime purchase
│   ├── auth/                # Authentication (signup, login, PIN management)
│   ├── cable/               # Cable TV subscription
│   ├── data/                # Data plans & purchase
│   ├── electricity/         # Electricity payment & validation
│   ├── exampin/             # Exam PIN purchase
│   ├── rewards/             # Reward retrieval
│   ├── transactions/        # Transaction history
│   └── wiaxy/               # Virtual account webhooks
├── admin/                   # Admin dashboard pages
├── auth/                    # Authentication pages (login, signup)
├── checkout/                # Checkout dashboard
├── dashboard/               # User dashboard
└── page.tsx                 # Landing page

components/
├── admin/                   # Admin UI components
├── app/                     # User app components
├── landing/                 # Homepage components
└── ui/                      # Reusable UI components

lib/
├── auth.ts                  # JWT & session management
├── adminAuth.ts             # Admin authentication
├── db.ts                    # Prisma singleton
├── saiful.ts                # Saiful API integration
├── smeplug.ts               # SMEPlug API integration
├── wiaxy.ts                 # Wiaxy virtual account integration
├── rewards.ts               # Reward logic
├── validators.ts            # Zod schemas
└── utils.ts                 # Helper functions

prisma/
└── schema.prisma            # Database schema

public/                      # Static assets
styles/                      # Global styles
```

## 🔐 Authentication

### Login Flow
1. User enters phone (11 digits) + PIN (6 digits)
2. System looks up user by phone
3. PIN verified using bcryptjs.compare()
4. JWT token issued (7 days expiry)
5. Token stored in `sy_session` cookie

### Signup Flow
1. User provides fullName, phone, PIN
2. PIN hashed with bcryptjs (12 rounds)
3. User record created
4. Virtual account created via Wiaxy
5. VirtualAccount linked to User
6. JWT token issued

### Admin Authentication
- Simple password-based (ADMIN_PASSWORD env var)
- Passed via `X-Admin-Password` header
- No JWT validation (stateless)

## 💳 Payment Flow

### Service Purchase (Authenticated User)
```
1. User selects service (data/airtime/etc)
2. System retrieves user by phone
3. PIN verified
4. Balance checked (kobo units)
5. Plan details fetched
6. Transaction created (PENDING status)
7. External API called (SMEPlug or Saiful)
8. Transaction updated (SUCCESS/FAILED)
9. Balance updated (decremented)
10. User notified
```

### Guest Data Purchase
```
1. User selects plan
2. No authentication required
3. Phone number provided
4. Transaction created
5. External API called immediately
6. Returns transaction reference
7. User can check status later
```

### Wallet Funding (Virtual Account)
```
1. User's virtual account created at signup
2. User transfers ₦X to account
3. Wiaxy webhook notifies system
4. Transaction created (DEPOSIT type)
5. User balance credited
6. Reward system triggered
7. User notified
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify-pin` - Verify PIN
- `POST /api/auth/change-pin` - Change PIN
- `GET /api/auth/me` - Get current user

### Services
- `GET /api/data/plans` - Get data plans
- `POST /api/data/purchase` - Purchase data
- `POST /api/data/guest-purchase` - Guest data purchase
- `POST /api/airtime/purchase` - Purchase airtime
- `POST /api/electricity/validate` - Validate meter
- `POST /api/electricity/pay` - Pay electricity bill
- `POST /api/cable/subscribe` - Subscribe to cable
- `POST /api/exampin/purchase` - Purchase exam PIN

### Wallet
- `GET /api/rewards` - Get user rewards
- `GET /api/transactions` - Get transaction history
- `POST /api/wiaxy/webhook` - Wiaxy payment webhook

### Admin
- `POST /api/admin/login` - Admin authentication
- `POST /api/admin/verify` - Verify admin password
- `GET /api/admin/plans` - Get all plans
- `POST /api/admin/plans` - Create plan
- `GET /api/admin/users` - Get all users
- `GET /api/admin/analytics` - Get analytics data

## 🔧 Configuration

See `ENV_SETUP.md` for detailed environment variable configuration.

### Key Variables
```bash
# Database
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=your-secret-key-min-32-chars
ADMIN_PASSWORD=your-admin-password

# APIs
SAIFUL_API_KEY=your-saiful-key
SAIFUL_API_URL=https://api.saiful.com
SMEPLUG_API_KEY=your-smeplug-key
SMEPLUG_BASE_URL=https://api.smeplug.ng

# Virtual Accounts
WIAXY_SECRET_KEY=your-wiaxy-key
WIAXY_BASE_URL=https://api.billstack.co/v2

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Push to Git
git add .
git commit -m "Your message"
git push origin main

# Import to Vercel
# 1. Go to vercel.com
# 2. Connect GitHub repo
# 3. Set environment variables in Vercel dashboard
# 4. Deploy
```

### Neon Database Deployment
- Vercel can auto-connect to Neon
- Or manually add DATABASE_URL in Vercel env vars

See `VERCEL_DEPLOYMENT.md` for detailed steps.

## 📊 Data Models

### User
- Phone-based unique identity
- PIN-based authentication (6 digits)
- Role-based access (USER/AGENT/ADMIN)
- Balance tracking in kobo
- Virtual account relationship

### Plan
- Network-specific (MTN/GLO/AIRTEL/9MOBILE)
- Dual API support (SMEPlug/Saiful)
- External API ID mapping
- User/Agent pricing tiers
- Validity periods

### Transaction
- Complete history logging
- Multiple transaction types
- Success/failure status tracking
- API reference for traceability
- JSON metadata for service-specific data
- Phone number tracking (user or guest)

### VirtualAccount
- One-per-user relationship with Wiaxy
- Multiple bank support
- Account number & name
- Used for wallet funding

## 🔄 API Integration

### SMEPlug (API_A) - Data
- Endpoint: `/data/purchase`
- Networks: MTN, GLO, AIRTEL, 9MOBILE
- Phone format: `09xxxxxxx` (local)
- Reference for idempotency

### Saiful (API_B) - Multi-service
- Data: `/data/{reference}`
- Airtime: `/airtime/{reference}`
- Electricity: `/electricity/meter/{reference}`, `/electricity/pay/{reference}`
- Cable: `/cable/{reference}`
- Exam PINs: `/exampin/{reference}`
- Token-based auth
- 30s timeout

### Wiaxy (Virtual Accounts & Webhooks)
- VA Creation: POST `/thirdparty/generateVirtualAccount/`
- Webhook: Receives payment notifications
- Signature verification required
- Multiple bank support

## 📈 Analytics & Monitoring

Admin dashboard provides:
- Total users and transactions
- Revenue (total & daily)
- Transaction trends (7-day graph)
- Revenue by network (pie chart)
- User and transaction counts by type

## ⚠️ Error Handling

All API responses follow this pattern:

**Success**:
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

**Error**:
```json
{
  "error": "Error message",
  "status": 400
}
```

Status codes:
- `401` - Unauthorized
- `402` - Payment Required (insufficient balance)
- `403` - Forbidden (banned account)
- `404` - Not Found
- `429` - Too Many Requests (rate limit)
- `500` - Server Error

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- path/to/test.ts
```

## 🐛 Troubleshooting

### Common Issues

**"User not found"**
- Verify phone format: 11 digits starting with 0
- Check database has user record

**"Insufficient balance"**
- Balance tracked in kobo (1 naira = 100 kobo)
- Ensure user has funded wallet

**"Invalid PIN"**
- PIN must be exactly 6 digits
- PIN is case-sensitive hash comparison

**"Plan not found"**
- Ensure plan is marked `isActive: true`
- Check apiSource and external IDs match

**API timeouts**
- Check external API status
- Verify API keys are valid
- Check network connectivity

See `DATABASE_SETUP.md` for database troubleshooting.

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "Add feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Open pull request

## 📄 License

Proprietary - DANBAIWA DATA PLUG

## 📞 Support

For issues or questions:
- Check issue tracker
- Review documentation
- Contact development team

## 📝 Changelog

### Version 0.1.0
- Initial release
- 5 core services
- Admin dashboard
- Virtual account integration
- Reward system

---

**Last Updated**: 2024
**Status**: Production Ready
# DANBAIWA DATA PLUG 📱 — Buy Data Instantly

Nigeria's fastest data delivery platform. Buy data for all networks at competitive prices with instant delivery.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [API Routes](#api-routes)
- [Database Setup](#database-setup)
- [Deployment](#deployment)
- [Flutterwave Integration](#flutterwave-integration)
- [Admin Panel](#admin-panel)
- [Data Plan Seeding](#data-plan-seeding)

---

## Overview

**DANBAIWA DATA PLUG** is a comprehensive digital services platform for Nigeria. Buy data, airtime, pay bills, subscribe to cable, and purchase exam PINs instantly with secure payments. It features:

- ✅ **Data Purchase** - MTN data plans (500MB - 75GB) via dual APIs (SME Plug & Saiful)
- ✅ **Airtime Top-up** - Quick airtime purchase across all networks
- ✅ **Electricity Payments** - Pay bills for all 11 Nigerian DISCOs with meter validation
- ✅ **Cable Subscriptions** - DSTV, GOtv, Startimes with 11+ plans
- ✅ **Exam PINs** - WAEC, NECO, NABTEB result checker PINs
- ✅ **Instant Delivery** - Real-time service activation and balance updates
- ✅ **Admin Dashboard** - Complete management, analytics, and transaction history
- ✅ **Authentication** - Secure JWT + 6-digit PIN-based login

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | TailwindCSS 4, Framer Motion |
| **Database** | PostgreSQL (Neon), Prisma 6.19.3 ORM |
| **Authentication** | JWT (jose) + 6-digit PIN |
| **Data Fetching** | TanStack Query, axios |
| **APIs Integrated** | Saiful, SME Plug (data & airtime) |
| **UI Components** | shadcn/ui, Recharts, Framer Motion |
| **Validation** | Zod |
| **Hashing** | bcryptjs |
| **State Management** | Zustand |
| **Hosting** | Vercel |

---

## Local Development

### Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** or **yarn**
- PostgreSQL database (Neon recommended: free tier at neon.tech)
- Saiful API credentials
- SME Plug API credentials

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd danbaiwa-data-plug
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

4. **Setup database**
```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (Neon)
npx prisma db push
```

5. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo User Credentials

- **Phone**: `08101234567`
- **Email**: `demo@danbaiwa.com`
- **Balance**: ₦10,000
- **PIN**: Set via signup

### Admin User

- **Phone**: `08000000001`
- **Email**: `admin@danbaiwa.com`
- **URL**: `http://localhost:3000/admin`

---

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database_name

# Authentication
JWT_SECRET=your-random-64-character-secret-key-here-min-32-chars

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# API Provider: SME Plug (Data & Airtime)
SMEPLUG_API_KEY=your-smeplug-api-key-here
SMEPLUG_BASE_URL=https://smeplug.ng/api/v1

# API Provider: Saiful (Electricity, Cable, Exam PINs)
SAIFUL_API_KEY=your-saiful-api-key-here
SAIFUL_BASE_URL=https://app.saifulegendconnect.com/api
```

### Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (Neon recommended) | ✅ |
| `JWT_SECRET` | Secret for JWT signing (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) | ✅ |
| `NEXT_PUBLIC_APP_URL` | Public app URL (`http://localhost:3000` for dev) | ✅ |
| `SMEPLUG_API_KEY` | API key from SME Plug dashboard | ✅ |
| `SMEPLUG_BASE_URL` | SME Plug API endpoint | ✅ |
| `SAIFUL_API_KEY` | API key from Saiful dashboard | ✅ |
| `SAIFUL_BASE_URL` | Saiful API endpoint | ✅ |

### Getting API Credentials

**Database (Neon)**:
1. Visit [neon.tech](https://neon.tech) (free tier available)
2. Create a PostgreSQL database
3. Copy the connection string to `DATABASE_URL`

**SME Plug (Data & Airtime)**:
1. Visit [smeplug.ng](https://smeplug.ng)
2. Register and navigate to API settings
3. Copy API key to `SMEPLUG_API_KEY`

**Saiful (Electricity, Cable, Exam PINs)**:
1. Contact Saiful or visit [saifulegendconnect.com](https://saifulegendconnect.com)
2. Get your API credentials
3. Copy to `SAIFUL_API_KEY`

---

## API Routes

### Authentication

| Method | Route | Description | Protected |
|--------|-------|-------------|-----------|
| POST | `/api/auth/signup` | Create new user account | ❌ |
| POST | `/api/auth/login` | Login with phone & PIN | ❌ |
| GET | `/api/auth/me` | Get current user info | ✅ |

### Data & Airtime

| Method | Route | Description | Protected |
|--------|-------|-------------|-----------|
| GET | `/api/data/plans` | Get all data plans | ❌ |
| POST | `/api/data/purchase` | Purchase data (auto-delivery) | ✅ |
| POST | `/api/airtime/purchase` | Purchase airtime | ✅ |

### Wallet & Transactions

| Method | Route | Description | Protected |
|--------|-------|-------------|-----------|
| GET | `/api/transactions` | Get user's transactions | ✅ |
| GET | `/api/transactions/status?ref=REF` | Check payment status | ❌ |
| POST | `/api/transactions/verify-manual` | Manually verify payment | ❌ |

### Flutterwave (Payment)

| Method | Route | Description | Protected |
|--------|-------|-------------|-----------|
| POST | `/api/flutterwave/create-temp-account` | Create virtual account (guest) | ❌ |
### Rewards

| Method | Route | Description | Protected |
|--------|-------|-------------|----------|
| GET | `/api/rewards` | Get user's rewards | ✅ |

### Admin Routes (Protected with ADMIN role)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/analytics` | Dashboard stats & charts |
| GET | `/api/admin/plans` | List all plans |
| POST | `/api/admin/plans` | Create new plan |
| PATCH | `/api/admin/plans/[id]` | Update plan |
| DELETE | `/api/admin/plans/[id]` | Delete plan |
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/users/[id]` | Get user details |
| PATCH | `/api/admin/users/[id]` | Update user info |
| POST | `/api/admin/users/[id]/balance` | Add/deduct balance |
| POST | `/api/admin/users/[id]/reset-pin` | Reset user PIN |
| GET | `/api/admin/transactions` | Get transactions (paginated, filterable) |

---

## Database Setup

### Database Schema

The project uses Prisma with PostgreSQL. Key models:

**User**
- `id`: Primary key
- `fullName`: User's name
- `phone`: 11-digit Nigerian number (unique)
- `email`: Email address
- `pinHash`: Hashed 6-digit PIN (bcryptjs)
- `balance`: Balance in kobo (₦1 = 100 kobo)
- `role`: USER | AGENT | ADMIN
- `isBanned`: Account ban status
- `createdAt`, `updatedAt`: Timestamps

**Plan**
- `id`: Primary key
- `name`: Display name (e.g., "500MB Share")
- `network`: MTN | AIRTEL | GLO | 9MOBILE
- `sizeLabel`: Data size (e.g., "500MB")
- `validity`: Validity period (e.g., "Weekly")
- `price`: Price in naira (₦)
- `apiSource`: API_A | API_B
- `externalPlanId`: Plan ID from data provider
- `externalNetworkId`: Network ID from provider
- `isActive`: Plan availability

**Transaction**
- `id`: Primary key
- `type`: DATA_PURCHASE | AIRTIME_PURCHASE | WALLET_FUNDING | REWARD_CREDIT
- `status`: PENDING | SUCCESS | FAILED
- `userId`: User ID (nullable for guests)
- `phoneNumber`: Target phone
- `amount`: Amount in naira
- `planId`: Related Plan ID (for data)
- `flwRef`: Flutterwave reference
- `description`: Transaction details
- `createdAt`: Timestamp

**VirtualAccount**
- `id`: Primary key
- `userId`: User ID
- `accountNumber`: Virtual account number
- `bankName`: Bank name
- `orderRef`: Unique order reference
- `accountName`: Account name
- `createdAt`: Timestamp

**Reward** & **UserReward**
- Track signup bonuses, deposit bonuses, referral rewards
- Automatic crediting on qualifying transactions

### Seeding Plans

Run once after database setup:

```bash
npx prisma db seed
```

This creates:
- 30+ MTN plans (API A)
- 5+ Airtel plans (API B)
- 3 reward types (Signup Bonus, First Deposit, High Roller)
- 1 admin user (phone: `08000000000`, PIN: `000000`)

To reseed:
```bash
npx prisma db seed
```

---

## Deployment

### Prerequisites

- Vercel account
- Neon PostgreSQL account (free tier available)
- All environment variables ready

### Step 1: Prepare Repository

1. Push code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Click "Add New" → "Project"
4. Select your repository
5. Vercel auto-detects Next.js → Click "Continue"

### Step 2: Add Environment Variables

In Vercel dashboard → Settings → Environment Variables, add:

```
DATABASE_URL=postgresql://...
JWT_SECRET=your-64-char-random-secret
SMEPLUG_API_KEY=your-smeplug-key
SMEPLUG_BASE_URL=https://smeplug.ng/api/v1
SAIFUL_API_KEY=your-saiful-key
SAIFUL_BASE_URL=https://app.saifulegendconnect.com/api
NEXT_PUBLIC_APP_URL=https://your-danbaiwa-domain.com
```

### Step 3: Deploy

1. Click "Deploy" button
2. Wait for ✓ "Ready" status (2-5 minutes)
3. Visit your deployed URL

### Step 4: Deploy

```bash
# Push to main branch to trigger deployment
git push origin main

# Or deploy directly via Vercel CLI
vercel deploy --prod
```

### Vercel Configuration

`vercel.json` already configured with:
- **Webhook max duration**: 30 seconds
- **Data purchase timeout**: 15 seconds
- **Airtime purchase timeout**: 15 seconds

---\n

## Admin Panel

### Access

- **URL**: `https://your-domain.com/admin`
- **Auth**: Login with admin credentials:
  - Phone: `08000000000`
  - PIN: `000000` (default)

**⚠️ Change the default PIN immediately in production!**

### Features

#### 📊 **Analytics Dashboard** (`/admin/analytics`)
- **Stats Cards**: Total users, transactions, revenue, today's revenue
- **Charts**:
  - Line: 7-day transaction trend
  - Pie: Revenue by network
  - Bar: Top 5 plans
- **Recent Transactions**: Last 20 transactions table

#### 📱 **Plans Management** (`/admin/plans`)
- View all plans (sortable table)
- **Create Plan** - Dialog form with all fields
- **Edit Plan** - Pre-filled form
- **Delete Plan** - Hard delete with confirmation
- **Toggle Active** - Inline toggle for availability

#### 👥 **Users Management** (`/admin/users`)
- View all users with search & role filter
- **User Detail Modal**:
  - Profile info (avatar, name, phone, role)
  - Balance management (add/deduct)
  - Change role (USER/AGENT/ADMIN)
  - Ban/Unban user
  - Reset PIN to 000000
  - View recent 10 transactions

#### 💵 **Transactions Viewer** (`/admin/transactions`)
- View all transactions (paginated)
- **Filters**:
  - By Status (ALL, PENDING, SUCCESS, FAILED)
  - By Type (ALL, DATA_PURCHASE, AIRTIME_PURCHASE, WALLET_FUNDING, REWARD_CREDIT)
  - By Date Range (start & end date)
- **Pagination**: 20 per page with prev/next
- **Color-Coded Status**: Green (success), Red (failed), Yellow (pending)

---

## Data Plan Seeding

### Manual Plan Creation (Admin Panel)

1. Login to `/admin`
2. Navigate to **Plans**
3. Click **Add Plan** button
4. Fill form:
   - Name: `500MB Share`
   - Network: `MTN`
   - Size Label: `500MB`
   - Validity: `Weekly`
   - Price: `300` (in naira)
   - API Source: `API_A` or `API_B`
   - External Plan ID: Get from provider
   - External Network ID: Get from provider
5. Click **Create**

### API A (SMEPlug) Plan IDs

| Plan | Size | Price | Validity | ID |
|------|------|-------|----------|-----|
| MTN 500MB | 500MB | ₦300 | Weekly | 423 |
| MTN 1GB | 1GB | ₦450 | Weekly | 424 |
| MTN 2GB | 2GB | ₦900 | Weekly | 425 |
| MTN 5GB | 5GB | ₦1,500 | Monthly | 176 |

*See `prisma/seed.ts` for complete list*

### API B (Saiful) Plan IDs

| Plan | Size | Price | Validity | ID |
|------|------|-------|----------|-----|
| MTN 5GB | 5GB | ₦1,500 | 14-30 Days | 85 |
| Airtel 5GB | 5GB | ₦1,500 | Monthly | 92 |

*Contact Saiful support for complete list*

---

## Building & Testing

### Local Build

```bash
npm run build
```

Must complete with 0 errors. Output: `.next/` directory

### Type Checking

```bash
npx tsc --noEmit
```

Must pass with 0 TypeScript errors

### Schema Validation

```bash
npx prisma validate
```

Must pass validation

### Lint Check

```bash
npm run lint
```

Must pass ESLint rules

### Complete Pre-Deployment Checklist

```bash
# 1. Build
npm run build

# 2. Type check
npx tsc --noEmit

# 3. Schema validate
npx prisma validate

# 4. Lint
npm run lint

# All should complete with 0 errors before deploying
```

---

## Rate Limiting

Implemented in-memory rate limiting for sensitive routes:

| Route | Limit |
|-------|-------|
| `POST /api/auth/login` | 5 attempts per 5 minutes per IP |
| `POST /api/data/purchase` | 10 attempts per minute per IP |
| `POST /api/airtime/purchase` | 10 attempts per minute per IP |

Limits are tracked by IP address and reset after the window expires. For large-scale deployments, upgrade to Redis-based rate limiting.

---

## Error Handling

All API routes return standardized JSON responses:

**Success (200-201)**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error (400-500)**:
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

---

## Troubleshooting

### Database Connection Issues
```
Error: connect ENOTFOUND neon.tech
```
- Verify `DATABASE_URL` is correct
- Check Neon dashboard for IP whitelisting
- Ensure `.env.local` file exists with valid URL

### Flutterwave Webhook Not Firing
- Verify webhook URL in Flutterwave dashboard
- Check webhook secret is correctly set in `.env`
- Test webhook in Flutterwave dashboard first

### Rate Limit Exceeded
- Wait for the window to reset (5 mins for login, 1 min for purchases)
- Try from different IP if using VPN
- Contact support for IP whitelisting

### Admin Login Fails
- Default PIN is `000000`
- If changed, check database for admin user PIN hash
- Reset PIN via admin panel if locked

---

## Support & Contribution

For issues, feature requests, or contributions:
- Email: support@danbaiwa.com
- GitHub Issues: [your-repo-issues](about:blank)
- Slack: [sy-data-sub channel](about:blank)

---

## License

© 2026 SY DATA SUB. All rights reserved.

---

**Last Updated**: April 9, 2026


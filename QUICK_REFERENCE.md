# Quick Reference Card

## 🚀 30-Second Getting Started

```bash
# 1. Setup
git clone <repo> && cd <repo>
npm install && cp .env.example .env.local

# 2. Configure (edit .env.local with your values)
# DATABASE_URL, NEXTAUTH_SECRET, SMEPLUG_API_KEY, etc.

# 3. Database
npx prisma migrate dev

# 4. Run
npm run dev

# 5. Visit
# http://localhost:3000
```

---

## 📁 Key Files

### Database
- **Schema:** `prisma/schema.prisma` (10 models)
- **Migrations:** `prisma/migrations/`

### API Routes (15 endpoints)
- `app/api/data/networks/` - GET networks
- `app/api/data/plans/[networkId]/` - GET plans
- `app/api/data/purchase/` - POST buy data
- `app/api/data/guest-purchase/` - POST guest buy data
- `app/api/airtime/purchase/` - POST buy airtime
- `app/api/transactions/` - GET transactions
- `app/api/transactions/[reference]/` - GET single
- `app/api/transactions/status/` - GET status with query
- `app/api/transactions/verify-manual/` - POST verify
- `app/api/rewards/` - GET rewards

### Components (4 main)
- `components/data/BuyData.tsx`
- `components/data/BuyAirtime.tsx`
- `components/data/TransactionHistory.tsx`
- `components/data/Rewards.tsx`

### Libraries
- `lib/db.ts` - Prisma
- `lib/auth.ts` - NextAuth
- `lib/validators.ts` - Validation
- `lib/data-delivery.ts` - Purchase logic
- `lib/smeplug.ts` - Smeplug API
- `lib/saiful.ts` - Saiful API
- `lib/flutterwave.ts` - Flutterwave API

---

## 🔑 API Key Setup

### 1. Smeplug (MTN, Glo, 9mobile)
```
Website: https://smeplug.com
Copy: API Key → SMEPLUG_API_KEY
```

### 2. Saiful (Airtel)
```
Website: https://saiful.net
Copy: Secret Key → SAIFUL_API_KEY
```

### 3. Flutterwave (Payments)
```
Website: https://flutterwave.com
Copy: Public Key → FLUTTERWAVE_PUBLIC_KEY
Copy: Secret Key → FLUTTERWAVE_SECRET_KEY
```

### 4. Database
```
PostgreSQL connection string:
postgresql://user:password@host:5432/dbname
→ DATABASE_URL
```

---

## 🌐 API Endpoints (Quick)

```
GET  /api/data/networks
GET  /api/data/plans/{networkId}
POST /api/data/purchase                    [AUTH]
POST /api/data/guest-purchase
POST /api/airtime/purchase                 [AUTH]
GET  /api/transactions                     [AUTH]
GET  /api/transactions/{reference}         [AUTH]
GET  /api/transactions/status?reference={} [AUTH]
POST /api/transactions/verify-manual       [AUTH]
GET  /api/rewards                          [AUTH]
```

---

## 💾 Environment Variables

```env
# Required
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<32-char-secret>
NEXTAUTH_URL=http://localhost:3000

# Providers
SMEPLUG_API_KEY=...
SAIFUL_API_KEY=...
FLUTTERWAVE_PUBLIC_KEY=...
FLUTTERWAVE_SECRET_KEY=...

# Optional
ADMIN_EMAIL=admin@example.com
LOG_LEVEL=info
```

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run specific test
npm test -- file.test.ts

# Coverage
npm test -- --coverage

# Test API endpoint
curl http://localhost:3000/api/data/networks
```

---

## 🚀 Deployment

### Vercel
```bash
vercel --prod
# Add env vars in dashboard
```

### Docker
```bash
docker build -t app .
docker run -p 3000:3000 app
```

### Other
See `DEPLOYMENT_GUIDE.md`

---

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| `DATABASE_URL not found` | Check `.env.local` exists |
| `Invalid API key` | Verify key copied correctly |
| `Port 3000 in use` | `lsof -i :3000` then `kill -9 PID` |
| `Prisma not found` | `npx prisma generate` |
| `Build fails` | `rm -rf .next && npm run build` |

---

## 📚 Documentation Map

| Document | Purpose |
|----------|---------|
| `SETUP_GUIDE.md` | Installation & configuration |
| `PROVIDER_SETUP.md` | API keys & provider setup |
| `API_DOCUMENTATION.md` | Complete API reference |
| `TESTING.md` | Testing strategies |
| `DEPLOYMENT_GUIDE.md` | Production deployment |
| `IMPLEMENTATION_COMPLETE.md` | Summary of everything |

---

## ✅ Features Implemented

✅ **Core**
- User authentication
- Data purchases
- Airtime purchases
- Payment processing
- Transaction tracking
- Reward system

✅ **UI Components**
- Buy data
- Buy airtime
- Transaction history
- Rewards display

✅ **APIs**
- 15 REST endpoints
- Provider integration
- Error handling
- Rate limiting
- Input validation

✅ **Documentation**
- Setup guide
- API docs
- Testing guide
- Deployment guide
- Troubleshooting

---

## 🎯 Next Steps

1. Get API keys (Smeplug, Saiful, Flutterwave)
2. Configure `.env.local`
3. Run `npx prisma migrate dev`
4. Run `npm run dev`
5. Test at `http://localhost:3000`
6. Deploy to production

---

## 📞 Quick Links

- **Next.js:** https://nextjs.org/docs
- **Prisma:** https://www.prisma.io/docs
- **NextAuth:** https://next-auth.js.org
- **Smeplug:** https://smeplug.com/developers
- **Saiful:** https://saiful.net/developers
- **Flutterwave:** https://developer.flutterwave.com

---

## 💡 Pro Tips

1. **Use Prisma Studio** to view database:
   ```bash
   npx prisma studio
   ```

2. **Test APIs with Postman/Insomnia** - import API docs

3. **Enable hot reload** - changes auto-refresh in dev

4. **Monitor logs** - check server console for errors

5. **Use git branches** - for feature development

---

## 🔒 Security Notes

- ⚠️ Never commit `.env.local`
- ⚠️ Rotate API keys every 90 days
- ⚠️ Use HTTPS in production
- ⚠️ Enable CORS only for trusted origins
- ⚠️ Validate all inputs server-side

---

**Everything is configured and ready to go!** 🎉

Start with `PROVIDER_SETUP.md` → `SETUP_GUIDE.md` → Run `npm run dev`

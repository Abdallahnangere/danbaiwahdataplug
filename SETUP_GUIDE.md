# Implementation & Setup Instructions

## Quick Start

### 1. Installation

```bash
# Clone repository
git clone <repo-url>
cd <project-directory>

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Update .env.local with your configuration
```

### 2. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Create/migrate database
npx prisma migrate dev

# Seed initial data (optional)
npx prisma db seed
```

### 3. Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Configuration

### Environment Variables

Required variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/myapp

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Payment Provider (Flutterwave)
FLUTTERWAVE_PUBLIC_KEY=KEY
FLUTTERWAVE_SECRET_KEY=SECRET
FLUTTERWAVE_WEBHOOK_SECRET=WEBHOOK_SECRET

# Data Providers
SMEPLUG_API_KEY=YOUR_KEY
SAIFUL_API_KEY=YOUR_KEY

# Admin
ADMIN_SECRET_KEY=admin_secret
ADMIN_EMAIL=admin@example.com

# Optional: Monitoring
SENTRY_DSN=
LOG_LEVEL=info
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin pages
│   ├── app/               # App pages
│   └── layout.tsx         # Root layout
├── components/
│   ├── data/              # Data/airtime components
│   ├── admin/             # Admin components
│   ├── ui/                # UI components (shadcn)
│   └── landing/           # Landing components
├── lib/
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # NextAuth configuration
│   ├── validators.ts     # Input validation
│   ├── smeplug.ts        # Smeplug integration
│   ├── saiful.ts         # Saiful integration
│   └── data-delivery.ts  # Business logic
├── prisma/
│   └── schema.prisma     # Database schema
└── public/               # Static assets
```

## Database Schema

Run `npx prisma studio` to view the database visually.

### Key Tables

1. **User** - User accounts
2. **Account** - OAuth accounts
3. **Transaction** - All transactions
4. **Reward** - User rewards
5. **DataPlan** - Available data plans
6. **DataNetwork** - Network providers
7. **AirtimeNetwork** - Airtime networks

See `prisma/schema.prisma` for complete schema.

## API Endpoints

### User Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Current user info

### Data Purchase
- `GET /api/data/networks` - List networks
- `GET /api/data/plans/[networkId]` - Plans for network
- `POST /api/data/purchase` - Buy data (authenticated)
- `POST /api/data/guest-purchase` - Buy data (guest)

### Airtime Purchase
- `POST /api/airtime/purchase` - Buy airtime

### Transactions
- `GET /api/transactions` - User's transactions
- `GET /api/transactions/status` - Transaction status
- `POST /api/transactions/verify-manual` - Manual verification

### Rewards
- `GET /api/rewards` - User's rewards

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for details.

## UI Components

### Built-in Components (`components/ui/`)
- button, card, input, select, badge, dialog, tabs, etc.

### Custom Components

#### Data Components
```tsx
import { BuyDataComponent } from "@/components/data/BuyData";
import { BuyAirtimeComponent } from "@/components/data/BuyAirtime";
import { TransactionHistory } from "@/components/data/TransactionHistory";
import { RewardsComponent } from "@/components/data/Rewards";
```

#### Usage Example
```tsx
"use client";

import { BuyDataComponent } from "@/components/data/BuyData";

export default function Page() {
  return (
    <div className="container">
      <BuyDataComponent />
    </div>
  );
}
```

## Common Tasks

### Adding a New API Endpoint

1. **Create route file:**
```bash
mkdir -p app/api/your-endpoint
touch app/api/your-endpoint/route.ts
```

2. **Implement endpoint:**
```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Authentication (if needed)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Your logic here
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Adding a New UI Component

1. **Create component file:**
```bash
touch components/data/YourComponent.tsx
```

2. **Implement component:**
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function YourComponent() {
  const [state, setState] = useState("");

  return (
    <div>
      <Button onClick={() => setState("value")}>
        Click me
      </Button>
    </div>
  );
}
```

### Adding a Migration

```bash
# Create migration
npx prisma migrate dev --name your_migration_name

# Edit migration file if needed
# File will be in prisma/migrations/

# Apply migration
npx prisma migrate deploy
```

### Updating the Database Schema

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name description`
3. Schema is automatically generated

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- validators.test.ts

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

See [TESTING.md](TESTING.md) for detailed testing guide.

## Deployment

```bash
# Build for production
npm run build

# Start production server
npm start

# Deploy to Vercel
npm i -g vercel
vercel --prod
```

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## Troubleshooting

### Database Connection Issues
```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
npx prisma db execute --stdin < /dev/null

# Reset database (development only!)
npx prisma migrate reset
```

### Build Errors
```bash
# Clear build cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Type Errors
```bash
# Generate Prisma types
npx prisma generate

# Check TypeScript
npm run type-check
```

### Hot Reload Not Working
- Ensure file is in correct directory
- Check file extensions (.ts, .tsx, not .js)
- Restart dev server

## Performance Tips

1. **Database**
   - Add indexes for frequently queried fields
   - Use pagination for large result sets
   - Cache results when appropriate

2. **Frontend**
   - Use code splitting with dynamic imports
   - Optimize images with next/image
   - Enable compression in production

3. **API**
   - Implement rate limiting
   - Cache responses
   - Paginate large responses

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use environment variables** for sensitive config
3. **Validate all inputs** server-side
4. **Use HTTPS** in production
5. **Enable CORS** only for trusted origins
6. **Rate limit** API endpoints
7. **Sanitize** user input
8. **Keep dependencies** up to date

## Getting Help

- **Documentation:** See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Testing:** See [TESTING.md](TESTING.md)
- **Deployment:** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Issues:** Check GitHub issues or create a new one
- **Provider Support:**
  - Smeplug: https://smeplug.com/support
  - Saiful: https://saiful.net/support
  - Flutterwave: https://flutterwave.com/support

## Sample Queries

### Using Prisma Client

```typescript
import { prisma } from "@/lib/db";

// Get user with transactions
const user = await prisma.user.findUnique({
  where: { id: "user_123" },
  include: { transactions: true }
});

// Get recent transactions
const txs = await prisma.transaction.findMany({
  where: {
    userId: "user_123",
    createdAt: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    }
  },
  orderBy: { createdAt: "desc" },
  take: 20
});

// Count transactions by status
const count = await prisma.transaction.groupBy({
  by: ["status"],
  where: { userId: "user_123" },
  _count: true
});
```

## Next Steps

1. Configure environment variables
2. Set up database
3. Run development server
4. Test API endpoints
5. Customize components
6. Deploy to production

Good luck with your project! 🚀

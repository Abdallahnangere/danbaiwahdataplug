# Deployment Guide

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificate configured
- [ ] API secrets secure (Smeplug, Saiful keys)
- [ ] RateLimit configured for production
- [ ] Error logging set up
- [ ] Monitoring alerts configured
- [ ] Backup strategy in place
- [ ] CDN configured (for static assets)
- [ ] Email service configured

## Environment Variables

Create `.env.production` with:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Authentication
NEXTAUTH_SECRET=your-secret-key-32-chars-min
NEXTAUTH_URL=https://yourdomain.com

# Payment Providers
FLUTTERWAVE_PUBLIC_KEY=your_public_key
FLUTTERWAVE_SECRET_KEY=your_secret_key
FLUTTERWAVE_WEBHOOK_SECRET=your_webhook_secret

# Data Providers
SMEPLUG_API_KEY=your_smeplug_key
SAIFUL_API_KEY=your_saiful_key

# Admin Settings
ADMIN_SECRET_KEY=your_admin_secret
ADMIN_EMAIL=admin@yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_SERVICE=your_logging_service

# Monitoring
SENTRY_DSN=your_sentry_dsn
ANALYTICS_ID=your_analytics_id
```

## Deploy to Vercel

### Option 1: Using Vercel Dashboard

1. **Connect Repository**
   - Go to vercel.com
   - Click "New Project"
   - Select your GitHub repository
   - Click "Import"

2. **Configure Environment**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.production`
   - Select environments (Production, Preview, Development)

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Configure custom domain if needed

### Option 2: Using Vercel CLI

```bash
# Install CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
# ... add remaining variables
```

## Deploy to Render/Railway/Other Platforms

### Using Docker

1. **Create Dockerfile**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

2. **Create docker-compose.yml** (for local testing)

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:password@db:5432/myapp
      NEXTAUTH_SECRET: your-secret
      NEXTAUTH_URL: http://localhost:3000
    depends_on:
      - db
  
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

3. **Deploy to Render**
   - Create account at render.com
   - New → Web Service
   - Connect GitHub repository
   - Environment: Node
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Add environment variables
   - Create PostgreSQL database
   - Deploy

## Post-Deployment Steps

### 1. Database Setup

```bash
# Run migrations
npx prisma migrate deploy

# Seed data (if needed)
npx prisma db seed
```

### 2. Verify Deployment

```bash
# Check health endpoint
curl https://yourdomain.com/api/health

# Test API endpoints
curl https://yourdomain.com/api/data/networks

# Check authentication
curl https://yourdomain.com/api/auth/me
```

### 3. Set Up Monitoring

#### Sentry (Error Tracking)

```bash
npm install @sentry/nextjs
```

Configure in `next.config.ts`:
```typescript
import { withSentryConfig } from "@sentry/nextjs";

const config = {
  // ... config
};

export default withSentryConfig(config, {
  org: "your-org",
  project: "your-project",
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
```

#### Uptime Monitoring

Use services like:
- UptimeRobot
- Better Uptime
- Pingdom

Configure to ping: `https://yourdomain.com/api/health`

### 4. Set Up Backups

#### Database Backups

For PostgreSQL on Vercel:
```bash
# Automatic backups are configured in database settings

# Manual backup
pg_dump $DATABASE_URL > backup.sql
```

#### File Backups
- Store uploads in S3/Cloud Storage
- Enable versioning
- Set lifecycle policy

### 5. SSL Certificate

- Automatic with Vercel
- For other platforms, use Let's Encrypt
- Configure auto-renewal

## Continuous Deployment

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        run: |
          npm i -g vercel
          vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
```

## Scaling Considerations

### Database Optimization

```sql
-- Create indexes for frequently queried fields
CREATE INDEX idx_user_phone ON "User"(phone);
CREATE INDEX idx_transaction_user_date ON "Transaction"(userId, createdAt);
CREATE INDEX idx_transaction_status ON "Transaction"(status);
```

### Caching Strategy

1. **Browser Caching**
   - Static assets: 1 year
   - HTML pages: 24 hours
   - API responses: 5 minutes

2. **Server-side Caching**
   - Network/plans: 1 hour
   - User data: 5 minutes
   - Transactions: No cache (always fresh)

### CDN Configuration

```typescript
// next.config.ts
module.exports = {
  images: {
    domains: ['cdn.example.com'],
  },
};
```

## Performance Optimization

### Frontend

```bash
# Build analysis
npm run build -- --profile

# Check bundle size
npm run analyze
```

### Backend

- Enable query result logging
- Monitor slow queries
- Set up auto-scaling when needed

## Security in Production

### Headers

Configure in `next.config.ts`:

```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains'
        }
      ]
    }
  ]
}
```

### API Rate Limiting

Configured in production environment:
- DDoS protection: 10,000 req/min per IP
- Per-user limit: 1,000 req/hour
- Per-endpoint limit: Varies

## Monitoring & Alerting

### Key Metrics to Monitor

1. **Availability**
   - Uptime %
   - Error rate
   - Response time (p50, p95, p99)

2. **Performance**
   - Database query time
   - API response time
   - Frontend metrics (FCP, LCP, CLS)

3. **Business**
   - Transaction success rate
   - Payment completion rate
   - User growth

### Alert Thresholds

```
- Error rate > 1% → Alert
- Response time > 2s → Alert
- Uptime < 99.5% → Alert
- Database connection pool > 80% → Alert
```

## Rollback Plan

1. **Quick Rollback**
   ```bash
   vercel rollback
   ```

2. **Manual Rollback**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

3. **Database Rollback**
   - Restore from backup
   - Run migration rollback: `npx prisma migrate resolve --rolled-back <migration-name>`

## Support & Maintenance

### Regular Tasks

- [ ] Monitor error logs daily
- [ ] Review performance metrics weekly
- [ ] Update dependencies monthly
- [ ] Security updates immediately
- [ ] Database optimization quarterly

### Incident Response

1. **Alert triggered**
2. **Investigate root cause**
3. **Implement fix**
4. **Deploy fix**
5. **Monitor for stability**
6. **Post-mortem review**

## Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

**Build Failures**
```bash
# Clear build cache
rm -rf .next

# Rebuild
npm run build
```

**API Timeouts**
- Check database performance
- Review rate limiting settings
- Check if provider APIs are responding

### Getting Help

- Check logs: `vercel logs` or platform logs
- Sentry dashboard for errors
- Datadog/New Relic for performance
- Provider documentation (Smeplug, Saiful, Flutterwave)

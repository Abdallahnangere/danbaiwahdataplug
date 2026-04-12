# Testing Guide

## Unit Testing

### Setup
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev ts-jest @types/jest
```

### Test Files Structure
```
tests/
├── unit/
│   ├── validators.test.ts
│   ├── data-delivery.test.ts
│   └── rewards.test.ts
├── integration/
│   ├── api.test.ts
│   └── auth.test.ts
└── e2e/
    ├── purchase-flow.test.ts
    └── auth-flow.test.ts
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Specific test file
npm test -- validators.test.ts
```

## API Testing

### Using Postman/Insomnia

#### Data Networks
```
GET /api/data/networks
Authorization: None
```

#### Buy Data (Authenticated)
```
POST /api/data/purchase
Authorization: Bearer <token>
Content-Type: application/json

{
  "planId": "plan_123",
  "phoneNumber": "09012345678"
}
```

#### Buy Data (Guest)
```
POST /api/data/guest-purchase
Authorization: None
Content-Type: application/json

{
  "planId": "plan_123",
  "phoneNumber": "09012345678",
  "email": "user@example.com"
}
```

#### Buy Airtime
```
POST /api/airtime/purchase
Authorization: Bearer <token>
Content-Type: application/json

{
  "networkId": "network_123",
  "amount": 500,
  "phoneNumber": "09012345678"
}
```

#### Get Transactions
```
GET /api/transactions?page=1&limit=20
Authorization: Bearer <token>
```

#### Check Transaction Status
```
GET /api/transactions/status?reference=REF123
Authorization: Bearer <token>
```

#### Get Rewards
```
GET /api/rewards
Authorization: Bearer <token>
```

## Performance Testing

### Load Testing with Apache Bench
```bash
# Basic load test
ab -n 1000 -c 100 https://api.example.com/api/data/networks

# With authentication
ab -n 1000 -c 100 -H "Authorization: Bearer TOKEN" \
  https://api.example.com/api/transactions
```

### Using k6
```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  let res = http.get('https://api.example.com/api/data/networks');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

## Security Testing

- [ ] SQL Injection - Test with special characters in input
- [ ] XSS - Verify HTML/JS in fields is escaped
- [ ] CSRF - Verify CSRF tokens on state-changing requests
- [ ] Rate Limiting - Exceed limits and verify 429 response
- [ ] Authorization - Test accessing resources with wrong user token
- [ ] Data Validation - Send invalid phone numbers, amounts, etc

## Manual Testing Checklist

### Authentication
- [ ] User can sign up with valid details
- [ ] User cannot sign up with existing phone number
- [ ] User can login with correct PIN
- [ ] User cannot login with wrong PIN
- [ ] User can logout
- [ ] Session persists on page refresh

### Data Purchase
- [ ] Networks load correctly
- [ ] Plans load when network selected
- [ ] User cannot purchase without sufficient balance
- [ ] Successful purchase creates transaction
- [ ] Transaction status updates correctly

### Airtime Purchase
- [ ] Can select different networks
- [ ] Can select predefined amounts
- [ ] Can enter custom amounts
- [ ] Amount validation works (50-50000)
- [ ] Phone number validation works

### Rewards
- [ ] Rewards display correctly
- [ ] Total rewards calculated correctly
- [ ] Unclaimed count accurate
- [ ] Claim functionality works

### Transactions
- [ ] History displays with pagination
- [ ] Filters work correctly
- [ ] Status badges show correct colors
- [ ] Can check single transaction status
- [ ] Manual verification works

## Browser Compatibility

- [ ] Chrome/Chromium (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Mobile Chrome/Safari
- [ ] Edge (latest version)

## Accessibility Testing

```bash
npm install --save-dev axe-core @axe-core/react
```

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG standards
- [ ] Focus indicators visible
- [ ] Form labels associated with inputs

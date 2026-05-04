# Elorge SPM — Sales Performance & Commission Intelligence Platform

Nigeria's first indigenous commission management system.

---

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- A Supabase account (free tier works)

### 1. Clone and Install
```bash
git clone https://github.com/your-org/elorge-spm.git
cd elorge-spm
pnpm install
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env
# Fill in your DATABASE_URL, NEXTAUTH_SECRET, and other values
```

### 3. Set Up the Database
```bash
# Generate Prisma client
pnpm db:generate

# Run migrations (creates all tables)
pnpm db:migrate

# Seed demo data
pnpm db:seed
```

### 4. Start Development
```bash
# Starts all apps in parallel (web + api)
pnpm dev
```

- **Web Dashboard**: http://localhost:3000
- **API**: http://localhost:4000
- **Prisma Studio**: `pnpm db:studio`

### 5. Demo Login Credentials
| Role    | Email                       | Password     |
|---------|-----------------------------|--------------|
| Admin   | admin@elorge-demo.com       | Password123! |
| Manager | manager@elorge-demo.com     | Password123! |
| Finance | finance@elorge-demo.com     | Password123! |
| Officer | sola@elorge-demo.com        | Password123! |

---

## Project Structure

```
elorge-spm/
├── apps/
│   ├── web/       → Next.js 14 dashboard (Vercel)
│   ├── api/       → Express REST API (Render)
│   └── mobile/    → Expo React Native (iOS + Android)
└── packages/
    ├── database/  → Prisma schema + migrations
    ├── engine/    → Commission calculation logic
    ├── shared/    → TypeScript types + constants
    ├── notifications/ → Push + email
    └── exports/   → Payroll Excel export
```

---

## Deployment

### Web (Vercel)
1. Push to GitHub
2. Connect repo to Vercel
3. Set root directory to `apps/web`
4. Add all env vars from `.env.example`
5. Deploy

### API (Render)
1. Create new Web Service in Render
2. Connect your GitHub repo
3. Root directory: `apps/api`
4. Build command: `pnpm install && pnpm build`
5. Start command: `node dist/index.js`
6. Add env vars

### Database (Supabase)
1. Create new project at supabase.com
2. Copy connection string to `DATABASE_URL`
3. Run: `pnpm db:migrate`

---

## Testing the Commission Engine
```bash
cd packages/engine
# The engine is pure TypeScript — no database needed
# Write unit tests in engine.test.ts
```

---

## Webhook Integration (for banks with core banking systems)
```
POST /webhooks/transaction
Header: x-elorge-signature: <HMAC-SHA256>

{
  "clientAccountNumber": "3012345678",
  "productCode": "FD-001",
  "value": 5000000,
  "externalRef": "BANK-TXN-001"
}
```

---

Built by Elorge Technologies Limited, Lagos, Nigeria.
© 2025 All Rights Reserved.

---

## Mobile App — Screens

| Screen | Purpose |
|--------|---------|
| LoginScreen | Email/password login + SSO option. Persists token on device. |
| HomeScreen | Commission total, rank, active leads, quick actions |
| LeadsScreen | Full pipeline with status filters + quick update buttons |
| LogLeadScreen | Log new prospect with product selector |
| MyClientsScreen | Full client portfolio with transaction history + remapping status |
| CommissionScreen | Month commission breakdown by transaction |
| ProfileScreen | User details, notification toggle, logout |

## Mobile Auth Flow

1. App launches → checks AsyncStorage for saved token
2. Token found → restore session, go to MainTabs
3. No token → show LoginScreen
4. Login success → save token + user to AsyncStorage → MainTabs
5. Logout → clear AsyncStorage + token → LoginScreen

## New API Endpoint (for mobile)
POST /api/auth/login       → { token, data: user }
POST /api/auth/logout      → clears session
POST /api/auth/register-push-token → saves Expo push token

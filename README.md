# Cheqq — Payroll & DeFi. Unified on Base.

Cheqq is a Next.js web application for borderless payroll, invoicing, and DeFi treasury management built on Base.

## Features

**For Companies (B2B)**
- Payroll management with batch payouts and loan deductions
- Invoice creation and payment link generation
- Treasury yield routing (Morpho / Aerodrome concepts)
- Employee lending/advances collateralized by future payroll

**For Freelancers (B2C)**
- Create and send invoices with payment links
- Accept crypto payments (USDC / IDRX)
- Withdraw to bank or crypto wallet
- Track payments and earnings

## Tech Stack

- **Framework:** Next.js 16.1.0 (App Router)
- **Frontend:** React 19.2.3, TypeScript, CSS Modules
- **Database:** PostgreSQL (Supabase) + Prisma ORM
- **Wallet:** OnchainKit, WalletConnect
- **Network:** Base Sepolia (testnet) / Base (mainnet)
- **Payments:** USDC, IDRX stablecoins

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- Supabase account (for database)

### Installation

```bash
npm install
```

### Environment Setup

Create `.env.local` with:

```env
# OnchainKit
NEXT_PUBLIC_ONCHAINKIT_CDP_KEY=your-key
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=Cheqq

# WalletConnect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-project-id

# Network (base-sepolia or base)
NEXT_PUBLIC_CHAIN=base-sepolia

# Supabase Database
DATABASE_URL="postgresql://..."
```

### Database Setup

```bash
npx prisma generate
npx prisma db push
```

### Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000`

## Routes

### Public
- `/` — Landing page
- `/get-started` — Role selection (Company or Freelancer)
- `/login` — Wallet-based login for returning users
- `/register/company` — Company registration with KYB
- `/register/freelancer` — Freelancer registration with KYC
- `/pay/[invoiceId]` — Payment page with USDC/IDRX support

### Company Dashboard
- `/dashboard` — Overview (balances, transactions, yield)
- `/dashboard/invoices` — Invoice management
- `/dashboard/invoices/new` — Create invoice
- `/dashboard/payroll` — Employee list and payroll stats
- `/dashboard/payroll/run` — Run batch payroll
- `/dashboard/employees` — Employee management
- `/dashboard/defi` — Treasury yield and lending
- `/dashboard/settings` — Company settings

### Freelancer Dashboard
- `/freelancer/dashboard` — Earnings overview
- `/freelancer/invoices` — Invoice management
- `/freelancer/invoices/new` — Create invoice
- `/freelancer/payments` — Payment history
- `/freelancer/withdraw` — Withdraw to bank/crypto
- `/freelancer/settings` — Profile settings

### API Endpoints
- `/api/auth/wallet` — Wallet authentication check
- `/api/companies` — Company CRUD
- `/api/freelancers` — Freelancer CRUD
- `/api/invoices` — Invoice management
- `/api/payments/status` — Payment status updates
- `/api/payroll` — Batch payroll execution
- `/api/webhooks/payment` — Payment webhooks

## Database Schema

**B2B Models:**
- Company, Employee, PayrollRun, PayrollItem, Loan, TreasuryBalance

**B2C Models:**
- Freelancer, Withdrawal

**Shared Models:**
- Invoice, Payment

## Authentication Flow

1. **New Users:** Click "Launch App" → Choose role → Complete KYB/KYC → Dashboard
2. **Returning Users:** Click "Sign In" → Connect wallet → Auto-redirect to dashboard

Wallet address is used as the unique identifier. Users cannot switch between Company and Freelancer roles.

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # Run ESLint
```

## Roadmap

- [x] Database integration (Prisma + Supabase)
- [x] Wallet authentication
- [x] KYB/KYC registration flow
- [x] Multi-currency support (USDC/IDRX)
- [ ] Smart contract deployment for batch payroll
- [ ] Real on-chain transactions
- [ ] Fiat off-ramp integration
- [ ] Production deployment

## License

Base Indonesia Hackathon 2025

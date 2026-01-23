# Cheqq — Payroll & DeFi. Unified on Base.

Cheqq is a BASE Blockchain web application for borderless payroll, invoicing, and DeFi treasury management built using Next.js.

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
- **Animations:** Framer Motion + Aceternity UI components
- **Database:** PostgreSQL (Supabase) + Prisma ORM
- **Auth:** Privy (email + embedded wallets)
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
# Privy
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id

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
- `/login` — Email or wallet-based login (Privy)
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

**Authentication**
- `/api/auth/wallet` — Wallet authentication check

**B2B APIs (Company Dashboard)**
- `/api/companies` — Company registration/auth
- `/api/employees` — List employees with salary/deductions
- `/api/payroll` — Batch payroll execution
- `/api/treasury` — Treasury balance management
- `/api/loans` — Employee salary advances
- `/api/defi/yield` — DeFi yield dashboard deposits
- `/api/analytics/invoices` — Invoice analytics and statistics

**B2C APIs (Freelancer)**
- `/api/freelancers` — Freelancer registration and management
- `/api/withdrawals` — Withdraw to bank or crypto wallet
- `/api/earnings` — Earnings balance by currency
- `/api/payout-settings` — Preferred payout method settings
- `/api/analytics/freelancer` — Freelancer dashboard analytics

**Shared APIs**
- `/api/invoices` — Invoice creation and management
- `/api/payments/status` — Payment status updates
- `/api/webhooks/payment` — Payment confirmation webhooks
- `/api/transfers` — On-chain USDC/token transfers
- `/api/offramp` — Fiat off-ramp quotes and withdrawals

## Database Schema

**B2B Models:**
- Company, Employee, PayrollRun, PayrollItem, Loan, TreasuryBalance

**B2C Models:**
- Freelancer, Withdrawal

**Shared Models:**
- Invoice, Payment

## Smart Contracts

| Network | Contract | Address |
|---------|----------|---------|
| Base Sepolia | CheqqPayroll | `0xb1946053637898a74d7C22c9Fc5f221B6DbB2a2e` |
| Base Mainnet | CheqqPayroll | TBD |

## Authentication Flow

1. **Email Signup:** Enter email → OTP verification → Auto smart wallet creation (Privy)
2. **Wallet Login:** Connect external wallet (MetaMask, Coinbase, etc.)
3. **New Users:** Choose role (Company/Freelancer) → Complete registration → Dashboard
4. **Returning Users:** Auto-redirect to appropriate dashboard

Wallet address is used as the unique identifier. Users cannot switch between Company and Freelancer roles.

## UI Components

Premium Aceternity UI components in `components/ui/`:

| Component | Effect |
|-----------|--------|
| `spotlight.tsx` | Mouse-following gradient |
| `flip-words.tsx` | Animated word cycling |
| `3d-card.tsx` | 3D perspective tilt |
| `hover-border-gradient.tsx` | Animated gradient buttons |
| `floating-navbar.tsx` | Hide/show on scroll |
| `bento-grid.tsx` | Modern grid layout |
| `wobble-card.tsx` | 3D tilt on hover |

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
- [x] B2B APIs (Treasury, Loans, Payroll, Analytics)
- [x] B2C APIs (Withdrawals, Earnings, Payout Settings)
- [x] DeFi yield integration (simulated)
- [x] Dashboard API integration (live data)
- [x] On-chain USDC transfers (CDP SDK)
- [x] Fiat off-ramp integration (simulated)
- [x] Smart contract deployment (CheqqPayroll on Base Sepolia)
- [x] Payroll UI → Smart Contract integration
- [x] Withdraw UI → Real balance + Off-ramp integration
- [x] Privy email signup + embedded wallets
- [x] Aceternity UI components (animations)
- [x] Supabase RLS security policies
- [ ] Production deployment (mainnet)

## License

Base Indonesia Hackathon 2026

# Cheqq — Payroll & DeFi. Unified on Tempo.

Cheqq is a blockchain web application for borderless payroll, invoicing, and DeFi treasury management built on the **Tempo Network** using Next.js.

> **Tempo Hackathon — Track 2: Stablecoin Infrastructure (Corporate Payroll Tools)**

## Features

**For Companies (B2B)**
- Payroll management with batch payouts and loan deductions
- Invoice creation and payment link generation
- Treasury yield routing (DeFi concepts)
- Employee lending/advances collateralized by future payroll

**For Freelancers (B2C)**
- Create and send invoices with payment links
- Accept crypto payments (AlphaUSD / BetaUSD)
- Withdraw to bank or crypto wallet
- Track payments and earnings

## Tech Stack

- **Framework:** Next.js 16.1.0 (App Router)
- **Frontend:** React 19.2.3, TypeScript, CSS Modules
- **Animations:** Framer Motion + Aceternity UI components
- **Database:** PostgreSQL (Supabase) + Prisma ORM
- **Auth:** Privy (email + embedded wallets)
- **Wallet:** WalletConnect, Injected Wallets
- **Network:** Tempo Testnet (Chain ID 42431)
- **Payments:** AlphaUSD, BetaUSD (TIP-20 stablecoins)
- **Smart Contracts:** Solidity (Foundry), deployed on Tempo Testnet

## Smart Contracts

| Network | Contract | Address |
|---------|----------|---------|
| Tempo Testnet | CheqqPayroll | `0x2c2c1b7A69A51470Ca1848893eb3aB960467bddD` |
| Tempo Testnet | CheqqGatedActions | `0xA6458724D242D8ff3552820d89dA3fb83761520a` |

### Token Addresses (TIP-20 Precompiles)

| Token | Address |
|-------|---------|
| AlphaUSD | `0x20C0000000000000000000000000000000000001` |
| BetaUSD | `0x20C0000000000000000000000000000000000002` |
| pathUSD | `0x20C0000000000000000000000000000000000000` |

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- Supabase account (for database)
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (for contract development)

### Installation

```bash
npm install
```

### Environment Setup

Create `.env.local` with:

```env
# Tempo Testnet
NEXT_PUBLIC_CHAIN=tempo-testnet
NEXT_PUBLIC_TEMPO_RPC_URL=https://rpc.moderato.tempo.xyz

# Privy
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id

# WalletConnect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-project-id

# Deployed Contracts (Tempo Testnet)
NEXT_PUBLIC_CHEQQ_PAYROLL_ADDRESS=0x2c2c1b7A69A51470Ca1848893eb3aB960467bddD
CHEQQ_GATED_ACTIONS_ADDRESS=0xA6458724D242D8ff3552820d89dA3fb83761520a
NEXT_PUBLIC_CHEQQ_GATED_ACTIONS_ADDRESS=0xA6458724D242D8ff3552820d89dA3fb83761520a

# Supabase Database
DATABASE_URL="postgresql://..."

# Supabase Storage (KYC/KYB uploads)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_STORAGE_BUCKET="kyc-documents"

# EIP-712 permit signer (backend wallet for signing permits)
PERMIT_SIGNER_PRIVATE_KEY=your-permit-signer-key
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
- `/pay/[invoiceId]` — Payment page with AlphaUSD/BetaUSD support

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
- `/api/transfers` — On-chain TIP-20 token transfers
- `/api/permit` — EIP-712 permit signing for gated actions
- `/api/offramp` — Fiat off-ramp quotes and withdrawals

## Database Schema

**B2B Models:**
- Company, Employee, PayrollRun, PayrollItem, Loan, TreasuryBalance

**B2C Models:**
- Freelancer, Withdrawal

**Shared Models:**
- Invoice, Payment

**Currency Enum:** `AlphaUSD`, `BetaUSD`, `pathUSD`

## Authentication Flow

1. **Email Signup:** Enter email → OTP verification → Auto smart wallet creation (Privy)
2. **Wallet Login:** Connect external wallet (MetaMask, etc.)
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

## Contract Deployment (Tempo Testnet)

Tempo requires **legacy (type 0) transactions** for contract deployment. Use `cast send --legacy --create` instead of `forge script`:

```bash
cd contracts
source .env
INIT_CODE=$(forge inspect src/CheqqPayroll.sol:CheqqPayroll bytecode)$(cast abi-encode "constructor(address)" $DEPLOYER_ADDRESS | sed 's/0x//')
cast send --legacy --rpc-url https://rpc.moderato.tempo.xyz --private-key $PRIVATE_KEY --create $INIT_CODE
```

> **Note:** Tempo charges gas fees in AlphaUSD (TIP-20) rather than native ETH.

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # Run ESLint
node scripts/lowercase-wallets.mjs # Normalize wallet casing in DB
```

## Roadmap

- [x] Database integration (Prisma + Supabase)
- [x] Wallet authentication (Privy)
- [x] KYB/KYC registration flow
- [x] Multi-currency support (AlphaUSD/BetaUSD)
- [x] B2B APIs (Treasury, Loans, Payroll, Analytics)
- [x] B2C APIs (Withdrawals, Earnings, Payout Settings)
- [x] DeFi yield integration (simulated)
- [x] Dashboard API integration (live data)
- [x] On-chain TIP-20 transfers (viem)
- [x] Fiat off-ramp integration (simulated)
- [x] Smart contract deployment (CheqqPayroll + CheqqGatedActions on Tempo Testnet)
- [x] Payroll UI → Smart Contract integration
- [x] Withdraw UI → Real balance + Off-ramp integration
- [x] Privy email signup + embedded wallets
- [x] Aceternity UI components (animations)
- [x] Supabase RLS security policies
- [x] EIP-712 permit-based gated actions
- [x] Tempo Hackathon integration (Track 2: Stablecoin Infrastructure)
- [ ] Production deployment (mainnet)

## License

Tempo Hackathon 2026

# Cheqq — Payroll & DeFi. Unified on Base.

OiOi. Prof. NOTA v11.11 reporting in.

Cheqq is a Next.js (App Router) product prototype for:
- invoice management + payment links (USDC / IDRX)
- borderless payroll runs (batch payouts, loan deductions)
- treasury yield routing (e.g. Morpho / Aerodrome concepts)
- employee lending/advances collateralized by future payroll (concept)

This repo is currently a **frontend/UI prototype** (mock data + simulated actions). The smart-contract architecture is documented in flowcharts; it is not implemented here.

## Quickstart (Local Lab)

Prereqs:
- Node.js (18+ recommended)
- npm (this repo has `package-lock.json`)

Run:
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## What’s Inside (Syllabus)

**Landing**
- `/` — marketing/overview sections (Navbar, Hero, Products, How It Works, Advantages, Partners, CTA)

**Company (Admin)**
- `/dashboard` — overview (balances, transactions, yield, loans)
- `/dashboard/invoices` — invoices list + filters + payment link copy
- `/dashboard/invoices/new` — invoice creation → payment link modal
- `/dashboard/payroll` — employees list + payroll stats
- `/dashboard/payroll/run` — multi-step “Run Payroll” flow (select → confirm → success)
- `/dashboard/defi` — treasury yield + employee lending widgets
- `/dashboard/settings` — company/wallet/payroll/notifications settings (mock save)

**Freelancer**
- `/freelancer/dashboard` — earnings + recent activity
- `/freelancer/invoices` + `/freelancer/invoices/new` — invoice flows (mock)
- `/freelancer/payments` — payments list (mock)
- `/freelancer/withdraw` — withdraw stablecoins → fiat (simulated)
- `/freelancer/settings` — profile/preferences (mock)

## Tech Stack (Tools of the Trade)

- Next.js `16.1.0` (App Router)
- React `19.2.3`
- TypeScript `^5`
- CSS Modules + global design system in `app/globals.css`
- Icons: `lucide-react`
- Linting: ESLint `^9` + `eslint-config-next`

## Project Map (Where Things Live)

- `app/` — routes (Next.js App Router)
- `components/` — UI building blocks (landing, dashboard, freelancer)
- `public/` — static assets
- `excalidraw-flow-chart/` — architecture + flows

## Flowcharts & Architecture Notes

- Mermaid + notes: `excalidraw-flow-chart/payfi_flowcharts.md`
- Excalidraw diagrams:
  - `excalidraw-flow-chart/system-architecture.excalidraw`
  - `excalidraw-flow-chart/onboarding-flow.excalidraw`
  - `excalidraw-flow-chart/invoice-flow.excalidraw`
  - `excalidraw-flow-chart/payroll-flow.excalidraw`
  - `excalidraw-flow-chart/defi-yield-flow.excalidraw`
  - `excalidraw-flow-chart/employee-lending-flow.excalidraw`

## Notes from Prof. NOTA (Reality Check)

- All “API calls” and “transactions” are simulated with timeouts and mock state.
- Payment links shown in the UI are generated client-side (demo behavior).
- Wallet connection, Base L2 interactions, stablecoin contracts, and protocol integrations are not wired up yet.

## Scripts (Press the Buttons)

- `npm run dev` — run locally
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — lint

## Roadmap (Homework)

- Add real data layer (API + persistence)
- Add wallet connect + on-chain reads/writes (Base)
- Implement invoice + payroll + treasury modules (contracts or service layer)
- Replace mock flows with real transaction state + error handling

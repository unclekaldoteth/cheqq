# Cheqq - System Flow Charts

## 1. High-Level System Architecture

```mermaid
flowchart TB
    subgraph Users["👥 Users"]
        Company["🏢 Company Admin"]
        Employee["👤 Employee"]
    end

    subgraph Frontend["🖥️ Frontend (Next.js)"]
        Landing["Landing Page"]
        Dashboard["Dashboard"]
        InvoiceUI["Invoice Manager"]
        PayrollUI["Payroll Manager"]
        DefiUI["DeFi Manager"]
    end

    subgraph Blockchain["⛓️ Tempo Network"]
        subgraph Contracts["Smart Contracts"]
            PayrollContract["CheqqPayroll"]
            GatedActions["CheqqGatedActions"]
        end
        
        subgraph Tokens["TIP-20 Tokens"]
            AlphaUSD["AlphaUSD"]
            BetaUSD["BetaUSD"]
            PathUSD["pathUSD"]
        end
    end

    subgraph Backend["🔧 Backend (Next.js API)"]
        PermitSigner["EIP-712 Permit Signer"]
        Database["PostgreSQL (Prisma)"]
    end

    Company --> Dashboard
    Employee --> Dashboard
    Dashboard --> InvoiceUI
    Dashboard --> PayrollUI
    Dashboard --> DefiUI

    PayrollUI --> PayrollContract
    PayrollUI --> PermitSigner
    PermitSigner --> GatedActions
    
    PayrollContract --> Tokens
    GatedActions --> PermitSigner
    
    InvoiceUI --> Backend
    Backend --> Database
```

---

## 2. Company Onboarding Flow

```mermaid
flowchart LR
    A["🏢 Company"] --> B["Connect Wallet\n(Privy / Injected)"]
    B --> C{"KYB Verified?"}
    C -->|No| D["Submit KYB\nDocumentation"]
    C -->|Yes| E["Sign In"]
    D --> E
    E --> F["Setup Company Profile"]
    F --> G["Add Employees"]
    G --> H["Fund Treasury\n(AlphaUSD/BetaUSD)"]
    H --> I["✅ Ready to Use"]
```

---

## 3. Invoice Management Flow

```mermaid
flowchart TB
    subgraph Create["📝 Create Invoice"]
        A1["Company creates invoice"] --> A2["Add client details"]
        A2 --> A3["Set amount & currency\n(AlphaUSD/BetaUSD)"]
        A3 --> A4["Generate payment link"]
    end

    subgraph Pay["💳 Payment"]
        B1["Client receives link"] --> B2["Connect wallet or\nlogin with Privy"]
        B2 --> B3{"Payment Method"}
        B3 -->|Crypto| B4["Pay with AlphaUSD/BetaUSD"]
        B3 -->|Fiat| B5["On-ramp to Stablecoin"]
        B4 --> B6["TIP-20 Transfer\non Tempo"]
        B5 --> B6
    end

    subgraph Settle["✅ Settlement"]
        C1["Payment confirmed on-chain"] --> C2["Funds sent to\nCompany Treasury"]
        C2 --> C3["Invoice marked PAID"]
        C3 --> C4["Notification sent"]
    end

    A4 --> B1
    B6 --> C1
```

---

## 4. Payroll Disbursement Flow

```mermaid
flowchart TB
    subgraph Setup["⚙️ Setup"]
        A1["Add employees"] --> A2["Set salary amounts"]
        A2 --> A3["Set pay frequency\n(Weekly/Monthly)"]
        A3 --> A4["Choose currency\n(AlphaUSD/BetaUSD)"]
    end

    subgraph Execute["🚀 Execute Payroll"]
        B1["Admin initiates payroll\nor scheduled trigger"] --> B2["Calculate total amount"]
        B2 --> B3{"Sufficient\nTreasury Balance?"}
        B3 -->|No| B4["Alert: Add funds"]
        B3 -->|Yes| B5["Generate batch transaction"]
        B5 --> B6["Admin signs transaction"]
    end

    subgraph Distribute["💸 Distribution"]
        C1["CheqqPayroll contract\nexecutes batch"] --> C2["Deduct any loan\nrepayments"]
        C2 --> C3["Transfer net salary\nto each employee"]
        C3 --> C4["Update records"]
        C4 --> C5["Send notifications"]
    end

    A4 --> B1
    B6 --> C1
```

---

## 5. DeFi Yield Generation Flow

```mermaid
flowchart TB
    subgraph Deposit["📥 Deposit"]
        A1["Company has idle\ntreasury funds"] --> A2["Choose yield protocol"]
        A2 --> A3["Select amount to deposit"]
        A3 --> A4["Approve & Deposit"]
    end

    subgraph Earn["📈 Earning"]
        B1["Funds deposited in\nDeFi protocol"] --> B2["Earn yield\n(4-8% APY)"]
        B2 --> B3{"Auto-compound\nenabled?"}
        B3 -->|Yes| B4["Rewards reinvested\ndaily"]
        B3 -->|No| B5["Rewards claimable\nmanually"]
        B4 --> B2
    end

    subgraph Withdraw["📤 Withdraw"]
        C1["Company needs funds\nfor payroll"] --> C2["Initiate withdrawal"]
        C2 --> C3["Funds returned\nto Treasury"]
        C3 --> C4["Available for\npayroll/invoices"]
    end

    A4 --> B1
    B5 --> C1
```

---

## 6. Employee Lending Flow (Key DeFi Feature)

```mermaid
flowchart TB
    subgraph Request["📋 Loan Request"]
        A1["Employee requests\nsalary advance"] --> A2["Specify amount\n(max 50% of salary)"]
        A2 --> A3["System calculates\nrepayment terms"]
        A3 --> A4["Employee accepts terms"]
    end

    subgraph Approval["✅ Approval"]
        B1["Request sent to\nCompany Admin"] --> B2{"Admin Review"}
        B2 -->|Approve| B3["Loan recorded\nin database"]
        B2 -->|Reject| B4["Employee notified"]
        B3 --> B5["Loan funds sent\nto Employee"]
    end

    subgraph Collateral["🔒 Collateral"]
        C1["Future salary is\nlocked as collateral"] --> C2["Collateral ratio:\n150% of loan"]
        C2 --> C3["If employee leaves:\nLoan deducted from\nfinal payout"]
    end

    subgraph Repayment["💰 Repayment"]
        D1["Next payroll runs"] --> D2["Automatic deduction\nfrom salary"]
        D2 --> D3["Loan balance\nupdated"]
        D3 --> D4{"Loan fully\nrepaid?"}
        D4 -->|No| D1
        D4 -->|Yes| D5["Collateral released\nLoan closed"]
    end

    A4 --> B1
    B5 --> C1
    C3 --> D1
```

---

## 7. EIP-712 Permit Flow (Gated Actions)

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant F as 🖥️ Frontend
    participant B as 🔧 Backend API
    participant GA as 📜 CheqqGatedActions
    participant T as ⛓️ Tempo

    U->>F: Initiate action (e.g., payroll)
    F->>B: POST /api/permit
    B->>B: Verify wallet registration
    B->>B: Generate nonce
    B->>B: Sign EIP-712 permit
    B-->>F: Return signed permit
    F->>GA: verifyAndUsePermit(permit, signature)
    GA->>GA: Verify signature matches permitSigner
    GA->>GA: Check nonce not used
    GA->>GA: Check not expired
    GA->>GA: Mark nonce as used
    GA-->>T: Emit PermitUsed event
    T-->>F: Transaction confirmed
    F-->>U: Action completed ✅
```

---

## 8. Complete Transaction Flow (End-to-End)

```mermaid
sequenceDiagram
    participant C as 🏢 Company
    participant F as 🖥️ Frontend
    participant API as 🔧 API Server
    participant SC as 📜 CheqqPayroll
    participant T as ⛓️ Tempo
    participant E as 👤 Employee

    Note over C,E: === Treasury Management ===
    C->>F: Deposit $50,000 AlphaUSD
    F->>T: TIP-20 Transfer to Treasury
    T-->>F: Confirm deposit
    F-->>C: Balance updated

    Note over C,E: === Employee Loan ===
    E->>F: Request $1,500 advance
    F->>API: POST /api/loans
    API->>API: Record loan in database
    API-->>F: Loan approved
    F->>T: Transfer AlphaUSD to Employee
    T-->>E: Funds received

    Note over C,E: === Payroll ===
    C->>F: Run monthly payroll
    F->>SC: executePayroll(batch)
    loop For each employee
        SC->>SC: Calculate net salary
        SC->>SC: Deduct loan repayment
        SC->>E: Transfer net amount
    end
    SC-->>F: Payroll complete
    F-->>C: Report generated
```

---

## 9. Smart Contract Architecture

```mermaid
flowchart TB
    subgraph Core["Cheqq Contracts"]
        Payroll["CheqqPayroll\n(Batch Payments)"]
        Gated["CheqqGatedActions\n(EIP-712 Permits)"]
    end

    subgraph Access["Access Control"]
        Owner["Ownable (Admin)"]
        PermitSigner["Permit Signer"]
        CompanyReg["Company Registry"]
    end

    subgraph Tokens["TIP-20 Token Support"]
        AlphaUSD["AlphaUSD"]
        BetaUSD["BetaUSD"]
        PathUSD["pathUSD"]
    end

    subgraph Security["Security"]
        Reentrancy["ReentrancyGuard"]
        SafeERC20["SafeERC20"]
        NonceTracking["Nonce Tracking"]
    end

    Owner --> Payroll
    Owner --> Gated
    PermitSigner --> Gated
    CompanyReg --> Payroll

    Payroll --> Tokens
    Payroll --> Reentrancy
    Payroll --> SafeERC20
    Gated --> NonceTracking
```

---

## 10. User Journey Map

```mermaid
journey
    title Cheqq User Journey
    section Onboarding
      Connect Wallet: 5: Company
      Create Profile: 4: Company
      Add Employees: 4: Company
      Fund Treasury: 5: Company
    section Daily Operations
      Create Invoice: 5: Company
      Client Pays Invoice: 5: Client
      View Dashboard: 5: Company
      Request Salary Advance: 4: Employee
    section Monthly Tasks
      Run Payroll: 5: Company
      Review Yield: 4: Company
      Generate Reports: 4: Company
    section Growth
      Increase DeFi Deposits: 4: Company
      Add More Employees: 4: Company
      Expand to Multi-chain: 3: Company
```

---

## Summary

| Flow | Description |
|------|-------------|
| **Onboarding** | Company connects wallet (Privy) → completes KYB → sets up profile |
| **Invoice** | Create invoice → client pays via link → instant TIP-20 settlement |
| **Payroll** | Set schedules → batch payments via CheqqPayroll → auto loan deductions |
| **DeFi Yield** | Deposit treasury → earn APY → compound or withdraw |
| **Employee Lending** | Request advance → collateralized by salary → auto repayment |
| **Gated Actions** | Backend signs EIP-712 permit → on-chain verification via CheqqGatedActions |

---

> 💡 **Key Innovation**: Employee loans are collateralized by **future payroll**, creating a unique DeFi primitive that reduces risk while providing employees with financial flexibility. Built on **Tempo** with TIP-20 stablecoins for low-cost, fast transactions.

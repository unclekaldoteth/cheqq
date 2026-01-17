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

    subgraph Blockchain["⛓️ Base L2"]
        subgraph Contracts["Smart Contracts"]
            CheqqCore["Cheqq Core"]
            InvoiceContract["Invoice Contract"]
            PayrollContract["Payroll Contract"]
            LendingContract["Employee Lending"]
            TreasuryVault["Treasury Vault"]
        end
        
        subgraph Tokens["Tokens"]
            USDC["USDC"]
            IDRX["IDRX"]
            ETH["ETH"]
        end
    end

    subgraph DeFiProtocols["📈 DeFi Protocols"]
        Morpho["Morpho (Lending)"]
        Aero["Aerodrome (DEX)"]
    end

    Company --> Dashboard
    Employee --> Dashboard
    Dashboard --> InvoiceUI
    Dashboard --> PayrollUI
    Dashboard --> DefiUI

    InvoiceUI --> InvoiceContract
    PayrollUI --> PayrollContract
    DefiUI --> LendingContract
    DefiUI --> TreasuryVault

    TreasuryVault --> Morpho
    TreasuryVault --> Aero
    
    PayrollContract --> Tokens
    InvoiceContract --> Tokens
    LendingContract --> Tokens
```

---

## 2. Company Onboarding Flow

```mermaid
flowchart LR
    A["🏢 Company"] --> B["Connect Wallet"]
    B --> C{"Has Smart Account?"}
    C -->|No| D["Create Smart Account\n(Account Abstraction)"]
    C -->|Yes| E["Sign In"]
    D --> E
    E --> F["Setup Company Profile"]
    F --> G["Add Employees"]
    G --> H["Fund Treasury\n(USDC/IDRX)"]
    H --> I["✅ Ready to Use"]
```

---

## 3. Invoice Management Flow

```mermaid
flowchart TB
    subgraph Create["📝 Create Invoice"]
        A1["Company creates invoice"] --> A2["Add client details"]
        A2 --> A3["Set amount & currency\n(USDC/IDRX)"]
        A3 --> A4["Generate payment link"]
    end

    subgraph Pay["💳 Payment"]
        B1["Client receives link"] --> B2["Connect wallet or\npay with card"]
        B2 --> B3{"Payment Method"}
        B3 -->|Crypto| B4["Pay with USDC/IDRX"]
        B3 -->|Fiat| B5["Onramp to Stablecoin"]
        B4 --> B6["Smart Contract\nprocesses payment"]
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
        A3 --> A4["Choose currency\n(USDC/IDRX)"]
    end

    subgraph Execute["🚀 Execute Payroll"]
        B1["Admin initiates payroll\nor scheduled trigger"] --> B2["Calculate total amount"]
        B2 --> B3{"Sufficient\nTreasury Balance?"}
        B3 -->|No| B4["Alert: Add funds"]
        B3 -->|Yes| B5["Generate batch transaction"]
        B5 --> B6["Admin signs transaction"]
    end

    subgraph Distribute["💸 Distribution"]
        C1["Smart Contract\nexecutes batch"] --> C2["Deduct any loan\nrepayments"]
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
        A1["Company has idle\ntreasury funds"] --> A2["Choose protocol\n(Morpho/Aerodrome)"]
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
        B2 -->|Approve| B3["Smart Contract\ncreates loan"]
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

## 7. Complete Transaction Flow (End-to-End)

```mermaid
sequenceDiagram
    participant C as 🏢 Company
    participant F as 🖥️ Frontend
    participant SC as 📜 Smart Contract
    participant M as 🦋 Morpho
    participant E as 👤 Employee

    Note over C,E: === Treasury Management ===
    C->>F: Deposit $50,000 USDC
    F->>SC: Treasury.deposit()
    SC->>M: Deposit to yield vault
    M-->>SC: Receive yield tokens
    SC-->>F: Confirm deposit
    F-->>C: Balance updated

    Note over C,E: === Employee Loan ===
    E->>F: Request $1,500 advance
    F->>SC: Lending.requestLoan()
    SC->>SC: Lock future salary as collateral
    SC->>E: Transfer $1,500 USDC
    SC-->>F: Loan created
    F-->>E: Funds received

    Note over C,E: === Payroll ===
    C->>F: Run monthly payroll
    F->>SC: Payroll.executeBatch()
    SC->>M: Withdraw required funds
    M-->>SC: Return USDC
    loop For each employee
        SC->>SC: Calculate net salary
        SC->>SC: Deduct loan repayment
        SC->>E: Transfer net amount
    end
    SC-->>F: Payroll complete
    F-->>C: Report generated
```

---

## 8. Smart Contract Architecture

```mermaid
flowchart TB
    subgraph Core["Cheqq Core"]
        Registry["Company Registry"]
        Access["Access Control"]
    end

    subgraph Modules["Feature Modules"]
        Invoice["Invoice Module"]
        Payroll["Payroll Module"]
        Lending["Lending Module"]
        Treasury["Treasury Module"]
    end

    subgraph External["External Integrations"]
        Morpho["Morpho Vault"]
        Aero["Aerodrome Pool"]
        Chainlink["Chainlink Price Feeds"]
    end

    subgraph Tokens["Token Support"]
        USDC["USDC"]
        IDRX["IDRX"]
    end

    Registry --> Invoice
    Registry --> Payroll
    Registry --> Lending
    Registry --> Treasury

    Access --> Invoice
    Access --> Payroll
    Access --> Lending
    Access --> Treasury

    Treasury --> Morpho
    Treasury --> Aero
    
    Lending --> Chainlink
    Invoice --> Tokens
    Payroll --> Tokens
    Lending --> Tokens
```

---

## 9. User Journey Map

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
| **Onboarding** | Company connects wallet → creates smart account → sets up profile |
| **Invoice** | Create invoice → client pays via link → instant settlement |
| **Payroll** | Set schedules → batch payments → auto loan deductions |
| **DeFi Yield** | Deposit treasury → earn APY → compound or withdraw |
| **Employee Lending** | Request advance → collateralized by salary → auto repayment |

---

> 💡 **Key Innovation**: Employee loans are collateralized by **future payroll**, creating a unique DeFi primitive that reduces risk while providing employees with financial flexibility.

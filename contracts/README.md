# Cheqq Smart Contracts

Solidity smart contracts for batch payroll payments and permit-gated actions on the **Tempo** blockchain.

## Overview

### CheqqPayroll

The `CheqqPayroll` contract enables companies to pay multiple employees in a single transaction using TIP-20 stablecoins (AlphaUSD, BetaUSD, pathUSD).

**Features:**
- **Batch Payments**: Pay up to 100 recipients in one transaction
- **Token Whitelist**: Only approved TIP-20 tokens can be used
- **Company Registration**: Only registered companies can execute payroll
- **Duplicate Prevention**: Each payroll ID can only be executed once
- **Optional Fees**: Configurable fee system (default 0%)
- **Gas Optimized**: Designed for Tempo's low-cost transactions

### CheqqGatedActions

The `CheqqGatedActions` contract provides EIP-712 permit verification for gated actions. It allows the backend to sign short-lived permits that authorize on-chain operations.

**Features:**
- **EIP-712 Permits**: Typed data signing for secure authorization
- **Nonce Tracking**: Prevents permit replay attacks
- **Wallet Registration**: On-chain wallet allowlisting
- **No EAS Dependency**: Simplified for Tempo (attestation checks are database-level)

## Contract Addresses

| Network | Contract | Address |
|---------|----------|---------|
| Tempo Testnet | CheqqPayroll | `0x2c2c1b7A69A51470Ca1848893eb3aB960467bddD` |
| Tempo Testnet | CheqqGatedActions | `0xA6458724D242D8ff3552820d89dA3fb83761520a` |

### Whitelisted Tokens

| Token | Address | Decimals |
|-------|---------|----------|
| AlphaUSD | `0x20C0000000000000000000000000000000000001` | 18 |
| BetaUSD | `0x20C0000000000000000000000000000000000002` | 18 |
| pathUSD | `0x20C0000000000000000000000000000000000000` | 18 |

## Development

### Prerequisites
- [Foundry](https://book.getfoundry.sh/getting-started/installation)

### Install Dependencies
```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
```

### Build
```bash
forge build
```

### Test
```bash
forge test -vvv
```

## Deployment (Tempo Testnet)

> **Important:** Tempo requires **legacy (type 0) transactions** for contract deployment. Standard `forge script` CREATE transactions may revert. Use `cast send --legacy --create` instead.

### 1. Set up environment

Create `contracts/.env`:
```env
PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY
```

### 2. Deploy CheqqPayroll

```bash
source .env
DEPLOYER=$(cast wallet address $PRIVATE_KEY)

INIT_CODE=$(forge inspect src/CheqqPayroll.sol:CheqqPayroll bytecode)$(cast abi-encode "constructor(address)" $DEPLOYER | sed 's/0x//')

cast send --legacy \
  --rpc-url https://rpc.moderato.tempo.xyz \
  --private-key $PRIVATE_KEY \
  --create $INIT_CODE
```

### 3. Deploy CheqqGatedActions

```bash
INIT_CODE=$(forge inspect src/CheqqGatedActions.sol:CheqqGatedActions bytecode)$(cast abi-encode "constructor(address,address)" $DEPLOYER $DEPLOYER | sed 's/0x//')

cast send --legacy \
  --rpc-url https://rpc.moderato.tempo.xyz \
  --private-key $PRIVATE_KEY \
  --create $INIT_CODE
```

### 4. Configure CheqqPayroll

After deployment, whitelist tokens and register your company:

```bash
PAYROLL_ADDR=0x_YOUR_DEPLOYED_PAYROLL_ADDRESS

# Whitelist AlphaUSD
cast send --legacy --rpc-url https://rpc.moderato.tempo.xyz --private-key $PRIVATE_KEY \
  $PAYROLL_ADDR "setTokenWhitelist(address,bool)" \
  0x20C0000000000000000000000000000000000001 true

# Whitelist BetaUSD
cast send --legacy --rpc-url https://rpc.moderato.tempo.xyz --private-key $PRIVATE_KEY \
  $PAYROLL_ADDR "setTokenWhitelist(address,bool)" \
  0x20C0000000000000000000000000000000000002 true

# Whitelist pathUSD
cast send --legacy --rpc-url https://rpc.moderato.tempo.xyz --private-key $PRIVATE_KEY \
  $PAYROLL_ADDR "setTokenWhitelist(address,bool)" \
  0x20C0000000000000000000000000000000000000 true

# Register deployer as company
cast send --legacy --rpc-url https://rpc.moderato.tempo.xyz --private-key $PRIVATE_KEY \
  $PAYROLL_ADDR "setCompanyRegistration(address,bool)" \
  $DEPLOYER true
```

### 5. Update environment variables

Update `.env.local` in the project root:
```env
NEXT_PUBLIC_CHEQQ_PAYROLL_ADDRESS=0x_DEPLOYED_PAYROLL_ADDRESS
CHEQQ_GATED_ACTIONS_ADDRESS=0x_DEPLOYED_GATED_ACTIONS_ADDRESS
NEXT_PUBLIC_CHEQQ_GATED_ACTIONS_ADDRESS=0x_DEPLOYED_GATED_ACTIONS_ADDRESS
```

## Usage

### 1. Register Company
```solidity
payroll.setCompanyRegistration(companyAddress, true);
```

### 2. Approve Token Spending
```solidity
alphaUSD.approve(payrollAddress, totalAmount);
```

### 3. Execute Payroll
```solidity
CheqqPayroll.PaymentItem[] memory payments = new CheqqPayroll.PaymentItem[](2);
payments[0] = CheqqPayroll.PaymentItem(employee1, 1000 * 10**18);
payments[1] = CheqqPayroll.PaymentItem(employee2, 2000 * 10**18);

payroll.executePayroll(payrollId, alphaUSDAddress, payments);
```

## Security

- Uses OpenZeppelin's `SafeERC20` for secure token transfers
- `ReentrancyGuard` prevents reentrancy attacks
- `Ownable` for admin access control
- Payroll ID tracking prevents duplicate payments
- EIP-712 typed data signing for permit verification
- Nonce tracking prevents permit replay attacks

## Tempo-Specific Notes

- **Gas Fees:** Tempo charges gas fees in AlphaUSD (TIP-20), not native ETH
- **Transaction Type:** Use legacy (type 0) transactions for contract deployment
- **RPC:** `https://rpc.moderato.tempo.xyz`
- **Chain ID:** `42431`
- **Explorer:** `https://explore.tempo.xyz`

## License

MIT

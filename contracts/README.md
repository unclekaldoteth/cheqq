# CheqqPayroll Smart Contracts

Solidity smart contracts for batch payroll payments on Base blockchain.

## Overview

The `CheqqPayroll` contract enables companies to pay multiple employees in a single transaction using USDC or other ERC-20 tokens.

### Features
- **Batch Payments**: Pay up to 100 recipients in one transaction
- **Token Whitelist**: Only approved tokens can be used
- **Company Registration**: Only registered companies can execute payroll
- **Duplicate Prevention**: Each payroll ID can only be executed once
- **Optional Fees**: Configurable fee system (default 0%)
- **Gas Optimized**: Designed for Base L2 low fees

## Contract Addresses

| Network | Contract | Address |
|---------|----------|---------|
| Base Sepolia | CheqqPayroll | `0xb1946053637898a74d7C22c9Fc5f221B6DbB2a2e` |
| Base Mainnet | CheqqPayroll | TBD |

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

### Deploy (Base Sepolia)
```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Deploy
forge script script/DeployCheqqPayroll.s.sol:DeployCheqqPayroll \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

## Usage

### 1. Register Company
```solidity
payroll.setCompanyRegistration(companyAddress, true);
```

### 2. Approve Token Spending
```solidity
usdc.approve(payrollAddress, totalAmount);
```

### 3. Execute Payroll
```solidity
CheqqPayroll.PaymentItem[] memory payments = new CheqqPayroll.PaymentItem[](2);
payments[0] = CheqqPayroll.PaymentItem(employee1, 1000 * 10**6);
payments[1] = CheqqPayroll.PaymentItem(employee2, 2000 * 10**6);

payroll.executePayroll(payrollId, usdcAddress, payments);
```

## Security

- Uses OpenZeppelin's `SafeERC20` for secure token transfers
- `ReentrancyGuard` prevents reentrancy attacks
- `Ownable` for admin access control
- Payroll ID tracking prevents duplicate payments

## License

MIT

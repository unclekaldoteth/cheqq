// CheqqPayroll Smart Contract Configuration

export const CHEQQ_PAYROLL_ADDRESSES = {
    'base': '0x0000000000000000000000000000000000000000' as `0x${string}`, // TODO: Deploy to mainnet
    'base-sepolia': '0xb1946053637898a74d7C22c9Fc5f221B6DbB2a2e' as `0x${string}`,
} as const;

// Contract ABI (essential functions only)
export const CHEQQ_PAYROLL_ABI = [
    // Read functions
    {
        name: 'whitelistedTokens',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'token', type: 'address' }],
        outputs: [{ name: '', type: 'bool' }],
    },
    {
        name: 'registeredCompanies',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'company', type: 'address' }],
        outputs: [{ name: '', type: 'bool' }],
    },
    {
        name: 'executedPayrolls',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'payrollId', type: 'bytes32' }],
        outputs: [{ name: '', type: 'bool' }],
    },
    {
        name: 'feeBps',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'calculatePayrollTotal',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            {
                name: 'payments',
                type: 'tuple[]',
                components: [
                    { name: 'recipient', type: 'address' },
                    { name: 'amount', type: 'uint256' },
                ],
            },
        ],
        outputs: [
            { name: 'totalAmount', type: 'uint256' },
            { name: 'feeAmount', type: 'uint256' },
            { name: 'totalRequired', type: 'uint256' },
        ],
    },
    {
        name: 'isPayrollExecuted',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'payrollId', type: 'bytes32' }],
        outputs: [{ name: '', type: 'bool' }],
    },
    // Write functions
    {
        name: 'executePayroll',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'payrollId', type: 'bytes32' },
            { name: 'token', type: 'address' },
            {
                name: 'payments',
                type: 'tuple[]',
                components: [
                    { name: 'recipient', type: 'address' },
                    { name: 'amount', type: 'uint256' },
                ],
            },
        ],
        outputs: [],
    },
    // Events
    {
        name: 'PayrollExecuted',
        type: 'event',
        inputs: [
            { name: 'payrollId', type: 'bytes32', indexed: true },
            { name: 'company', type: 'address', indexed: true },
            { name: 'token', type: 'address', indexed: true },
            { name: 'totalAmount', type: 'uint256', indexed: false },
            { name: 'recipientCount', type: 'uint256', indexed: false },
        ],
    },
    {
        name: 'PaymentSent',
        type: 'event',
        inputs: [
            { name: 'payrollId', type: 'bytes32', indexed: true },
            { name: 'recipient', type: 'address', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false },
        ],
    },
] as const;

/**
 * Get CheqqPayroll contract address for current network
 */
export function getCheqqPayrollAddress(): `0x${string}` {
    const network = (process.env.NEXT_PUBLIC_CHAIN || 'base-sepolia') as 'base' | 'base-sepolia';
    return CHEQQ_PAYROLL_ADDRESSES[network];
}

/**
 * Generate unique payroll ID from payroll run ID
 */
export function generatePayrollId(payrollRunId: string): `0x${string}` {
    // Create a deterministic bytes32 hash from the payroll run ID
    const encoder = new TextEncoder();
    const data = encoder.encode(`CHEQQ-PAYROLL-${payrollRunId}`);

    // Simple hash for demo (in production use keccak256)
    let hash = BigInt(0);
    for (let i = 0; i < data.length; i++) {
        hash = ((hash << BigInt(5)) - hash) + BigInt(data[i]);
        hash = hash & BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
    }

    return `0x${hash.toString(16).padStart(64, '0')}` as `0x${string}`;
}

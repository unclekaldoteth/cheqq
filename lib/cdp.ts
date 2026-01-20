import { CdpClient } from '@coinbase/cdp-sdk';
import { createPublicClient, http, parseEther } from 'viem';
import { baseSepolia, base } from 'viem/chains';

// Select chain based on environment
const chain = process.env.NEXT_PUBLIC_CHAIN === 'base' ? base : baseSepolia;
const networkName = process.env.NEXT_PUBLIC_CHAIN === 'base' ? 'base' : 'base-sepolia';

// Initialize public client for reading chain data
const publicClient = createPublicClient({
    chain,
    transport: http(),
});

// CDP Client singleton (initialized on first use)
let cdpClient: CdpClient | null = null;

/**
 * Get or create the CDP client instance
 * CDP client reads credentials from environment:
 * - CDP_API_KEY_ID
 * - CDP_API_KEY_SECRET
 * - CDP_WALLET_SECRET
 */
export function getCdpClient(): CdpClient {
    if (!cdpClient) {
        cdpClient = new CdpClient();
    }
    return cdpClient;
}

/**
 * Create a new EVM account (server wallet)
 * Useful for creating company treasury or employee payout accounts
 */
export async function createEvmAccount(): Promise<{ address: string }> {
    const cdp = getCdpClient();
    const account = await cdp.evm.createAccount();
    return { address: account.address };
}

/**
 * Request test ETH from faucet (testnet only)
 */
export async function requestFaucetFunds(address: string): Promise<string> {
    if (process.env.NEXT_PUBLIC_CHAIN === 'base') {
        throw new Error('Faucet only available on testnet');
    }

    const cdp = getCdpClient();
    const { transactionHash } = await cdp.evm.requestFaucet({
        address: address as `0x${string}`,
        network: 'base-sepolia',
        token: 'eth',
    });

    // Wait for confirmation
    await publicClient.waitForTransactionReceipt({ hash: transactionHash });
    return transactionHash;
}

/**
 * Send ETH or native token from a server wallet
 */
export async function sendTransaction(
    fromAddress: string,
    toAddress: string,
    amountEther: string
): Promise<{ transactionHash: string; explorerUrl: string }> {
    const cdp = getCdpClient();

    const result = await cdp.evm.sendTransaction({
        address: fromAddress as `0x${string}`,
        transaction: {
            to: toAddress as `0x${string}`,
            value: parseEther(amountEther),
        },
        network: networkName,
    });

    // Wait for confirmation
    await publicClient.waitForTransactionReceipt({
        hash: result.transactionHash
    });

    const explorerBase = process.env.NEXT_PUBLIC_CHAIN === 'base'
        ? 'https://basescan.org'
        : 'https://sepolia.basescan.org';

    return {
        transactionHash: result.transactionHash,
        explorerUrl: `${explorerBase}/tx/${result.transactionHash}`,
    };
}

/**
 * Execute batch payroll transactions
 * Sends payments to multiple recipients in sequence
 */
export async function executeBatchPayroll(
    fromAddress: string,
    recipients: Array<{ address: string; amount: string }>
): Promise<Array<{ address: string; transactionHash: string; success: boolean; error?: string }>> {
    const results = [];

    for (const recipient of recipients) {
        try {
            const result = await sendTransaction(
                fromAddress,
                recipient.address,
                recipient.amount
            );
            results.push({
                address: recipient.address,
                transactionHash: result.transactionHash,
                success: true,
            });
        } catch (error) {
            results.push({
                address: recipient.address,
                transactionHash: '',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    return results;
}

/**
 * Get account balance
 */
export async function getAccountBalance(address: string): Promise<string> {
    const balance = await publicClient.getBalance({
        address: address as `0x${string}`,
    });
    return (Number(balance) / 1e18).toFixed(6);
}

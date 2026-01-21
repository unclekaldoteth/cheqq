import { CdpClient } from '@coinbase/cdp-sdk';
import { createPublicClient, http, parseEther, erc20Abi, encodeFunctionData } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { getTokenAddress, getTokenConfig, parseTokenAmount } from './tokens';

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
export async function getAccountBalanceRaw(address: string): Promise<bigint> {
    return publicClient.getBalance({
        address: address as `0x${string}`,
    });
}

/**
 * Get account balance formatted in ETH
 */
export async function getAccountBalance(address: string): Promise<string> {
    const balance = await getAccountBalanceRaw(address);
    return (Number(balance) / 1e18).toFixed(6);
}

// =========================
// ERC-20 Token Functions
// =========================

/**
 * Get USDC balance for an address
 */
export async function getUSDCBalance(address: string): Promise<string> {
    const tokenAddress = getTokenAddress('USDC') as `0x${string}`;
    const token = getTokenConfig('USDC');
    if (!token) throw new Error('USDC token not configured');

    const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
    });

    return (Number(balance) / Math.pow(10, token.decimals)).toFixed(2);
}

/**
 * Get token balance in smallest unit
 */
export async function getTokenBalanceRaw(address: string, symbol: string): Promise<bigint> {
    if (symbol.toUpperCase() === 'ETH') {
        return getAccountBalanceRaw(address);
    }

    const tokenAddress = getTokenAddress(symbol) as `0x${string}`;
    const token = getTokenConfig(symbol);
    if (!token) throw new Error(`Token ${symbol} not configured`);

    const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
    });

    return balance as bigint;
}

/**
 * Get token balance for any supported token
 */
export async function getTokenBalance(address: string, symbol: string): Promise<string> {
    if (symbol.toUpperCase() === 'ETH') {
        return getAccountBalance(address);
    }

    const token = getTokenConfig(symbol);
    if (!token) throw new Error(`Token ${symbol} not configured`);

    const balance = await getTokenBalanceRaw(address, symbol);

    return (Number(balance) / Math.pow(10, token.decimals)).toFixed(token.decimals > 2 ? 2 : token.decimals);
}

/**
 * Send USDC from a server wallet to a recipient
 */
export async function sendUSDC(
    fromAddress: string,
    toAddress: string,
    amount: string
): Promise<{ transactionHash: string; explorerUrl: string }> {
    const cdp = getCdpClient();
    const tokenAddress = getTokenAddress('USDC') as `0x${string}`;
    const parsedAmount = parseTokenAmount(amount, 'USDC');

    // Encode ERC-20 transfer function
    const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [toAddress as `0x${string}`, parsedAmount],
    });

    const result = await cdp.evm.sendTransaction({
        address: fromAddress as `0x${string}`,
        transaction: {
            to: tokenAddress,
            data,
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
 * Send any supported token from a server wallet
 */
export async function sendToken(
    fromAddress: string,
    toAddress: string,
    amount: string,
    symbol: string
): Promise<{ transactionHash: string; explorerUrl: string }> {
    if (symbol.toUpperCase() === 'ETH') {
        return sendTransaction(fromAddress, toAddress, amount);
    }

    const cdp = getCdpClient();
    const tokenAddress = getTokenAddress(symbol) as `0x${string}`;
    const parsedAmount = parseTokenAmount(amount, symbol);

    const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [toAddress as `0x${string}`, parsedAmount],
    });

    const result = await cdp.evm.sendTransaction({
        address: fromAddress as `0x${string}`,
        transaction: {
            to: tokenAddress,
            data,
        },
        network: networkName,
    });

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
 * Execute batch USDC payroll transactions
 */
export async function executeBatchUSDCPayroll(
    fromAddress: string,
    recipients: Array<{ address: string; amount: string }>
): Promise<Array<{ address: string; transactionHash: string; success: boolean; error?: string }>> {
    const results = [];

    for (const recipient of recipients) {
        try {
            const result = await sendUSDC(
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

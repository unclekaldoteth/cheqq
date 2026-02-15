/**
 * Tempo Chain Utilities
 * Handles token transfers, balance queries, and batch payroll on Tempo Testnet.
 * Replaces the previous CDP SDK-based implementation.
 */

import { createPublicClient, createWalletClient, http, erc20Abi, encodeFunctionData, formatUnits, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { tempoTestnet } from '@/providers/OnchainProvider';
import { getTokenAddress, getTokenConfig, parseTokenAmount } from './tokens';

const TEMPO_RPC_URL =
    process.env.NEXT_PUBLIC_TEMPO_RPC_URL ||
    process.env.TEMPO_RPC_URL ||
    'https://rpc.moderato.tempo.xyz';

// Initialize public client for reading chain data on Tempo Testnet
const publicClient = createPublicClient({
    chain: tempoTestnet,
    transport: http(TEMPO_RPC_URL),
});

/**
 * Get a wallet client for server-side transactions
 * Uses PERMIT_SIGNER_PRIVATE_KEY for signing
 */
function getWalletClient() {
    const privateKey = process.env.PERMIT_SIGNER_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('PERMIT_SIGNER_PRIVATE_KEY not configured');
    }

    const account = privateKeyToAccount(privateKey as Hex);
    return createWalletClient({
        account,
        chain: tempoTestnet,
        transport: http(TEMPO_RPC_URL),
    });
}

/**
 * Get token balance in smallest unit (TIP-20 / ERC-20 compatible)
 */
export async function getTokenBalanceRaw(address: string, symbol: string): Promise<bigint> {
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
 * Get token balance formatted for display
 */
export async function getTokenBalance(address: string, symbol: string): Promise<string> {
    const token = getTokenConfig(symbol);
    if (!token) throw new Error(`Token ${symbol} not configured`);

    const balance = await getTokenBalanceRaw(address, symbol);
    const formatted = formatUnits(balance, token.decimals);
    const numeric = Number.parseFloat(formatted);
    return Number.isFinite(numeric) ? numeric.toFixed(2) : '0.00';
}

/**
 * Get AlphaUSD balance for an address (primary stablecoin)
 */
export async function getAlphaUSDBalance(address: string): Promise<string> {
    return getTokenBalance(address, 'AlphaUSD');
}

/**
 * Send any supported TIP-20 token from a server wallet
 */
export async function sendToken(
    fromAddress: string,
    toAddress: string,
    amount: string,
    symbol: string
): Promise<{ transactionHash: string; explorerUrl: string }> {
    const walletClient = getWalletClient();
    const tokenAddress = getTokenAddress(symbol) as `0x${string}`;
    const parsedAmount = parseTokenAmount(amount, symbol);

    const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [toAddress as `0x${string}`, parsedAmount],
    });

    const txHash = await walletClient.sendTransaction({
        to: tokenAddress,
        data,
    });

    // Wait for confirmation
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    return {
        transactionHash: txHash,
        explorerUrl: `https://explore.tempo.xyz/tx/${txHash}`,
    };
}

/**
 * Send AlphaUSD from a server wallet to a recipient
 */
export async function sendAlphaUSD(
    fromAddress: string,
    toAddress: string,
    amount: string
): Promise<{ transactionHash: string; explorerUrl: string }> {
    return sendToken(fromAddress, toAddress, amount, 'AlphaUSD');
}

/**
 * Execute batch payroll transactions (sequential)
 */
export async function executeBatchPayroll(
    fromAddress: string,
    recipients: Array<{ address: string; amount: string }>,
    symbol: string = 'AlphaUSD'
): Promise<Array<{ address: string; transactionHash: string; success: boolean; error?: string }>> {
    const results = [];

    for (const recipient of recipients) {
        try {
            const result = await sendToken(
                fromAddress,
                recipient.address,
                recipient.amount,
                symbol
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
 * Execute batch AlphaUSD payroll transactions
 */
export async function executeBatchAlphaUSDPayroll(
    fromAddress: string,
    recipients: Array<{ address: string; amount: string }>
): Promise<Array<{ address: string; transactionHash: string; success: boolean; error?: string }>> {
    return executeBatchPayroll(fromAddress, recipients, 'AlphaUSD');
}

/**
 * Get the public client instance for external use
 */
export function getPublicClient() {
    return publicClient;
}

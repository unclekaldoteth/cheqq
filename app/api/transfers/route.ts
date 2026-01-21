import { NextResponse } from 'next/server';
import { parseEther } from 'viem';
import { getTokenConfig, parseTokenAmount } from '@/lib/tokens';

// Force dynamic rendering - prevents build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_CURRENCIES = ['USDC', 'IDRX', 'ETH'] as const;

const isValidAddress = (address: string): boolean =>
    /^0x[a-f0-9]{40}$/i.test(address);

const isAllowedCurrency = (value: string): boolean =>
    ALLOWED_CURRENCIES.includes(value.toUpperCase() as (typeof ALLOWED_CURRENCIES)[number]);

// POST /api/transfers - Execute on-chain transfer
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const fromAddress = String(body.fromAddress || '').trim();
        const toAddress = String(body.toAddress || '').trim();
        const amountValue = String(body.amount || '').trim();
        const currency = String(body.currency || 'USDC').trim().toUpperCase();
        const amountPattern = /^(?:\d+|\d*\.\d+)$/;

        // Validation
        if (!fromAddress || !isValidAddress(fromAddress)) {
            return NextResponse.json(
                { error: 'Invalid sender address' },
                { status: 400 }
            );
        }

        if (!toAddress || !isValidAddress(toAddress)) {
            return NextResponse.json(
                { error: 'Invalid recipient address' },
                { status: 400 }
            );
        }

        const amount = parseFloat(amountValue);
        if (!Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json(
                { error: 'Amount must be greater than zero' },
                { status: 400 }
            );
        }

        if (!amountPattern.test(amountValue)) {
            return NextResponse.json(
                { error: 'Amount must be a valid numeric string' },
                { status: 400 }
            );
        }

        if (!isAllowedCurrency(currency)) {
            return NextResponse.json(
                { error: 'Unsupported currency' },
                { status: 400 }
            );
        }

        const tokenConfig = currency === 'ETH' ? null : getTokenConfig(currency);
        if (!tokenConfig && currency !== 'ETH') {
            return NextResponse.json(
                { error: 'Unsupported currency' },
                { status: 400 }
            );
        }

        const decimalPlaces = amountValue.includes('.') ? amountValue.split('.')[1].length : 0;
        const maxDecimals = currency === 'ETH' ? 18 : (tokenConfig?.decimals ?? 0);
        if (decimalPlaces > maxDecimals) {
            return NextResponse.json(
                { error: `Amount exceeds supported precision (${maxDecimals} decimals)` },
                { status: 400 }
            );
        }

        // Import CDP functions dynamically
        const { sendToken, getTokenBalanceRaw, getAccountBalanceRaw } = await import('@/lib/cdp');

        // Check sender balance
        let balanceRaw: bigint;
        let requestedRaw: bigint;
        try {
            if (currency === 'ETH') {
                balanceRaw = await getAccountBalanceRaw(fromAddress);
                requestedRaw = parseEther(amountValue);
            } else {
                balanceRaw = await getTokenBalanceRaw(fromAddress, currency);
                requestedRaw = parseTokenAmount(amountValue, currency);
            }
        } catch (error) {
            return NextResponse.json(
                { error: error instanceof Error ? error.message : 'Invalid amount' },
                { status: 400 }
            );
        }

        if (balanceRaw < requestedRaw) {
            const available = currency === 'ETH'
                ? (Number(balanceRaw) / 1e18).toFixed(6)
                : (Number(balanceRaw) / Math.pow(10, tokenConfig?.decimals ?? 0)).toFixed(
                    (tokenConfig?.decimals ?? 0) > 2 ? 2 : (tokenConfig?.decimals ?? 0)
                );
            return NextResponse.json(
                {
                    error: 'Insufficient balance',
                    available,
                    requested: amountValue,
                },
                { status: 400 }
            );
        }

        // Execute transfer
        const result = await sendToken(fromAddress, toAddress, amountValue, currency);

        return NextResponse.json({
            success: true,
            transactionHash: result.transactionHash,
            explorerUrl: result.explorerUrl,
            transfer: {
                from: fromAddress,
                to: toAddress,
                amount: amountValue,
                currency,
            },
        });
    } catch (error) {
        console.error('Transfer failed:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Transfer failed' },
            { status: 500 }
        );
    }
}

// GET /api/transfers - Get transaction status or balance
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address')?.trim();
        const currency = searchParams.get('currency')?.trim().toUpperCase() || 'USDC';
        const txHash = searchParams.get('txHash')?.trim();

        // Get balance
        if (address) {
            if (!isValidAddress(address)) {
                return NextResponse.json(
                    { error: 'Invalid address' },
                    { status: 400 }
                );
            }

            const { getTokenBalance, getAccountBalance } = await import('@/lib/cdp');

            // Get all balances if currency not specified
            if (!searchParams.has('currency')) {
                const [usdc, idrx, eth] = await Promise.all([
                    getTokenBalance(address, 'USDC'),
                    getTokenBalance(address, 'IDRX'),
                    getAccountBalance(address),
                ]);

                return NextResponse.json({
                    address,
                    balances: {
                        USDC: usdc,
                        IDRX: idrx,
                        ETH: eth,
                    },
                });
            }

            if (!isAllowedCurrency(currency)) {
                return NextResponse.json(
                    { error: 'Unsupported currency' },
                    { status: 400 }
                );
            }

            const balance = await getTokenBalance(address, currency);
            return NextResponse.json({
                address,
                currency,
                balance,
            });
        }

        // Get transaction status
        if (txHash) {
            const { createPublicClient, http } = await import('viem');
            const { baseSepolia, base } = await import('viem/chains');

            const chain = process.env.NEXT_PUBLIC_CHAIN === 'base' ? base : baseSepolia;
            const publicClient = createPublicClient({ chain, transport: http() });

            const receipt = await publicClient.getTransactionReceipt({
                hash: txHash as `0x${string}`,
            });

            return NextResponse.json({
                txHash,
                status: receipt.status === 'success' ? 'confirmed' : 'failed',
                blockNumber: receipt.blockNumber.toString(),
                gasUsed: receipt.gasUsed.toString(),
            });
        }

        return NextResponse.json(
            { error: 'Provide address or txHash parameter' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Failed to get transfer info:', error);
        return NextResponse.json(
            { error: 'Failed to get transfer info' },
            { status: 500 }
        );
    }
}

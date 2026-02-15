import { NextResponse } from 'next/server';
import { getTokenConfig, parseTokenAmount } from '@/lib/tokens';
import { normalizeCurrency } from '@/lib/currency';
import { formatUnits } from 'viem';

// Force dynamic rendering - prevents build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const isValidAddress = (address: string): boolean =>
    /^0x[a-f0-9]{40}$/i.test(address);

// POST /api/transfers - Execute on-chain TIP-20 transfer
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const fromAddress = String(body.fromAddress || '').trim();
        const toAddress = String(body.toAddress || '').trim();
        const amountValue = String(body.amount || '').trim();
        const currency = normalizeCurrency(String(body.currency || 'AlphaUSD'), 'AlphaUSD');
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

        if (!currency) {
            return NextResponse.json(
                { error: 'Unsupported currency. Supported: AlphaUSD, BetaUSD, pathUSD' },
                { status: 400 }
            );
        }

        const tokenConfig = getTokenConfig(currency);
        if (!tokenConfig) {
            return NextResponse.json(
                { error: 'Unsupported currency' },
                { status: 400 }
            );
        }

        const decimalPlaces = amountValue.includes('.') ? amountValue.split('.')[1].length : 0;
        if (decimalPlaces > tokenConfig.decimals) {
            return NextResponse.json(
                { error: `Amount exceeds supported precision (${tokenConfig.decimals} decimals)` },
                { status: 400 }
            );
        }

        // Import chain functions dynamically
        const { sendToken, getTokenBalanceRaw } = await import('@/lib/cdp');

        // Check sender balance
        let balanceRaw: bigint;
        let requestedRaw: bigint;
        try {
            balanceRaw = await getTokenBalanceRaw(fromAddress, currency);
            requestedRaw = parseTokenAmount(amountValue, currency);
        } catch (error) {
            return NextResponse.json(
                { error: error instanceof Error ? error.message : 'Invalid amount' },
                { status: 400 }
            );
        }

        if (balanceRaw < requestedRaw) {
            const formattedAvailable = formatUnits(balanceRaw, tokenConfig.decimals);
            const availableNumeric = Number.parseFloat(formattedAvailable);
            const available = Number.isFinite(availableNumeric)
                ? availableNumeric.toFixed(2)
                : formattedAvailable;
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
        const rawCurrency = searchParams.get('currency');
        const normalizedCurrency = normalizeCurrency(rawCurrency);
        const currency = normalizedCurrency || 'AlphaUSD';
        const txHash = searchParams.get('txHash')?.trim();

        // Get balance
        if (address) {
            if (!isValidAddress(address)) {
                return NextResponse.json(
                    { error: 'Invalid address' },
                    { status: 400 }
                );
            }

            const { getTokenBalance } = await import('@/lib/cdp');

            // Get all balances if currency not specified
            if (!searchParams.has('currency')) {
                const [alphaUsd, betaUsd, pathUsd] = await Promise.all([
                    getTokenBalance(address, 'AlphaUSD'),
                    getTokenBalance(address, 'BetaUSD'),
                    getTokenBalance(address, 'pathUSD'),
                ]);

                return NextResponse.json({
                    address,
                    balances: {
                        AlphaUSD: alphaUsd,
                        BetaUSD: betaUsd,
                        pathUSD: pathUsd,
                    },
                });
            }

            if (searchParams.has('currency') && !normalizedCurrency) {
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
            const { getPublicClient } = await import('@/lib/cdp');
            const publicClient = getPublicClient();

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

import { NextResponse } from 'next/server';
import type { Currency } from '@prisma/client';

// Force dynamic rendering - prevents build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_CURRENCIES = ['USDC', 'IDRX', 'ETH'] as const;

const isAllowedCurrency = (value: string): value is Currency =>
    ALLOWED_CURRENCIES.includes(value as Currency);

// Mock yield rates - In production, these would come from actual DeFi protocols
const YIELD_RATES: Record<Currency, { protocol: string; apy: number; tvl: number }> = {
    USDC: { protocol: 'Moonwell', apy: 4.5, tvl: 125000000 },
    IDRX: { protocol: 'Internal Vault', apy: 3.2, tvl: 5000000 },
    ETH: { protocol: 'Aave', apy: 2.8, tvl: 500000000 },
};

// GET /api/defi/yield - Get yield rates and positions
export async function GET(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('companyId')?.trim();
        const currencyParam = searchParams.get('currency')?.trim().toUpperCase() || null;

        if (currencyParam && !isAllowedCurrency(currencyParam)) {
            return NextResponse.json(
                { error: 'Invalid currency' },
                { status: 400 }
            );
        }

        // Return available yield rates
        const rates = Object.entries(YIELD_RATES).map(([curr, data]) => ({
            currency: curr,
            ...data,
        }));

        if (!companyId) {
            return NextResponse.json({
                rates: currencyParam ? rates.filter((r) => r.currency === currencyParam) : rates,
                message: 'Available yield rates across protocols',
            });
        }

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { id: true },
        });

        if (!company) {
            return NextResponse.json(
                { error: 'Company not found' },
                { status: 404 }
            );
        }

        // Get company treasury balances
        const balances = await prisma.treasuryBalance.findMany({
            where: { companyId },
        });

        // Calculate potential and actual yields
        const positions = balances.map((balance) => {
            const rate = YIELD_RATES[balance.currency as Currency];
            const currentBalance = Number(balance.balance);
            const yieldEarned = Number(balance.yieldEarned);
            const estimatedAnnualYield = currentBalance * (rate?.apy || 0) / 100;
            const estimatedMonthlyYield = estimatedAnnualYield / 12;

            return {
                currency: balance.currency,
                balance: currentBalance,
                yieldEarned,
                protocol: rate?.protocol || 'None',
                apy: rate?.apy || 0,
                estimatedAnnualYield,
                estimatedMonthlyYield,
            };
        });

        const filteredPositions = currencyParam
            ? positions.filter((p) => p.currency === currencyParam)
            : positions;

        const totalBalance = filteredPositions.reduce((sum, p) => sum + p.balance, 0);
        const totalYieldEarned = filteredPositions.reduce((sum, p) => sum + p.yieldEarned, 0);
        const totalEstimatedAnnual = filteredPositions.reduce((sum, p) => sum + p.estimatedAnnualYield, 0);

        return NextResponse.json({
            rates: currencyParam ? rates.filter((r) => r.currency === currencyParam) : rates,
            positions: filteredPositions,
            summary: {
                totalBalance,
                totalYieldEarned,
                totalEstimatedAnnualYield: totalEstimatedAnnual,
                totalEstimatedMonthlyYield: totalEstimatedAnnual / 12,
            },
        });
    } catch (error) {
        console.error('Failed to fetch yield data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch yield data' },
            { status: 500 }
        );
    }
}

// POST /api/defi/yield - Deposit to yield protocol (mock)
export async function POST(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const body = await request.json();
        const companyId = String(body.companyId || '').trim();
        const currencyInput = String(body.currency || 'USDC').trim().toUpperCase();
        const amountValue = String(body.amount ?? '').trim();

        if (!companyId) {
            return NextResponse.json(
                { error: 'Company ID is required' },
                { status: 400 }
            );
        }

        if (!isAllowedCurrency(currencyInput)) {
            return NextResponse.json(
                { error: 'Invalid currency' },
                { status: 400 }
            );
        }

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { id: true },
        });

        if (!company) {
            return NextResponse.json(
                { error: 'Company not found' },
                { status: 404 }
            );
        }

        const parsedAmount = Number.parseFloat(amountValue);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return NextResponse.json(
                { error: 'Amount must be greater than zero' },
                { status: 400 }
            );
        }

        // Get current balance
        const balance = await prisma.treasuryBalance.findUnique({
            where: {
                companyId_currency: {
                    companyId,
                    currency: currencyInput as Currency,
                },
            },
        });

        if (!balance || Number(balance.balance) < parsedAmount) {
            return NextResponse.json(
                { error: 'Insufficient balance for deposit' },
                { status: 400 }
            );
        }

        // In production: Execute actual DeFi deposit transaction
        // For now, we simulate by updating the treasury balance with yield tracking
        const rate = YIELD_RATES[currencyInput as Currency];

        return NextResponse.json({
            success: true,
            deposit: {
                amount: parsedAmount,
                currency: currencyInput,
                protocol: rate.protocol,
                apy: rate.apy,
                estimatedAnnualYield: parsedAmount * rate.apy / 100,
            },
            message: `Deposited ${parsedAmount} ${currencyInput} to ${rate.protocol} at ${rate.apy}% APY`,
            note: 'This is a simulated deposit. In production, this would execute an actual DeFi transaction.',
        });
    } catch (error) {
        console.error('Failed to deposit to yield protocol:', error);
        return NextResponse.json(
            { error: 'Failed to deposit to yield protocol' },
            { status: 500 }
        );
    }
}

// PATCH /api/defi/yield - Withdraw from yield protocol (mock)
export async function PATCH(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const body = await request.json();
        const companyId = String(body.companyId || '').trim();
        const currencyInput = String(body.currency || 'USDC').trim().toUpperCase();
        const amountValue = String(body.amount ?? '').trim();

        if (!companyId) {
            return NextResponse.json(
                { error: 'Company ID is required' },
                { status: 400 }
            );
        }

        if (!isAllowedCurrency(currencyInput)) {
            return NextResponse.json(
                { error: 'Invalid currency' },
                { status: 400 }
            );
        }

        const parsedAmount = Number.parseFloat(amountValue);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return NextResponse.json(
                { error: 'Amount must be greater than zero' },
                { status: 400 }
            );
        }

        // Verify company exists
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { id: true },
        });

        if (!company) {
            return NextResponse.json(
                { error: 'Company not found' },
                { status: 404 }
            );
        }

        // In production: Execute actual DeFi withdrawal transaction
        const rate = YIELD_RATES[currencyInput as Currency];

        return NextResponse.json({
            success: true,
            withdrawal: {
                amount: parsedAmount,
                currency: currencyInput,
                protocol: rate.protocol,
            },
            message: `Withdrew ${parsedAmount} ${currencyInput} from ${rate.protocol}`,
            note: 'This is a simulated withdrawal. In production, this would execute an actual DeFi transaction.',
        });
    } catch (error) {
        console.error('Failed to withdraw from yield protocol:', error);
        return NextResponse.json(
            { error: 'Failed to withdraw from yield protocol' },
            { status: 500 }
        );
    }
}

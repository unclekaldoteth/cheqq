import { NextResponse } from 'next/server';
import type { Currency } from '@prisma/client';

// Force dynamic rendering - prevents build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_CURRENCIES = ['USDC', 'IDRX', 'ETH'] as const;

const isAllowedCurrency = (value: string): value is Currency =>
    ALLOWED_CURRENCIES.includes(value as Currency);

// GET /api/earnings - Get freelancer earnings balance
export async function GET(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const { searchParams } = new URL(request.url);
        const freelancerId = searchParams.get('freelancerId')?.trim();
        const currencyParam = searchParams.get('currency')?.trim().toUpperCase();

        if (!freelancerId) {
            return NextResponse.json(
                { error: 'Freelancer ID is required' },
                { status: 400 }
            );
        }

        if (currencyParam && !isAllowedCurrency(currencyParam)) {
            return NextResponse.json(
                { error: 'Invalid currency' },
                { status: 400 }
            );
        }

        // Verify freelancer exists
        const freelancer = await prisma.freelancer.findUnique({
            where: { id: freelancerId },
            select: {
                id: true,
                name: true,
                walletAddress: true,
            },
        });

        if (!freelancer) {
            return NextResponse.json(
                { error: 'Freelancer not found' },
                { status: 404 }
            );
        }

        // Get paid invoices
        const paidInvoices = await prisma.invoice.findMany({
            where: {
                freelancerId,
                status: 'PAID',
                ...(currencyParam && { currency: currencyParam as Currency }),
            },
            select: {
                id: true,
                amount: true,
                currency: true,
                paidAt: true,
            },
        });

        // Get withdrawals
        const withdrawals = await prisma.withdrawal.findMany({
            where: {
                freelancerId,
                ...(currencyParam && { currency: currencyParam as Currency }),
            },
            select: {
                id: true,
                amount: true,
                currency: true,
                status: true,
            },
        });

        // Calculate balances by currency
        const balancesByCurrency: Record<string, {
            totalEarned: number;
            totalWithdrawn: number;
            pendingWithdrawals: number;
            availableBalance: number;
            invoiceCount: number;
            withdrawalCount: number;
        }> = {};

        for (const invoice of paidInvoices) {
            const curr = invoice.currency;
            if (!balancesByCurrency[curr]) {
                balancesByCurrency[curr] = {
                    totalEarned: 0,
                    totalWithdrawn: 0,
                    pendingWithdrawals: 0,
                    availableBalance: 0,
                    invoiceCount: 0,
                    withdrawalCount: 0,
                };
            }
            balancesByCurrency[curr].totalEarned += Number(invoice.amount);
            balancesByCurrency[curr].invoiceCount += 1;
        }

        for (const withdrawal of withdrawals) {
            const curr = withdrawal.currency;
            if (!balancesByCurrency[curr]) {
                balancesByCurrency[curr] = {
                    totalEarned: 0,
                    totalWithdrawn: 0,
                    pendingWithdrawals: 0,
                    availableBalance: 0,
                    invoiceCount: 0,
                    withdrawalCount: 0,
                };
            }
            balancesByCurrency[curr].withdrawalCount += 1;
            if (withdrawal.status === 'COMPLETED') {
                balancesByCurrency[curr].totalWithdrawn += Number(withdrawal.amount);
            }
            if (withdrawal.status === 'PENDING' || withdrawal.status === 'PROCESSING') {
                balancesByCurrency[curr].pendingWithdrawals += Number(withdrawal.amount);
            }
        }

        // Calculate available balances
        for (const curr of Object.keys(balancesByCurrency)) {
            const b = balancesByCurrency[curr];
            b.availableBalance = b.totalEarned - b.totalWithdrawn - b.pendingWithdrawals;
        }

        // Calculate totals
        const totals = {
            totalEarned: Object.values(balancesByCurrency).reduce((sum, b) => sum + b.totalEarned, 0),
            totalWithdrawn: Object.values(balancesByCurrency).reduce((sum, b) => sum + b.totalWithdrawn, 0),
            pendingWithdrawals: Object.values(balancesByCurrency).reduce((sum, b) => sum + b.pendingWithdrawals, 0),
            availableBalance: Object.values(balancesByCurrency).reduce((sum, b) => sum + b.availableBalance, 0),
        };

        // Format response
        const balances = Object.entries(balancesByCurrency).map(([currency, data]) => ({
            currency,
            ...data,
        }));

        return NextResponse.json({
            freelancer: {
                id: freelancer.id,
                name: freelancer.name,
                walletAddress: freelancer.walletAddress,
            },
            balances: currencyParam
                ? balances.filter((b) => b.currency === currencyParam)
                : balances,
            totals,
        });
    } catch (error) {
        console.error('Failed to fetch earnings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch earnings' },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import type { Currency } from '@prisma/client';

// Force dynamic rendering - prevents build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_CURRENCIES = ['USDC', 'IDRX', 'ETH'] as const;

const isAllowedCurrency = (value: string): value is Currency =>
    ALLOWED_CURRENCIES.includes(value as Currency);

// GET /api/treasury?companyId=xxx - Get treasury balances for a company
export async function GET(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('companyId')?.trim();

        if (!companyId) {
            return NextResponse.json(
                { error: 'Company ID is required' },
                { status: 400 }
            );
        }

        // Verify company exists
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { id: true, name: true, walletAddress: true },
        });

        if (!company) {
            return NextResponse.json(
                { error: 'Company not found' },
                { status: 404 }
            );
        }

        const balances = await prisma.treasuryBalance.findMany({
            where: { companyId },
            orderBy: { currency: 'asc' },
        });

        // Calculate totals
        const totalBalance = balances.reduce(
            (sum, b) => sum + Number(b.balance),
            0
        );
        const totalYield = balances.reduce(
            (sum, b) => sum + Number(b.yieldEarned),
            0
        );

        return NextResponse.json({
            company: {
                id: company.id,
                name: company.name,
                walletAddress: company.walletAddress,
            },
            balances,
            summary: {
                totalBalance,
                totalYield,
                currencies: balances.length,
            },
        });
    } catch (error) {
        console.error('Failed to fetch treasury balances:', error);
        return NextResponse.json(
            { error: 'Failed to fetch treasury balances' },
            { status: 500 }
        );
    }
}

// POST /api/treasury - Create or upsert treasury balance
export async function POST(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const body = await request.json();
        const companyId = String(body.companyId || '').trim();
        const currencyInput = String(body.currency || 'USDC').trim().toUpperCase();
        const balanceValue = String(body.balance ?? '0').trim();

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

        const parsedBalance = Number.parseFloat(balanceValue);
        if (!Number.isFinite(parsedBalance) || parsedBalance < 0) {
            return NextResponse.json(
                { error: 'Balance must be a non-negative number' },
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

        // Upsert the balance
        const balance = await prisma.treasuryBalance.upsert({
            where: {
                companyId_currency: {
                    companyId,
                    currency: currencyInput as Currency,
                },
            },
            update: {
                balance: parsedBalance,
            },
            create: {
                companyId,
                currency: currencyInput as Currency,
                balance: parsedBalance,
                yieldEarned: 0,
            },
        });

        return NextResponse.json({
            balance,
            message: 'Treasury balance updated successfully',
        });
    } catch (error) {
        console.error('Failed to update treasury balance:', error);
        return NextResponse.json(
            { error: 'Failed to update treasury balance' },
            { status: 500 }
        );
    }
}

// PATCH /api/treasury - Update balance or yield earned
export async function PATCH(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const body = await request.json();
        const id = String(body.id || '').trim();

        if (!id) {
            return NextResponse.json(
                { error: 'Treasury balance ID is required' },
                { status: 400 }
            );
        }

        // Build update data
        const updateData: { balance?: number; yieldEarned?: number } = {};

        if (body.balance !== undefined) {
            const parsedBalance = Number.parseFloat(String(body.balance));
            if (!Number.isFinite(parsedBalance) || parsedBalance < 0) {
                return NextResponse.json(
                    { error: 'Balance must be a non-negative number' },
                    { status: 400 }
                );
            }
            updateData.balance = parsedBalance;
        }

        if (body.yieldEarned !== undefined) {
            const parsedYield = Number.parseFloat(String(body.yieldEarned));
            if (!Number.isFinite(parsedYield) || parsedYield < 0) {
                return NextResponse.json(
                    { error: 'Yield earned must be a non-negative number' },
                    { status: 400 }
                );
            }
            updateData.yieldEarned = parsedYield;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: 'No valid update fields provided' },
                { status: 400 }
            );
        }

        const balance = await prisma.treasuryBalance.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            balance,
            message: 'Treasury balance updated successfully',
        });
    } catch (error) {
        console.error('Failed to update treasury balance:', error);
        return NextResponse.json(
            { error: 'Failed to update treasury balance' },
            { status: 500 }
        );
    }
}

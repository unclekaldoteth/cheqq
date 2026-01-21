import { NextResponse } from 'next/server';

// Force dynamic rendering - prevents build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_TYPES = ['BANK', 'CRYPTO'] as const;

type PayoutType = 'BANK' | 'CRYPTO';

const isAllowedType = (value: string): value is PayoutType =>
    ALLOWED_TYPES.includes(value as PayoutType);

interface PayoutSettings {
    preferredType: PayoutType;
    cryptoWallet?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
    bankSwiftCode?: string;
}

// In-memory store for payout settings (in production, this would be a database table)
// This is a simplified solution - in production, add a PayoutSettings model to Prisma
const payoutSettingsStore: Record<string, PayoutSettings> = {};

// GET /api/payout-settings - Get freelancer payout settings
export async function GET(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const { searchParams } = new URL(request.url);
        const freelancerId = searchParams.get('freelancerId')?.trim();

        if (!freelancerId) {
            return NextResponse.json(
                { error: 'Freelancer ID is required' },
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

        // Get settings or return defaults
        const settings = payoutSettingsStore[freelancerId] || {
            preferredType: 'CRYPTO',
            cryptoWallet: freelancer.walletAddress,
        };

        return NextResponse.json({
            freelancer: {
                id: freelancer.id,
                name: freelancer.name,
            },
            settings,
        });
    } catch (error) {
        console.error('Failed to fetch payout settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch payout settings' },
            { status: 500 }
        );
    }
}

// POST /api/payout-settings - Create/Update payout settings
export async function POST(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const body = await request.json();
        const freelancerId = String(body.freelancerId || '').trim();
        const preferredType = String(body.preferredType || '').trim().toUpperCase();

        if (!freelancerId) {
            return NextResponse.json(
                { error: 'Freelancer ID is required' },
                { status: 400 }
            );
        }

        if (!isAllowedType(preferredType)) {
            return NextResponse.json(
                { error: 'Preferred type must be BANK or CRYPTO' },
                { status: 400 }
            );
        }

        // Verify freelancer exists
        const freelancer = await prisma.freelancer.findUnique({
            where: { id: freelancerId },
            select: { id: true, walletAddress: true },
        });

        if (!freelancer) {
            return NextResponse.json(
                { error: 'Freelancer not found' },
                { status: 404 }
            );
        }

        // Validate crypto wallet if type is CRYPTO
        if (preferredType === 'CRYPTO') {
            const cryptoWallet = String(body.cryptoWallet || freelancer.walletAddress).trim();
            const isValidAddress = /^0x[a-f0-9]{40}$/i.test(cryptoWallet);

            if (!isValidAddress) {
                return NextResponse.json(
                    { error: 'Invalid crypto wallet address' },
                    { status: 400 }
                );
            }

            payoutSettingsStore[freelancerId] = {
                preferredType: 'CRYPTO',
                cryptoWallet,
            };

            return NextResponse.json({
                settings: payoutSettingsStore[freelancerId],
                message: 'Payout settings updated successfully',
            });
        }

        // Validate bank details if type is BANK
        const bankName = String(body.bankName || '').trim();
        const bankAccountNumber = String(body.bankAccountNumber || '').trim();
        const bankAccountName = String(body.bankAccountName || '').trim();
        const bankSwiftCode = String(body.bankSwiftCode || '').trim();

        if (!bankName || !bankAccountNumber || !bankAccountName) {
            return NextResponse.json(
                { error: 'Bank name, account number, and account name are required for bank payouts' },
                { status: 400 }
            );
        }

        payoutSettingsStore[freelancerId] = {
            preferredType: 'BANK',
            bankName,
            bankAccountNumber,
            bankAccountName,
            bankSwiftCode: bankSwiftCode || undefined,
        };

        return NextResponse.json({
            settings: payoutSettingsStore[freelancerId],
            message: 'Payout settings updated successfully',
        });
    } catch (error) {
        console.error('Failed to update payout settings:', error);
        return NextResponse.json(
            { error: 'Failed to update payout settings' },
            { status: 500 }
        );
    }
}

// DELETE /api/payout-settings - Delete payout settings
export async function DELETE(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const { searchParams } = new URL(request.url);
        const freelancerId = searchParams.get('freelancerId')?.trim();

        if (!freelancerId) {
            return NextResponse.json(
                { error: 'Freelancer ID is required' },
                { status: 400 }
            );
        }

        // Verify freelancer exists
        const freelancer = await prisma.freelancer.findUnique({
            where: { id: freelancerId },
            select: { id: true },
        });

        if (!freelancer) {
            return NextResponse.json(
                { error: 'Freelancer not found' },
                { status: 404 }
            );
        }

        delete payoutSettingsStore[freelancerId];

        return NextResponse.json({
            message: 'Payout settings deleted successfully',
        });
    } catch (error) {
        console.error('Failed to delete payout settings:', error);
        return NextResponse.json(
            { error: 'Failed to delete payout settings' },
            { status: 500 }
        );
    }
}

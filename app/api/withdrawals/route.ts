import { NextResponse } from 'next/server';
import type { Currency, PaymentStatus } from '@prisma/client';
import { normalizeCurrency } from '@/lib/currency';

// Force dynamic rendering - prevents build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_STATUSES = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] as const;
const ALLOWED_TYPES = ['BANK', 'CRYPTO'] as const;

type WithdrawalType = 'BANK' | 'CRYPTO';

const isAllowedStatus = (value: string): value is PaymentStatus =>
    ALLOWED_STATUSES.includes(value as PaymentStatus);

const isAllowedType = (value: string): value is WithdrawalType =>
    ALLOWED_TYPES.includes(value as WithdrawalType);

// GET /api/withdrawals - List withdrawals
export async function GET(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const { searchParams } = new URL(request.url);
        const withdrawalId = searchParams.get('id')?.trim();
        const freelancerId = searchParams.get('freelancerId')?.trim();
        const statusParam = searchParams.get('status')?.trim().toUpperCase();

        // Get single withdrawal by ID
        if (withdrawalId) {
            const withdrawal = await prisma.withdrawal.findUnique({
                where: { id: withdrawalId },
                include: {
                    freelancer: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            walletAddress: true,
                        },
                    },
                },
            });

            if (!withdrawal) {
                return NextResponse.json(
                    { error: 'Withdrawal not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ withdrawal });
        }

        // Require freelancerId for listing
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

        // Build query filter
        interface WithdrawalWhere {
            freelancerId: string;
            status?: PaymentStatus;
        }
        const where: WithdrawalWhere = { freelancerId };

        if (statusParam) {
            if (!isAllowedStatus(statusParam)) {
                return NextResponse.json(
                    { error: 'Invalid withdrawal status' },
                    { status: 400 }
                );
            }
            where.status = statusParam as PaymentStatus;
        }

        const withdrawals = await prisma.withdrawal.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        // Calculate summary
        const summary = {
            total: withdrawals.length,
            totalAmount: withdrawals.reduce((sum, w) => sum + Number(w.amount), 0),
            pending: withdrawals.filter((w) => w.status === 'PENDING').length,
            completed: withdrawals.filter((w) => w.status === 'COMPLETED').length,
            completedAmount: withdrawals
                .filter((w) => w.status === 'COMPLETED')
                .reduce((sum, w) => sum + Number(w.amount), 0),
        };

        return NextResponse.json({ withdrawals, summary });
    } catch (error) {
        console.error('Failed to fetch withdrawals:', error);
        return NextResponse.json(
            { error: 'Failed to fetch withdrawals' },
            { status: 500 }
        );
    }
}

// POST /api/withdrawals - Create withdrawal request
export async function POST(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const body = await request.json();
        const freelancerId = String(body.freelancerId || '').trim();
        const amountValue = String(body.amount ?? '').trim();
        const currencyInput = normalizeCurrency(String(body.currency || 'AlphaUSD'), 'AlphaUSD');
        const destinationType = String(body.destinationType || '').trim().toUpperCase();
        const destination = String(body.destination || '').trim();

        // Validation
        if (!freelancerId) {
            return NextResponse.json(
                { error: 'Freelancer ID is required' },
                { status: 400 }
            );
        }

        const parsedAmount = Number.parseFloat(amountValue);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return NextResponse.json(
                { error: 'Withdrawal amount must be greater than zero' },
                { status: 400 }
            );
        }

        if (!currencyInput) {
            return NextResponse.json(
                { error: 'Invalid currency' },
                { status: 400 }
            );
        }

        if (!isAllowedType(destinationType)) {
            return NextResponse.json(
                { error: 'Destination type must be BANK or CRYPTO' },
                { status: 400 }
            );
        }

        if (!destination) {
            return NextResponse.json(
                { error: 'Destination is required' },
                { status: 400 }
            );
        }

        // Validate destination format
        if (destinationType === 'CRYPTO') {
            const normalizedAddress = destination.toLowerCase();
            const isValidAddress = /^0x[a-f0-9]{40}$/.test(normalizedAddress);
            if (!isValidAddress) {
                return NextResponse.json(
                    { error: 'Invalid crypto wallet address' },
                    { status: 400 }
                );
            }
        }

        // Verify freelancer exists
        const freelancer = await prisma.freelancer.findUnique({
            where: { id: freelancerId },
            select: { id: true, name: true },
        });

        if (!freelancer) {
            return NextResponse.json(
                { error: 'Freelancer not found' },
                { status: 404 }
            );
        }

        // Calculate available balance (paid invoices - completed withdrawals)
        const paidInvoices = await prisma.invoice.findMany({
            where: {
                freelancerId,
                status: 'PAID',
                currency: currencyInput as Currency,
            },
            select: { amount: true },
        });

        const completedWithdrawals = await prisma.withdrawal.findMany({
            where: {
                freelancerId,
                status: 'COMPLETED',
                currency: currencyInput as Currency,
            },
            select: { amount: true },
        });

        const pendingWithdrawals = await prisma.withdrawal.findMany({
            where: {
                freelancerId,
                status: { in: ['PENDING', 'PROCESSING'] },
                currency: currencyInput as Currency,
            },
            select: { amount: true },
        });

        const totalEarned = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
        const totalWithdrawn = completedWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
        const totalPending = pendingWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
        const availableBalance = totalEarned - totalWithdrawn - totalPending;

        if (parsedAmount > availableBalance) {
            return NextResponse.json(
                {
                    error: 'Insufficient balance',
                    availableBalance,
                    requested: parsedAmount,
                },
                { status: 400 }
            );
        }

        // Create withdrawal
        const withdrawal = await prisma.withdrawal.create({
            data: {
                freelancerId,
                amount: parsedAmount,
                currency: currencyInput as Currency,
                destinationType: destinationType as WithdrawalType,
                destination,
                status: 'PENDING',
            },
        });

        return NextResponse.json({
            withdrawal,
            balance: {
                totalEarned,
                totalWithdrawn,
                pendingWithdrawals: totalPending + parsedAmount,
                availableAfter: availableBalance - parsedAmount,
            },
            message: 'Withdrawal request created successfully',
        });
    } catch (error) {
        console.error('Failed to create withdrawal:', error);
        return NextResponse.json(
            { error: 'Failed to create withdrawal' },
            { status: 500 }
        );
    }
}

// PATCH /api/withdrawals - Update withdrawal status
export async function PATCH(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const body = await request.json();
        const id = String(body.id || '').trim();
        const statusInput = body.status ? String(body.status).trim().toUpperCase() : null;
        const txHash = body.txHash ? String(body.txHash).trim() : null;

        if (!id) {
            return NextResponse.json(
                { error: 'Withdrawal ID is required' },
                { status: 400 }
            );
        }

        // Get existing withdrawal
        const existingWithdrawal = await prisma.withdrawal.findUnique({
            where: { id },
        });

        if (!existingWithdrawal) {
            return NextResponse.json(
                { error: 'Withdrawal not found' },
                { status: 404 }
            );
        }

        if (!statusInput) {
            return NextResponse.json(
                { error: 'Status is required' },
                { status: 400 }
            );
        }

        if (!isAllowedStatus(statusInput)) {
            return NextResponse.json(
                { error: 'Invalid withdrawal status' },
                { status: 400 }
            );
        }

        // Validate status transitions
        const currentStatus = existingWithdrawal.status;
        const validTransitions: Record<string, string[]> = {
            PENDING: ['PROCESSING', 'FAILED'],
            PROCESSING: ['COMPLETED', 'FAILED'],
            COMPLETED: [],
            FAILED: ['PENDING'],
        };

        if (!validTransitions[currentStatus]?.includes(statusInput)) {
            return NextResponse.json(
                { error: `Cannot transition from ${currentStatus} to ${statusInput}` },
                { status: 400 }
            );
        }

        const withdrawal = await prisma.withdrawal.update({
            where: { id },
            data: {
                status: statusInput as PaymentStatus,
                txHash: txHash || undefined,
                completedAt: statusInput === 'COMPLETED' ? new Date() : undefined,
            },
        });

        return NextResponse.json({
            withdrawal,
            message: 'Withdrawal status updated successfully',
        });
    } catch (error) {
        console.error('Failed to update withdrawal:', error);
        return NextResponse.json(
            { error: 'Failed to update withdrawal' },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import type { PaymentStatus, Currency } from '@prisma/client';

// Force dynamic rendering - prevents build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_STATUSES = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] as const;
const ALLOWED_CURRENCIES = ['USDC', 'IDRX', 'ETH'] as const;

const isAllowedStatus = (value: string): value is PaymentStatus =>
    ALLOWED_STATUSES.includes(value as PaymentStatus);

const isAllowedCurrency = (value: string): value is Currency =>
    ALLOWED_CURRENCIES.includes(value as Currency);

// GET /api/payments/status?id=xxx - Check payment status
export async function GET(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const { searchParams } = new URL(request.url);
        const paymentId = searchParams.get('id');
        const invoiceId = searchParams.get('invoiceId');

        if (paymentId) {
            const payment = await prisma.payment.findUnique({
                where: { id: paymentId },
                include: { invoice: true },
            });

            if (!payment) {
                return NextResponse.json(
                    { error: 'Payment not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ payment });
        }

        if (invoiceId) {
            const payments = await prisma.payment.findMany({
                where: { invoiceId },
                orderBy: { createdAt: 'desc' },
            });

            return NextResponse.json({ payments });
        }

        return NextResponse.json(
            { error: 'Payment ID or Invoice ID is required' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Failed to fetch payment:', error);
        return NextResponse.json(
            { error: 'Failed to fetch payment' },
            { status: 500 }
        );
    }
}

// POST /api/payments/status - Record payment
export async function POST(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const body = await request.json();
        const invoiceId = String(body.invoiceId || '').trim();
        const amount = String(body.amount ?? '').trim();
        const statusInput = String(body.status || 'PENDING').trim().toUpperCase();
        const currencyInput = String(body.currency || 'USDC').trim().toUpperCase();

        if (!invoiceId) {
            return NextResponse.json(
                { error: 'Invoice ID is required' },
                { status: 400 }
            );
        }

        const parsedAmount = Number.parseFloat(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return NextResponse.json(
                { error: 'Payment amount must be greater than zero' },
                { status: 400 }
            );
        }

        if (!isAllowedStatus(statusInput)) {
            return NextResponse.json(
                { error: 'Invalid payment status' },
                { status: 400 }
            );
        }

        if (!isAllowedCurrency(currencyInput)) {
            return NextResponse.json(
                { error: 'Invalid currency' },
                { status: 400 }
            );
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            select: { id: true },
        });

        if (!invoice) {
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            );
        }

        const payment = await prisma.payment.create({
            data: {
                invoiceId,
                amount,
                currency: currencyInput as Currency,
                status: statusInput as PaymentStatus,
                txHash: body.txHash || null,
                payerAddress: body.payerAddress || null,
            },
        });

        // If payment is completed, update invoice status
        if (statusInput === 'COMPLETED') {
            await prisma.invoice.update({
                where: { id: invoiceId },
                data: {
                    status: 'PAID',
                    paidAt: new Date(),
                },
            });
        }

        return NextResponse.json({
            payment,
            message: 'Payment recorded'
        });
    } catch (error) {
        console.error('Failed to record payment:', error);
        return NextResponse.json(
            { error: 'Failed to record payment' },
            { status: 500 }
        );
    }
}

// PATCH /api/payments/status - Update payment status
export async function PATCH(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const body = await request.json();
        const id = String(body.id || '').trim();
        const statusInput = String(body.status || '').trim().toUpperCase();

        if (!id) {
            return NextResponse.json(
                { error: 'Payment ID is required' },
                { status: 400 }
            );
        }

        if (!isAllowedStatus(statusInput)) {
            return NextResponse.json(
                { error: 'Valid payment status is required' },
                { status: 400 }
            );
        }

        const payment = await prisma.payment.update({
            where: { id },
            data: {
                status: statusInput as PaymentStatus,
                txHash: body.txHash || undefined,
                confirmedAt: statusInput === 'COMPLETED' ? new Date() : undefined,
            },
        });

        // If payment is completed, update invoice status
        if (statusInput === 'COMPLETED') {
            await prisma.invoice.update({
                where: { id: payment.invoiceId },
                data: {
                    status: 'PAID',
                    paidAt: new Date(),
                },
            });
        }

        return NextResponse.json({
            payment,
            message: 'Payment status updated'
        });
    } catch (error) {
        console.error('Failed to update payment:', error);
        return NextResponse.json(
            { error: 'Failed to update payment status' },
            { status: 500 }
        );
    }
}

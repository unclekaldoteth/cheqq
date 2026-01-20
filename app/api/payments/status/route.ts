import { NextResponse } from 'next/server';
import type { PaymentStatus, Currency } from '@prisma/client';

// Force dynamic rendering - prevents build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

        const payment = await prisma.payment.create({
            data: {
                invoiceId: body.invoiceId,
                amount: body.amount,
                currency: (body.currency as Currency) || 'USDC',
                status: (body.status as PaymentStatus) || 'PENDING',
                txHash: body.txHash || null,
                payerAddress: body.payerAddress || null,
            },
        });

        // If payment is completed, update invoice status
        if (body.status === 'COMPLETED') {
            await prisma.invoice.update({
                where: { id: body.invoiceId },
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
        const { id, status, txHash } = body;

        const payment = await prisma.payment.update({
            where: { id },
            data: {
                status: status as PaymentStatus,
                txHash: txHash || undefined,
                confirmedAt: status === 'COMPLETED' ? new Date() : undefined,
            },
        });

        // If payment is completed, update invoice status
        if (status === 'COMPLETED') {
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

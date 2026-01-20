import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createHmac } from 'crypto';

// Webhook secret for verifying signatures (set in .env)
const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || '';

/**
 * Verify webhook signature
 */
function verifySignature(payload: string, signature: string): boolean {
    if (!WEBHOOK_SECRET) {
        console.warn('PAYMENT_WEBHOOK_SECRET not set - skipping verification');
        return true;
    }

    const expectedSignature = createHmac('sha256', WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

    return signature === expectedSignature || signature === `sha256=${expectedSignature}`;
}

// POST /api/webhooks/payment - Handle payment confirmations
export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get('x-signature') ||
            request.headers.get('x-hub-signature-256') || '';

        // Verify signature
        if (!verifySignature(rawBody, signature)) {
            console.error('Invalid webhook signature');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        const body = JSON.parse(rawBody);
        const { event, data } = body;

        console.log(`Webhook received: ${event}`, data);

        switch (event) {
            case 'payment.completed': {
                const { invoiceId, paymentId, txHash, amount, currency, payerAddress } = data;

                // Record payment
                const payment = await prisma.payment.upsert({
                    where: { id: paymentId || `webhook-${Date.now()}` },
                    update: {
                        status: 'COMPLETED',
                        txHash,
                        payerAddress,
                        confirmedAt: new Date(),
                    },
                    create: {
                        invoiceId,
                        amount,
                        currency: currency || 'USDC',
                        status: 'COMPLETED',
                        txHash,
                        payerAddress,
                        confirmedAt: new Date(),
                    },
                });

                // Update invoice status
                await prisma.invoice.update({
                    where: { id: invoiceId },
                    data: {
                        status: 'PAID',
                        paidAt: new Date(),
                    },
                });

                console.log(`Payment confirmed: ${payment.id} for invoice ${invoiceId}`);

                // TODO: Send notification email or push notification

                return NextResponse.json({
                    success: true,
                    paymentId: payment.id,
                    message: 'Payment confirmed'
                });
            }

            case 'payment.failed': {
                const { invoiceId, paymentId, error } = data;

                if (paymentId) {
                    await prisma.payment.update({
                        where: { id: paymentId },
                        data: { status: 'FAILED' },
                    });
                }

                console.error(`Payment failed for invoice ${invoiceId}:`, error);

                return NextResponse.json({
                    success: true,
                    message: 'Payment failure recorded'
                });
            }

            case 'payroll.completed': {
                const { payrollRunId, results } = data;

                // Update payroll run and items
                await prisma.payrollRun.update({
                    where: { id: payrollRunId },
                    data: {
                        status: 'COMPLETED',
                        executedAt: new Date(),
                    },
                });

                // Update individual items
                for (const result of results) {
                    await prisma.payrollItem.update({
                        where: { id: result.itemId },
                        data: {
                            status: result.success ? 'COMPLETED' : 'FAILED',
                            txHash: result.txHash || null,
                        },
                    });
                }

                console.log(`Payroll completed: ${payrollRunId}`);

                return NextResponse.json({
                    success: true,
                    message: 'Payroll completion recorded'
                });
            }

            default:
                console.log(`Unknown webhook event: ${event}`);
                return NextResponse.json({
                    success: true,
                    message: 'Event received but not processed'
                });
        }
    } catch (error) {
        console.error('Webhook processing failed:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

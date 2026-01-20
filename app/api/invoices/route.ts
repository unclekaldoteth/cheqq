import { NextResponse } from 'next/server';
import type { Currency, InvoiceStatus } from '@prisma/client';

// Force dynamic rendering - prevents build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_STATUSES = ['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'] as const;
const ALLOWED_CURRENCIES = ['USDC', 'IDRX', 'ETH'] as const;

const isAllowedStatus = (value: string): value is InvoiceStatus =>
    ALLOWED_STATUSES.includes(value as InvoiceStatus);

const isAllowedCurrency = (value: string): value is Currency =>
    ALLOWED_CURRENCIES.includes(value as Currency);

// GET /api/invoices - List all invoices
export async function GET(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const companyId = searchParams.get('companyId');
        const freelancerId = searchParams.get('freelancerId');
        const statusParam = searchParams.get('status');
        const status = statusParam ? statusParam.toUpperCase() : null;

        if (status && !isAllowedStatus(status)) {
            return NextResponse.json(
                { error: 'Invalid invoice status' },
                { status: 400 }
            );
        }

        if (id) {
            const invoice = await prisma.invoice.findUnique({
                where: { id },
                include: {
                    payments: true,
                    company: {
                        select: {
                            id: true,
                            name: true,
                            walletAddress: true,
                        },
                    },
                    freelancer: {
                        select: {
                            id: true,
                            name: true,
                            walletAddress: true,
                        },
                    },
                },
            });

            if (!invoice) {
                return NextResponse.json(
                    { error: 'Invoice not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ invoice });
        }

        const where: Record<string, unknown> = {};
        if (companyId) where.companyId = companyId;
        if (freelancerId) where.freelancerId = freelancerId;
        if (status) where.status = status;

        const invoices = await prisma.invoice.findMany({
            where,
            include: {
                payments: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ invoices });
    } catch (error) {
        console.error('Failed to fetch invoices:', error);
        return NextResponse.json(
            { error: 'Failed to fetch invoices' },
            { status: 500 }
        );
    }
}

// POST /api/invoices - Create new invoice
export async function POST(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const body = await request.json();
        const companyId = String(body.companyId || '').trim();
        const freelancerId = String(body.freelancerId || '').trim();
        const clientName = String(body.clientName || '').trim();
        const clientEmail = String(body.clientEmail || '').trim();
        const description = String(body.description || '').trim();
        const amount = String(body.amount ?? '').trim();
        const currencyInput = String(body.currency || 'USDC').trim().toUpperCase();

        if (!companyId && !freelancerId) {
            return NextResponse.json(
                { error: 'Company or freelancer ID is required' },
                { status: 400 }
            );
        }

        if (!clientName || !clientEmail || !description) {
            return NextResponse.json(
                { error: 'Client name, email, and description are required' },
                { status: 400 }
            );
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
            return NextResponse.json(
                { error: 'Invalid client email address' },
                { status: 400 }
            );
        }

        const parsedAmount = Number.parseFloat(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return NextResponse.json(
                { error: 'Invoice amount must be greater than zero' },
                { status: 400 }
            );
        }

        if (!isAllowedCurrency(currencyInput)) {
            return NextResponse.json(
                { error: 'Invalid currency' },
                { status: 400 }
            );
        }

        const dueDate = body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        if (Number.isNaN(dueDate.getTime())) {
            return NextResponse.json(
                { error: 'Invalid due date' },
                { status: 400 }
            );
        }

        const invoice = await prisma.invoice.create({
            data: {
                companyId: companyId || null,
                freelancerId: freelancerId || null,
                clientName,
                clientEmail,
                description,
                amount,
                currency: currencyInput as Currency,
                status: 'PENDING',
                dueDate,
            },
            include: {
                company: { select: { walletAddress: true } },
                freelancer: { select: { walletAddress: true } },
            },
        });

        // Generate payment link
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const paymentLinkUrl = new URL(`/pay/${invoice.id}`, baseUrl);
        paymentLinkUrl.searchParams.set('amount', invoice.amount.toString());
        paymentLinkUrl.searchParams.set('currency', invoice.currency);
        const recipientAddress = invoice.company?.walletAddress || invoice.freelancer?.walletAddress;
        if (recipientAddress) {
            paymentLinkUrl.searchParams.set('recipient', recipientAddress);
        }

        return NextResponse.json({
            invoice,
            paymentLink: paymentLinkUrl.toString(),
            message: 'Invoice created successfully'
        });
    } catch (error) {
        console.error('Failed to create invoice:', error);
        return NextResponse.json(
            { error: 'Failed to create invoice' },
            { status: 500 }
        );
    }
}

// PATCH /api/invoices - Update invoice status
export async function PATCH(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const body = await request.json();
        const id = String(body.id || '').trim();
        const statusInput = body.status ? String(body.status).trim().toUpperCase() : '';

        if (!id) {
            return NextResponse.json(
                { error: 'Invoice ID is required' },
                { status: 400 }
            );
        }

        if (!statusInput || !isAllowedStatus(statusInput)) {
            return NextResponse.json(
                { error: 'Valid invoice status is required' },
                { status: 400 }
            );
        }

        const paidAt = body.paidAt ? new Date(body.paidAt) : undefined;
        if (paidAt && Number.isNaN(paidAt.getTime())) {
            return NextResponse.json(
                { error: 'Invalid paid at date' },
                { status: 400 }
            );
        }

        const invoice = await prisma.invoice.update({
            where: { id },
            data: {
                status: statusInput as InvoiceStatus,
                paidAt,
            },
        });

        return NextResponse.json({
            invoice,
            message: 'Invoice updated successfully'
        });
    } catch (error) {
        console.error('Failed to update invoice:', error);
        return NextResponse.json(
            { error: 'Failed to update invoice' },
            { status: 500 }
        );
    }
}

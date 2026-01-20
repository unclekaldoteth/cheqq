import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Currency, InvoiceStatus } from '@prisma/client';

// GET /api/invoices - List all invoices
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const companyId = searchParams.get('companyId');
        const freelancerId = searchParams.get('freelancerId');
        const status = searchParams.get('status') as InvoiceStatus | null;

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
        const body = await request.json();

        const invoice = await prisma.invoice.create({
            data: {
                companyId: body.companyId || null,
                freelancerId: body.freelancerId || null,
                clientName: body.clientName,
                clientEmail: body.clientEmail,
                description: body.description,
                amount: body.amount,
                currency: (body.currency as Currency) || 'USDC',
                status: 'PENDING',
                dueDate: body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });

        // Generate payment link
        const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pay/${invoice.id}`;

        return NextResponse.json({
            invoice,
            paymentLink,
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
        const body = await request.json();
        const { id, status, paidAt } = body;

        const invoice = await prisma.invoice.update({
            where: { id },
            data: {
                status: status as InvoiceStatus,
                paidAt: paidAt ? new Date(paidAt) : undefined,
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

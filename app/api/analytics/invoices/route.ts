import { NextResponse } from 'next/server';
import type { InvoiceStatus } from '@prisma/client';

// Force dynamic rendering - prevents build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/analytics/invoices - Get invoice analytics
export async function GET(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('companyId')?.trim();
        const freelancerId = searchParams.get('freelancerId')?.trim();
        const startDate = searchParams.get('startDate')?.trim();
        const endDate = searchParams.get('endDate')?.trim();

        if (!companyId && !freelancerId) {
            return NextResponse.json(
                { error: 'Company ID or freelancer ID is required' },
                { status: 400 }
            );
        }

        // Build query filter
        interface InvoiceWhere {
            companyId?: string;
            freelancerId?: string;
            createdAt?: { gte?: Date; lte?: Date };
        }
        const where: InvoiceWhere = {};

        if (companyId) where.companyId = companyId;
        if (freelancerId) where.freelancerId = freelancerId;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                const start = new Date(startDate);
                if (Number.isNaN(start.getTime())) {
                    return NextResponse.json(
                        { error: 'Invalid startDate' },
                        { status: 400 }
                    );
                }
                where.createdAt.gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                if (Number.isNaN(end.getTime())) {
                    return NextResponse.json(
                        { error: 'Invalid endDate' },
                        { status: 400 }
                    );
                }
                where.createdAt.lte = end;
            }
        }

        if (where.createdAt?.gte && where.createdAt?.lte && where.createdAt.gte > where.createdAt.lte) {
            return NextResponse.json(
                { error: 'startDate cannot be after endDate' },
                { status: 400 }
            );
        }

        // Fetch all invoices matching filter
        const invoices = await prisma.invoice.findMany({
            where,
            select: {
                id: true,
                amount: true,
                currency: true,
                status: true,
                dueDate: true,
                paidAt: true,
                createdAt: true,
            },
        });

        // Calculate statistics
        const now = new Date();
        const stats = {
            total: invoices.length,
            draft: 0,
            pending: 0,
            paid: 0,
            overdue: 0,
            cancelled: 0,
        };

        const amounts = {
            total: 0,
            draft: 0,
            pending: 0,
            paid: 0,
            overdue: 0,
            cancelled: 0,
        };

        // Group by currency
        const byCurrency: Record<string, { count: number; total: number; paid: number; pending: number }> = {};

        // Monthly breakdown (last 6 months)
        const monthlyData: Record<string, { invoiced: number; paid: number; count: number }> = {};

        for (const invoice of invoices) {
            const amount = Number(invoice.amount);
            const status = invoice.status as InvoiceStatus;
            const isOverdue = status === 'PENDING' && invoice.dueDate < now;

            // Status counts
            if (isOverdue) {
                stats.overdue++;
                amounts.overdue += amount;
            } else {
                const statusKey = status.toLowerCase() as keyof typeof stats;
                if (statusKey in stats) {
                    stats[statusKey]++;
                    amounts[statusKey] += amount;
                }
            }
            amounts.total += amount;

            // Currency breakdown
            const curr = invoice.currency;
            if (!byCurrency[curr]) {
                byCurrency[curr] = { count: 0, total: 0, paid: 0, pending: 0 };
            }
            byCurrency[curr].count++;
            byCurrency[curr].total += amount;
            if (status === 'PAID') byCurrency[curr].paid += amount;
            if (status === 'PENDING' || isOverdue) byCurrency[curr].pending += amount;

            // Monthly breakdown
            const monthKey = invoice.createdAt.toISOString().slice(0, 7); // YYYY-MM
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { invoiced: 0, paid: 0, count: 0 };
            }
            monthlyData[monthKey].count++;
            monthlyData[monthKey].invoiced += amount;
            if (status === 'PAID') monthlyData[monthKey].paid += amount;
        }

        // Convert monthly data to sorted array
        const monthly = Object.entries(monthlyData)
            .map(([month, data]) => ({ month, ...data }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-6); // Last 6 months

        // Calculate metrics
        const collectionRate = amounts.total > 0
            ? Math.round((amounts.paid / amounts.total) * 100)
            : 0;

        const avgInvoiceAmount = stats.total > 0
            ? Math.round(amounts.total / stats.total)
            : 0;

        const paidInvoices = invoices.filter((i) => i.status === 'PAID' && i.paidAt);
        const avgDaysToPayment = paidInvoices.reduce((sum, i) => {
                const days = Math.ceil(
                    (i.paidAt!.getTime() - i.createdAt.getTime()) / (1000 * 60 * 60 * 24)
                );
                return sum + days;
            }, 0);

        const avgDays = paidInvoices.length > 0
            ? Math.round(avgDaysToPayment / paidInvoices.length)
            : 0;

        return NextResponse.json({
            summary: {
                counts: stats,
                amounts,
                collectionRate,
                avgInvoiceAmount,
                avgDaysToPayment: avgDays,
            },
            byCurrency: Object.entries(byCurrency).map(([currency, data]) => ({
                currency,
                ...data,
            })),
            monthly,
            filters: {
                companyId: companyId || null,
                freelancerId: freelancerId || null,
                startDate: startDate || null,
                endDate: endDate || null,
            },
        });
    } catch (error) {
        console.error('Failed to fetch invoice analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch invoice analytics' },
            { status: 500 }
        );
    }
}

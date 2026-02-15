import { NextResponse } from 'next/server';

// Force dynamic rendering - prevents build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/analytics/freelancer - Get freelancer dashboard analytics
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
                email: true,
                walletAddress: true,
                createdAt: true,
            },
        });

        if (!freelancer) {
            return NextResponse.json(
                { error: 'Freelancer not found' },
                { status: 404 }
            );
        }

        // Get all invoices
        const invoices = await prisma.invoice.findMany({
            where: { freelancerId },
            select: {
                id: true,
                amount: true,
                currency: true,
                status: true,
                dueDate: true,
                createdAt: true,
                paidAt: true,
            },
        });

        // Get all withdrawals
        const withdrawals = await prisma.withdrawal.findMany({
            where: { freelancerId },
            select: {
                id: true,
                amount: true,
                currency: true,
                status: true,
                createdAt: true,
                completedAt: true,
            },
        });

        // Calculate invoice stats
        const now = new Date();
        const invoiceStats = {
            total: invoices.length,
            draft: 0,
            pending: 0,
            paid: 0,
            overdue: 0,
            cancelled: 0,
        };

        for (const invoice of invoices) {
            const isOverdue = invoice.status === 'OVERDUE'
                || (invoice.status === 'PENDING' && invoice.dueDate < now);

            if (isOverdue) {
                invoiceStats.overdue += 1;
                continue;
            }

            if (invoice.status === 'DRAFT') {
                invoiceStats.draft += 1;
                continue;
            }

            if (invoice.status === 'PENDING') {
                invoiceStats.pending += 1;
                continue;
            }

            if (invoice.status === 'PAID') {
                invoiceStats.paid += 1;
                continue;
            }

            if (invoice.status === 'CANCELLED') {
                invoiceStats.cancelled += 1;
            }
        }

        // Calculate earnings by currency
        const earningsByCurrency: Record<string, {
            totalInvoiced: number;
            totalPaid: number;
            pending: number;
            withdrawn: number;
            pendingWithdrawals: number;
            availableBalance: number;
        }> = {};

        for (const invoice of invoices) {
            const isOverdue = invoice.status === 'OVERDUE'
                || (invoice.status === 'PENDING' && invoice.dueDate < now);
            const curr = invoice.currency;
            if (!earningsByCurrency[curr]) {
                earningsByCurrency[curr] = {
                    totalInvoiced: 0,
                    totalPaid: 0,
                    pending: 0,
                    withdrawn: 0,
                    pendingWithdrawals: 0,
                    availableBalance: 0,
                };
            }
            earningsByCurrency[curr].totalInvoiced += Number(invoice.amount);
            if (invoice.status === 'PAID') {
                earningsByCurrency[curr].totalPaid += Number(invoice.amount);
            }
            if (invoice.status === 'PENDING' || isOverdue) {
                earningsByCurrency[curr].pending += Number(invoice.amount);
            }
        }

        for (const withdrawal of withdrawals) {
            const curr = withdrawal.currency;
            if (!earningsByCurrency[curr]) {
                earningsByCurrency[curr] = {
                    totalInvoiced: 0,
                    totalPaid: 0,
                    pending: 0,
                    withdrawn: 0,
                    pendingWithdrawals: 0,
                    availableBalance: 0,
                };
            }
            if (withdrawal.status === 'COMPLETED') {
                earningsByCurrency[curr].withdrawn += Number(withdrawal.amount);
            }
            if (withdrawal.status === 'PENDING' || withdrawal.status === 'PROCESSING') {
                earningsByCurrency[curr].pendingWithdrawals += Number(withdrawal.amount);
            }
        }

        // Calculate available balances
        for (const curr of Object.keys(earningsByCurrency)) {
            const e = earningsByCurrency[curr];
            e.availableBalance = e.totalPaid - e.withdrawn - e.pendingWithdrawals;
        }

        // Calculate totals (in primary currency - AlphaUSD)
        const totals = {
            totalInvoiced: Object.values(earningsByCurrency).reduce((sum, e) => sum + e.totalInvoiced, 0),
            totalPaid: Object.values(earningsByCurrency).reduce((sum, e) => sum + e.totalPaid, 0),
            pendingPayments: Object.values(earningsByCurrency).reduce((sum, e) => sum + e.pending, 0),
            totalWithdrawn: Object.values(earningsByCurrency).reduce((sum, e) => sum + e.withdrawn, 0),
            pendingWithdrawals: Object.values(earningsByCurrency).reduce((sum, e) => sum + e.pendingWithdrawals, 0),
            availableBalance: Object.values(earningsByCurrency).reduce((sum, e) => sum + e.availableBalance, 0),
        };

        // Monthly earnings trend (last 6 months)
        const monthlyData: Record<string, { invoiced: number; paid: number; withdrawn: number }> = {};

        for (const invoice of invoices) {
            const monthKey = invoice.createdAt.toISOString().slice(0, 7);
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { invoiced: 0, paid: 0, withdrawn: 0 };
            }
            monthlyData[monthKey].invoiced += Number(invoice.amount);
            if (invoice.status === 'PAID') {
                monthlyData[monthKey].paid += Number(invoice.amount);
            }
        }

        for (const withdrawal of withdrawals) {
            if (withdrawal.status === 'COMPLETED' && withdrawal.completedAt) {
                const monthKey = withdrawal.completedAt.toISOString().slice(0, 7);
                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = { invoiced: 0, paid: 0, withdrawn: 0 };
                }
                monthlyData[monthKey].withdrawn += Number(withdrawal.amount);
            }
        }

        const monthly = Object.entries(monthlyData)
            .map(([month, data]) => ({ month, ...data }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-6);

        // Recent activity
        const recentInvoices = invoices
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 5);

        const recentWithdrawals = withdrawals
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 5);

        // Withdrawal stats
        const withdrawalStats = {
            total: withdrawals.length,
            pending: withdrawals.filter((w) => w.status === 'PENDING').length,
            processing: withdrawals.filter((w) => w.status === 'PROCESSING').length,
            completed: withdrawals.filter((w) => w.status === 'COMPLETED').length,
            failed: withdrawals.filter((w) => w.status === 'FAILED').length,
        };

        return NextResponse.json({
            freelancer: {
                id: freelancer.id,
                name: freelancer.name,
                email: freelancer.email,
                walletAddress: freelancer.walletAddress,
                memberSince: freelancer.createdAt,
            },
            invoices: invoiceStats,
            withdrawals: withdrawalStats,
            earnings: {
                totals,
                byCurrency: Object.entries(earningsByCurrency).map(([currency, data]) => ({
                    currency,
                    ...data,
                })),
            },
            monthly,
            recentActivity: {
                invoices: recentInvoices,
                withdrawals: recentWithdrawals,
            },
        });
    } catch (error) {
        console.error('Failed to fetch freelancer analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch freelancer analytics' },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/analytics/company - Get company dashboard analytics
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
            select: {
                id: true,
                name: true,
                email: true,
                walletAddress: true,
                createdAt: true,
            },
        });

        if (!company) {
            return NextResponse.json(
                { error: 'Company not found' },
                { status: 404 }
            );
        }

        // Get all invoices
        const invoices = await prisma.invoice.findMany({
            where: { companyId },
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

        // Get employees
        const employees = await prisma.employee.findMany({
            where: { companyId },
            select: {
                id: true,
                status: true,
                salary: true,
                currency: true,
            },
        });

        // Get payroll runs
        const payrollRuns = await prisma.payrollRun.findMany({
            where: { companyId },
            include: {
                items: {
                    select: {
                        id: true,
                        netAmount: true,
                        status: true,
                        txHash: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        // Get treasury balances
        const treasuryBalances = await prisma.treasuryBalance.findMany({
            where: { companyId },
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

        let totalInvoiced = 0;
        let totalPaid = 0;
        let totalPending = 0;

        for (const invoice of invoices) {
            const isOverdue = invoice.status === 'OVERDUE'
                || (invoice.status === 'PENDING' && invoice.dueDate < now);
            const amount = Number(invoice.amount);
            totalInvoiced += amount;

            if (isOverdue) {
                invoiceStats.overdue += 1;
                totalPending += amount;
                continue;
            }

            if (invoice.status === 'DRAFT') {
                invoiceStats.draft += 1;
                continue;
            }

            if (invoice.status === 'PENDING') {
                invoiceStats.pending += 1;
                totalPending += amount;
                continue;
            }

            if (invoice.status === 'PAID') {
                invoiceStats.paid += 1;
                totalPaid += amount;
                continue;
            }

            if (invoice.status === 'CANCELLED') {
                invoiceStats.cancelled += 1;
            }
        }

        // Calculate employee stats
        const activeEmployees = employees.filter(e => e.status === 'ACTIVE');
        const monthlyPayroll = activeEmployees.reduce(
            (sum, e) => sum + Number(e.salary),
            0
        );

        const employeeStats = {
            total: employees.length,
            active: activeEmployees.length,
            monthlyPayroll,
        };

        // Calculate payroll stats
        const payrollStats = {
            totalRuns: payrollRuns.length,
            completed: payrollRuns.filter(p => p.status === 'COMPLETED').length,
            pending: payrollRuns.filter(p => p.status === 'PENDING').length,
            totalPaid: payrollRuns
                .filter(p => p.status === 'COMPLETED')
                .reduce((sum, p) => sum + Number(p.totalAmount), 0),
        };

        // Calculate treasury totals
        const treasurySummary = {
            totalBalance: 0,
            totalYield: 0,
        };

        for (const balance of treasuryBalances) {
            treasurySummary.totalBalance += Number(balance.balance);
            treasurySummary.totalYield += Number(balance.yieldEarned);
        }

        // Build recent transactions
        interface Transaction {
            id: string;
            type: string;
            title: string;
            description: string;
            amount: number;
            currency: string;
            status: string;
            date: string;
            txHash?: string | null;
        }

        const transactions: Transaction[] = [];

        // Add payroll runs to transactions
        for (const run of payrollRuns.slice(0, 10)) {
            transactions.push({
                id: run.id,
                type: 'outgoing',
                title: `Payroll - ${run.createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
                description: `Batch payment to ${run.items.length} employees`,
                amount: Number(run.totalAmount),
                currency: run.currency,
                status: run.status,
                date: (run.executedAt || run.createdAt).toISOString(),
                txHash: run.txHash,
            });
        }

        // Add paid invoices to transactions
        const paidInvoices = invoices
            .filter(inv => inv.status === 'PAID' && inv.paidAt)
            .sort((a, b) => new Date(b.paidAt!).getTime() - new Date(a.paidAt!).getTime())
            .slice(0, 10);

        for (const inv of paidInvoices) {
            transactions.push({
                id: inv.id,
                type: 'incoming',
                title: `Invoice #${inv.id.slice(-8).toUpperCase()}`,
                description: 'Payment received',
                amount: Number(inv.amount),
                currency: inv.currency,
                status: 'COMPLETED',
                date: inv.paidAt!.toISOString(),
            });
        }

        // Sort by date descending
        transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Monthly trend data
        const monthlyData: Record<string, {
            invoiced: number;
            paid: number;
            payroll: number;
        }> = {};

        for (const invoice of invoices) {
            const monthKey = invoice.createdAt.toISOString().slice(0, 7);
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { invoiced: 0, paid: 0, payroll: 0 };
            }
            monthlyData[monthKey].invoiced += Number(invoice.amount);
            if (invoice.status === 'PAID') {
                monthlyData[monthKey].paid += Number(invoice.amount);
            }
        }

        for (const run of payrollRuns) {
            if (run.status === 'COMPLETED' && run.executedAt) {
                const monthKey = run.executedAt.toISOString().slice(0, 7);
                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = { invoiced: 0, paid: 0, payroll: 0 };
                }
                monthlyData[monthKey].payroll += Number(run.totalAmount);
            }
        }

        const monthly = Object.entries(monthlyData)
            .map(([month, data]) => ({ month, ...data }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-6);

        return NextResponse.json({
            company: {
                id: company.id,
                name: company.name,
                email: company.email,
                walletAddress: company.walletAddress,
                memberSince: company.createdAt,
            },
            invoices: invoiceStats,
            employees: employeeStats,
            payroll: payrollStats,
            earnings: {
                totalInvoiced,
                totalPaid,
                totalPending,
            },
            treasury: treasurySummary,
            transactions: transactions.slice(0, 10),
            monthly,
        });
    } catch (error) {
        console.error('Failed to fetch company analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch company analytics' },
            { status: 500 }
        );
    }
}

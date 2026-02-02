import { NextResponse } from 'next/server';
import type { EmployeeStatus } from '@prisma/client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_STATUSES = ['ACTIVE', 'INACTIVE', 'TERMINATED'] as const;

const isAllowedStatus = (value: string): value is typeof ALLOWED_STATUSES[number] =>
    ALLOWED_STATUSES.includes(value as typeof ALLOWED_STATUSES[number]);

// GET /api/employees - List employees for a company or get single employee by ID
export async function GET(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id')?.trim();
        const companyId = searchParams.get('companyId')?.trim();
        const statusParam = searchParams.get('status')?.trim();
        const normalizedStatus = statusParam ? statusParam.toUpperCase() : null;

        // If id is provided, fetch single employee with full details
        if (id) {
            const employee = await prisma.employee.findUnique({
                where: { id },
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    loans: {
                        orderBy: { createdAt: 'desc' },
                    },
                    payrollItems: {
                        take: 10,
                        orderBy: { payrollRun: { createdAt: 'desc' } },
                        include: {
                            payrollRun: {
                                select: {
                                    id: true,
                                    createdAt: true,
                                    executedAt: true,
                                    status: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!employee) {
                return NextResponse.json(
                    { error: 'Employee not found' },
                    { status: 404 }
                );
            }

            // Calculate totals
            const activeLoan = employee.loans.find(l => l.status === 'ACTIVE');
            const totalDeductions = employee.loans
                .filter(l => l.status === 'ACTIVE')
                .reduce((sum, loan) => sum + Number(loan.monthlyDeduction), 0);

            // Build activity from payroll items with explicit type
            const activity: Array<{
                id: string;
                type: string;
                title: string;
                date: string;
                amount: number;
                status: string;
                txHash: string | null;
            }> = employee.payrollItems.map((item) => ({
                id: item.id,
                type: 'salary',
                title: 'Salary Payment',
                date: item.payrollRun.executedAt?.toISOString() || item.payrollRun.createdAt.toISOString(),
                amount: Number(item.netAmount),
                status: item.status,
                txHash: item.txHash,
            }));

            // Add loan events to activity
            for (const loan of employee.loans) {
                if (loan.approvedAt) {
                    activity.push({
                        id: loan.id,
                        type: 'loan',
                        title: loan.status === 'ACTIVE' ? 'Loan Approved' : `Loan ${loan.status}`,
                        date: loan.approvedAt.toISOString(),
                        amount: Number(loan.amount),
                        status: String(loan.status),
                        txHash: null,
                    });
                }
            }

            // Sort activity by date descending
            activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return NextResponse.json({
                employee: {
                    id: employee.id,
                    name: employee.name,
                    email: employee.email,
                    walletAddress: employee.walletAddress,
                    salary: Number(employee.salary),
                    currency: employee.currency,
                    status: employee.status,
                    createdAt: employee.createdAt.toISOString(),
                    company: employee.company,
                    hasActiveLoan: !!activeLoan,
                    loanBalance: activeLoan ? Number(activeLoan.remainingAmount) : 0,
                    monthlyDeduction: totalDeductions,
                    loans: employee.loans.map(l => ({
                        id: l.id,
                        amount: Number(l.amount),
                        remainingAmount: Number(l.remainingAmount),
                        monthlyDeduction: Number(l.monthlyDeduction),
                        status: l.status,
                        approvedAt: l.approvedAt?.toISOString(),
                        createdAt: l.createdAt.toISOString(),
                    })),
                    activity: activity.slice(0, 10),
                },
            });
        }

        // List employees for a company
        if (!companyId) {
            return NextResponse.json(
                { error: 'Company ID is required' },
                { status: 400 }
            );
        }

        if (normalizedStatus && normalizedStatus !== 'ALL' && !isAllowedStatus(normalizedStatus)) {
            return NextResponse.json(
                { error: 'Invalid employee status' },
                { status: 400 }
            );
        }

        const statusFilter = normalizedStatus && normalizedStatus !== 'ALL'
            ? (normalizedStatus as EmployeeStatus)
            : undefined;

        const employees = await prisma.employee.findMany({
            where: {
                companyId,
                ...(statusFilter ? { status: statusFilter } : {}),
            },
            include: {
                loans: {
                    where: { status: 'ACTIVE' },
                },
            },
            orderBy: { name: 'asc' },
        });

        // Transform to include calculated fields
        const employeesWithPayroll = employees.map((emp) => {
            const salary = Number(emp.salary);
            const totalDeductions = emp.loans.reduce(
                (sum, loan) => sum + Number(loan.monthlyDeduction),
                0
            );
            const netAmount = Math.max(0, salary - totalDeductions);
            const loanBalance = emp.loans.reduce(
                (sum, loan) => sum + Number(loan.remainingAmount),
                0
            );
            return {
                id: emp.id,
                name: emp.name,
                email: emp.email,
                walletAddress: emp.walletAddress,
                salary,
                grossAmount: salary,
                loanDeduction: totalDeductions,
                netAmount,
                currency: emp.currency,
                status: emp.status,
                createdAt: emp.createdAt.toISOString(),
                hasActiveLoan: emp.loans.length > 0,
                loanBalance,
            };
        });

        return NextResponse.json({
            employees: employeesWithPayroll,
            count: employeesWithPayroll.length,
        });
    } catch (error) {
        console.error('Failed to fetch employees:', error);
        return NextResponse.json(
            { error: 'Failed to fetch employees' },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/employees - List employees for a company
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

        const employees = await prisma.employee.findMany({
            where: {
                companyId,
                status: 'ACTIVE',
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
            return {
                id: emp.id,
                name: emp.name,
                email: emp.email,
                walletAddress: emp.walletAddress,
                grossAmount: salary,
                loanDeduction: totalDeductions,
                netAmount,
                currency: emp.currency,
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

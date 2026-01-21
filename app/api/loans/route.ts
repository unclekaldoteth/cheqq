import { NextResponse } from 'next/server';
import type { LoanStatus, Currency } from '@prisma/client';

// Force dynamic rendering - prevents build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_STATUSES = ['PENDING', 'ACTIVE', 'PAID', 'DEFAULTED'] as const;
const ALLOWED_CURRENCIES = ['USDC', 'IDRX', 'ETH'] as const;

const isAllowedStatus = (value: string): value is LoanStatus =>
    ALLOWED_STATUSES.includes(value as LoanStatus);

const isAllowedCurrency = (value: string): value is Currency =>
    ALLOWED_CURRENCIES.includes(value as Currency);

// GET /api/loans - List loans
export async function GET(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const { searchParams } = new URL(request.url);
        const loanId = searchParams.get('id')?.trim();
        const companyId = searchParams.get('companyId')?.trim();
        const employeeId = searchParams.get('employeeId')?.trim();
        const statusParam = searchParams.get('status')?.trim().toUpperCase();

        // Get single loan by ID
        if (loanId) {
            const loan = await prisma.loan.findUnique({
                where: { id: loanId },
                include: {
                    employee: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            walletAddress: true,
                            companyId: true,
                        },
                    },
                },
            });

            if (!loan) {
                return NextResponse.json(
                    { error: 'Loan not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ loan });
        }

        // Build query filter
        interface LoanWhere {
            status?: LoanStatus;
            employeeId?: string;
            employee?: { companyId: string };
        }
        const where: LoanWhere = {};

        if (statusParam) {
            if (!isAllowedStatus(statusParam)) {
                return NextResponse.json(
                    { error: 'Invalid loan status' },
                    { status: 400 }
                );
            }
            where.status = statusParam as LoanStatus;
        }

        if (employeeId) {
            where.employeeId = employeeId;
        }

        if (companyId) {
            where.employee = { companyId };
        }

        const loans = await prisma.loan.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        companyId: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Calculate summary
        const summary = {
            total: loans.length,
            totalAmount: loans.reduce((sum, l) => sum + Number(l.amount), 0),
            totalRemaining: loans.reduce((sum, l) => sum + Number(l.remainingAmount), 0),
            active: loans.filter((l) => l.status === 'ACTIVE').length,
            pending: loans.filter((l) => l.status === 'PENDING').length,
        };

        return NextResponse.json({ loans, summary });
    } catch (error) {
        console.error('Failed to fetch loans:', error);
        return NextResponse.json(
            { error: 'Failed to fetch loans' },
            { status: 500 }
        );
    }
}

// POST /api/loans - Create new loan
export async function POST(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const body = await request.json();
        const employeeId = String(body.employeeId || '').trim();
        const amountValue = String(body.amount ?? '').trim();
        const monthlyDeductionValue = String(body.monthlyDeduction ?? '').trim();
        const currencyInput = String(body.currency || 'USDC').trim().toUpperCase();

        // Validation
        if (!employeeId) {
            return NextResponse.json(
                { error: 'Employee ID is required' },
                { status: 400 }
            );
        }

        const parsedAmount = Number.parseFloat(amountValue);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return NextResponse.json(
                { error: 'Loan amount must be greater than zero' },
                { status: 400 }
            );
        }

        const parsedDeduction = Number.parseFloat(monthlyDeductionValue);
        if (!Number.isFinite(parsedDeduction) || parsedDeduction <= 0) {
            return NextResponse.json(
                { error: 'Monthly deduction must be greater than zero' },
                { status: 400 }
            );
        }

        if (parsedDeduction > parsedAmount) {
            return NextResponse.json(
                { error: 'Monthly deduction cannot exceed loan amount' },
                { status: 400 }
            );
        }

        if (!isAllowedCurrency(currencyInput)) {
            return NextResponse.json(
                { error: 'Invalid currency' },
                { status: 400 }
            );
        }

        // Verify employee exists
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: {
                id: true,
                name: true,
                salary: true,
                companyId: true,
            },
        });

        if (!employee) {
            return NextResponse.json(
                { error: 'Employee not found' },
                { status: 404 }
            );
        }

        // Check if deduction exceeds salary
        if (parsedDeduction > Number(employee.salary)) {
            return NextResponse.json(
                { error: 'Monthly deduction cannot exceed employee salary' },
                { status: 400 }
            );
        }

        // Check for existing active loans
        const existingLoans = await prisma.loan.findMany({
            where: {
                employeeId,
                status: { in: ['PENDING', 'ACTIVE'] },
            },
        });

        const totalExistingDeductions = existingLoans.reduce(
            (sum, l) => sum + Number(l.monthlyDeduction),
            0
        );

        if (totalExistingDeductions + parsedDeduction > Number(employee.salary)) {
            return NextResponse.json(
                { error: 'Total loan deductions would exceed employee salary' },
                { status: 400 }
            );
        }

        // Create loan
        const loan = await prisma.loan.create({
            data: {
                employeeId,
                amount: parsedAmount,
                remainingAmount: parsedAmount,
                monthlyDeduction: parsedDeduction,
                currency: currencyInput as Currency,
                status: 'PENDING', // Needs approval
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        companyId: true,
                    },
                },
            },
        });

        return NextResponse.json({
            loan,
            message: 'Loan request created successfully',
        });
    } catch (error) {
        console.error('Failed to create loan:', error);
        return NextResponse.json(
            { error: 'Failed to create loan' },
            { status: 500 }
        );
    }
}

// PATCH /api/loans - Update loan status
export async function PATCH(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const body = await request.json();
        const id = String(body.id || '').trim();
        const statusInput = body.status ? String(body.status).trim().toUpperCase() : null;
        const action = body.action ? String(body.action).trim().toLowerCase() : null;

        if (!id) {
            return NextResponse.json(
                { error: 'Loan ID is required' },
                { status: 400 }
            );
        }

        if (action && action !== 'approve' && action !== 'reject') {
            return NextResponse.json(
                { error: 'Invalid loan action' },
                { status: 400 }
            );
        }

        // Get existing loan
        const existingLoan = await prisma.loan.findUnique({
            where: { id },
        });

        if (!existingLoan) {
            return NextResponse.json(
                { error: 'Loan not found' },
                { status: 404 }
            );
        }

        // Handle actions
        if (action === 'approve') {
            if (existingLoan.status !== 'PENDING') {
                return NextResponse.json(
                    { error: 'Only pending loans can be approved' },
                    { status: 400 }
                );
            }

            const employee = await prisma.employee.findUnique({
                where: { id: existingLoan.employeeId },
                select: { salary: true },
            });

            if (!employee) {
                return NextResponse.json(
                    { error: 'Employee not found' },
                    { status: 404 }
                );
            }

            const monthlyDeduction = Number(existingLoan.monthlyDeduction);
            const salaryAmount = Number(employee.salary);

            if (!Number.isFinite(monthlyDeduction) || monthlyDeduction <= 0) {
                return NextResponse.json(
                    { error: 'Invalid monthly deduction for this loan' },
                    { status: 400 }
                );
            }

            if (!Number.isFinite(salaryAmount) || salaryAmount <= 0) {
                return NextResponse.json(
                    { error: 'Employee salary must be greater than zero' },
                    { status: 400 }
                );
            }

            if (monthlyDeduction > salaryAmount) {
                return NextResponse.json(
                    { error: 'Monthly deduction cannot exceed employee salary' },
                    { status: 400 }
                );
            }

            const activeLoans = await prisma.loan.findMany({
                where: {
                    employeeId: existingLoan.employeeId,
                    status: 'ACTIVE',
                    NOT: { id },
                },
                select: { monthlyDeduction: true },
            });

            const totalActiveDeductions = activeLoans.reduce(
                (sum, loan) => sum + Number(loan.monthlyDeduction),
                0
            );

            if (totalActiveDeductions + monthlyDeduction > salaryAmount) {
                return NextResponse.json(
                    { error: 'Total loan deductions would exceed employee salary' },
                    { status: 400 }
                );
            }

            const loan = await prisma.loan.update({
                where: { id },
                data: {
                    status: 'ACTIVE',
                    approvedAt: new Date(),
                },
            });

            return NextResponse.json({
                loan,
                message: 'Loan approved successfully',
            });
        }

        if (action === 'reject') {
            if (existingLoan.status !== 'PENDING') {
                return NextResponse.json(
                    { error: 'Only pending loans can be rejected' },
                    { status: 400 }
                );
            }

            await prisma.loan.delete({ where: { id } });

            return NextResponse.json({
                message: 'Loan request rejected and deleted',
            });
        }

        // Direct status update
        if (statusInput) {
            if (!isAllowedStatus(statusInput)) {
                return NextResponse.json(
                    { error: 'Invalid loan status' },
                    { status: 400 }
                );
            }

            const updateData: { status: LoanStatus; remainingAmount?: number; approvedAt?: Date } = {
                status: statusInput as LoanStatus,
            };

            if (statusInput === 'PAID') {
                updateData.remainingAmount = 0;
            }

            if (statusInput === 'ACTIVE' && !existingLoan.approvedAt) {
                updateData.approvedAt = new Date();
            }

            const loan = await prisma.loan.update({
                where: { id },
                data: updateData,
            });

            return NextResponse.json({
                loan,
                message: 'Loan status updated successfully',
            });
        }

        // Update remaining amount (for manual adjustments)
        if (body.remainingAmount !== undefined) {
            const parsedRemaining = Number.parseFloat(String(body.remainingAmount));
            if (!Number.isFinite(parsedRemaining) || parsedRemaining < 0) {
                return NextResponse.json(
                    { error: 'Remaining amount must be a non-negative number' },
                    { status: 400 }
                );
            }

            const loan = await prisma.loan.update({
                where: { id },
                data: {
                    remainingAmount: parsedRemaining,
                    status: parsedRemaining <= 0 ? 'PAID' : existingLoan.status,
                },
            });

            return NextResponse.json({
                loan,
                message: 'Loan remaining amount updated',
            });
        }

        return NextResponse.json(
            { error: 'No valid update provided' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Failed to update loan:', error);
        return NextResponse.json(
            { error: 'Failed to update loan' },
            { status: 500 }
        );
    }
}

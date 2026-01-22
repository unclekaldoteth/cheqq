import { NextResponse } from 'next/server';
import type { PayrollStatus, Currency } from '@prisma/client';
import { executeBatchPayroll } from '@/lib/cdp';

// Force dynamic rendering - prevents build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_PAYROLL_STATUSES = ['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED'] as const;
const ALLOWED_CURRENCIES = ['USDC', 'IDRX', 'ETH'] as const;

const isAllowedPayrollStatus = (value: string): value is PayrollStatus =>
    ALLOWED_PAYROLL_STATUSES.includes(value as PayrollStatus);

const isAllowedCurrency = (value: string): value is Currency =>
    ALLOWED_CURRENCIES.includes(value as Currency);

interface PayrollItem {
    employeeId: string;
    walletAddress: string;
    grossAmount: number;
    loanDeduction: number;
    netAmount: number;
}

// GET /api/payroll - List payroll runs
export async function GET(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('companyId');

        const payrollRuns = await prisma.payrollRun.findMany({
            where: companyId ? { companyId } : {},
            include: {
                items: {
                    include: { employee: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ payrollRuns });
    } catch (error) {
        console.error('Failed to fetch payroll runs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch payroll runs' },
            { status: 500 }
        );
    }
}

// POST /api/payroll - Create payroll batch
export async function POST(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const body = await request.json();
        const { companyId, employeeIds, currency = 'USDC' } = body;
        const normalizedCompanyId = String(companyId || '').trim();
        const currencyInput = String(currency || 'USDC').trim().toUpperCase();

        if (!normalizedCompanyId) {
            return NextResponse.json(
                { error: 'Company ID is required' },
                { status: 400 }
            );
        }

        if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
            return NextResponse.json(
                { error: 'At least one employee ID is required' },
                { status: 400 }
            );
        }

        const normalizedEmployeeIds = employeeIds
            .filter((id: unknown) => typeof id === 'string' && id.trim().length > 0)
            .map((id: string) => id.trim());

        if (normalizedEmployeeIds.length === 0) {
            return NextResponse.json(
                { error: 'Employee IDs must be valid strings' },
                { status: 400 }
            );
        }

        if (!isAllowedCurrency(currencyInput)) {
            return NextResponse.json(
                { error: 'Invalid payroll currency' },
                { status: 400 }
            );
        }

        // Fetch employees
        const employees = await prisma.employee.findMany({
            where: {
                id: { in: normalizedEmployeeIds },
                companyId: normalizedCompanyId,
                status: 'ACTIVE',
            },
            include: {
                loans: {
                    where: { status: 'ACTIVE' },
                },
            },
        });

        if (employees.length === 0) {
            return NextResponse.json(
                { error: 'No active employees found' },
                { status: 400 }
            );
        }

        if (employees.length !== normalizedEmployeeIds.length) {
            return NextResponse.json(
                { error: 'Some employees were not found or inactive' },
                { status: 400 }
            );
        }

        // Calculate totals with loan deductions
        const items: PayrollItem[] = employees.map((emp) => {
            const loanDeduction = emp.loans.reduce(
                (sum, loan) => sum + Number(loan.monthlyDeduction),
                0
            );
            const grossAmount = Number(emp.salary);
            const netAmount = grossAmount - loanDeduction;

            return {
                employeeId: emp.id,
                walletAddress: emp.walletAddress,
                grossAmount,
                loanDeduction,
                netAmount,
            };
        });

        const invalidItem = items.find(
            (item) => !Number.isFinite(item.netAmount) || item.netAmount < 0
        );

        if (invalidItem) {
            return NextResponse.json(
                { error: 'Loan deductions exceed salary for one or more employees' },
                { status: 400 }
            );
        }

        const totalAmount = items.reduce((sum: number, item: PayrollItem) => sum + item.netAmount, 0);

        // Create payroll run with items
        const payrollRun = await prisma.payrollRun.create({
            data: {
                companyId: normalizedCompanyId,
                totalAmount,
                currency: currencyInput as Currency,
                status: 'PENDING',
                items: {
                    create: items.map((item: PayrollItem) => ({
                        employeeId: item.employeeId,
                        grossAmount: item.grossAmount,
                        loanDeduction: item.loanDeduction,
                        netAmount: item.netAmount,
                        status: 'PENDING',
                    })),
                },
            },
            include: {
                items: {
                    include: { employee: true },
                },
            },
        });

        return NextResponse.json({
            payrollRun,
            message: 'Payroll batch created successfully'
        });
    } catch (error) {
        console.error('Failed to create payroll:', error);
        return NextResponse.json(
            { error: 'Failed to create payroll batch' },
            { status: 500 }
        );
    }
}

// PATCH /api/payroll - Execute or update payroll status
export async function PATCH(request: Request) {
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();

        const body = await request.json();
        const { id, action, txHash, fromAddress } = body;
        const payrollId = String(id || '').trim();
        const actionInput = action ? String(action).trim() : '';

        if (!payrollId) {
            return NextResponse.json(
                { error: 'Payroll run ID is required' },
                { status: 400 }
            );
        }

        if (actionInput && actionInput !== 'execute') {
            return NextResponse.json(
                { error: 'Invalid payroll action' },
                { status: 400 }
            );
        }

        const payrollRun = await prisma.payrollRun.findUnique({
            where: { id: payrollId },
            include: {
                items: {
                    include: { employee: true },
                },
                company: true,
            },
        });

        if (!payrollRun) {
            return NextResponse.json(
                { error: 'Payroll run not found' },
                { status: 404 }
            );
        }

        // Execute payroll using CDP SDK
        if (actionInput === 'execute') {
            // Update status to processing
            await prisma.payrollRun.update({
                where: { id: payrollId },
                data: { status: 'PROCESSING' },
            });

            const recipients = payrollRun.items.map((item: { employee: { walletAddress: string }; netAmount: { toString: () => string } }) => ({
                address: item.employee.walletAddress,
                amount: item.netAmount.toString(),
            }));

            try {
                const treasuryAddress = fromAddress || payrollRun.company?.walletAddress;
                if (!treasuryAddress) {
                    throw new Error('No treasury wallet configured');
                }

                const results = await executeBatchPayroll(treasuryAddress, recipients);

                // Update each item status
                for (let i = 0; i < payrollRun.items.length; i++) {
                    const result = results[i];
                    await prisma.payrollItem.update({
                        where: { id: payrollRun.items[i].id },
                        data: {
                            status: result.success ? 'COMPLETED' : 'FAILED',
                            txHash: result.transactionHash || null,
                        },
                    });

                    // Deduct from active loans if payment succeeded
                    if (result.success) {
                        const employee = payrollRun.items[i].employee;
                        const activeLoans = await prisma.loan.findMany({
                            where: { employeeId: employee.id, status: 'ACTIVE' },
                        });

                        for (const loan of activeLoans) {
                            const newRemaining = Number(loan.remainingAmount) - Number(loan.monthlyDeduction);
                            await prisma.loan.update({
                                where: { id: loan.id },
                                data: {
                                    remainingAmount: Math.max(0, newRemaining),
                                    status: newRemaining <= 0 ? 'PAID' : 'ACTIVE',
                                },
                            });
                        }
                    }
                }

                const allSuccessful = results.every((r: { success: boolean }) => r.success);

                await prisma.payrollRun.update({
                    where: { id: payrollId },
                    data: {
                        status: allSuccessful ? 'COMPLETED' : 'FAILED',
                        executedAt: new Date(),
                    },
                });

                return NextResponse.json({
                    payrollRun: await prisma.payrollRun.findUnique({
                        where: { id: payrollId },
                        include: { items: true },
                    }),
                    results,
                    message: allSuccessful ? 'Payroll executed successfully' : 'Some payments failed',
                });
            } catch (error) {
                await prisma.payrollRun.update({
                    where: { id: payrollId },
                    data: { status: 'FAILED' },
                });
                throw error;
            }
        }

        const statusInput = String(body.status || '').trim().toUpperCase();
        if (!isAllowedPayrollStatus(statusInput)) {
            return NextResponse.json(
                { error: 'Valid payroll status is required' },
                { status: 400 }
            );
        }

        // Simple status update
        const updated = await prisma.payrollRun.update({
            where: { id: payrollId },
            data: {
                status: statusInput as PayrollStatus,
                txHash: txHash || undefined,
                executedAt: statusInput === 'COMPLETED' ? new Date() : undefined,
            },
        });

        return NextResponse.json({
            payrollRun: updated,
            message: 'Payroll status updated'
        });
    } catch (error) {
        console.error('Failed to update payroll:', error);
        return NextResponse.json(
            { error: 'Failed to update payroll' },
            { status: 500 }
        );
    }
}

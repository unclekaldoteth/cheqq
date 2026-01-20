import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PayrollStatus, PaymentStatus, Currency } from '@prisma/client';
import { executeBatchPayroll } from '@/lib/cdp';

// GET /api/payroll - List payroll runs
export async function GET(request: Request) {
    try {
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
        const body = await request.json();
        const { companyId, employeeIds, currency = 'USDC' } = body;

        // Fetch employees
        const employees = await prisma.employee.findMany({
            where: {
                id: { in: employeeIds },
                companyId,
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

        // Calculate totals with loan deductions
        const items = employees.map((emp) => {
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

        const totalAmount = items.reduce((sum, item) => sum + item.netAmount, 0);

        // Create payroll run with items
        const payrollRun = await prisma.payrollRun.create({
            data: {
                companyId,
                totalAmount,
                currency: currency as Currency,
                status: 'PENDING',
                items: {
                    create: items.map((item) => ({
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
        const body = await request.json();
        const { id, action, txHash, fromAddress } = body;

        const payrollRun = await prisma.payrollRun.findUnique({
            where: { id },
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
        if (action === 'execute') {
            // Update status to processing
            await prisma.payrollRun.update({
                where: { id },
                data: { status: 'PROCESSING' },
            });

            const recipients = payrollRun.items.map((item) => ({
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

                const allSuccessful = results.every((r) => r.success);

                await prisma.payrollRun.update({
                    where: { id },
                    data: {
                        status: allSuccessful ? 'COMPLETED' : 'FAILED',
                        executedAt: new Date(),
                    },
                });

                return NextResponse.json({
                    payrollRun: await prisma.payrollRun.findUnique({
                        where: { id },
                        include: { items: true },
                    }),
                    results,
                    message: allSuccessful ? 'Payroll executed successfully' : 'Some payments failed',
                });
            } catch (error) {
                await prisma.payrollRun.update({
                    where: { id },
                    data: { status: 'FAILED' },
                });
                throw error;
            }
        }

        // Simple status update
        const updated = await prisma.payrollRun.update({
            where: { id },
            data: {
                status: body.status as PayrollStatus,
                txHash: txHash || undefined,
                executedAt: body.status === 'COMPLETED' ? new Date() : undefined,
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

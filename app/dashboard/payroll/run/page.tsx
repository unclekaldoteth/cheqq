'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, ArrowRight, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Sidebar, TopBar } from '@/components/dashboard';
import { PayrollPreview, type PayrollItem } from '@/components/dashboard/payroll';
import { CHEQQ_PAYROLL_ABI, getCheqqPayrollAddress, generatePayrollId } from '@/lib/contracts';
import { getTokenAddress, parseTokenAmount } from '@/lib/tokens';
import styles from './page.module.css';

type Step = 'select' | 'approve' | 'confirm' | 'success';

export default function RunPayrollPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('select');
    const [items, setItems] = useState<PayrollItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [paymentDate, setPaymentDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

    // Get companyId from localStorage (in production, use auth context)
    const companyId = typeof window !== 'undefined'
        ? localStorage.getItem('companyId')
        : null;

    // Fetch employees from API
    useEffect(() => {
        const fetchEmployees = async () => {
            if (!companyId) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/employees?companyId=${encodeURIComponent(companyId)}`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();

                // Transform to PayrollItem format
                const payrollItems: PayrollItem[] = data.employees.map((emp: {
                    id: string;
                    name: string;
                    walletAddress: string;
                    grossAmount: number;
                    loanDeduction: number;
                    netAmount: number;
                    currency: string;
                }) => {
                    const currency = (emp.currency || 'USDC') as PayrollItem['currency'];
                    const netAmount = Number(emp.netAmount);
                    const isPayable = currency === 'USDC' && netAmount > 0;
                    return {
                        id: emp.id,
                        name: emp.name,
                        walletAddress: emp.walletAddress,
                        grossAmount: Number(emp.grossAmount),
                        loanDeduction: Number(emp.loanDeduction),
                        netAmount,
                        currency,
                        selected: isPayable,
                    };
                });

                setItems(payrollItems);
            } catch (error) {
                console.error('Failed to fetch employees:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, [companyId]);

    // Smart contract write
    const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();

    // Wait for transaction
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    // Handle transaction success
    useEffect(() => {
        if (isSuccess && hash) {
            setTxHash(hash);
            setStep('success');
        }
    }, [isSuccess, hash]);

    const selectableItems = useMemo(
        () => items.filter(item => item.currency === 'USDC' && item.netAmount > 0),
        [items]
    );
    const allSelected = useMemo(
        () => selectableItems.length > 0 && selectableItems.every(item => item.selected),
        [selectableItems]
    );
    const selectedCount = useMemo(() => items.filter(item => item.selected).length, [items]);
    const payableItems = useMemo(
        () => selectableItems.filter(item => item.selected),
        [selectableItems]
    );
    const payableCount = payableItems.length;
    const hasNonPayableSelected = useMemo(
        () => items.some(item => item.selected && (item.currency !== 'USDC' || item.netAmount <= 0)),
        [items]
    );
    const canContinue = payableCount > 0 && !hasNonPayableSelected;

    const handleToggleItem = (id: string) => {
        setItems(prev =>
            prev.map(item =>
                item.id === id ? { ...item, selected: !item.selected } : item
            )
        );
    };

    const handleToggleAll = () => {
        const newValue = !allSelected;
        setItems(prev => prev.map(item => (
            newValue
                ? (item.currency === 'USDC' && item.netAmount > 0
                    ? { ...item, selected: true }
                    : { ...item, selected: false })
                : { ...item, selected: false }
        )));
    };

    const handleProceedToConfirm = () => {
        if (canContinue) {
            setStep('confirm');
        }
    };

    const handleExecutePayroll = async () => {
        if (payableItems.length === 0 || hasNonPayableSelected) return;

        // Generate unique payroll ID
        const payrollId = generatePayrollId(`${companyId}-${Date.now()}`);
        const tokenAddress = getTokenAddress('USDC') as `0x${string}`;

        // Prepare payment items for contract
        const payments = payableItems.map(item => ({
            recipient: item.walletAddress as `0x${string}`,
            amount: parseTokenAmount(item.netAmount.toString(), 'USDC'),
        }));

        // Execute contract call
        writeContract({
            address: getCheqqPayrollAddress(),
            abi: CHEQQ_PAYROLL_ABI,
            functionName: 'executePayroll',
            args: [payrollId, tokenAddress, payments],
        });
    };

    const handleBack = () => {
        if (step === 'confirm') {
            setStep('select');
        } else {
            router.push('/dashboard/payroll');
        }
    };

    // Calculate totals
    const totals = useMemo(() => {
        const selected = payableItems;
        return {
            usdc: {
                gross: selected.filter(i => i.currency === 'USDC').reduce((sum, i) => sum + i.grossAmount, 0),
                net: selected.filter(i => i.currency === 'USDC').reduce((sum, i) => sum + i.netAmount, 0),
            },
            idrx: {
                gross: selected.filter(i => i.currency === 'IDRX').reduce((sum, i) => sum + i.grossAmount, 0),
                net: selected.filter(i => i.currency === 'IDRX').reduce((sum, i) => sum + i.netAmount, 0),
            },
        };
    }, [payableItems]);

    const formatAmount = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount) + ` ${currency}`;
    };

    const isProcessing = isWritePending || isConfirming;
    const explorerUrl = txHash
        ? `https://sepolia.basescan.org/tx/${txHash}`
        : undefined;

    return (
        <div className={styles.dashboardLayout}>
            <Sidebar />
            <div className={styles.mainContent}>
                <TopBar />
                <main className={styles.main}>
                    {/* Page Header */}
                    <div className={styles.pageHeader}>
                        <button className={styles.backBtn} onClick={handleBack}>
                            <ArrowLeft size={20} />
                            {step === 'success' ? 'Back to Payroll' : 'Back'}
                        </button>
                        <h1>Run Payroll</h1>
                        <p>
                            {step === 'select' && 'Select employees and review payroll details'}
                            {step === 'confirm' && 'Review and confirm payroll execution'}
                            {step === 'success' && 'Payroll completed successfully'}
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <div className={styles.steps}>
                        <div className={`${styles.step} ${step === 'select' ? styles.active : ''} ${step !== 'select' ? styles.completed : ''}`}>
                            <span className={styles.stepNumber}>
                                {step !== 'select' ? <Check size={16} /> : '1'}
                            </span>
                            <span className={styles.stepLabel}>Select Employees</span>
                        </div>
                        <div className={styles.stepDivider} />
                        <div className={`${styles.step} ${step === 'confirm' ? styles.active : ''} ${step === 'success' ? styles.completed : ''}`}>
                            <span className={styles.stepNumber}>
                                {step === 'success' ? <Check size={16} /> : '2'}
                            </span>
                            <span className={styles.stepLabel}>Confirm</span>
                        </div>
                        <div className={styles.stepDivider} />
                        <div className={`${styles.step} ${step === 'success' ? styles.active : ''}`}>
                            <span className={styles.stepNumber}>3</span>
                            <span className={styles.stepLabel}>Complete</span>
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className={styles.loadingState}>
                            <Loader2 size={32} className={styles.spinner} />
                            <span>Loading employees...</span>
                        </div>
                    )}

                    {/* No Employees */}
                    {!loading && items.length === 0 && step === 'select' && (
                        <div className={styles.emptyState}>
                            <p>No employees found. Add employees first to run payroll.</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => router.push('/dashboard/employees/new')}
                            >
                                Add Employee
                            </button>
                        </div>
                    )}

                    {/* Step Content */}
                    {!loading && items.length > 0 && step === 'select' && (
                        <>
                            {/* Period Selector */}
                            <div className={styles.periodSelector}>
                                <div className={styles.periodField}>
                                    <label>Payment Date</label>
                                    <input
                                        type="date"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                    />
                                </div>
                                <div className={styles.periodField}>
                                    <label>Pay Period</label>
                                    <select defaultValue="january">
                                        <option value="january">January 2024</option>
                                        <option value="february">February 2024</option>
                                        <option value="march">March 2024</option>
                                    </select>
                                </div>
                            </div>

                            {/* Payroll Preview */}
                            <div className={styles.content}>
                                <PayrollPreview
                                    items={items}
                                    onToggleItem={handleToggleItem}
                                    onToggleAll={handleToggleAll}
                                    allSelected={allSelected}
                                />
                            </div>

                            {hasNonPayableSelected && (
                                <div className={styles.notice}>
                                    Only USDC employees with a positive net payout can be executed on-chain right now.
                                    Deselect IDRX or zero-net employees to continue.
                                </div>
                            )}

                            {/* Actions */}
                            <div className={styles.actions}>
                                <span>
                                    {selectedCount} of {items.length} employees selected
                                </span>
                                <div className={styles.actionButtons}>
                                    <button
                                        className="btn btn-outline"
                                        onClick={() => router.push('/dashboard/payroll')}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleProceedToConfirm}
                                        disabled={!canContinue}
                                    >
                                        Continue
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {step === 'confirm' && (
                        <div className={styles.confirmation}>
                            <div className={styles.confirmIcon}>
                                <CheckCircle size={40} />
                            </div>
                            <h2>Confirm Payroll</h2>
                            <p>
                                You are about to execute payroll for {payableCount} employees.
                                This will call the CheqqPayroll smart contract on Base.
                            </p>
                            <div className={styles.confirmAmount}>
                                {totals.usdc.net > 0 && (
                                    <div className={styles.confirmItem}>
                                        <span className={styles.confirmLabel}>USDC Payout</span>
                                        <span className={styles.confirmValue}>
                                            {formatAmount(totals.usdc.net, 'USDC')}
                                        </span>
                                    </div>
                                )}
                                {totals.idrx.net > 0 && (
                                    <div className={styles.confirmItem}>
                                        <span className={styles.confirmLabel}>IDRX Payout</span>
                                        <span className={styles.confirmValue}>
                                            {formatAmount(totals.idrx.net, 'IDRX')}
                                        </span>
                                    </div>
                                )}
                                <div className={styles.confirmItem}>
                                    <span className={styles.confirmLabel}>Employees</span>
                                    <span className={styles.confirmValue}>{payableCount}</span>
                                </div>
                            </div>
                            <div className={styles.confirmButtons}>
                                <button className="btn btn-outline" onClick={handleBack} disabled={isProcessing}>
                                    Go Back
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleExecutePayroll}
                                    disabled={isProcessing || payableCount === 0}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 size={18} className={styles.spinner} />
                                            {isConfirming ? 'Confirming...' : 'Signing...'}
                                        </>
                                    ) : 'Execute Payroll'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className={styles.confirmation}>
                            <div className={`${styles.confirmIcon} ${styles.successIcon}`}>
                                <CheckCircle size={40} />
                            </div>
                            <h2>Payroll Complete!</h2>
                            <p>
                                Successfully disbursed salaries to {payableCount} employees.
                                All transactions have been confirmed on Base.
                            </p>
                            {txHash && (
                                <div className={styles.txHash}>
                                    Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                                    <a
                                        href={explorerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                            )}
                            <div className={styles.confirmButtons}>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => router.push('/dashboard/payroll')}
                                >
                                    Back to Payroll
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => router.push('/dashboard')}
                                >
                                    Go to Dashboard
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

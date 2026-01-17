'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, ArrowRight, CheckCircle, ExternalLink } from 'lucide-react';
import { Sidebar, TopBar } from '@/components/dashboard';
import { PayrollPreview, type PayrollItem } from '@/components/dashboard/payroll';
import styles from './page.module.css';

// Mock employee data for payroll
const mockPayrollData: PayrollItem[] = [
    {
        id: '1',
        name: 'Sarah Chen',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        grossAmount: 5000,
        loanDeduction: 500,
        netAmount: 4500,
        currency: 'USDC',
        selected: true,
    },
    {
        id: '2',
        name: 'Michael Johnson',
        walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        grossAmount: 4500,
        loanDeduction: 0,
        netAmount: 4500,
        currency: 'USDC',
        selected: true,
    },
    {
        id: '3',
        name: 'Dewi Putri',
        walletAddress: '0x9876543210fedcba9876543210fedcba98765432',
        grossAmount: 75000000,
        loanDeduction: 5000000,
        netAmount: 70000000,
        currency: 'IDRX',
        selected: true,
    },
    {
        id: '4',
        name: 'James Wilson',
        walletAddress: '0xfedcba9876543210fedcba9876543210fedcba98',
        grossAmount: 6000,
        loanDeduction: 0,
        netAmount: 6000,
        currency: 'USDC',
        selected: true,
    },
    {
        id: '5',
        name: 'Emily Rodriguez',
        walletAddress: '0x5678901234abcdef5678901234abcdef56789012',
        grossAmount: 4000,
        loanDeduction: 0,
        netAmount: 4000,
        currency: 'USDC',
        selected: true,
    },
];

type Step = 'select' | 'confirm' | 'success';

export default function RunPayrollPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('select');
    const [items, setItems] = useState<PayrollItem[]>(mockPayrollData);
    const [paymentDate, setPaymentDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [isProcessing, setIsProcessing] = useState(false);
    const [txHash] = useState('0x7a8b...3f2e');

    const allSelected = useMemo(() => items.every(item => item.selected), [items]);
    const selectedCount = useMemo(() => items.filter(item => item.selected).length, [items]);

    const handleToggleItem = (id: string) => {
        setItems(prev =>
            prev.map(item =>
                item.id === id ? { ...item, selected: !item.selected } : item
            )
        );
    };

    const handleToggleAll = () => {
        const newValue = !allSelected;
        setItems(prev => prev.map(item => ({ ...item, selected: newValue })));
    };

    const handleProceedToConfirm = () => {
        if (selectedCount > 0) {
            setStep('confirm');
        }
    };

    const handleExecutePayroll = async () => {
        setIsProcessing(true);
        // Simulate blockchain transaction
        await new Promise(resolve => setTimeout(resolve, 2500));
        setIsProcessing(false);
        setStep('success');
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
        const selected = items.filter(item => item.selected);
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
    }, [items]);

    const formatAmount = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount) + ` ${currency}`;
    };

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

                    {/* Step Content */}
                    {step === 'select' && (
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
                                        disabled={selectedCount === 0}
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
                                You are about to execute payroll for {selectedCount} employees.
                                This action will transfer funds from your treasury.
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
                                    <span className={styles.confirmValue}>{selectedCount}</span>
                                </div>
                            </div>
                            <div className={styles.confirmButtons}>
                                <button className="btn btn-outline" onClick={handleBack}>
                                    Go Back
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleExecutePayroll}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? 'Processing...' : 'Execute Payroll'}
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
                                Successfully disbursed salaries to {selectedCount} employees.
                                All transactions have been confirmed on Base.
                            </p>
                            <div className={styles.txHash}>
                                Transaction: {txHash}
                                <a
                                    href={`https://basescan.org/tx/${txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <ExternalLink size={14} />
                                </a>
                            </div>
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

'use client';

import { useState, useEffect } from 'react';
import { Users, Clock, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import styles from './LoanCard.module.css';

interface Loan {
    id: string;
    amount: string | number;
    remainingAmount: string | number;
    monthlyDeduction: string | number;
    status: string;
    employee: {
        id: string;
        name: string;
        email: string;
    };
}

interface LoanResponse {
    loans: Loan[];
    summary: {
        total: number;
        totalAmount: number;
        totalRemaining: number;
        active: number;
    };
}

interface LoanCardProps {
    companyId?: string;
}

export default function LoanCard({ companyId }: LoanCardProps) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<LoanResponse | null>(null);

    useEffect(() => {
        if (!companyId) {
            setData(null);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        let isActive = true;

        const fetchLoans = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ companyId, status: 'ACTIVE' });
                const res = await fetch(`/api/loans?${params.toString()}`, {
                    signal: controller.signal,
                });
                if (!res.ok) throw new Error('Failed to fetch');
                const loanData: LoanResponse = await res.json();
                if (isActive) {
                    setData(loanData);
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') return;
                console.error('Failed to fetch loans');
                if (isActive) {
                    setData(null);
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        fetchLoans();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [companyId]);

    const formatUSD = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    const toNumber = (value: string | number) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const getProgress = (loan: Loan) => {
        const total = toNumber(loan.amount);
        const remaining = toNumber(loan.remainingAmount);
        if (total <= 0) return 0;
        const progress = Math.round(((total - remaining) / total) * 100);
        return Math.min(100, Math.max(0, progress));
    };

    const getInitials = (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return '--';
        return trimmed
            .split(/\s+/)
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (loading) {
        return (
            <div className={styles.loanCard}>
                <div className={styles.loadingState}>
                    <Loader2 size={24} className={styles.spinner} />
                    <span>Loading loans...</span>
                </div>
            </div>
        );
    }

    const activeLoans = data?.loans || [];
    const totalLent = data?.summary.totalAmount || 0;
    const outstanding = data?.summary.totalRemaining || 0;

    return (
        <div className={styles.loanCard}>
            <div className={styles.header}>
                <div className={styles.title}>
                    <Users size={20} />
                    <h3>Employee Loans</h3>
                </div>
                <a href="/dashboard/defi/loans" className={styles.link}>
                    Manage <ExternalLink size={14} />
                </a>
            </div>

            <div className={styles.content}>
                <div className={styles.summary}>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryValue}>{activeLoans.length}</span>
                        <span className={styles.summaryLabel}>Active Loans</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryValue}>{formatUSD(totalLent)}</span>
                        <span className={styles.summaryLabel}>Total Lent</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryValue}>{formatUSD(outstanding)}</span>
                        <span className={styles.summaryLabel}>Outstanding</span>
                    </div>
                </div>

                <div className={styles.loanList}>
                    {activeLoans.slice(0, 3).map((loan) => (
                        <div key={loan.id} className={styles.loanItem}>
                            <div className={styles.avatar}>{getInitials(loan.employee.name)}</div>
                            <div className={styles.loanInfo}>
                                <span className={styles.employeeName}>{loan.employee.name}</span>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${getProgress(loan)}%` }}
                                    ></div>
                                </div>
                                <div className={styles.loanMeta}>
                                    <span>
                                        {formatUSD(toNumber(loan.remainingAmount))} remaining of {formatUSD(toNumber(loan.amount))}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.nextPayment}>
                                <Clock size={12} />
                                <span>{formatUSD(toNumber(loan.monthlyDeduction))}/mo</span>
                            </div>
                        </div>
                    ))}
                    {activeLoans.length === 0 && (
                        <div className={styles.emptyState}>
                            No active loans
                        </div>
                    )}
                </div>

                <div className={styles.notice}>
                    <AlertCircle size={14} />
                    <span>Loans are automatically repaid via payroll deduction</span>
                </div>

                <a href="/dashboard/defi/loans/new" className={`btn btn-outline ${styles.newLoanBtn}`}>
                    + New Salary Advance
                </a>
            </div>
        </div>
    );
}

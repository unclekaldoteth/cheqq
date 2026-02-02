'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowUpRight, ArrowDownLeft, Wallet, TrendingUp, PiggyBank, Users, Loader2, Coins, Check, X, Clock } from 'lucide-react';
import { Sidebar, TopBar } from '@/components/dashboard';
import {
    type TreasuryData,
    type Loan,
    type LoansSummary,
    normalizeDate,
    normalizeTreasuryResponse,
    normalizeLoansResponse,
} from '@/lib/defi/normalize';
import styles from './page.module.css';

// Static protocols data (these are fixed DeFi integrations)
const protocols = [
    {
        id: 'morpho',
        name: 'Morpho',
        description: 'Optimized lending protocol',
        icon: '🦋',
        apy: 5.2,
    },
    {
        id: 'aerodrome',
        name: 'Aerodrome',
        description: 'DEX liquidity provision',
        icon: '✈️',
        apy: 8.4,
    },
];

export default function DefiPage() {
    const [loading, setLoading] = useState(true);
    const [treasury, setTreasury] = useState<TreasuryData | null>(null);
    const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
    const [pendingLoans, setPendingLoans] = useState<Loan[]>([]);
    const [loansSummary, setLoansSummary] = useState<LoansSummary | null>(null);
    const [processingLoanId, setProcessingLoanId] = useState<string | null>(null);

    const fetchLoans = useCallback(async (companyId: string, signal?: AbortSignal, isActive?: () => boolean) => {
        try {
            const [activeRes, pendingRes] = await Promise.all([
                fetch(`/api/loans?companyId=${encodeURIComponent(companyId)}&status=ACTIVE`, { signal }),
                fetch(`/api/loans?companyId=${encodeURIComponent(companyId)}&status=PENDING`, { signal }),
            ]);

            if (signal?.aborted || (isActive && !isActive())) return;

            if (activeRes.ok) {
                const data = await activeRes.json();
                const normalized = normalizeLoansResponse(data);
                if (signal?.aborted || (isActive && !isActive())) return;
                setActiveLoans(normalized.loans);
                setLoansSummary(normalized.summary);
            }

            if (pendingRes.ok) {
                const data = await pendingRes.json();
                const normalized = normalizeLoansResponse(data);
                if (signal?.aborted || (isActive && !isActive())) return;
                setPendingLoans(normalized.loans);
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            console.error('Failed to fetch loans:', err);
        }
    }, []);

    useEffect(() => {
        const companyId = localStorage.getItem('companyId');
        if (!companyId) {
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        let isActive = true;

        const fetchData = async () => {
            try {
                // Fetch treasury
                const treasuryRes = await fetch(`/api/treasury?companyId=${encodeURIComponent(companyId)}`, {
                    signal: controller.signal,
                });

                if (isActive && treasuryRes.ok) {
                    const treasuryData = await treasuryRes.json();
                    setTreasury(normalizeTreasuryResponse(treasuryData));
                }

                // Fetch loans
                await fetchLoans(companyId, controller.signal, () => isActive);
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') return;
                console.error('Failed to fetch DeFi data:', error);
            } finally {
                if (isActive) setLoading(false);
            }
        };

        fetchData();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [fetchLoans]);

    const handleLoanAction = async (loanId: string, action: 'approve' | 'reject') => {
        setProcessingLoanId(loanId);
        try {
            const response = await fetch('/api/loans', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: loanId, action }),
            });

            if (response.ok) {
                // Refresh loans
                const companyId = localStorage.getItem('companyId');
                if (companyId) {
                    await fetchLoans(companyId);
                }
            } else {
                const data = await response.json();
                alert(data.error || `Failed to ${action} loan`);
            }
        } catch (err) {
            console.error(`Failed to ${action} loan:`, err);
            alert(`Failed to ${action} loan`);
        } finally {
            setProcessingLoanId(null);
        }
    };

    const formatAmount = (amount: number, compact = false) => {
        if (compact && amount >= 1000000) {
            return (amount / 1000000).toFixed(1) + 'M';
        }
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (date: string) => {
        const normalized = normalizeDate(date);
        if (normalized === '-') return normalized;
        return new Date(normalized).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    // Calculate stats
    const totalTreasury = treasury?.summary.totalBalance || 0;
    const totalYield = treasury?.summary.totalYield || 0;
    const activeLoansCount = loansSummary?.active || 0;
    const pendingLoansCount = pendingLoans.length;

    if (loading) {
        return (
            <div className={styles.dashboardLayout}>
                <Sidebar />
                <div className={styles.mainContent}>
                    <TopBar />
                    <main className={styles.main}>
                        <div className={styles.loadingState}>
                            <Loader2 size={32} className={styles.spinner} />
                            <span>Loading DeFi data...</span>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dashboardLayout}>
            <Sidebar />
            <div className={styles.mainContent}>
                <TopBar />
                <main className={styles.main}>
                    {/* Page Header */}
                    <div className={styles.pageHeader}>
                        <div>
                            <h1>Treasury & DeFi</h1>
                            <p>Manage company funds and employee lending</p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className={styles.statsGrid}>
                        <div className={`${styles.statCard} ${styles.primary}`}>
                            <div className={styles.iconWrapper}>
                                <Wallet size={24} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Treasury Balance</span>
                                <span className={styles.statValue}>
                                    ${formatAmount(totalTreasury)}
                                </span>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.green}`}>
                            <div className={styles.iconWrapper}>
                                <TrendingUp size={24} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Yield Earned</span>
                                <span className={styles.statValue}>
                                    ${formatAmount(totalYield)}
                                </span>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.blue}`}>
                            <div className={styles.iconWrapper}>
                                <PiggyBank size={24} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Deposited in DeFi</span>
                                <span className={styles.statValue}>$0.00</span>
                                <span className={styles.statSubtext}>Coming soon</span>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.orange}`}>
                            <div className={styles.iconWrapper}>
                                <Users size={24} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Active Loans</span>
                                <span className={styles.statValue}>{activeLoansCount}</span>
                                {pendingLoansCount > 0 && (
                                    <span className={styles.statSubtext}>
                                        {pendingLoansCount} pending
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Sections */}
                    <div className={styles.sections}>
                        {/* DeFi Protocols */}
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h2>DeFi Protocols</h2>
                            </div>
                            <div className={styles.protocols}>
                                {protocols.map((protocol) => (
                                    <div key={protocol.id} className={styles.protocolCard}>
                                        <div className={styles.protocolIcon}>{protocol.icon}</div>
                                        <div className={styles.protocolInfo}>
                                            <div className={styles.protocolName}>{protocol.name}</div>
                                            <div className={styles.protocolDesc}>{protocol.description}</div>
                                        </div>
                                        <div className={styles.protocolStats}>
                                            <div className={styles.protocolApy}>{protocol.apy}% APY</div>
                                            <div className={styles.protocolDeposit}>
                                                $0.00
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Quick Actions */}
                            <div className={styles.actionsCard}>
                                <button className={`${styles.actionBtn} ${styles.primary}`}>
                                    <ArrowUpRight size={18} />
                                    Deposit
                                </button>
                                <button className={styles.actionBtn}>
                                    <ArrowDownLeft size={18} />
                                    Withdraw
                                </button>
                            </div>
                        </div>

                        {/* Employee Lending */}
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h2>Employee Lending</h2>
                                <span className={styles.badge}>{activeLoansCount} Active</span>
                            </div>

                            {/* Pending Loans Approval */}
                            {pendingLoans.length > 0 && (
                                <div className={styles.pendingSection}>
                                    <h3 className={styles.pendingTitle}>
                                        <Clock size={16} />
                                        Pending Approval ({pendingLoans.length})
                                    </h3>
                                    <div className={styles.loanList}>
                                        {pendingLoans.map((loan) => (
                                            <div key={loan.id} className={`${styles.loanItem} ${styles.pendingLoan}`}>
                                                <div className={styles.loanAvatar}>
                                                    {loan.employee.name.charAt(0) || '?'}
                                                </div>
                                                <div className={styles.loanInfo}>
                                                    <div className={styles.loanName}>{loan.employee.name}</div>
                                                    <div className={styles.loanDate}>
                                                        Requested {formatDate(loan.createdAt)}
                                                    </div>
                                                </div>
                                                <div className={styles.loanAmount}>
                                                    <div className={styles.loanBalance}>
                                                        {formatAmount(loan.amount, true)} {loan.currency}
                                                    </div>
                                                    <div className={styles.loanMonthly}>
                                                        {formatAmount(loan.monthlyDeduction, true)}/mo
                                                    </div>
                                                </div>
                                                <div className={styles.loanActions}>
                                                    <button
                                                        className={`${styles.loanActionBtn} ${styles.approveBtn}`}
                                                        onClick={() => handleLoanAction(loan.id, 'approve')}
                                                        disabled={processingLoanId === loan.id}
                                                        title="Approve loan"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        className={`${styles.loanActionBtn} ${styles.rejectBtn}`}
                                                        onClick={() => handleLoanAction(loan.id, 'reject')}
                                                        disabled={processingLoanId === loan.id}
                                                        title="Reject loan"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Active Loans */}
                            {activeLoans.length > 0 ? (
                                <div className={styles.loanList}>
                                    {activeLoans.map((loan) => (
                                        <div key={loan.id} className={styles.loanItem}>
                                            <div className={styles.loanAvatar}>
                                                {loan.employee.name.charAt(0) || '?'}
                                            </div>
                                            <div className={styles.loanInfo}>
                                                <div className={styles.loanName}>{loan.employee.name}</div>
                                                <div className={styles.loanDate}>Since {formatDate(loan.createdAt)}</div>
                                            </div>
                                            <div className={styles.loanAmount}>
                                                <div className={styles.loanBalance}>
                                                    {formatAmount(loan.remainingAmount, true)} {loan.currency}
                                                </div>
                                                <div className={styles.loanMonthly}>
                                                    -{formatAmount(loan.monthlyDeduction, true)}/mo
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : pendingLoans.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <Coins size={40} strokeWidth={1.5} />
                                    <h3>No active loans</h3>
                                    <p>Employee salary advances will appear here</p>
                                </div>
                            ) : null}

                            {activeLoans.length > 0 && (
                                <div className={styles.actionsCard}>
                                    <button className={styles.actionBtn} style={{ gridColumn: '1 / -1' }}>
                                        <Users size={18} />
                                        View All Loans
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

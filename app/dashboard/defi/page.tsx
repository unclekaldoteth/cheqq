'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, Wallet, TrendingUp, PiggyBank, Users, Loader2, Coins } from 'lucide-react';
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
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loansSummary, setLoansSummary] = useState<LoansSummary | null>(null);

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
                // Fetch treasury and loans in parallel
                const [treasuryRes, loansRes] = await Promise.all([
                    fetch(`/api/treasury?companyId=${encodeURIComponent(companyId)}`, {
                        signal: controller.signal,
                    }),
                    fetch(`/api/loans?companyId=${encodeURIComponent(companyId)}&status=ACTIVE`, {
                        signal: controller.signal,
                    }),
                ]);

                if (isActive) {
                    if (treasuryRes.ok) {
                        const treasuryData = await treasuryRes.json();
                        setTreasury(normalizeTreasuryResponse(treasuryData));
                    }

                    if (loansRes.ok) {
                        const loansData = await loansRes.json();
                        const normalized = normalizeLoansResponse(loansData);
                        setLoans(normalized.loans);
                        setLoansSummary(normalized.summary);
                    }
                }
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
    }, []);

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
                            <h1>DeFi</h1>
                            <p>Manage treasury yields and employee lending</p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className={styles.statsGrid}>
                        <div className={`${styles.statCard} ${styles.blue}`}>
                            <div className={styles.iconWrapper}>
                                <Wallet size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Total Treasury</span>
                                <span className={styles.statValue}>${formatAmount(totalTreasury)} USDC</span>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.green}`}>
                            <div className={styles.iconWrapper}>
                                <PiggyBank size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Deposited in DeFi</span>
                                <span className={styles.statValue}>${formatAmount(0)}</span>
                                <span className={styles.statSubtext}>Coming soon</span>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.green}`}>
                            <div className={styles.iconWrapper}>
                                <TrendingUp size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Yield Earned</span>
                                <span className={styles.statValue} style={{ color: '#00D395' }}>+${formatAmount(totalYield)}</span>
                                <span className={styles.statSubtext}>All time</span>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.orange}`}>
                            <div className={styles.iconWrapper}>
                                <Users size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Active Loans</span>
                                <span className={styles.statValue}>{activeLoansCount}</span>
                                <span className={styles.statSubtext}>Employee advances</span>
                            </div>
                        </div>
                    </div>

                    {/* Sections */}
                    <div className={styles.sections}>
                        {/* Yield Protocols */}
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h2>Yield Protocols</h2>
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
                            {loans.length > 0 ? (
                                <div className={styles.loanList}>
                                    {loans.map((loan) => (
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
                            ) : (
                                <div className={styles.emptyState}>
                                    <Coins size={40} strokeWidth={1.5} />
                                    <h3>No active loans</h3>
                                    <p>Employee salary advances will appear here</p>
                                </div>
                            )}
                            {loans.length > 0 && (
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

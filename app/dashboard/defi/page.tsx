'use client';

import { ArrowUpRight, ArrowDownLeft, Wallet, TrendingUp, PiggyBank, Users } from 'lucide-react';
import { Sidebar, TopBar } from '@/components/dashboard';
import styles from './page.module.css';

// Mock data
const defiStats = {
    totalTreasury: 125000,
    totalDeposited: 85000,
    totalYieldEarned: 3450,
    currentApy: 6.8,
    activeLoans: 3,
    totalLoanBalance: 4500,
};

const protocols = [
    {
        id: 'morpho',
        name: 'Morpho',
        description: 'Optimized lending protocol',
        icon: '🦋',
        apy: 5.2,
        deposited: 50000,
    },
    {
        id: 'aerodrome',
        name: 'Aerodrome',
        description: 'DEX liquidity provision',
        icon: '✈️',
        apy: 8.4,
        deposited: 35000,
    },
];

const activeLoans = [
    {
        id: '1',
        name: 'Sarah Chen',
        loanDate: '2023-12-15',
        balance: 1500,
        monthlyDeduction: 500,
        currency: 'USDC',
    },
    {
        id: '2',
        name: 'Dewi Putri',
        loanDate: '2024-01-05',
        balance: 15000000,
        monthlyDeduction: 5000000,
        currency: 'IDRX',
    },
    {
        id: '3',
        name: 'Alex Kumar',
        loanDate: '2024-01-10',
        balance: 2000,
        monthlyDeduction: 400,
        currency: 'USDC',
    },
];

export default function DefiPage() {
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
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

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
                                <span className={styles.statValue}>${formatAmount(defiStats.totalTreasury)} USDC</span>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.green}`}>
                            <div className={styles.iconWrapper}>
                                <PiggyBank size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Deposited in DeFi</span>
                                <span className={styles.statValue}>${formatAmount(defiStats.totalDeposited)}</span>
                                <span className={styles.statSubtext}>{((defiStats.totalDeposited / defiStats.totalTreasury) * 100).toFixed(0)}% of treasury</span>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.green}`}>
                            <div className={styles.iconWrapper}>
                                <TrendingUp size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Yield Earned</span>
                                <span className={styles.statValue} style={{ color: '#00D395' }}>+${formatAmount(defiStats.totalYieldEarned)}</span>
                                <span className={styles.statSubtext}>All time</span>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.orange}`}>
                            <div className={styles.iconWrapper}>
                                <Users size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Active Loans</span>
                                <span className={styles.statValue}>{defiStats.activeLoans}</span>
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
                                                ${formatAmount(protocol.deposited)}
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
                                <span className={styles.badge}>{defiStats.activeLoans} Active</span>
                            </div>
                            <div className={styles.loanList}>
                                {activeLoans.map((loan) => (
                                    <div key={loan.id} className={styles.loanItem}>
                                        <div className={styles.loanAvatar}>
                                            {loan.name.charAt(0)}
                                        </div>
                                        <div className={styles.loanInfo}>
                                            <div className={styles.loanName}>{loan.name}</div>
                                            <div className={styles.loanDate}>Since {formatDate(loan.loanDate)}</div>
                                        </div>
                                        <div className={styles.loanAmount}>
                                            <div className={styles.loanBalance}>
                                                {formatAmount(loan.balance, true)} {loan.currency}
                                            </div>
                                            <div className={styles.loanMonthly}>
                                                -{formatAmount(loan.monthlyDeduction, true)}/mo
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.actionsCard}>
                                <button className={styles.actionBtn} style={{ gridColumn: '1 / -1' }}>
                                    <Users size={18} />
                                    View All Loans
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

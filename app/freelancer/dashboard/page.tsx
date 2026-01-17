'use client';

import Link from 'next/link';
import { Plus, ArrowUpRight, TrendingUp, Clock, FileText, ArrowDownLeft, ChevronRight } from 'lucide-react';
import { FreelancerSidebar, FreelancerTopBar } from '@/components/freelancer';
import styles from './page.module.css';

// Mock data
const stats = {
    totalEarned: 12500,
    pendingPayments: 3200,
    thisMonth: 4500,
};

const recentTransactions = [
    {
        id: '1',
        type: 'income',
        title: 'Invoice #INV-2024-001',
        client: 'TechCorp Indonesia',
        amount: 2500,
        currency: 'USDC',
        date: '2024-01-10',
    },
    {
        id: '2',
        type: 'income',
        title: 'Invoice #INV-2024-002',
        client: 'Digital Solutions',
        amount: 1500,
        currency: 'USDC',
        date: '2024-01-08',
    },
    {
        id: '3',
        type: 'expense',
        title: 'Withdrawal to Bank',
        client: 'BCA Bank',
        amount: 1000,
        currency: 'USDC',
        date: '2024-01-05',
    },
    {
        id: '4',
        type: 'income',
        title: 'Invoice #INV-2023-089',
        client: 'StartUp Labs',
        amount: 3500,
        currency: 'USDC',
        date: '2024-01-02',
    },
];

export default function FreelancerDashboard() {
    const formatAmount = (amount: number) => {
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

    const availableBalance = stats.totalEarned - 5000; // Mock: some withdrawn

    return (
        <div className={styles.dashboardLayout}>
            <FreelancerSidebar />
            <div className={styles.mainContent}>
                <FreelancerTopBar />
                <main className={styles.main}>
                    {/* Page Header */}
                    <div className={styles.pageHeader}>
                        <div className={styles.greeting}>
                            <h1>Welcome back, John!</h1>
                            <p>Here&apos;s what&apos;s happening with your earnings</p>
                        </div>
                        <div className={styles.quickActions}>
                            <Link href="/freelancer/invoices/new" className="btn btn-primary" style={{ background: '#00D395' }}>
                                <Plus size={18} />
                                Create Invoice
                            </Link>
                        </div>
                    </div>

                    {/* Balance Card */}
                    <div className={styles.balanceCard}>
                        <div className={styles.balanceInfo}>
                            <h2>Available Balance</h2>
                            <div className={styles.balanceAmount}>${formatAmount(availableBalance)}</div>
                            <div className={styles.balanceCurrency}>USDC</div>
                        </div>
                        <div className={styles.balanceActions}>
                            <Link href="/freelancer/withdraw" className={`${styles.balanceBtn} ${styles.primary}`}>
                                <ArrowUpRight size={18} />
                                Withdraw
                            </Link>
                            <Link href="/freelancer/invoices/new" className={`${styles.balanceBtn} ${styles.secondary}`}>
                                <Plus size={18} />
                                New Invoice
                            </Link>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className={styles.statsGrid}>
                        <div className={`${styles.statCard} ${styles.green}`}>
                            <div className={styles.iconWrapper}>
                                <TrendingUp size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Total Earned</span>
                                <span className={styles.statValue}>${formatAmount(stats.totalEarned)}</span>
                                <span className={styles.statSubtext}>All time</span>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.orange}`}>
                            <div className={styles.iconWrapper}>
                                <Clock size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Pending</span>
                                <span className={styles.statValue}>${formatAmount(stats.pendingPayments)}</span>
                                <span className={styles.statSubtext}>Awaiting payment</span>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.blue}`}>
                            <div className={styles.iconWrapper}>
                                <FileText size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>This Month</span>
                                <span className={styles.statValue}>${formatAmount(stats.thisMonth)}</span>
                                <span className={styles.statSubtext}>January 2024</span>
                            </div>
                        </div>
                    </div>

                    {/* Sections */}
                    <div className={styles.sections}>
                        {/* Recent Transactions */}
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h2>Recent Transactions</h2>
                                <Link href="/freelancer/payments">View all</Link>
                            </div>
                            <div className={styles.transactionList}>
                                {recentTransactions.map((tx) => (
                                    <div key={tx.id} className={styles.transactionItem}>
                                        <div className={`${styles.transactionIcon} ${styles[tx.type]}`}>
                                            {tx.type === 'income' ? (
                                                <ArrowDownLeft size={18} />
                                            ) : (
                                                <ArrowUpRight size={18} />
                                            )}
                                        </div>
                                        <div className={styles.transactionInfo}>
                                            <div className={styles.transactionTitle}>{tx.title}</div>
                                            <div className={styles.transactionDate}>
                                                {tx.client} • {formatDate(tx.date)}
                                            </div>
                                        </div>
                                        <div className={`${styles.transactionAmount} ${styles[tx.type]}`}>
                                            {tx.type === 'income' ? '+' : '-'}${formatAmount(tx.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h2>Quick Actions</h2>
                            </div>
                            <div className={styles.quickLinks}>
                                <Link href="/freelancer/invoices/new" className={styles.quickLink}>
                                    <div className={styles.quickLinkIcon}>
                                        <FileText size={18} />
                                    </div>
                                    <div className={styles.quickLinkInfo}>
                                        <div className={styles.quickLinkTitle}>Create Invoice</div>
                                        <div className={styles.quickLinkDesc}>Bill your clients</div>
                                    </div>
                                    <ChevronRight size={18} color="var(--text-light)" />
                                </Link>
                                <Link href="/freelancer/withdraw" className={styles.quickLink}>
                                    <div className={styles.quickLinkIcon}>
                                        <ArrowUpRight size={18} />
                                    </div>
                                    <div className={styles.quickLinkInfo}>
                                        <div className={styles.quickLinkTitle}>Withdraw Funds</div>
                                        <div className={styles.quickLinkDesc}>Cash out to bank</div>
                                    </div>
                                    <ChevronRight size={18} color="var(--text-light)" />
                                </Link>
                                <Link href="/freelancer/settings" className={styles.quickLink}>
                                    <div className={styles.quickLinkIcon}>
                                        <TrendingUp size={18} />
                                    </div>
                                    <div className={styles.quickLinkInfo}>
                                        <div className={styles.quickLinkTitle}>View Earnings</div>
                                        <div className={styles.quickLinkDesc}>Detailed analytics</div>
                                    </div>
                                    <ChevronRight size={18} color="var(--text-light)" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

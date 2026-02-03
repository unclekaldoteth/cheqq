'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, ArrowUpRight, TrendingUp, Clock, FileText, ArrowDownLeft, ChevronRight, Loader2 } from 'lucide-react';
import { FreelancerSidebar, FreelancerTopBar } from '@/components/freelancer';
import styles from './page.module.css';
import { useUser } from '@/contexts/UserContext';

interface FreelancerAnalytics {
    freelancer: {
        id: string;
        name: string;
        email: string;
        walletAddress: string;
    };
    invoices: {
        total: number;
        pending: number;
        paid: number;
    };
    earnings: {
        totals: {
            totalPaid: number;
            pendingPayments: number;
            totalWithdrawn: number;
            availableBalance: number;
        };
    };
    recentActivity: {
        invoices: Array<{
            id: string;
            amount: string | number;
            currency: string;
            status: string;
            createdAt: string;
        }>;
        withdrawals: Array<{
            id: string;
            amount: string | number;
            currency: string;
            status: string;
            createdAt: string;
        }>;
    };
}

export default function FreelancerDashboard() {
    const { user, userType, loading: userLoading } = useUser();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<FreelancerAnalytics | null>(null);
    const freelancerId = userType === 'freelancer' ? user?.id ?? null : null;

    // In production, get freelancerId from auth context
    useEffect(() => {
        if (userLoading) return;
        if (!freelancerId) {
            setData(null);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        let isActive = true;

        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ freelancerId });
                const res = await fetch(`/api/analytics/freelancer?${params.toString()}`, {
                    signal: controller.signal,
                });
                if (!res.ok) throw new Error('Failed to fetch');
                const analytics: FreelancerAnalytics = await res.json();
                if (isActive) {
                    setData(analytics);
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') return;
                console.error('Failed to fetch freelancer analytics');
                if (isActive) {
                    setData(null);
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [freelancerId, userLoading]);

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (date: string) => {
        const parsed = new Date(date);
        if (Number.isNaN(parsed.getTime())) return '-';
        return parsed.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    // Use API data or defaults
    const totals = data?.earnings?.totals;
    const stats = {
        totalEarned: totals?.totalPaid || 0,
        pendingPayments: totals?.pendingPayments || 0,
        availableBalance: totals?.availableBalance || 0,
    };

    const freelancerName = data?.freelancer?.name || (userType === 'freelancer' ? user?.name : null) || 'Freelancer';
    const greetingName = freelancerName.trim().split(/\s+/)[0] || freelancerName;

    // Combine recent invoices and withdrawals into transactions
    const recentInvoices = data?.recentActivity?.invoices || [];
    const recentWithdrawals = data?.recentActivity?.withdrawals || [];
    const recentTransactions = [
        ...recentInvoices.map((inv) => ({
            id: inv.id,
            type: 'income' as const,
            title: `Invoice #${inv.id.slice(-8).toUpperCase()}`,
            client: inv.status === 'PAID' ? 'Paid' : inv.status,
            amount: Number(inv.amount),
            currency: inv.currency,
            date: inv.createdAt,
        })),
        ...recentWithdrawals.map((w) => ({
            id: w.id,
            type: 'expense' as const,
            title: 'Withdrawal',
            client: w.status,
            amount: Number(w.amount),
            currency: w.currency,
            date: w.createdAt,
        })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    if (loading) {
        return (
            <div className={styles.dashboardLayout}>
                <FreelancerSidebar />
                <div className={styles.mainContent}>
                    <FreelancerTopBar />
                    <main className={styles.main}>
                        <div className={styles.loadingState}>
                            <Loader2 size={32} className={styles.spinner} />
                            <span>Loading your dashboard...</span>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dashboardLayout}>
            <FreelancerSidebar />
            <div className={styles.mainContent}>
                <FreelancerTopBar />
                <main className={styles.main}>
                    {/* Page Header */}
                    <div className={styles.pageHeader}>
                        <div className={styles.greeting}>
                            <h1>Welcome back, {greetingName}!</h1>
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
                            <div className={styles.balanceAmount}>${formatAmount(stats.availableBalance)}</div>
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
                                <span className={styles.statLabel}>Invoices</span>
                                <span className={styles.statValue}>{data?.invoices?.total || 0}</span>
                                <span className={styles.statSubtext}>{data?.invoices?.paid || 0} paid</span>
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
                                {recentTransactions.length > 0 ? (
                                    recentTransactions.map((tx) => (
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
                                    ))
                                ) : (
                                    <div className={styles.emptyState}>
                                        No transactions yet. Create your first invoice!
                                    </div>
                                )}
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

'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, ArrowDownLeft, Calendar, Loader2, DollarSign, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { FreelancerSidebar, FreelancerTopBar } from '@/components/freelancer';
import styles from './page.module.css';

type PaymentStatus = 'completed' | 'pending' | 'failed';

interface Payment {
    id: string;
    title: string;
    client: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    date: string;
}

const parsePaymentDate = (value?: string) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizePaymentStatus = (value?: string): PaymentStatus => {
    const normalized = value?.toLowerCase();
    if (normalized === 'completed') return 'completed';
    if (normalized === 'failed') return 'failed';
    return 'pending';
};

export default function PaymentsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch payments from API
    useEffect(() => {
        const freelancerId = localStorage.getItem('freelancerId');
        if (!freelancerId) {
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        let isActive = true;

        const fetchPayments = async () => {
            try {
                const res = await fetch(`/api/invoices?freelancerId=${encodeURIComponent(freelancerId)}`, {
                    signal: controller.signal,
                });
                if (res.ok) {
                    const data = await res.json();
                    if (isActive) {
                        const mapped: Payment[] = (data.invoices || []).flatMap((invoice: {
                            id: string;
                            clientName?: string;
                            paidAt?: string;
                            createdAt?: string;
                            payments?: Array<{
                                id: string;
                                amount: string | number;
                                currency: string;
                                status: string;
                                createdAt?: string;
                                confirmedAt?: string;
                            }>;
                        }) => {
                            const invoiceTitle = `Invoice #${invoice.id.slice(-8).toUpperCase()}`;
                            const baseDate = invoice.paidAt || invoice.createdAt || '';
                            return (invoice.payments || []).map((payment) => ({
                                id: payment.id,
                                title: invoiceTitle,
                                client: invoice.clientName || 'Client',
                                amount: Number(payment.amount),
                                currency: payment.currency,
                                status: normalizePaymentStatus(payment.status),
                                date: payment.confirmedAt || payment.createdAt || baseDate,
                            }));
                        });
                        setPayments(mapped);
                    }
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') return;
                console.error('Failed to fetch payments');
            } finally {
                if (isActive) setLoading(false);
            }
        };

        fetchPayments();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, []);

    // Filter payments
    const filteredPayments = payments.filter((payment) => {
        const matchesSearch =
            payment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            payment.client.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Calculate stats
    const totalReceived = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
    const now = new Date();
    const thisMonthAmount = payments.reduce((sum, payment) => {
        if (payment.status !== 'completed') return sum;
        const paymentDate = parsePaymentDate(payment.date);
        if (!paymentDate) return sum;
        if (paymentDate.getMonth() !== now.getMonth() || paymentDate.getFullYear() !== now.getFullYear()) {
            return sum;
        }
        return sum + payment.amount;
    }, 0);
    const currentMonthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (date: string) => {
        const parsed = parsePaymentDate(date);
        if (!parsed) return '-';
        return parsed.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className={styles.dashboardLayout}>
                <FreelancerSidebar />
                <div className={styles.mainContent}>
                    <FreelancerTopBar />
                    <main className={styles.main}>
                        <div className={styles.loadingState}>
                            <Loader2 size={32} className={styles.spinner} />
                            <span>Loading payments...</span>
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
                        <div>
                            <h1>Payments</h1>
                            <p>Track all your received payments</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className={styles.statsGrid}>
                        <div className={`${styles.statCard} ${styles.green}`}>
                            <div className={styles.iconWrapper}>
                                <TrendingUp size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Total Received</span>
                                <span className={styles.statValue}>${formatAmount(totalReceived)}</span>
                                <span className={styles.statSubtext}>All time</span>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.blue}`}>
                            <div className={styles.iconWrapper}>
                                <Calendar size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>This Month</span>
                                <span className={styles.statValue}>${formatAmount(thisMonthAmount)}</span>
                                <span className={styles.statSubtext}>{currentMonthName}</span>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.orange}`}>
                            <div className={styles.iconWrapper}>
                                <ArrowDownLeft size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Pending</span>
                                <span className={styles.statValue}>${formatAmount(pendingAmount)}</span>
                                <span className={styles.statSubtext}>Awaiting</span>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className={styles.filters}>
                        <div className={styles.searchBox}>
                            <Search size={18} className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search payments..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                        <div className={styles.filterGroup}>
                            <Filter size={18} />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className={styles.filterSelect}
                            >
                                <option value="all">All Status</option>
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                    </div>

                    {/* Payments Table or Empty State */}
                    {payments.length > 0 ? (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Payment</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPayments.map((payment) => (
                                        <tr key={payment.id}>
                                            <td>
                                                <div className={styles.paymentInfo}>
                                                    <span className={styles.paymentTitle}>{payment.title}</span>
                                                    <span className={styles.paymentClient}>{payment.client}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={styles.amount}>
                                                    +${formatAmount(payment.amount)} {payment.currency}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={styles.date}>{formatDate(payment.date)}</span>
                                            </td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[payment.status]}`}>
                                                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <DollarSign size={48} strokeWidth={1.5} />
                            <h3>No payments yet</h3>
                            <p>Create an invoice to start receiving payments</p>
                            <Link href="/freelancer/invoices/new" className="btn btn-primary" style={{ background: '#00D395' }}>
                                <LinkIcon size={18} />
                                Create Invoice
                            </Link>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

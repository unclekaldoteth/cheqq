'use client';

import { useState } from 'react';
import { Search, Filter, TrendingUp, ArrowDownLeft, Calendar } from 'lucide-react';
import { FreelancerSidebar, FreelancerTopBar } from '@/components/freelancer';
import styles from './page.module.css';

// Mock data
const mockPayments = [
    {
        id: '1',
        title: 'Invoice #INV-2024-001',
        client: 'TechCorp Indonesia',
        amount: 2500,
        currency: 'USDC',
        status: 'completed',
        date: '2024-01-10',
    },
    {
        id: '2',
        title: 'Invoice #INV-2023-089',
        client: 'StartUp Labs',
        amount: 3500,
        currency: 'USDC',
        status: 'completed',
        date: '2024-01-02',
    },
    {
        id: '3',
        title: 'Invoice #INV-2023-085',
        client: 'Digital Solutions',
        amount: 1800,
        currency: 'USDC',
        status: 'completed',
        date: '2023-12-28',
    },
    {
        id: '4',
        title: 'Invoice #INV-2023-080',
        client: 'Creative Agency',
        amount: 2200,
        currency: 'USDC',
        status: 'completed',
        date: '2023-12-15',
    },
    {
        id: '5',
        title: 'Invoice #INV-2024-002',
        client: 'Global Ventures',
        amount: 1500,
        currency: 'USDC',
        status: 'pending',
        date: '2024-01-12',
    },
];

export default function PaymentsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Filter payments
    const filteredPayments = mockPayments.filter((payment) => {
        const matchesSearch =
            payment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            payment.client.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Calculate stats
    const totalReceived = mockPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = mockPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
    const thisMonthAmount = mockPayments
        .filter(p => p.status === 'completed' && new Date(p.date).getMonth() === 0)
        .reduce((sum, p) => sum + p.amount, 0);

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
            year: 'numeric',
        });
    };

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
                                <span className={styles.statSubtext}>January 2024</span>
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
                            </select>
                        </div>
                    </div>

                    {/* Payments Table */}
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
                                                {payment.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        </div>
    );
}

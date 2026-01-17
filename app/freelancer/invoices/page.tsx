'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Filter, DollarSign, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { FreelancerSidebar, FreelancerTopBar } from '@/components/freelancer';
import { InvoiceTable, type Invoice } from '@/components/dashboard/invoice';
import styles from './page.module.css';

// Mock data
const mockInvoices: Invoice[] = [
    {
        id: '1',
        invoiceNumber: 'INV-2024-001',
        clientName: 'TechCorp Indonesia',
        clientEmail: 'finance@techcorp.id',
        amount: 2500,
        currency: 'USDC',
        status: 'paid',
        dueDate: '2024-01-15',
        createdAt: '2024-01-01',
    },
    {
        id: '2',
        invoiceNumber: 'INV-2024-002',
        clientName: 'Digital Solutions',
        clientEmail: 'billing@digitalsolutions.com',
        amount: 1500,
        currency: 'USDC',
        status: 'pending',
        dueDate: '2024-01-25',
        createdAt: '2024-01-05',
    },
    {
        id: '3',
        invoiceNumber: 'INV-2024-003',
        clientName: 'StartUp Labs',
        clientEmail: 'accounts@startuplabs.io',
        amount: 25000000,
        currency: 'IDRX',
        status: 'pending',
        dueDate: '2024-01-30',
        createdAt: '2024-01-10',
    },
    {
        id: '4',
        invoiceNumber: 'INV-2024-004',
        clientName: 'Global Ventures',
        clientEmail: 'pay@globalventures.com',
        amount: 3200,
        currency: 'USDC',
        status: 'overdue',
        dueDate: '2024-01-05',
        createdAt: '2023-12-20',
    },
    {
        id: '5',
        invoiceNumber: 'INV-2024-005',
        clientName: 'Creative Agency',
        clientEmail: 'hello@creativeagency.co',
        amount: 1800,
        currency: 'USDC',
        status: 'draft',
        dueDate: '2024-02-01',
        createdAt: '2024-01-12',
    },
];

export default function FreelancerInvoicesPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Filter invoices
    const filteredInvoices = mockInvoices.filter((invoice) => {
        const matchesSearch =
            invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Calculate stats
    const totalAmount = mockInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.currency === 'USDC' ? i.amount : 0), 0);
    const pendingAmount = mockInvoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + (i.currency === 'USDC' ? i.amount : 0), 0);
    const paidCount = mockInvoices.filter(i => i.status === 'paid').length;
    const overdueCount = mockInvoices.filter(i => i.status === 'overdue').length;

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const handleViewInvoice = (id: string) => {
        router.push(`/freelancer/invoices/${id}`);
    };

    const handleCopyLink = (id: string) => {
        const link = `${window.location.origin}/pay/${id}`;
        navigator.clipboard.writeText(link);
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
                            <h1>Invoices</h1>
                            <p>Create and track your invoices</p>
                        </div>
                        <Link href="/freelancer/invoices/new" className="btn btn-primary" style={{ background: '#00D395' }}>
                            <Plus size={18} />
                            New Invoice
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className={styles.statsGrid}>
                        <div className={`${styles.statCard} ${styles.blue}`}>
                            <div className={styles.iconWrapper}>
                                <DollarSign size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Total Earned</span>
                                <span className={styles.statValue}>${formatAmount(totalAmount)}</span>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.orange}`}>
                            <div className={styles.iconWrapper}>
                                <Clock size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Pending</span>
                                <span className={styles.statValue}>${formatAmount(pendingAmount)}</span>
                                <span className={styles.statSubtext}>Awaiting payment</span>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.green}`}>
                            <div className={styles.iconWrapper}>
                                <CheckCircle size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Paid</span>
                                <span className={styles.statValue}>{paidCount}</span>
                                <span className={styles.statSubtext}>Invoices</span>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.red}`}>
                            <div className={styles.iconWrapper}>
                                <AlertTriangle size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Overdue</span>
                                <span className={styles.statValue}>{overdueCount}</span>
                                <span className={styles.statSubtext}>Need attention</span>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className={styles.filters}>
                        <div className={styles.searchBox}>
                            <Search size={18} className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search invoices..."
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
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                                <option value="overdue">Overdue</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>
                    </div>

                    {/* Invoice Table */}
                    <InvoiceTable
                        invoices={filteredInvoices}
                        onView={handleViewInvoice}
                        onCopyLink={handleCopyLink}
                    />
                </main>
            </div>
        </div>
    );
}

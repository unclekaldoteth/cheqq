'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Filter, Search } from 'lucide-react';
import { Sidebar, TopBar } from '@/components/dashboard';
import {
    InvoiceStats,
    InvoiceTable,
    type Invoice,
} from '@/components/dashboard/invoice';
import styles from './page.module.css';

// Mock data for demonstration
const mockInvoices: Invoice[] = [
    {
        id: '1',
        invoiceNumber: 'INV-2024-001',
        clientName: 'TechCorp Indonesia',
        clientEmail: 'finance@techcorp.id',
        amount: 15000,
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
        amount: 8500,
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
        amount: 5200,
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
        amount: 3750,
        currency: 'USDC',
        status: 'draft',
        dueDate: '2024-02-01',
        createdAt: '2024-01-12',
    },
];

export default function InvoicesPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const filteredInvoices = mockInvoices.filter((invoice) => {
        const matchesSearch =
            invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Calculate stats
    const stats = {
        totalOutstanding: mockInvoices
            .filter((i) => i.status === 'pending' || i.status === 'overdue')
            .filter((i) => i.currency === 'USDC')
            .reduce((sum, i) => sum + i.amount, 0),
        paidThisMonth: mockInvoices
            .filter((i) => i.status === 'paid')
            .filter((i) => i.currency === 'USDC')
            .reduce((sum, i) => sum + i.amount, 0),
        pendingCount: mockInvoices.filter((i) => i.status === 'pending').length,
        overdueCount: mockInvoices.filter((i) => i.status === 'overdue').length,
    };

    const handleViewInvoice = (id: string) => {
        router.push(`/dashboard/invoices/${id}`);
    };

    const handleCopyLink = (id: string) => {
        const link = `${window.location.origin}/pay/${id}`;
        navigator.clipboard.writeText(link);
        // Could add toast notification here
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
                            <h1>Invoices</h1>
                            <p>Create, track, and manage your invoices</p>
                        </div>
                        <Link href="/dashboard/invoices/new" className="btn btn-primary">
                            <Plus size={18} />
                            New Invoice
                        </Link>
                    </div>

                    {/* Stats */}
                    <InvoiceStats
                        totalOutstanding={stats.totalOutstanding}
                        paidThisMonth={stats.paidThisMonth}
                        pendingCount={stats.pendingCount}
                        overdueCount={stats.overdueCount}
                    />

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
                                <option value="draft">Draft</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                                <option value="cancelled">Cancelled</option>
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

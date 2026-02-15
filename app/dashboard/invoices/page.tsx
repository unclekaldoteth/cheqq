'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Filter, Search, Loader2 } from 'lucide-react';
import { Sidebar, TopBar } from '@/components/dashboard';
import {
    InvoiceStats,
    InvoiceTable,
    type Invoice,
    type InvoiceStatusType,
} from '@/components/dashboard/invoice';
import { normalizeCurrency } from '@/lib/currency';
import styles from './page.module.css';
import { useUser } from '@/contexts/UserContext';

interface InvoiceFromAPI {
    id: string;
    clientName: string;
    clientEmail: string;
    description: string;
    amount: string | number;
    currency: string;
    status: string;
    dueDate: string;
    createdAt: string;
    paidAt?: string | null;
}

const normalizeInvoiceCurrency = (value?: string): Invoice['currency'] => {
    return (normalizeCurrency(value) as Invoice['currency'] | null) || 'AlphaUSD';
};

const normalizeInvoiceStatus = (value?: string): InvoiceStatusType => {
    const normalized = value?.toLowerCase();
    if (
        normalized === 'draft' ||
        normalized === 'pending' ||
        normalized === 'paid' ||
        normalized === 'overdue' ||
        normalized === 'cancelled'
    ) {
        return normalized;
    }
    return 'pending';
};

const normalizeDate = (value?: string) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().split('T')[0];
};

export default function InvoicesPage() {
    const router = useRouter();
    const { user, userType, loading: userLoading } = useUser();
    const companyId = userType === 'company' ? user?.id ?? null : null;
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userLoading) return;
        if (!companyId) {
            setInvoices([]);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        let isActive = true;

        const fetchInvoices = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ companyId });
                const res = await fetch(`/api/invoices?${params.toString()}`, {
                    signal: controller.signal,
                });
                if (!res.ok) throw new Error('Failed to fetch invoices');
                const data = await res.json();

                if (isActive) {
                    // Transform API response to match Invoice interface
                    const transformed: Invoice[] = (data.invoices || []).map((inv: InvoiceFromAPI) => ({
                        id: inv.id,
                        invoiceNumber: `INV-${inv.id.slice(-8).toUpperCase()}`,
                        clientName: inv.clientName,
                        clientEmail: inv.clientEmail,
                        amount: Number(inv.amount),
                        currency: normalizeInvoiceCurrency(inv.currency),
                        status: normalizeInvoiceStatus(inv.status),
                        dueDate: normalizeDate(inv.dueDate),
                        createdAt: normalizeDate(inv.createdAt),
                    }));
                    setInvoices(transformed);
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') return;
                console.error('Failed to fetch invoices:', error);
                if (isActive) {
                    setInvoices([]);
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        fetchInvoices();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [companyId, userLoading]);

    const filteredInvoices = invoices.filter((invoice) => {
        const matchesSearch =
            invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Calculate stats
    const stats = {
        totalOutstanding: invoices
            .filter((i) => i.status === 'pending' || i.status === 'overdue')
            .filter((i) => i.currency === 'AlphaUSD')
            .reduce((sum, i) => sum + i.amount, 0),
        paidThisMonth: invoices
            .filter((i) => i.status === 'paid')
            .filter((i) => i.currency === 'AlphaUSD')
            .reduce((sum, i) => sum + i.amount, 0),
        pendingCount: invoices.filter((i) => i.status === 'pending').length,
        overdueCount: invoices.filter((i) => i.status === 'overdue').length,
    };

    const handleViewInvoice = (id: string) => {
        router.push(`/dashboard/invoices/${id}`);
    };

    const handleCopyLink = (id: string) => {
        const link = `${window.location.origin}/pay/${id}`;
        navigator.clipboard.writeText(link);
        // Could add toast notification here
    };

    if (loading) {
        return (
            <div className={styles.dashboardLayout}>
                <Sidebar />
                <div className={styles.mainContent}>
                    <TopBar />
                    <main className={styles.main}>
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
                        <div className={styles.loadingState}>
                            <Loader2 size={32} className={styles.spinner} />
                            <span>Loading invoices...</span>
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

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Filter, DollarSign, Clock, CheckCircle, AlertTriangle, Loader2, FileText } from 'lucide-react';
import { FreelancerSidebar, FreelancerTopBar } from '@/components/freelancer';
import { InvoiceTable, type Invoice, type InvoiceStatusType } from '@/components/dashboard/invoice';
import styles from './page.module.css';
import { useUser } from '@/contexts/UserContext';

const normalizeInvoiceCurrency = (value?: string): Invoice['currency'] => {
    if (value === 'IDRX') return 'IDRX';
    if (value === 'ETH') return 'ETH';
    return 'USDC';
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

export default function FreelancerInvoicesPage() {
    const router = useRouter();
    const { user, userType, loading: userLoading } = useUser();
    const freelancerId = userType === 'freelancer' ? user?.id ?? null : null;
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch invoices from API
    useEffect(() => {
        if (userLoading) return;
        if (!freelancerId) {
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        let isActive = true;

        const fetchInvoices = async () => {
            try {
                const res = await fetch(`/api/invoices?freelancerId=${encodeURIComponent(freelancerId)}`, {
                    signal: controller.signal,
                });
                if (res.ok) {
                    const data = await res.json();
                    if (isActive) {
                        const mapped: Invoice[] = (data.invoices || []).map((inv: {
                            id: string;
                            amount: string | number;
                            currency: string;
                            status: string;
                            dueDate: string;
                            createdAt: string;
                            clientName?: string;
                            clientEmail?: string;
                        }) => ({
                            id: inv.id,
                            invoiceNumber: `INV-${inv.id.slice(-8).toUpperCase()}`,
                            clientName: inv.clientName || 'Client',
                            clientEmail: inv.clientEmail || '',
                            amount: Number(inv.amount),
                            currency: normalizeInvoiceCurrency(inv.currency),
                            status: normalizeInvoiceStatus(inv.status),
                            dueDate: inv.dueDate,
                            createdAt: inv.createdAt,
                        }));
                        setInvoices(mapped);
                    }
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') return;
                console.error('Failed to fetch invoices');
            } finally {
                if (isActive) setLoading(false);
            }
        };

        fetchInvoices();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [freelancerId, userLoading]);

    // Filter invoices
    const filteredInvoices = invoices.filter((invoice) => {
        const matchesSearch =
            invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Calculate stats
    const totalAmount = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.currency === 'USDC' ? i.amount : 0), 0);
    const pendingAmount = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + (i.currency === 'USDC' ? i.amount : 0), 0);
    const paidCount = invoices.filter(i => i.status === 'paid').length;
    const overdueCount = invoices.filter(i => i.status === 'overdue').length;

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

    if (loading) {
        return (
            <div className={styles.dashboardLayout}>
                <FreelancerSidebar />
                <div className={styles.mainContent}>
                    <FreelancerTopBar />
                    <main className={styles.main}>
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

                    {/* Invoice Table or Empty State */}
                    {invoices.length > 0 ? (
                        <InvoiceTable
                            invoices={filteredInvoices}
                            onView={handleViewInvoice}
                            onCopyLink={handleCopyLink}
                        />
                    ) : (
                        <div className={styles.emptyState}>
                            <FileText size={48} strokeWidth={1.5} />
                            <h3>No invoices yet</h3>
                            <p>Create your first invoice to start getting paid</p>
                            <Link href="/freelancer/invoices/new" className="btn btn-primary" style={{ background: '#00D395' }}>
                                <Plus size={18} />
                                Create Invoice
                            </Link>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

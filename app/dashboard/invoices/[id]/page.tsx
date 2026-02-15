'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Copy, ExternalLink, Send, Loader2 } from 'lucide-react';
import { Sidebar, TopBar } from '@/components/dashboard';
import { InvoiceStatus, type InvoiceStatusType } from '@/components/dashboard/invoice';
import styles from './page.module.css';

interface Invoice {
    id: string;
    clientName: string;
    clientEmail: string;
    amount: string | number;
    currency: string;
    status: string;
    description: string;
    dueDate: string;
    createdAt: string;
    paidAt?: string | null;
    company?: {
        id: string;
        name: string;
        walletAddress: string | null;
    } | null;
    freelancer?: {
        id: string;
        name: string;
        walletAddress: string | null;
    } | null;
    payments?: Array<{
        id: string;
        status: string;
        txHash?: string | null;
        createdAt: string;
        confirmedAt?: string | null;
    }>;
}

interface ActivityItem {
    id: string;
    type: string;
    date: string;
    description: string;
    txHash?: string | null;
}

export default function InvoiceDetailPage() {
    const router = useRouter();
    const params = useParams();
    const invoiceId = params.id as string;

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!invoiceId) {
            setError('Invoice ID is missing');
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        let isActive = true;

        const fetchInvoice = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/invoices?id=${invoiceId}`, {
                    signal: controller.signal,
                });
                if (!res.ok) {
                    if (res.status === 404) {
                        throw new Error('Invoice not found');
                    }
                    throw new Error('Failed to fetch invoice');
                }
                const data = await res.json();
                if (isActive) {
                    setInvoice(data.invoice);
                }
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') return;
                console.error('Failed to fetch invoice:', err);
                if (isActive) {
                    setError(err instanceof Error ? err.message : 'Failed to load invoice');
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        fetchInvoice();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [invoiceId]);

    const formatDate = (date: string) => {
        const parsed = new Date(date);
        if (isNaN(parsed.getTime())) return '-';
        return parsed.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatAmount = (amount: string | number) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (!Number.isFinite(num)) return '0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    const handleCopyLink = async () => {
        if (!invoice) return;
        const baseUrl = window.location.origin;
        const paymentLink = `${baseUrl}/pay/${invoice.id}`;
        await navigator.clipboard.writeText(paymentLink);
    };

    // Build activity timeline from invoice data
    const buildActivityTimeline = (inv: Invoice): ActivityItem[] => {
        const activities: ActivityItem[] = [];

        // Invoice created
        activities.push({
            id: 'created',
            type: 'created',
            date: inv.createdAt,
            description: 'Invoice created',
        });

        // Payment events from payments array
        if (inv.payments && inv.payments.length > 0) {
            for (const payment of inv.payments) {
                if (payment.status === 'COMPLETED' && payment.confirmedAt) {
                    activities.push({
                        id: payment.id,
                        type: 'paid',
                        date: payment.confirmedAt,
                        description: `Payment received - ${formatAmount(inv.amount)} ${inv.currency}`,
                        txHash: payment.txHash,
                    });
                } else if (payment.status === 'PENDING') {
                    activities.push({
                        id: payment.id,
                        type: 'pending',
                        date: payment.createdAt,
                        description: 'Payment pending',
                    });
                }
            }
        }

        // Paid at timestamp
        if (inv.paidAt && inv.status === 'PAID') {
            const hasPaidActivity = activities.some(a => a.type === 'paid');
            if (!hasPaidActivity) {
                activities.push({
                    id: 'paid',
                    type: 'paid',
                    date: inv.paidAt,
                    description: `Payment received - ${formatAmount(inv.amount)} ${inv.currency}`,
                });
            }
        }

        // Sort by date descending (newest first in display, but we'll reverse for timeline)
        return activities.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    };

    if (loading) {
        return (
            <div className={styles.dashboardLayout}>
                <Sidebar />
                <div className={styles.mainContent}>
                    <TopBar />
                    <main className={styles.main}>
                        <div className={styles.loadingState}>
                            <Loader2 size={32} className={styles.spinner} />
                            <span>Loading invoice...</span>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className={styles.dashboardLayout}>
                <Sidebar />
                <div className={styles.mainContent}>
                    <TopBar />
                    <main className={styles.main}>
                        <div className={styles.pageHeader}>
                            <button
                                className={styles.backBtn}
                                onClick={() => router.push('/dashboard/invoices')}
                            >
                                <ArrowLeft size={20} />
                                Back to Invoices
                            </button>
                        </div>
                        <div className={styles.errorState}>
                            <h2>Error</h2>
                            <p>{error || 'Invoice not found'}</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => router.push('/dashboard/invoices')}
                            >
                                Go to Invoices
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    const activities = buildActivityTimeline(invoice);
    const invoiceNumber = `INV-${invoice.id.slice(-8).toUpperCase()}`;
    const paymentLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/pay/${invoice.id}`;
    const statusLower = invoice.status.toLowerCase() as InvoiceStatusType;

    return (
        <div className={styles.dashboardLayout}>
            <Sidebar />
            <div className={styles.mainContent}>
                <TopBar />
                <main className={styles.main}>
                    {/* Page Header */}
                    <div className={styles.pageHeader}>
                        <button
                            className={styles.backBtn}
                            onClick={() => router.push('/dashboard/invoices')}
                        >
                            <ArrowLeft size={20} />
                            Back to Invoices
                        </button>
                        <div className={styles.headerRow}>
                            <div>
                                <div className={styles.invoiceTitle}>
                                    <h1>#{invoiceNumber}</h1>
                                    <InvoiceStatus status={statusLower} />
                                </div>
                                <p>Created on {formatDate(invoice.createdAt)}</p>
                            </div>
                            <div className={styles.headerActions}>
                                <button className="btn btn-outline" onClick={handleCopyLink}>
                                    <Copy size={16} />
                                    Copy Link
                                </button>
                                <button className="btn btn-primary">
                                    <Send size={16} />
                                    Send Reminder
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={styles.content}>
                        {/* Main Info */}
                        <div className={styles.mainSection}>
                            {/* Amount Card */}
                            <div className={styles.amountCard}>
                                <span className={styles.amountLabel}>Total Amount</span>
                                <span className={styles.amountValue}>
                                    {formatAmount(invoice.amount)}
                                    <span className={styles.currency}>{invoice.currency}</span>
                                </span>
                                <span className={styles.dueLine}>
                                    Due {formatDate(invoice.dueDate)}
                                </span>
                            </div>

                            {/* Client Info */}
                            <div className={styles.infoCard}>
                                <h3>Client Details</h3>
                                <div className={styles.infoGrid}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Name</span>
                                        <span className={styles.infoValue}>{invoice.clientName}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Email</span>
                                        <span className={styles.infoValue}>{invoice.clientEmail}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Description/Memo */}
                            {invoice.description && (
                                <div className={styles.infoCard}>
                                    <h3>Description</h3>
                                    <p className={styles.memo}>{invoice.description}</p>
                                </div>
                            )}

                            {/* Payment Link */}
                            <div className={styles.infoCard}>
                                <h3>Payment Link</h3>
                                <div className={styles.linkBox}>
                                    <input
                                        type="text"
                                        readOnly
                                        value={paymentLink}
                                        className={styles.linkInput}
                                    />
                                    <button className={styles.linkBtn} onClick={handleCopyLink}>
                                        <Copy size={16} />
                                    </button>
                                    <a
                                        href={paymentLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.linkBtn}
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Activity Timeline */}
                        <div className={styles.sideSection}>
                            <div className={styles.infoCard}>
                                <h3>Activity</h3>
                                <div className={styles.timeline}>
                                    {activities.length > 0 ? (
                                        activities.map((tx, index) => (
                                            <div key={tx.id} className={styles.timelineItem}>
                                                <div className={styles.timelineDot} />
                                                {index < activities.length - 1 && (
                                                    <div className={styles.timelineLine} />
                                                )}
                                                <div className={styles.timelineContent}>
                                                    <span className={styles.timelineDate}>
                                                        {formatDate(tx.date)}
                                                    </span>
                                                    <span className={styles.timelineDesc}>{tx.description}</span>
                                                    {tx.txHash && (
                                                        <a
                                                            href={`https://explore.tempo.xyz/tx/${tx.txHash}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={styles.txLink}
                                                        >
                                                            View on Explorer →
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className={styles.noActivity}>No activity yet</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

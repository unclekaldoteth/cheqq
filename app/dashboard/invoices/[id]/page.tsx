'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, ExternalLink, Send } from 'lucide-react';
import { Sidebar, TopBar } from '@/components/dashboard';
import { InvoiceStatus, type InvoiceStatusType } from '@/components/dashboard/invoice';
import styles from './page.module.css';

// Mock invoice data
const mockInvoice = {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    clientName: 'TechCorp Indonesia',
    clientEmail: 'finance@techcorp.id',
    amount: 15000,
    currency: 'USDC' as const,
    status: 'paid' as InvoiceStatusType,
    dueDate: '2024-01-15',
    createdAt: '2024-01-01',
    memo: 'Software development services for Q4 2023. Includes frontend development, API integration, and deployment.',
    paymentLink: 'https://pay.cheqq.app/inv-2024-001',
    transactions: [
        { id: 1, type: 'created', date: '2024-01-01', description: 'Invoice created' },
        { id: 2, type: 'sent', date: '2024-01-02', description: 'Payment link sent to client' },
        { id: 3, type: 'viewed', date: '2024-01-10', description: 'Client viewed invoice' },
        { id: 4, type: 'paid', date: '2024-01-12', description: 'Payment received - 15,000 USDC', txHash: '0x1234...abcd' },
    ],
};

export default function InvoiceDetailPage() {
    const router = useRouter();

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(mockInvoice.paymentLink);
    };

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
                                    <h1>#{mockInvoice.invoiceNumber}</h1>
                                    <InvoiceStatus status={mockInvoice.status} />
                                </div>
                                <p>Created on {formatDate(mockInvoice.createdAt)}</p>
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
                                    {formatAmount(mockInvoice.amount)}
                                    <span className={styles.currency}>{mockInvoice.currency}</span>
                                </span>
                                <span className={styles.dueLine}>
                                    Due {formatDate(mockInvoice.dueDate)}
                                </span>
                            </div>

                            {/* Client Info */}
                            <div className={styles.infoCard}>
                                <h3>Client Details</h3>
                                <div className={styles.infoGrid}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Name</span>
                                        <span className={styles.infoValue}>{mockInvoice.clientName}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Email</span>
                                        <span className={styles.infoValue}>{mockInvoice.clientEmail}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Memo */}
                            {mockInvoice.memo && (
                                <div className={styles.infoCard}>
                                    <h3>Memo</h3>
                                    <p className={styles.memo}>{mockInvoice.memo}</p>
                                </div>
                            )}

                            {/* Payment Link */}
                            <div className={styles.infoCard}>
                                <h3>Payment Link</h3>
                                <div className={styles.linkBox}>
                                    <input
                                        type="text"
                                        readOnly
                                        value={mockInvoice.paymentLink}
                                        className={styles.linkInput}
                                    />
                                    <button className={styles.linkBtn} onClick={handleCopyLink}>
                                        <Copy size={16} />
                                    </button>
                                    <a
                                        href={mockInvoice.paymentLink}
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
                                    {mockInvoice.transactions.map((tx, index) => (
                                        <div key={tx.id} className={styles.timelineItem}>
                                            <div className={styles.timelineDot} />
                                            {index < mockInvoice.transactions.length - 1 && (
                                                <div className={styles.timelineLine} />
                                            )}
                                            <div className={styles.timelineContent}>
                                                <span className={styles.timelineDate}>
                                                    {formatDate(tx.date)}
                                                </span>
                                                <span className={styles.timelineDesc}>{tx.description}</span>
                                                {tx.txHash && (
                                                    <a href="#" className={styles.txLink}>
                                                        View on Explorer →
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

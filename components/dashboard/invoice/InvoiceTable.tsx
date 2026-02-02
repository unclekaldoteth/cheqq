'use client';

import { MoreHorizontal, Copy, Eye } from 'lucide-react';
import InvoiceStatus, { type InvoiceStatusType } from './InvoiceStatus';
import styles from './InvoiceTable.module.css';

export interface Invoice {
    id: string;
    invoiceNumber: string;
    clientName: string;
    clientEmail: string;
    amount: number;
    currency: 'USDC' | 'IDRX' | 'ETH';
    status: InvoiceStatusType;
    dueDate: string;
    createdAt: string;
}

interface InvoiceTableProps {
    invoices: Invoice[];
    onView?: (id: string) => void;
    onCopyLink?: (id: string) => void;
}

export default function InvoiceTable({ invoices, onView, onCopyLink }: InvoiceTableProps) {
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatAmount = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount) + ` ${currency}`;
    };

    if (invoices.length === 0) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📄</div>
                <h3>No invoices yet</h3>
                <p>Create your first invoice to get started</p>
            </div>
        );
    }

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Invoice</th>
                        <th>Client</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {invoices.map((invoice) => (
                        <tr key={invoice.id}>
                            <td>
                                <div className={styles.invoiceCell}>
                                    <span className={styles.invoiceNumber}>
                                        #{invoice.invoiceNumber}
                                    </span>
                                    <span className={styles.createdDate}>
                                        {formatDate(invoice.createdAt)}
                                    </span>
                                </div>
                            </td>
                            <td>
                                <div className={styles.clientCell}>
                                    <span className={styles.clientName}>{invoice.clientName}</span>
                                    <span className={styles.clientEmail}>{invoice.clientEmail}</span>
                                </div>
                            </td>
                            <td>
                                <span className={styles.amount}>
                                    {formatAmount(invoice.amount, invoice.currency)}
                                </span>
                            </td>
                            <td>
                                <InvoiceStatus status={invoice.status} size="sm" />
                            </td>
                            <td>
                                <span className={styles.dueDate}>
                                    {formatDate(invoice.dueDate)}
                                </span>
                            </td>
                            <td>
                                <div className={styles.actions}>
                                    <button
                                        className={styles.actionBtn}
                                        onClick={() => onView?.(invoice.id)}
                                        title="View invoice"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button
                                        className={styles.actionBtn}
                                        onClick={() => onCopyLink?.(invoice.id)}
                                        title="Copy payment link"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button className={styles.actionBtn} title="More options">
                                        <MoreHorizontal size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

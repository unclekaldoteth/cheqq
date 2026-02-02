'use client';

import { Calendar, ExternalLink } from 'lucide-react';
import InvoiceStatus, { type InvoiceStatusType } from './InvoiceStatus';
import styles from './InvoiceCard.module.css';

interface InvoiceCardProps {
    invoiceNumber: string;
    clientName: string;
    clientEmail: string;
    amount: number;
    currency: 'USDC' | 'IDRX' | 'ETH';
    status: InvoiceStatusType;
    dueDate: string;
    createdAt: string;
    onViewDetails?: () => void;
}

export default function InvoiceCard({
    invoiceNumber,
    clientName,
    clientEmail,
    amount,
    currency,
    status,
    dueDate,
    createdAt,
    onViewDetails,
}: InvoiceCardProps) {
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
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

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.invoiceInfo}>
                    <span className={styles.invoiceNumber}>#{invoiceNumber}</span>
                    <span className={styles.createdDate}>Created {formatDate(createdAt)}</span>
                </div>
                <InvoiceStatus status={status} />
            </div>

            <div className={styles.body}>
                <div className={styles.client}>
                    <span className={styles.clientName}>{clientName}</span>
                    <span className={styles.clientEmail}>{clientEmail}</span>
                </div>

                <div className={styles.amount}>
                    <span className={styles.amountValue}>{formatAmount(amount)}</span>
                    <span className={styles.currency}>{currency}</span>
                </div>
            </div>

            <div className={styles.footer}>
                <div className={styles.dueDate}>
                    <Calendar size={14} />
                    <span>Due {formatDate(dueDate)}</span>
                </div>
                {onViewDetails && (
                    <button className={styles.viewBtn} onClick={onViewDetails}>
                        View Details
                        <ExternalLink size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}

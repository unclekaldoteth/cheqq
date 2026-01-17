'use client';

import styles from './InvoiceStatus.module.css';

export type InvoiceStatusType = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';

interface InvoiceStatusProps {
    status: InvoiceStatusType;
    size?: 'sm' | 'md';
}

const statusConfig: Record<InvoiceStatusType, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'draft' },
    pending: { label: 'Pending', className: 'pending' },
    paid: { label: 'Paid', className: 'paid' },
    overdue: { label: 'Overdue', className: 'overdue' },
    cancelled: { label: 'Cancelled', className: 'cancelled' },
};

export default function InvoiceStatus({ status, size = 'md' }: InvoiceStatusProps) {
    const config = statusConfig[status];

    return (
        <span
            className={`${styles.status} ${styles[config.className]} ${styles[size]}`}
        >
            <span className={styles.dot} />
            {config.label}
        </span>
    );
}

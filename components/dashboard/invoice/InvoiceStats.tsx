'use client';

import { DollarSign, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import styles from './InvoiceStats.module.css';

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    subtext?: string;
    variant?: 'default' | 'success' | 'warning' | 'danger';
}

function StatCard({ icon, label, value, subtext, variant = 'default' }: StatCardProps) {
    return (
        <div className={`${styles.statCard} ${styles[variant]}`}>
            <div className={styles.iconWrapper}>
                {icon}
            </div>
            <div className={styles.content}>
                <span className={styles.label}>{label}</span>
                <span className={styles.value}>{value}</span>
                {subtext && <span className={styles.subtext}>{subtext}</span>}
            </div>
        </div>
    );
}

interface InvoiceStatsProps {
    totalOutstanding: number;
    paidThisMonth: number;
    pendingCount: number;
    overdueCount: number;
    currency?: string;
}

export default function InvoiceStats({
    totalOutstanding,
    paidThisMonth,
    pendingCount,
    overdueCount,
    currency = 'USDC'
}: InvoiceStatsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <div className={styles.statsGrid}>
            <StatCard
                icon={<DollarSign size={20} />}
                label="Total Outstanding"
                value={`${formatCurrency(totalOutstanding)} ${currency}`}
                variant="default"
            />
            <StatCard
                icon={<CheckCircle size={20} />}
                label="Paid This Month"
                value={`${formatCurrency(paidThisMonth)} ${currency}`}
                variant="success"
            />
            <StatCard
                icon={<Clock size={20} />}
                label="Pending Invoices"
                value={pendingCount.toString()}
                subtext="Awaiting payment"
                variant="warning"
            />
            <StatCard
                icon={<AlertTriangle size={20} />}
                label="Overdue"
                value={overdueCount.toString()}
                subtext="Need attention"
                variant="danger"
            />
        </div>
    );
}

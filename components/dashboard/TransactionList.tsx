'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, ExternalLink, Loader2 } from 'lucide-react';
import styles from './TransactionList.module.css';

interface Transaction {
    id: string;
    type: 'incoming' | 'outgoing';
    title: string;
    description: string;
    amount: number;
    currency: string;
    status: string;
    date: string;
    txHash?: string | null;
}

interface TransactionListProps {
    companyId?: string;
}

export default function TransactionList({ companyId }: TransactionListProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!companyId) {
            setTransactions([]);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        let isActive = true;

        const fetchTransactions = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ companyId });
                const res = await fetch(`/api/analytics/company?${params.toString()}`, {
                    signal: controller.signal,
                });
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();

                if (isActive) {
                    const txs: Transaction[] = (data.transactions || []).map((tx: Transaction) => ({
                        ...tx,
                        type: tx.type === 'incoming' ? 'incoming' : 'outgoing',
                    }));
                    setTransactions(txs);
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') return;
                console.error('Failed to fetch transactions');
                if (isActive) {
                    setTransactions([]);
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        fetchTransactions();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [companyId]);

    const formatAmount = (amount: number, currency: string, type: Transaction['type']) => {
        const safeAmount = Number.isFinite(amount) ? amount : 0;
        const formatted = new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(safeAmount);
        const sign = type === 'incoming' ? '+' : '-';
        return `${sign}${formatted} ${currency}`;
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return '—';
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className={styles.transactionCard}>
                <div className={styles.header}>
                    <h3>Recent Transactions</h3>
                </div>
                <div className={styles.loadingState}>
                    <Loader2 size={24} className={styles.spinner} />
                </div>
            </div>
        );
    }

    if (!companyId || transactions.length === 0) {
        return (
            <div className={styles.transactionCard}>
                <div className={styles.header}>
                    <h3>Recent Transactions</h3>
                    <a href="/dashboard/transactions" className={styles.viewAll}>
                        View all <ExternalLink size={14} />
                    </a>
                </div>
                <div className={styles.emptyState}>
                    <p>No transactions yet. Run payroll or receive invoice payments to see activity here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.transactionCard}>
            <div className={styles.header}>
                <h3>Recent Transactions</h3>
                <a href="/dashboard/transactions" className={styles.viewAll}>
                    View all <ExternalLink size={14} />
                </a>
            </div>

            <div className={styles.transactionList}>
                {transactions.map((tx) => (
                    <div key={tx.id} className={styles.transaction}>
                        <div className={`${styles.icon} ${tx.type === 'incoming' ? styles.incoming : styles.outgoing}`}>
                            {tx.type === 'incoming' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div className={styles.details}>
                            <span className={styles.title}>{tx.title}</span>
                            <span className={styles.description}>{tx.description}</span>
                        </div>
                        <div className={styles.meta}>
                            <span className={`${styles.amount} ${tx.type === 'incoming' ? styles.positive : styles.negative}`}>
                                {formatAmount(tx.amount, tx.currency, tx.type)}
                            </span>
                            <span className={styles.time}>{formatTimeAgo(tx.date)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

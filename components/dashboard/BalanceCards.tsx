'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Coins, Loader2 } from 'lucide-react';
import styles from './BalanceCards.module.css';

interface TreasuryBalance {
    currency: string;
    balance: string | number;
    yieldEarned: string | number;
}

interface TreasuryResponse {
    balances: TreasuryBalance[];
    summary: {
        totalBalance: number;
        totalYield: number;
    };
}

interface BalanceCardData {
    label: string;
    value: string;
    subValue?: string;
    change: string;
    trend: 'up' | 'down';
    icon: React.ReactNode;
    color: string;
}

// Default mock data for when no companyId or API fails
const defaultBalances: BalanceCardData[] = [
    {
        label: 'Total Balance',
        value: '$0.00',
        change: '–',
        trend: 'up',
        icon: <DollarSign size={20} />,
        color: '#0052FF',
    },
    {
        label: 'AlphaUSD',
        value: '$0.00',
        change: '–',
        trend: 'up',
        icon: <span>💵</span>,
        color: '#2775CA',
    },
    {
        label: 'BetaUSD',
        value: 'Rp 0',
        subValue: '≈ $0',
        change: '–',
        trend: 'up',
        icon: <span>🇮🇩</span>,
        color: '#DC143C',
    },
    {
        label: 'pathUSD',
        value: '$0.00',
        change: '–',
        trend: 'up',
        icon: <Coins size={20} />,
        color: '#22A06B',
    },
];

interface BalanceCardsProps {
    companyId?: string;
}

export default function BalanceCards({ companyId }: BalanceCardsProps) {
    const [balances, setBalances] = useState<BalanceCardData[]>(defaultBalances);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!companyId) {
            setBalances(defaultBalances);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        let isActive = true;

        const fetchBalances = async () => {
            setLoading(true);
            setBalances(defaultBalances);
            try {
                const params = new URLSearchParams({ companyId });
                const res = await fetch(`/api/treasury?${params.toString()}`, {
                    signal: controller.signal,
                });
                if (!res.ok) throw new Error('Failed to fetch');

                const data: TreasuryResponse = await res.json();

                const toNumber = (value: string | number | undefined) => {
                    const parsed = Number(value ?? 0);
                    return Number.isFinite(parsed) ? parsed : 0;
                };

                // Transform API data to display format
                const alphaUsdBalance = data.balances.find((b) => b.currency === 'AlphaUSD');
                const betaUsdBalance = data.balances.find((b) => b.currency === 'BetaUSD');
                const pathUsdBalance = data.balances.find((b) => b.currency === 'pathUSD');

                const formatUSD = (val: number) =>
                    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

                const formatIDR = (val: number) =>
                    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

                const totalBalance = toNumber(data.summary.totalBalance);
                const totalYield = toNumber(data.summary.totalYield);
                const alphaUsd = toNumber(alphaUsdBalance?.balance);
                const alphaUsdYield = toNumber(alphaUsdBalance?.yieldEarned);
                const betaUsd = toNumber(betaUsdBalance?.balance);
                const pathUsd = toNumber(pathUsdBalance?.balance);

                const newBalances: BalanceCardData[] = [
                    {
                        label: 'Total Balance',
                        value: formatUSD(totalBalance),
                        change: totalYield > 0 ? `+${formatUSD(totalYield)} yield` : '–',
                        trend: 'up',
                        icon: <DollarSign size={20} />,
                        color: '#0052FF',
                    },
                    {
                        label: 'AlphaUSD',
                        value: formatUSD(alphaUsd),
                        change: alphaUsdYield > 0
                            ? `+${formatUSD(alphaUsdYield)}`
                            : '–',
                        trend: 'up',
                        icon: <span>💵</span>,
                        color: '#2775CA',
                    },
                    {
                        label: 'BetaUSD',
                        value: formatIDR(betaUsd),
                        subValue: `≈ ${formatUSD(betaUsd / 15700)}`,
                        change: '–',
                        trend: 'up',
                        icon: <span>🇮🇩</span>,
                        color: '#DC143C',
                    },
                    {
                        label: 'pathUSD',
                        value: formatUSD(pathUsd),
                        change: '–',
                        trend: 'up',
                        icon: <Coins size={20} />,
                        color: '#22A06B',
                    },
                ];

                if (isActive) {
                    setBalances(newBalances);
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') return;
                console.error('Failed to fetch treasury balances');
                if (isActive) {
                    setBalances(defaultBalances);
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        fetchBalances();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [companyId]);

    if (loading) {
        return (
            <div className={styles.balanceGrid}>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`${styles.balanceCard} ${styles.loading}`}>
                        <Loader2 size={24} className={styles.spinner} />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={styles.balanceGrid}>
            {balances.map((balance, index) => (
                <div key={index} className={styles.balanceCard}>
                    <div className={styles.cardHeader}>
                        <div
                            className={styles.iconBox}
                            style={{ background: `${balance.color}15`, color: balance.color }}
                        >
                            {balance.icon}
                        </div>
                        <span className={styles.label}>{balance.label}</span>
                    </div>
                    <div className={styles.cardBody}>
                        <span className={styles.value}>{balance.value}</span>
                        {balance.subValue && (
                            <span className={styles.subValue}>{balance.subValue}</span>
                        )}
                    </div>
                    <div className={`${styles.change} ${balance.trend === 'up' ? styles.up : styles.down}`}>
                        {balance.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span>{balance.change}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

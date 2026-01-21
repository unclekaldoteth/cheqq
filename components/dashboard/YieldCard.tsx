'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, ExternalLink, Info, Loader2 } from 'lucide-react';
import styles from './YieldCard.module.css';

interface YieldPosition {
    currency: string;
    balance: number;
    yieldEarned: number;
    protocol: string;
    apy: number;
    estimatedMonthlyYield: number;
}

interface YieldResponse {
    rates: Array<{ currency: string; protocol: string; apy: number }>;
    positions: YieldPosition[];
    summary: {
        totalBalance: number;
        totalYieldEarned: number;
        totalEstimatedMonthlyYield: number;
    };
}

interface YieldCardProps {
    companyId?: string;
}

export default function YieldCard({ companyId }: YieldCardProps) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<YieldResponse | null>(null);

    useEffect(() => {
        if (!companyId) {
            setData(null);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        let isActive = true;

        const fetchYield = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ companyId });
                const res = await fetch(`/api/defi/yield?${params.toString()}`, {
                    signal: controller.signal,
                });
                if (!res.ok) throw new Error('Failed to fetch');
                const yieldData: YieldResponse = await res.json();
                if (isActive) {
                    setData(yieldData);
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') return;
                console.error('Failed to fetch yield data');
                if (isActive) {
                    setData(null);
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        fetchYield();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [companyId]);

    const formatUSD = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    const positions = data?.positions ?? [];
    const totalDeposited = positions.reduce((sum, p) => sum + Number(p.balance || 0), 0);

    // Calculate weighted average APY based on deposited balances
    const avgApy = totalDeposited > 0
        ? positions.reduce((sum, p) => sum + (p.apy * Number(p.balance || 0)), 0) / totalDeposited
        : 0;

    if (loading) {
        return (
            <div className={styles.yieldCard}>
                <div className={styles.loadingState}>
                    <Loader2 size={24} className={styles.spinner} />
                    <span>Loading yield data...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.yieldCard}>
            <div className={styles.header}>
                <div className={styles.title}>
                    <TrendingUp size={20} />
                    <h3>DeFi Yield</h3>
                </div>
                <a href="/dashboard/defi" className={styles.link}>
                    Manage <ExternalLink size={14} />
                </a>
            </div>

            <div className={styles.content}>
                <div className={styles.mainStat}>
                    <span className={styles.apyLabel}>Average APY</span>
                    <span className={styles.apyValue}>{avgApy.toFixed(2)}%</span>
                </div>

                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <span className={styles.statLabel}>Deposited</span>
                        <span className={styles.statValue}>
                            {formatUSD(data?.summary?.totalBalance || 0)}
                        </span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statLabel}>Earned (Total)</span>
                        <span className={styles.statValue}>
                            {formatUSD(data?.summary?.totalYieldEarned || 0)}
                        </span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statLabel}>Est. Monthly</span>
                        <span className={styles.statValue}>
                            {formatUSD(data?.summary?.totalEstimatedMonthlyYield || 0)}
                        </span>
                    </div>
                </div>

                <div className={styles.protocols}>
                    {positions.slice(0, 2).map((pos, index) => (
                        <div key={index} className={styles.protocol}>
                            <span className={styles.protocolIcon}>
                                {pos.protocol === 'Moonwell' ? '🌙' : pos.protocol === 'Aave' ? '👻' : '🏦'}
                            </span>
                            <div className={styles.protocolInfo}>
                                <span className={styles.protocolName}>{pos.protocol} {pos.currency}</span>
                                <span className={styles.protocolAmount}>{formatUSD(pos.balance)}</span>
                            </div>
                            <span className={styles.protocolApy}>{pos.apy}% APY</span>
                        </div>
                    ))}
                    {positions.length === 0 && (
                        <div className={styles.emptyState}>
                            No active yield positions
                        </div>
                    )}
                </div>

                <div className={styles.notice}>
                    <Info size={14} />
                    <span>Yields are estimated. Actual returns may vary.</span>
                </div>
            </div>
        </div>
    );
}

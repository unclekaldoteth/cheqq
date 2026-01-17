import { TrendingUp, TrendingDown, DollarSign, Coins } from 'lucide-react';
import styles from './BalanceCards.module.css';

const balances = [
    {
        label: 'Total Balance',
        value: '$127,450.00',
        change: '+12.5%',
        trend: 'up',
        icon: <DollarSign size={20} />,
        color: '#0052FF',
    },
    {
        label: 'USDC',
        value: '$75,000.00',
        change: '+5.2%',
        trend: 'up',
        icon: <span>💵</span>,
        color: '#2775CA',
    },
    {
        label: 'IDRX',
        value: 'Rp 825,000,000',
        subValue: '≈ $52,450',
        change: '+8.1%',
        trend: 'up',
        icon: <span>🇮🇩</span>,
        color: '#DC143C',
    },
    {
        label: 'ETH',
        value: '0.85 ETH',
        subValue: '≈ $2,975',
        change: '-2.3%',
        trend: 'down',
        icon: <Coins size={20} />,
        color: '#627EEA',
    },
];

export default function BalanceCards() {
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
                        <span className={styles.period}>vs last month</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

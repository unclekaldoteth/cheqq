import { ArrowUpRight, ArrowDownLeft, ExternalLink } from 'lucide-react';
import styles from './TransactionList.module.css';

const transactions = [
    {
        type: 'outgoing',
        title: 'Payroll - December 2024',
        description: 'Batch payment to 25 employees',
        amount: '-$45,000.00',
        status: 'completed',
        time: '2 hours ago',
        txHash: '0xabc...123',
    },
    {
        type: 'incoming',
        title: 'Invoice #INV-2024-089',
        description: 'Payment from TechCorp Ltd',
        amount: '+$12,500.00',
        status: 'completed',
        time: '5 hours ago',
        txHash: '0xdef...456',
    },
    {
        type: 'outgoing',
        title: 'DeFi Deposit',
        description: 'Deposited to Morpho USDC vault',
        amount: '-$20,000.00',
        status: 'completed',
        time: '1 day ago',
        txHash: '0xghi...789',
    },
    {
        type: 'incoming',
        title: 'Yield Earned',
        description: 'Morpho vault interest',
        amount: '+$156.32',
        status: 'completed',
        time: '1 day ago',
        txHash: '0xjkl...012',
    },
    {
        type: 'incoming',
        title: 'Loan Repayment',
        description: 'John Doe - Salary advance repaid',
        amount: '+$500.00',
        status: 'completed',
        time: '2 days ago',
        txHash: '0xmno...345',
    },
];

export default function TransactionList() {
    return (
        <div className={styles.transactionCard}>
            <div className={styles.header}>
                <h3>Recent Transactions</h3>
                <a href="/dashboard/transactions" className={styles.viewAll}>
                    View all <ExternalLink size={14} />
                </a>
            </div>

            <div className={styles.transactionList}>
                {transactions.map((tx, index) => (
                    <div key={index} className={styles.transaction}>
                        <div className={`${styles.icon} ${tx.type === 'incoming' ? styles.incoming : styles.outgoing}`}>
                            {tx.type === 'incoming' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div className={styles.details}>
                            <span className={styles.title}>{tx.title}</span>
                            <span className={styles.description}>{tx.description}</span>
                        </div>
                        <div className={styles.meta}>
                            <span className={`${styles.amount} ${tx.type === 'incoming' ? styles.positive : styles.negative}`}>
                                {tx.amount}
                            </span>
                            <span className={styles.time}>{tx.time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

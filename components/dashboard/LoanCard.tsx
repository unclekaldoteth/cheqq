import { Users, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import styles from './LoanCard.module.css';

const activeLoans = [
    {
        employee: 'John Doe',
        avatar: 'JD',
        amount: '$1,500',
        remaining: '$500',
        nextPayment: 'Dec 25, 2024',
        progress: 67,
    },
    {
        employee: 'Sarah Kim',
        avatar: 'SK',
        amount: '$2,000',
        remaining: '$1,200',
        nextPayment: 'Dec 28, 2024',
        progress: 40,
    },
];

export default function LoanCard() {
    return (
        <div className={styles.loanCard}>
            <div className={styles.header}>
                <div className={styles.title}>
                    <Users size={20} />
                    <h3>Employee Loans</h3>
                </div>
                <a href="/dashboard/defi/loans" className={styles.link}>
                    Manage <ExternalLink size={14} />
                </a>
            </div>

            <div className={styles.content}>
                <div className={styles.summary}>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryValue}>2</span>
                        <span className={styles.summaryLabel}>Active Loans</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryValue}>$3,500</span>
                        <span className={styles.summaryLabel}>Total Lent</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryValue}>$1,700</span>
                        <span className={styles.summaryLabel}>Outstanding</span>
                    </div>
                </div>

                <div className={styles.loanList}>
                    {activeLoans.map((loan, index) => (
                        <div key={index} className={styles.loanItem}>
                            <div className={styles.avatar}>{loan.avatar}</div>
                            <div className={styles.loanInfo}>
                                <span className={styles.employeeName}>{loan.employee}</span>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${loan.progress}%` }}
                                    ></div>
                                </div>
                                <div className={styles.loanMeta}>
                                    <span>{loan.remaining} remaining of {loan.amount}</span>
                                </div>
                            </div>
                            <div className={styles.nextPayment}>
                                <Clock size={12} />
                                <span>{loan.nextPayment}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.notice}>
                    <AlertCircle size={14} />
                    <span>Loans are automatically repaid via payroll deduction</span>
                </div>

                <a href="/dashboard/defi/loans/new" className={`btn btn-outline ${styles.newLoanBtn}`}>
                    + New Salary Advance
                </a>
            </div>
        </div>
    );
}

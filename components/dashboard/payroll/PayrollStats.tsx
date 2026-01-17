'use client';

import { Users, DollarSign, Clock, AlertCircle } from 'lucide-react';
import styles from './PayrollStats.module.css';

interface PayrollStatsProps {
    totalEmployees: number;
    activeEmployees: number;
    totalPayroll: number;
    currency: string;
    nextPayDate: string;
    pendingLoans: number;
}

export default function PayrollStats({
    totalEmployees,
    activeEmployees,
    totalPayroll,
    currency,
    nextPayDate,
    pendingLoans,
}: PayrollStatsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.employees}`}>
                <div className={styles.iconWrapper}>
                    <Users size={20} />
                </div>
                <div className={styles.content}>
                    <span className={styles.label}>Total Employees</span>
                    <span className={styles.value}>{totalEmployees}</span>
                    <span className={styles.subtext}>{activeEmployees} active</span>
                </div>
            </div>

            <div className={`${styles.statCard} ${styles.payroll}`}>
                <div className={styles.iconWrapper}>
                    <DollarSign size={20} />
                </div>
                <div className={styles.content}>
                    <span className={styles.label}>Monthly Payroll</span>
                    <span className={styles.value}>{formatCurrency(totalPayroll)} {currency}</span>
                    <span className={styles.subtext}>Next cycle amount</span>
                </div>
            </div>

            <div className={`${styles.statCard} ${styles.schedule}`}>
                <div className={styles.iconWrapper}>
                    <Clock size={20} />
                </div>
                <div className={styles.content}>
                    <span className={styles.label}>Next Pay Date</span>
                    <span className={styles.value}>{formatDate(nextPayDate)}</span>
                    <span className={styles.subtext}>Monthly schedule</span>
                </div>
            </div>

            <div className={`${styles.statCard} ${styles.loans}`}>
                <div className={styles.iconWrapper}>
                    <AlertCircle size={20} />
                </div>
                <div className={styles.content}>
                    <span className={styles.label}>Active Loans</span>
                    <span className={styles.value}>{pendingLoans}</span>
                    <span className={styles.subtext}>Employees with advances</span>
                </div>
            </div>
        </div>
    );
}

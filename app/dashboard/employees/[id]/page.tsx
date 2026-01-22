'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, DollarSign, CreditCard } from 'lucide-react';
import { Sidebar, TopBar } from '@/components/dashboard';
import styles from './page.module.css';

// Mock employee data
const mockEmployee = {
    id: '1',
    name: 'Sarah Chen',
    email: 'sarah.chen@acmecorp.com',
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    salary: 5000,
    currency: 'USDC',
    department: 'Engineering',
    status: 'active' as const,
    joinDate: '2023-06-15',
    hasActiveLoan: true,
    loanBalance: 1500,
    loanTerm: '3 months',
    monthlyDeduction: 500,
    activity: [
        { id: 1, type: 'salary', title: 'Salary Payment', date: '2024-01-31', amount: 4500 },
        { id: 2, type: 'loan', title: 'Loan Deduction', date: '2024-01-31', amount: -500 },
        { id: 3, type: 'salary', title: 'Salary Payment', date: '2023-12-31', amount: 4500 },
        { id: 4, type: 'loan', title: 'Loan Approved', date: '2023-12-15', amount: 1500 },
    ],
};

export default function EmployeeDetailPage() {
    const router = useRouter();

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'long',
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

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'active': return styles.statusActive;
            case 'pending': return styles.statusPending;
            case 'inactive': return styles.statusInactive;
            default: return '';
        }
    };

    return (
        <div className={styles.dashboardLayout}>
            <Sidebar />
            <div className={styles.mainContent}>
                <TopBar />
                <main className={styles.main}>
                    {/* Page Header */}
                    <div className={styles.pageHeader}>
                        <button
                            className={styles.backBtn}
                            onClick={() => router.push('/dashboard/employees')}
                        >
                            <ArrowLeft size={20} />
                            Back to Employees
                        </button>
                        <div className={styles.headerRow}>
                            <div className={styles.employeeHeader}>
                                <div className={styles.avatar}>
                                    {mockEmployee.name.charAt(0).toUpperCase()}
                                </div>
                                <div className={styles.employeeInfo}>
                                    <h1>{mockEmployee.name}</h1>
                                    <div className={styles.employeeMeta}>
                                        <span>{mockEmployee.department}</span>
                                        <span className={`${styles.status} ${getStatusClass(mockEmployee.status)}`}>
                                            {mockEmployee.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.headerActions}>
                                <button className="btn btn-outline">
                                    <Edit2 size={16} />
                                    Edit
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className={styles.content}>
                        <div className={styles.mainSection}>
                            {/* Employee Details */}
                            <div className={styles.card}>
                                <h3>Employee Information</h3>
                                <div className={styles.infoGrid}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Email</span>
                                        <span className={styles.infoValue}>{mockEmployee.email}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Department</span>
                                        <span className={styles.infoValue}>{mockEmployee.department}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Join Date</span>
                                        <span className={styles.infoValue}>{formatDate(mockEmployee.joinDate)}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Status</span>
                                        <span className={styles.infoValue} style={{ textTransform: 'capitalize' }}>
                                            {mockEmployee.status}
                                        </span>
                                    </div>
                                    <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                                        <span className={styles.infoLabel}>Wallet Address</span>
                                        <span className={`${styles.infoValue} ${styles.mono}`}>
                                            {mockEmployee.walletAddress}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Activity */}
                            <div className={styles.card}>
                                <h3>Recent Activity</h3>
                                <div className={styles.activityList}>
                                    {mockEmployee.activity.map((item) => (
                                        <div key={item.id} className={styles.activityItem}>
                                            <div className={styles.activityIcon}>
                                                {item.type === 'salary' ? (
                                                    <DollarSign size={18} />
                                                ) : (
                                                    <CreditCard size={18} />
                                                )}
                                            </div>
                                            <div className={styles.activityContent}>
                                                <div className={styles.activityTitle}>{item.title}</div>
                                                <div className={styles.activityDate}>{formatDate(item.date)}</div>
                                            </div>
                                            <div className={styles.activityAmount} style={{
                                                color: item.amount > 0 ? 'var(--accent-green)' : '#DC2626',
                                                fontWeight: 600,
                                            }}>
                                                {item.amount > 0 ? '+' : ''}{formatAmount(item.amount)} {mockEmployee.currency}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className={styles.sideSection}>
                            {/* Salary Card */}
                            <div className={`${styles.card} ${styles.salaryCard}`}>
                                <div className={styles.salaryAmount}>
                                    {formatAmount(mockEmployee.salary)}
                                </div>
                                <div className={styles.salaryCurrency}>{mockEmployee.currency}</div>
                                <div className={styles.salaryLabel}>Monthly Salary</div>
                            </div>

                            {/* Loan Card */}
                            <div className={`${styles.card} ${styles.loanCard}`}>
                                <h3>Active Loan</h3>
                                {mockEmployee.hasActiveLoan ? (
                                    <>
                                        <div className={styles.loanAmount}>
                                            {formatAmount(mockEmployee.loanBalance)} {mockEmployee.currency}
                                        </div>
                                        <div className={styles.loanInfo}>
                                            <div className={styles.loanRow}>
                                                <span>Term</span>
                                                <span>{mockEmployee.loanTerm}</span>
                                            </div>
                                            <div className={styles.loanRow}>
                                                <span>Monthly Deduction</span>
                                                <span>{formatAmount(mockEmployee.monthlyDeduction)} {mockEmployee.currency}</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className={styles.noLoan}>No active loan</p>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

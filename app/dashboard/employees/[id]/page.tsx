'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit2, DollarSign, CreditCard, Loader2 } from 'lucide-react';
import { Sidebar, TopBar } from '@/components/dashboard';
import styles from './page.module.css';

interface Loan {
    id: string;
    amount: number;
    remainingAmount: number;
    monthlyDeduction: number;
    status: string;
    approvedAt?: string | null;
    createdAt: string;
}

interface ActivityItem {
    id: string;
    type: string;
    title: string;
    date: string;
    amount: number;
    status?: string;
    txHash?: string | null;
}

interface Employee {
    id: string;
    name: string;
    email: string;
    walletAddress: string;
    salary: number;
    currency: string;
    status: string;
    createdAt: string;
    company?: {
        id: string;
        name: string;
    } | null;
    hasActiveLoan: boolean;
    loanBalance: number;
    monthlyDeduction: number;
    loans: Loan[];
    activity: ActivityItem[];
}

export default function EmployeeDetailPage() {
    const router = useRouter();
    const params = useParams();
    const employeeId = params.id as string;

    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!employeeId) {
            setError('Employee ID is missing');
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        let isActive = true;

        const fetchEmployee = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/employees?id=${employeeId}`, {
                    signal: controller.signal,
                });
                if (!res.ok) {
                    if (res.status === 404) {
                        throw new Error('Employee not found');
                    }
                    throw new Error('Failed to fetch employee');
                }
                const data = await res.json();
                if (isActive) {
                    setEmployee(data.employee);
                }
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') return;
                console.error('Failed to fetch employee:', err);
                if (isActive) {
                    setError(err instanceof Error ? err.message : 'Failed to load employee');
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        fetchEmployee();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [employeeId]);

    const formatDate = (date: string) => {
        const parsed = new Date(date);
        if (isNaN(parsed.getTime())) return '-';
        return parsed.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatAmount = (amount: number) => {
        if (!Number.isFinite(amount)) return '0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const getStatusClass = (status: string) => {
        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case 'active': return styles.statusActive;
            case 'pending': return styles.statusPending;
            case 'inactive':
            case 'terminated': return styles.statusInactive;
            default: return '';
        }
    };

    if (loading) {
        return (
            <div className={styles.dashboardLayout}>
                <Sidebar />
                <div className={styles.mainContent}>
                    <TopBar />
                    <main className={styles.main}>
                        <div className={styles.loadingState}>
                            <Loader2 size={32} className={styles.spinner} />
                            <span>Loading employee...</span>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (error || !employee) {
        return (
            <div className={styles.dashboardLayout}>
                <Sidebar />
                <div className={styles.mainContent}>
                    <TopBar />
                    <main className={styles.main}>
                        <div className={styles.pageHeader}>
                            <button
                                className={styles.backBtn}
                                onClick={() => router.push('/dashboard/employees')}
                            >
                                <ArrowLeft size={20} />
                                Back to Employees
                            </button>
                        </div>
                        <div className={styles.errorState}>
                            <h2>Error</h2>
                            <p>{error || 'Employee not found'}</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => router.push('/dashboard/employees')}
                            >
                                Go to Employees
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // Calculate loan term if active loan exists
    const activeLoan = employee.loans.find(l => l.status === 'ACTIVE');
    const loanTerm = activeLoan
        && Number.isFinite(activeLoan.remainingAmount)
        && Number.isFinite(activeLoan.monthlyDeduction)
        && activeLoan.monthlyDeduction > 0
        ? `${Math.ceil(activeLoan.remainingAmount / activeLoan.monthlyDeduction)} months remaining`
        : '—';

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
                                    {employee.name.charAt(0).toUpperCase()}
                                </div>
                                <div className={styles.employeeInfo}>
                                    <h1>{employee.name}</h1>
                                    <div className={styles.employeeMeta}>
                                        <span>{employee.company?.name || 'Unknown Company'}</span>
                                        <span className={`${styles.status} ${getStatusClass(employee.status)}`}>
                                            {employee.status.toLowerCase()}
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
                                        <span className={styles.infoValue}>{employee.email}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Company</span>
                                        <span className={styles.infoValue}>{employee.company?.name || '-'}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Join Date</span>
                                        <span className={styles.infoValue}>{formatDate(employee.createdAt)}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Status</span>
                                        <span className={styles.infoValue} style={{ textTransform: 'capitalize' }}>
                                            {employee.status.toLowerCase()}
                                        </span>
                                    </div>
                                    <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                                        <span className={styles.infoLabel}>Wallet Address</span>
                                        <span className={`${styles.infoValue} ${styles.mono}`}>
                                            {employee.walletAddress}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Activity */}
                            <div className={styles.card}>
                                <h3>Recent Activity</h3>
                                <div className={styles.activityList}>
                                    {employee.activity.length > 0 ? (
                                        employee.activity.map((item) => (
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
                                                    color: item.type === 'salary' ? 'var(--accent-green)' : '#2563EB',
                                                    fontWeight: 600,
                                                }}>
                                                    {item.type === 'salary' ? '+' : ''}{formatAmount(item.amount)} {employee.currency}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className={styles.noActivity}>No recent activity</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={styles.sideSection}>
                            {/* Salary Card */}
                            <div className={`${styles.card} ${styles.salaryCard}`}>
                                <div className={styles.salaryAmount}>
                                    {formatAmount(employee.salary)}
                                </div>
                                <div className={styles.salaryCurrency}>{employee.currency}</div>
                                <div className={styles.salaryLabel}>Monthly Salary</div>
                            </div>

                            {/* Loan Card */}
                            <div className={`${styles.card} ${styles.loanCard}`}>
                                <h3>Active Loan</h3>
                                {employee.hasActiveLoan && activeLoan ? (
                                    <>
                                        <div className={styles.loanAmount}>
                                            {formatAmount(employee.loanBalance)} {employee.currency}
                                        </div>
                                        <div className={styles.loanInfo}>
                                            <div className={styles.loanRow}>
                                                <span>Term</span>
                                                <span>{loanTerm}</span>
                                            </div>
                                            <div className={styles.loanRow}>
                                                <span>Monthly Deduction</span>
                                                <span>{formatAmount(employee.monthlyDeduction)} {employee.currency}</span>
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

'use client';

import { MoreHorizontal, Wallet, Edit2 } from 'lucide-react';
import styles from './EmployeeTable.module.css';

export interface Employee {
    id: string;
    name: string;
    email: string;
    walletAddress: string;
    salary: number;
    currency: 'AlphaUSD' | 'BetaUSD';
    department: string;
    status: 'active' | 'inactive' | 'pending';
    joinDate: string;
    hasActiveLoan?: boolean;
    loanBalance?: number;
}

interface EmployeeTableProps {
    employees: Employee[];
    onEdit?: (id: string) => void;
    onViewDetails?: (id: string) => void;
}

export default function EmployeeTable({ employees, onEdit, onViewDetails }: EmployeeTableProps) {
    const formatSalary = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount) + ` ${currency}`;
    };

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'active': return styles.statusActive;
            case 'inactive': return styles.statusInactive;
            case 'pending': return styles.statusPending;
            default: return '';
        }
    };

    if (employees.length === 0) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>👥</div>
                <h3>No employees yet</h3>
                <p>Add your first employee to get started</p>
            </div>
        );
    }

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Wallet</th>
                        <th>Department</th>
                        <th>Salary</th>
                        <th>Status</th>
                        <th>Loan</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map((employee) => (
                        <tr key={employee.id} onClick={() => onViewDetails?.(employee.id)}>
                            <td>
                                <div className={styles.employeeCell}>
                                    <div className={styles.avatar}>
                                        {employee.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className={styles.employeeInfo}>
                                        <span className={styles.employeeName}>{employee.name}</span>
                                        <span className={styles.employeeEmail}>{employee.email}</span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className={styles.walletCell}>
                                    <Wallet size={14} />
                                    <span>{truncateAddress(employee.walletAddress)}</span>
                                </div>
                            </td>
                            <td>
                                <span className={styles.department}>{employee.department}</span>
                            </td>
                            <td>
                                <span className={styles.salary}>
                                    {formatSalary(employee.salary, employee.currency)}
                                </span>
                            </td>
                            <td>
                                <span className={`${styles.status} ${getStatusClass(employee.status)}`}>
                                    {employee.status}
                                </span>
                            </td>
                            <td>
                                {employee.hasActiveLoan ? (
                                    <span className={styles.loanBadge}>
                                        {formatSalary(employee.loanBalance || 0, employee.currency)}
                                    </span>
                                ) : (
                                    <span className={styles.noLoan}>—</span>
                                )}
                            </td>
                            <td>
                                <div className={styles.actions}>
                                    <button
                                        className={styles.actionBtn}
                                        onClick={(e) => { e.stopPropagation(); onEdit?.(employee.id); }}
                                        title="Edit employee"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button className={styles.actionBtn} title="More options">
                                        <MoreHorizontal size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

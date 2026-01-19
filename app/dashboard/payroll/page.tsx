'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Play, Filter, Search } from 'lucide-react';
import { Sidebar, TopBar } from '@/components/dashboard';
import { PayrollStats, EmployeeTable, type Employee } from '@/components/dashboard/payroll';
import styles from './page.module.css';

// Mock data for demonstration
const mockEmployees: Employee[] = [
    {
        id: '1',
        name: 'Sarah Chen',
        email: 'sarah.chen@acmecorp.com',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        salary: 5000,
        currency: 'USDC',
        department: 'Engineering',
        status: 'active',
        joinDate: '2023-06-15',
        hasActiveLoan: true,
        loanBalance: 1500,
    },
    {
        id: '2',
        name: 'Michael Johnson',
        email: 'michael.j@acmecorp.com',
        walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        salary: 4500,
        currency: 'USDC',
        department: 'Design',
        status: 'active',
        joinDate: '2023-08-01',
    },
    {
        id: '3',
        name: 'Dewi Putri',
        email: 'dewi.p@acmecorp.com',
        walletAddress: '0x9876543210fedcba9876543210fedcba98765432',
        salary: 75000000,
        currency: 'IDRX',
        department: 'Marketing',
        status: 'active',
        joinDate: '2024-01-10',
        hasActiveLoan: true,
        loanBalance: 15000000,
    },
    {
        id: '4',
        name: 'James Wilson',
        email: 'james.w@acmecorp.com',
        walletAddress: '0xfedcba9876543210fedcba9876543210fedcba98',
        salary: 6000,
        currency: 'USDC',
        department: 'Engineering',
        status: 'active',
        joinDate: '2022-11-20',
    },
    {
        id: '5',
        name: 'Emily Rodriguez',
        email: 'emily.r@acmecorp.com',
        walletAddress: '0x5678901234abcdef5678901234abcdef56789012',
        salary: 4000,
        currency: 'USDC',
        department: 'Operations',
        status: 'pending',
        joinDate: '2024-01-08',
    },
];

export default function PayrollPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState<string>('all');

    // Get unique departments
    const departments = [...new Set(mockEmployees.map(e => e.department))];

    // Filter employees
    const filteredEmployees = mockEmployees.filter((employee) => {
        const matchesSearch =
            employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee.walletAddress.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
        return matchesSearch && matchesDepartment;
    });

    // Calculate stats
    const activeEmployees = mockEmployees.filter(e => e.status === 'active');
    const usdcPayroll = activeEmployees
        .filter(e => e.currency === 'USDC')
        .reduce((sum, e) => sum + e.salary, 0);
    const employeesWithLoans = mockEmployees.filter(e => e.hasActiveLoan).length;

    // Next pay date (mock: last day of current month)
    const now = new Date();
    const nextPayDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const handleViewEmployee = (id: string) => {
        router.push(`/dashboard/employees/${id}`);
    };

    const handleEditEmployee = (id: string) => {
        router.push(`/dashboard/employees/${id}/edit`);
    };

    return (
        <div className={styles.dashboardLayout}>
            <Sidebar />
            <div className={styles.mainContent}>
                <TopBar />
                <main className={styles.main}>
                    {/* Page Header */}
                    <div className={styles.pageHeader}>
                        <div>
                            <h1>Payroll</h1>
                            <p>Manage employees and run payroll disbursements</p>
                        </div>
                        <div className={styles.headerActions}>
                            <Link href="/dashboard/employees/new" className="btn btn-outline">
                                <Plus size={18} />
                                Add Employee
                            </Link>
                            <Link href="/dashboard/payroll/run" className="btn btn-primary">
                                <Play size={18} />
                                Run Payroll
                            </Link>
                        </div>
                    </div>

                    {/* Stats */}
                    <PayrollStats
                        totalEmployees={mockEmployees.length}
                        activeEmployees={activeEmployees.length}
                        totalPayroll={usdcPayroll}
                        currency="USDC"
                        nextPayDate={nextPayDate}
                        pendingLoans={employeesWithLoans}
                    />

                    {/* Filters */}
                    <div className={styles.filters}>
                        <div className={styles.searchBox}>
                            <Search size={18} className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                        <div className={styles.filterGroup}>
                            <Filter size={18} />
                            <select
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                                className={styles.filterSelect}
                            >
                                <option value="all">All Departments</option>
                                {departments.map((dept) => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Employee Table */}
                    <EmployeeTable
                        employees={filteredEmployees}
                        onEdit={handleEditEmployee}
                        onViewDetails={handleViewEmployee}
                    />
                </main>
            </div>
        </div>
    );
}

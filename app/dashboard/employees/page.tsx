'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Filter, Search, Users, UserCheck, Clock, CreditCard } from 'lucide-react';
import { Sidebar, TopBar } from '@/components/dashboard';
import { EmployeeTable, type Employee } from '@/components/dashboard/payroll';
import styles from './page.module.css';

// Mock employee data
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
    {
        id: '6',
        name: 'Ahmad Rizki',
        email: 'ahmad.r@acmecorp.com',
        walletAddress: '0x1111222233334444555566667777888899990000',
        salary: 50000000,
        currency: 'IDRX',
        department: 'Finance',
        status: 'inactive',
        joinDate: '2023-03-15',
    },
];

export default function EmployeesPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Get unique departments
    const departments = [...new Set(mockEmployees.map(e => e.department))];

    // Filter employees
    const filteredEmployees = mockEmployees.filter((employee) => {
        const matchesSearch =
            employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee.walletAddress.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
        const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
        return matchesSearch && matchesDepartment && matchesStatus;
    });

    // Calculate stats
    const totalEmployees = mockEmployees.length;
    const activeEmployees = mockEmployees.filter(e => e.status === 'active').length;
    const pendingEmployees = mockEmployees.filter(e => e.status === 'pending').length;
    const employeesWithLoans = mockEmployees.filter(e => e.hasActiveLoan).length;

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
                            <h1>Employees</h1>
                            <p>Manage your team members and their payroll settings</p>
                        </div>
                        <Link href="/dashboard/employees/new" className="btn btn-primary">
                            <Plus size={18} />
                            Add Employee
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className={styles.statsGrid}>
                        <div className={`${styles.statCard} ${styles.blue}`}>
                            <div className={styles.iconWrapper}>
                                <Users size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Total Employees</span>
                                <span className={styles.statValue}>{totalEmployees}</span>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.green}`}>
                            <div className={styles.iconWrapper}>
                                <UserCheck size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Active</span>
                                <span className={styles.statValue}>{activeEmployees}</span>
                                <span className={styles.statSubtext}>On payroll</span>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.orange}`}>
                            <div className={styles.iconWrapper}>
                                <Clock size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Pending</span>
                                <span className={styles.statValue}>{pendingEmployees}</span>
                                <span className={styles.statSubtext}>Awaiting setup</span>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.red}`}>
                            <div className={styles.iconWrapper}>
                                <CreditCard size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Active Loans</span>
                                <span className={styles.statValue}>{employeesWithLoans}</span>
                                <span className={styles.statSubtext}>With advances</span>
                            </div>
                        </div>
                    </div>

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
                        <div className={styles.filterGroup}>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className={styles.filterSelect}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="inactive">Inactive</option>
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

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Play, Filter, Search, Loader2, UserPlus } from 'lucide-react';
import { Sidebar, TopBar } from '@/components/dashboard';
import { PayrollStats, EmployeeTable, type Employee } from '@/components/dashboard/payroll';
import styles from './page.module.css';

const normalizeEmployeeCurrency = (value?: string): Employee['currency'] => {
    if (value === 'IDRX') return 'IDRX';
    return 'USDC';
};

const normalizeEmployeeStatus = (value?: string): Employee['status'] => {
    const normalized = value?.toLowerCase();
    if (normalized === 'active' || normalized === 'inactive' || normalized === 'pending') {
        return normalized;
    }
    if (normalized === 'terminated') {
        return 'inactive';
    }
    return 'active';
};

export default function PayrollPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState<string>('all');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch employees from API
    useEffect(() => {
        const companyId = localStorage.getItem('companyId');
        if (!companyId) {
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        let isActive = true;

        const fetchEmployees = async () => {
            try {
                const res = await fetch(`/api/employees?companyId=${encodeURIComponent(companyId)}&status=ACTIVE`, {
                    signal: controller.signal,
                });
                if (res.ok) {
                    const data = await res.json();
                    if (isActive) {
                        const mapped: Employee[] = (data.employees || []).map((e: {
                            id: string;
                            name: string;
                            email: string;
                            walletAddress: string;
                            salary?: string | number;
                            grossAmount?: string | number;
                            netAmount?: string | number;
                            currency?: string;
                            department?: string;
                            status?: string;
                            createdAt?: string;
                            hasActiveLoan?: boolean;
                            loanBalance?: number;
                            loanDeduction?: number;
                        }) => ({
                            id: e.id,
                            name: e.name,
                            email: e.email,
                            walletAddress: e.walletAddress,
                            salary: Number(e.salary ?? e.grossAmount ?? e.netAmount ?? 0),
                            currency: normalizeEmployeeCurrency(e.currency),
                            department: e.department || 'General',
                            status: normalizeEmployeeStatus(e.status),
                            joinDate: e.createdAt || new Date().toISOString(),
                            hasActiveLoan: e.hasActiveLoan ?? Number(e.loanBalance ?? e.loanDeduction ?? 0) > 0,
                            loanBalance: e.loanBalance ?? e.loanDeduction ?? 0,
                        }));
                        setEmployees(mapped);
                    }
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') return;
                console.error('Failed to fetch employees');
            } finally {
                if (isActive) setLoading(false);
            }
        };

        fetchEmployees();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, []);

    // Get unique departments
    const departments = [...new Set(employees.map(e => e.department))];

    // Filter employees
    const filteredEmployees = employees.filter((employee) => {
        const matchesSearch =
            employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee.walletAddress.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
        return matchesSearch && matchesDepartment;
    });

    // Calculate stats
    const activeEmployees = employees.filter(e => e.status === 'active');
    const usdcPayroll = activeEmployees
        .filter(e => e.currency === 'USDC')
        .reduce((sum, e) => sum + e.salary, 0);
    const employeesWithLoans = employees.filter(e => e.hasActiveLoan).length;

    // Next pay date (last day of current month)
    const now = new Date();
    const nextPayDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const handleViewEmployee = (id: string) => {
        router.push(`/dashboard/employees/${id}`);
    };

    const handleEditEmployee = (id: string) => {
        router.push(`/dashboard/employees/${id}/edit`);
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
                            <span>Loading payroll data...</span>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

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
                        totalEmployees={employees.length}
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

                    {/* Employee Table or Empty State */}
                    {employees.length > 0 ? (
                        <EmployeeTable
                            employees={filteredEmployees}
                            onEdit={handleEditEmployee}
                            onViewDetails={handleViewEmployee}
                        />
                    ) : (
                        <div className={styles.emptyState}>
                            <UserPlus size={48} strokeWidth={1.5} />
                            <h3>No employees yet</h3>
                            <p>Add employees to start managing payroll</p>
                            <Link href="/dashboard/employees/new" className="btn btn-primary">
                                <Plus size={18} />
                                Add Employee
                            </Link>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

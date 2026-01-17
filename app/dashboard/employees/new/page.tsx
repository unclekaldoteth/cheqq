'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Sidebar, TopBar } from '@/components/dashboard';
import styles from './page.module.css';

interface EmployeeFormData {
    name: string;
    email: string;
    walletAddress: string;
    salary: string;
    currency: 'USDC' | 'IDRX';
    department: string;
}

export default function NewEmployeePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<EmployeeFormData>({
        name: '',
        email: '',
        walletAddress: '',
        salary: '',
        currency: 'USDC',
        department: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Redirect back to employees list
        router.push('/dashboard/employees');
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
                        <h1>Add Employee</h1>
                        <p>Add a new team member to your payroll</p>
                    </div>

                    {/* Form */}
                    <div className={styles.formContainer}>
                        <form className={styles.form} onSubmit={handleSubmit}>
                            {/* Personal Information */}
                            <div className={styles.formSection}>
                                <h3>Personal Information</h3>
                                <div className={styles.formGrid}>
                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label htmlFor="name">Full Name</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label htmlFor="email">Email Address</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="john@company.com"
                                            required
                                        />
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label htmlFor="department">Department</label>
                                        <select
                                            id="department"
                                            name="department"
                                            value={formData.department}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Select department</option>
                                            <option value="Engineering">Engineering</option>
                                            <option value="Design">Design</option>
                                            <option value="Marketing">Marketing</option>
                                            <option value="Operations">Operations</option>
                                            <option value="Finance">Finance</option>
                                            <option value="HR">HR</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Wallet Information */}
                            <div className={styles.formSection}>
                                <h3>Wallet Information</h3>
                                <div className={styles.formGrid}>
                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label htmlFor="walletAddress">Wallet Address</label>
                                        <input
                                            type="text"
                                            id="walletAddress"
                                            name="walletAddress"
                                            value={formData.walletAddress}
                                            onChange={handleChange}
                                            placeholder="0x..."
                                            required
                                        />
                                        <span className={styles.hint}>
                                            The Ethereum address where salary will be deposited
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Salary Information */}
                            <div className={styles.formSection}>
                                <h3>Salary Information</h3>
                                <div className={styles.formGrid}>
                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label htmlFor="salary">Monthly Salary</label>
                                        <div className={styles.salaryGroup}>
                                            <input
                                                type="number"
                                                id="salary"
                                                name="salary"
                                                value={formData.salary}
                                                onChange={handleChange}
                                                placeholder="5000"
                                                min="0"
                                                step="0.01"
                                                className={styles.salaryInput}
                                                required
                                            />
                                            <select
                                                name="currency"
                                                value={formData.currency}
                                                onChange={handleChange}
                                                className={styles.currencySelect}
                                            >
                                                <option value="USDC">USDC</option>
                                                <option value="IDRX">IDRX</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className={styles.formActions}>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => router.push('/dashboard/employees')}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Adding...' : 'Add Employee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}

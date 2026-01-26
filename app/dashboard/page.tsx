'use client';

import { useState, useEffect } from 'react';
import {
    Sidebar,
    TopBar,
    BalanceCards,
    TransactionList,
    YieldCard,
    LoanCard
} from '@/components/dashboard';
import Link from 'next/link';
import styles from './page.module.css';

export default function DashboardPage() {
    const [companyId] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('companyId');
    });
    const [companyName, setCompanyName] = useState<string>('');

    useEffect(() => {
        if (!companyId) return;

        const controller = new AbortController();
        let isActive = true;

        // Fetch company name
        const fetchCompany = async () => {
            try {
                const res = await fetch(`/api/analytics/company?companyId=${companyId}`, {
                    signal: controller.signal,
                });
                if (res.ok) {
                    const data = await res.json();
                    if (isActive) {
                        setCompanyName(data.company?.name || '');
                    }
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') return;
                // Ignore errors
            }
        };

        fetchCompany();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [companyId]);

    const displayName = companyName || 'Your Company';

    return (
        <div className={styles.dashboardLayout}>
            <Sidebar />
            <div className={styles.mainContent}>
                <TopBar />
                <main className={styles.main}>
                    {/* Welcome Section */}
                    <div className={styles.welcome}>
                        <div>
                            <h1>Welcome back, {displayName}! 👋</h1>
                            <p>Here&apos;s what&apos;s happening with your business finances today.</p>
                        </div>
                        <div className={styles.quickActions}>
                            <Link href="/dashboard/invoices/new" className="btn btn-primary">
                                + New Invoice
                            </Link>
                            <Link href="/dashboard/payroll/run" className="btn btn-secondary">
                                Run Payroll
                            </Link>
                        </div>
                    </div>

                    {/* Balance Cards */}
                    <section className={styles.section}>
                        <BalanceCards companyId={companyId || undefined} />
                    </section>

                    {/* Main Grid */}
                    <div className={styles.grid}>
                        {/* Transactions */}
                        <div className={styles.gridMain}>
                            <TransactionList companyId={companyId || undefined} />
                        </div>

                        {/* Sidebar Widgets */}
                        <div className={styles.gridSidebar}>
                            <YieldCard companyId={companyId || undefined} />
                            <LoanCard companyId={companyId || undefined} />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

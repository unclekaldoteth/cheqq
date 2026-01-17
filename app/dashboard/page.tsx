import {
    Sidebar,
    TopBar,
    BalanceCards,
    TransactionList,
    YieldCard,
    LoanCard
} from '@/components/dashboard';
import styles from './page.module.css';

export const metadata = {
    title: 'Dashboard | Cheqq',
    description: 'Manage your invoices, payroll, and DeFi earnings in one place.',
};

export default function DashboardPage() {
    return (
        <div className={styles.dashboardLayout}>
            <Sidebar />
            <div className={styles.mainContent}>
                <TopBar />
                <main className={styles.main}>
                    {/* Welcome Section */}
                    <div className={styles.welcome}>
                        <div>
                            <h1>Welcome back, Acme Corp! 👋</h1>
                            <p>Here&apos;s what&apos;s happening with your business finances today.</p>
                        </div>
                        <div className={styles.quickActions}>
                            <a href="/dashboard/invoices/new" className="btn btn-primary">
                                + New Invoice
                            </a>
                            <a href="/dashboard/payroll/run" className="btn btn-secondary">
                                Run Payroll
                            </a>
                        </div>
                    </div>

                    {/* Balance Cards */}
                    <section className={styles.section}>
                        <BalanceCards />
                    </section>

                    {/* Main Grid */}
                    <div className={styles.grid}>
                        {/* Transactions */}
                        <div className={styles.gridMain}>
                            <TransactionList />
                        </div>

                        {/* Sidebar Widgets */}
                        <div className={styles.gridSidebar}>
                            <YieldCard />
                            <LoanCard />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

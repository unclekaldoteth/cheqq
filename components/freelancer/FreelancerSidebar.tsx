'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { LayoutDashboard, FileText, ArrowDownLeft, ArrowUpRight, Settings, ChevronLeft } from 'lucide-react';
import styles from './FreelancerSidebar.module.css';

const menuItems = [
    { href: '/freelancer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/freelancer/invoices', label: 'Invoices', icon: FileText },
    { href: '/freelancer/payments', label: 'Payments', icon: ArrowDownLeft },
    { href: '/freelancer/withdraw', label: 'Withdraw', icon: ArrowUpRight },
    { href: '/freelancer/settings', label: 'Settings', icon: Settings },
];

export default function FreelancerSidebar() {
    const pathname = usePathname();

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <Image src="/logo.png" alt="Cheqq" width={32} height={32} className={styles.logoImage} />
                <span className={styles.logoText}>Cheqq</span>
                <span className={styles.badge}>Freelancer</span>
            </div>

            <nav className={styles.nav}>
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className={styles.footer}>
                <Link href="/dashboard" className={styles.switchLink}>
                    <ChevronLeft size={16} />
                    <span>Switch to Business</span>
                </Link>
            </div>
        </aside>
    );
}

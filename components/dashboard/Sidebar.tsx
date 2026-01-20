'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    LayoutDashboard,
    FileText,
    Wallet,
    Users,
    TrendingUp,
    Settings,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import styles from './Sidebar.module.css';

const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Overview', href: '/dashboard', active: true },
    { icon: <FileText size={20} />, label: 'Invoices', href: '/dashboard/invoices' },
    { icon: <Wallet size={20} />, label: 'Payroll', href: '/dashboard/payroll' },
    { icon: <Users size={20} />, label: 'Employees', href: '/dashboard/employees' },
    { icon: <TrendingUp size={20} />, label: 'DeFi', href: '/dashboard/defi' },
    { icon: <Settings size={20} />, label: 'Settings', href: '/dashboard/settings' },
];

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
            <div className={styles.sidebarHeader}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>◆</span>
                    {!collapsed && <span>Cheqq</span>}
                </Link>
            </div>

            <nav className={styles.nav}>
                {menuItems.map((item, index) => (
                    <Link
                        key={index}
                        href={item.href}
                        className={`${styles.navItem} ${item.active ? styles.active : ''}`}
                        title={item.label}
                    >
                        {item.icon}
                        {!collapsed && <span>{item.label}</span>}
                    </Link>
                ))}
            </nav>

            <button
                className={styles.collapseBtn}
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            <div className={styles.sidebarFooter}>
                <div className={styles.networkBadge}>
                    <span className={styles.networkDot}></span>
                    {!collapsed && <span>Base Mainnet</span>}
                </div>
            </div>
        </aside>
    );
}

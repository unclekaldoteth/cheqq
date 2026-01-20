'use client';

import { Bell, Search } from 'lucide-react';
import styles from './TopBar.module.css';
import { WalletConnect } from '@/components/wallet/WalletConnect';

export default function TopBar() {
    return (
        <header className={styles.topBar}>
            <div className={styles.searchContainer}>
                <Search size={18} className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="Search invoices, employees, transactions..."
                    className={styles.searchInput}
                />
            </div>

            <div className={styles.actions}>
                <button className={styles.notificationBtn}>
                    <Bell size={20} />
                    <span className={styles.notificationDot}></span>
                </button>

                <WalletConnect />

                <div className={styles.userProfile}>
                    <div className={styles.avatar}>A</div>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>Acme Corp</span>
                        <span className={styles.userRole}>Admin</span>
                    </div>
                </div>
            </div>
        </header>
    );
}


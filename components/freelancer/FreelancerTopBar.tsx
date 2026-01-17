'use client';

import { Bell, Search } from 'lucide-react';
import styles from './FreelancerTopBar.module.css';

export default function FreelancerTopBar() {
    return (
        <header className={styles.topBar}>
            <div className={styles.searchBox}>
                <Search size={18} className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="Search invoices, payments..."
                    className={styles.searchInput}
                />
            </div>

            <div className={styles.actions}>
                <button className={styles.iconBtn}>
                    <Bell size={20} />
                    <span className={styles.notificationDot}></span>
                </button>

                <div className={styles.walletInfo}>
                    <span className={styles.walletDot}></span>
                    <span className={styles.walletAddress}>0x1234...5678</span>
                </div>

                <div className={styles.userProfile}>
                    <div className={styles.avatar}>JD</div>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>John Doe</span>
                        <span className={styles.userRole}>Freelancer</span>
                    </div>
                </div>
            </div>
        </header>
    );
}

import { Bell, Search, ChevronDown } from 'lucide-react';
import styles from './TopBar.module.css';

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

                <div className={styles.walletInfo}>
                    <div className={styles.walletAddress}>
                        <span className={styles.walletIcon}>🔵</span>
                        <span>0x1234...5678</span>
                    </div>
                    <ChevronDown size={16} />
                </div>

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

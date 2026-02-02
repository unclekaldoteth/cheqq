'use client';

import { Bell, Search } from 'lucide-react';
import styles from './FreelancerTopBar.module.css';
import { WalletConnect } from '@/components/wallet/WalletConnect';
import { useUser, getInitials } from '@/contexts/UserContext';

export default function FreelancerTopBar() {
    const { user, userType, loading } = useUser();
    const isFreelancer = userType === 'freelancer';

    // Default values while loading or if no user
    const displayName = isFreelancer && user?.name ? user.name : 'Freelancer';
    const initials = isFreelancer && user?.name ? getInitials(user.name) : 'F';

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

                <WalletConnect />

                <div className={styles.userProfile}>
                    <div className={styles.avatar}>
                        {loading ? '...' : initials}
                    </div>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>
                            {loading ? 'Loading...' : displayName}
                        </span>
                        <span className={styles.userRole}>Freelancer</span>
                    </div>
                </div>
            </div>
        </header>
    );
}

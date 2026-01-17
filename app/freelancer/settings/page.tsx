'use client';

import { useState } from 'react';
import { User, Wallet, Bell } from 'lucide-react';
import { FreelancerSidebar, FreelancerTopBar } from '@/components/freelancer';
import styles from './page.module.css';

type SettingsTab = 'profile' | 'wallet' | 'notifications';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [name, setName] = useState('John Doe');
    const [email, setEmail] = useState('john.doe@email.com');
    const [profession, setProfession] = useState('Software Developer');
    const [currency, setCurrency] = useState('USDC');
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [paymentAlerts, setPaymentAlerts] = useState(true);

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'wallet', label: 'Wallet', icon: Wallet },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ] as const;

    return (
        <div className={styles.dashboardLayout}>
            <FreelancerSidebar />
            <div className={styles.mainContent}>
                <FreelancerTopBar />
                <main className={styles.main}>
                    {/* Page Header */}
                    <div className={styles.pageHeader}>
                        <div>
                            <h1>Settings</h1>
                            <p>Manage your profile and preferences</p>
                        </div>
                    </div>

                    {/* Settings Layout */}
                    <div className={styles.settingsLayout}>
                        {/* Navigation */}
                        <nav className={styles.settingsNav}>
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>

                        {/* Content */}
                        <div className={styles.settingsContent}>
                            {activeTab === 'profile' && (
                                <>
                                    <div className={styles.contentHeader}>
                                        <h2>Profile Information</h2>
                                        <p>Update your personal details</p>
                                    </div>
                                    <div className={styles.form}>
                                        <div className={styles.formSection}>
                                            <div className={styles.formGrid}>
                                                <div className={styles.formGroup}>
                                                    <label>Full Name</label>
                                                    <input
                                                        type="text"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                    />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label>Email</label>
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                    />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label>Profession</label>
                                                    <input
                                                        type="text"
                                                        value={profession}
                                                        onChange={(e) => setProfession(e.target.value)}
                                                    />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label>Preferred Currency</label>
                                                    <select
                                                        value={currency}
                                                        onChange={(e) => setCurrency(e.target.value)}
                                                    >
                                                        <option value="USDC">USDC</option>
                                                        <option value="IDRX">IDRX</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.formActions}>
                                            <button className="btn btn-outline">Cancel</button>
                                            <button
                                                className="btn btn-primary"
                                                style={{ background: '#00D395' }}
                                                onClick={handleSave}
                                                disabled={isSaving}
                                            >
                                                {isSaving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'wallet' && (
                                <>
                                    <div className={styles.contentHeader}>
                                        <h2>Wallet Settings</h2>
                                        <p>Manage your connected wallet</p>
                                    </div>
                                    <div className={styles.form}>
                                        <div className={styles.formSection}>
                                            <div className={styles.formGrid}>
                                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                                    <label>Connected Wallet</label>
                                                    <input
                                                        type="text"
                                                        value="0x1234567890abcdef1234567890abcdef12345678"
                                                        readOnly
                                                        style={{ fontFamily: 'monospace' }}
                                                    />
                                                    <span className={styles.hint}>
                                                        This is your main wallet for receiving payments
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.formActions}>
                                            <button className="btn btn-outline">
                                                Change Wallet
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'notifications' && (
                                <>
                                    <div className={styles.contentHeader}>
                                        <h2>Notification Preferences</h2>
                                        <p>Choose how you want to be notified</p>
                                    </div>
                                    <div className={styles.form}>
                                        <div className={styles.formSection}>
                                            <div className={styles.formGrid}>
                                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-md) 0' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 500 }}>Email Notifications</div>
                                                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Receive updates via email</div>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={emailNotifications}
                                                            onChange={(e) => setEmailNotifications(e.target.checked)}
                                                            style={{ width: 20, height: 20 }}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-md) 0' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 500 }}>Payment Alerts</div>
                                                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Get notified when you receive payments</div>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={paymentAlerts}
                                                            onChange={(e) => setPaymentAlerts(e.target.checked)}
                                                            style={{ width: 20, height: 20 }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.formActions}>
                                            <button
                                                className="btn btn-primary"
                                                style={{ background: '#00D395' }}
                                                onClick={handleSave}
                                                disabled={isSaving}
                                            >
                                                {isSaving ? 'Saving...' : 'Save Preferences'}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { Building, Wallet, Calendar, Bell, Shield, CreditCard } from 'lucide-react';
import { Sidebar, TopBar } from '@/components/dashboard';
import styles from './page.module.css';

type SettingsTab = 'company' | 'wallet' | 'payroll' | 'notifications';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('company');
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [companyName, setCompanyName] = useState('Acme Corp');
    const [companyEmail, setCompanyEmail] = useState('admin@acmecorp.com');
    const [walletAddress, setWalletAddress] = useState('0x1234...abcd');
    const [payrollDay, setPayrollDay] = useState('last');
    const [autoPayroll, setAutoPayroll] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [paymentAlerts, setPaymentAlerts] = useState(true);

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
    };

    const tabs = [
        { id: 'company', label: 'Company', icon: Building },
        { id: 'wallet', label: 'Wallet', icon: Wallet },
        { id: 'payroll', label: 'Payroll', icon: Calendar },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ] as const;

    return (
        <div className={styles.dashboardLayout}>
            <Sidebar />
            <div className={styles.mainContent}>
                <TopBar />
                <main className={styles.main}>
                    {/* Page Header */}
                    <div className={styles.pageHeader}>
                        <h1>Settings</h1>
                        <p>Manage your company and payroll preferences</p>
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
                            {activeTab === 'company' && (
                                <>
                                    <div className={styles.contentHeader}>
                                        <h2>Company Information</h2>
                                        <p>Update your company profile and details</p>
                                    </div>
                                    <div className={styles.form}>
                                        <div className={styles.formSection}>
                                            <h3>Basic Information</h3>
                                            <div className={styles.formGrid}>
                                                <div className={styles.formGroup}>
                                                    <label>Company Name</label>
                                                    <input
                                                        type="text"
                                                        value={companyName}
                                                        onChange={(e) => setCompanyName(e.target.value)}
                                                    />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label>Admin Email</label>
                                                    <input
                                                        type="email"
                                                        value={companyEmail}
                                                        onChange={(e) => setCompanyEmail(e.target.value)}
                                                    />
                                                </div>
                                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                                    <label>Business Description</label>
                                                    <textarea
                                                        placeholder="Brief description of your business..."
                                                        defaultValue="Technology company focused on blockchain solutions."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.formActions}>
                                            <button className="btn btn-outline">Cancel</button>
                                            <button
                                                className="btn btn-primary"
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
                                        <h2>Wallet Configuration</h2>
                                        <p>Manage your treasury wallet and signing settings</p>
                                    </div>
                                    <div className={styles.form}>
                                        <div className={styles.formSection}>
                                            <h3>Treasury Wallet</h3>
                                            <div className={styles.formGrid}>
                                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                                    <label>Connected Wallet</label>
                                                    <input
                                                        type="text"
                                                        value={walletAddress}
                                                        readOnly
                                                        style={{ fontFamily: 'monospace' }}
                                                    />
                                                    <span className={styles.hint}>
                                                        This is your primary treasury wallet for payroll and invoices
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.formSection}>
                                            <h3>Multi-sig Settings</h3>
                                            <div className={styles.toggleRow}>
                                                <div className={styles.toggleInfo}>
                                                    <span className={styles.toggleLabel}>Require Multi-sig</span>
                                                    <span className={styles.toggleDesc}>
                                                        Require multiple signers for large transactions
                                                    </span>
                                                </div>
                                                <div className={styles.toggle}></div>
                                            </div>
                                        </div>
                                        <div className={styles.formActions}>
                                            <button className="btn btn-outline">Cancel</button>
                                            <button className="btn btn-primary" onClick={handleSave}>
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'payroll' && (
                                <>
                                    <div className={styles.contentHeader}>
                                        <h2>Payroll Settings</h2>
                                        <p>Configure your payroll schedule and automation</p>
                                    </div>
                                    <div className={styles.form}>
                                        <div className={styles.formSection}>
                                            <h3>Schedule</h3>
                                            <div className={styles.formGrid}>
                                                <div className={styles.formGroup}>
                                                    <label>Pay Day</label>
                                                    <select
                                                        value={payrollDay}
                                                        onChange={(e) => setPayrollDay(e.target.value)}
                                                    >
                                                        <option value="last">Last day of month</option>
                                                        <option value="1">1st of month</option>
                                                        <option value="15">15th of month</option>
                                                        <option value="25">25th of month</option>
                                                    </select>
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label>Default Currency</label>
                                                    <select defaultValue="USDC">
                                                        <option value="USDC">USDC</option>
                                                        <option value="IDRX">IDRX</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.formSection}>
                                            <h3>Automation</h3>
                                            <div className={styles.toggleRow}>
                                                <div className={styles.toggleInfo}>
                                                    <span className={styles.toggleLabel}>Auto-run Payroll</span>
                                                    <span className={styles.toggleDesc}>
                                                        Automatically execute payroll on pay day
                                                    </span>
                                                </div>
                                                <div
                                                    className={`${styles.toggle} ${autoPayroll ? styles.active : ''}`}
                                                    onClick={() => setAutoPayroll(!autoPayroll)}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className={styles.formActions}>
                                            <button className="btn btn-outline">Cancel</button>
                                            <button className="btn btn-primary" onClick={handleSave}>
                                                Save Changes
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
                                            <h3>Email Notifications</h3>
                                            <div className={styles.toggleRow}>
                                                <div className={styles.toggleInfo}>
                                                    <span className={styles.toggleLabel}>Email Notifications</span>
                                                    <span className={styles.toggleDesc}>
                                                        Receive email updates about your account
                                                    </span>
                                                </div>
                                                <div
                                                    className={`${styles.toggle} ${emailNotifications ? styles.active : ''}`}
                                                    onClick={() => setEmailNotifications(!emailNotifications)}
                                                ></div>
                                            </div>
                                            <div className={styles.toggleRow}>
                                                <div className={styles.toggleInfo}>
                                                    <span className={styles.toggleLabel}>Payment Alerts</span>
                                                    <span className={styles.toggleDesc}>
                                                        Get notified when payments are received or sent
                                                    </span>
                                                </div>
                                                <div
                                                    className={`${styles.toggle} ${paymentAlerts ? styles.active : ''}`}
                                                    onClick={() => setPaymentAlerts(!paymentAlerts)}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className={styles.formActions}>
                                            <button className="btn btn-outline">Cancel</button>
                                            <button className="btn btn-primary" onClick={handleSave}>
                                                Save Changes
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

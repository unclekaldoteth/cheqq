'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { FreelancerSidebar, FreelancerTopBar } from '@/components/freelancer';
import styles from './page.module.css';

export default function WithdrawPage() {
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('bank');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const availableBalance = 7500; // Mock balance
    const fee = 2.50; // Mock fee

    const formatAmount = (amt: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amt);
    };

    const handleMaxClick = () => {
        setAmount(availableBalance.toString());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        setIsLoading(false);
        setShowSuccess(true);
    };

    const numericAmount = parseFloat(amount) || 0;
    const youReceive = Math.max(0, numericAmount - fee);

    if (showSuccess) {
        return (
            <div className={styles.dashboardLayout}>
                <FreelancerSidebar />
                <div className={styles.mainContent}>
                    <FreelancerTopBar />
                    <main className={styles.main}>
                        <div className={styles.successCard}>
                            <div className={styles.successIcon}>
                                <Check size={32} />
                            </div>
                            <h2>Withdrawal Initiated!</h2>
                            <p>Your funds are on the way</p>

                            <div className={styles.successDetails}>
                                <div className={styles.detailRow}>
                                    <span>Amount</span>
                                    <span>${formatAmount(numericAmount)} USDC</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Method</span>
                                    <span>{method === 'bank' ? 'Bank Transfer' : 'Local Payout'}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>You Receive</span>
                                    <span>${formatAmount(youReceive)}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Estimated Time</span>
                                    <span>1-2 business days</span>
                                </div>
                            </div>

                            <button
                                className="btn btn-primary"
                                style={{ background: '#00D395', width: '100%' }}
                                onClick={() => router.push('/freelancer/dashboard')}
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dashboardLayout}>
            <FreelancerSidebar />
            <div className={styles.mainContent}>
                <FreelancerTopBar />
                <main className={styles.main}>
                    {/* Page Header */}
                    <div className={styles.pageHeader}>
                        <div>
                            <h1>Withdraw</h1>
                            <p>Convert your stablecoins to fiat</p>
                        </div>
                    </div>

                    {/* Balance Card */}
                    <div className={styles.balanceCard}>
                        <div className={styles.balanceLabel}>Available Balance</div>
                        <div className={styles.balanceAmount}>${formatAmount(availableBalance)}</div>
                        <div className={styles.balanceCurrency}>USDC</div>
                    </div>

                    {/* Withdraw Form */}
                    <div className={styles.withdrawCard}>
                        <h3>Withdrawal Details</h3>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label>Amount</label>
                                <div className={styles.amountInputWrapper}>
                                    <span className={styles.currencySymbol}>$</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        max={availableBalance}
                                        min="10"
                                        step="0.01"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className={styles.maxBtn}
                                        onClick={handleMaxClick}
                                    >
                                        MAX
                                    </button>
                                </div>
                                <span className={styles.hint}>Minimum withdrawal: $10.00</span>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Withdrawal Method</label>
                                <select
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value)}
                                >
                                    <option value="bank">Bank Transfer</option>
                                    <option value="local">Local Payout (GoPay, OVO, etc.)</option>
                                </select>
                            </div>

                            {numericAmount > 0 && (
                                <div className={styles.summary}>
                                    <div className={styles.summaryRow}>
                                        <span>Withdrawal Amount</span>
                                        <span>${formatAmount(numericAmount)} USDC</span>
                                    </div>
                                    <div className={styles.summaryRow}>
                                        <span>Fee</span>
                                        <span>-${formatAmount(fee)}</span>
                                    </div>
                                    <div className={`${styles.summaryRow} ${styles.total}`}>
                                        <span>You Receive</span>
                                        <span>${formatAmount(youReceive)}</span>
                                    </div>
                                </div>
                            )}

                            <div className={styles.formActions}>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => router.push('/freelancer/dashboard')}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ background: '#00D395' }}
                                    disabled={isLoading || numericAmount < 10 || numericAmount > availableBalance}
                                >
                                    {isLoading ? 'Processing...' : 'Withdraw'}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { FreelancerSidebar, FreelancerTopBar } from '@/components/freelancer';
import styles from './page.module.css';
import { useUser } from '@/contexts/UserContext';

interface EarningsData {
    balances: Array<{
        currency: string;
        availableBalance: number;
    }>;
    totals: {
        availableBalance: number;
    };
}

interface OffRampQuote {
    inputAmount: string;
    inputCurrency: string;
    outputAmount: string;
    outputCurrency: string;
    fee: string;
    exchangeRate: number;
}

export default function WithdrawPage() {
    const router = useRouter();
    const { user, userType, loading: userLoading } = useUser();
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('bank');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingQuote, setIsFetchingQuote] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [earnings, setEarnings] = useState<EarningsData | null>(null);
    const [quote, setQuote] = useState<OffRampQuote | null>(null);
    const [loadingBalance, setLoadingBalance] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const freelancerId = userType === 'freelancer' ? user?.id ?? null : null;

    // Fetch real balance
    useEffect(() => {
        const fetchBalance = async () => {
            if (userLoading) return;
            if (!freelancerId) {
                setLoadingBalance(false);
                return;
            }

            try {
                const res = await fetch(`/api/earnings?freelancerId=${freelancerId}`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data: EarningsData = await res.json();
                setEarnings(data);
            } catch (err) {
                console.error('Failed to fetch earnings:', err);
            } finally {
                setLoadingBalance(false);
            }
        };

        fetchBalance();
    }, [freelancerId, userLoading]);

    // Fetch off-ramp quote when amount changes
    useEffect(() => {
        if (method !== 'bank') {
            setQuote(null);
            setIsFetchingQuote(false);
            return;
        }

        const fetchQuote = async () => {
            if (!amount || parseFloat(amount) <= 0) {
                setQuote(null);
                setIsFetchingQuote(false);
                return;
            }

            setIsFetchingQuote(true);
            try {
                const res = await fetch(
                    `/api/offramp?amount=${amount}&inputCurrency=USDC&outputCurrency=IDR`
                );
                if (res.ok) {
                    const data = await res.json();
                    setQuote(data.quote);
                }
            } catch (err) {
                console.error('Failed to fetch quote:', err);
            } finally {
                setIsFetchingQuote(false);
            }
        };

        const debounce = setTimeout(fetchQuote, 500);
        return () => clearTimeout(debounce);
    }, [amount, method]);

    const usdcBalance = earnings?.balances?.find((balance) => balance.currency === 'USDC');
    const availableBalance = usdcBalance?.availableBalance ?? 0;
    const fee = quote ? parseFloat(quote.fee) : 0;

    const formatAmount = (amt: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amt);
    };

    const formatIDR = (amt: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amt);
    };

    const handleMaxClick = () => {
        setAmount(availableBalance.toString());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        if (!freelancerId) {
            setError('Unable to identify your account. Please log in again.');
            setIsLoading(false);
            return;
        }

        try {
            // Create withdrawal via API
            const withdrawRes = await fetch('/api/withdrawals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    freelancerId,
                    amount: parseFloat(amount),
                    currency: 'USDC',
                    destinationType: method === 'bank' ? 'BANK' : 'CRYPTO',
                    destination: method === 'bank'
                        ? `${bankName} - ${accountNumber} - ${accountName}`
                        : accountNumber,
                }),
            });

            if (!withdrawRes.ok) {
                const data = await withdrawRes.json();
                throw new Error(data.error || 'Withdrawal failed');
            }

            // If bank method, also call off-ramp
            if (method === 'bank') {
                const offRampRes = await fetch('/api/offramp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        freelancerId,
                        amount,
                        inputCurrency: 'USDC',
                        outputCurrency: 'IDR',
                        bankName,
                        accountNumber,
                        accountName,
                    }),
                });
                if (!offRampRes.ok) {
                    const data = await offRampRes.json().catch(() => null);
                    throw new Error(data?.error || 'Off-ramp failed');
                }
            }

            setShowSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Withdrawal failed');
        } finally {
            setIsLoading(false);
        }
    };

    const numericAmount = parseFloat(amount) || 0;
    const youReceive = quote
        ? parseFloat(quote.outputAmount)
        : Math.max(0, numericAmount - fee);

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
                                    <span>{method === 'bank' ? 'Bank Transfer' : 'Crypto Wallet'}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>You Receive</span>
                                    <span>
                                        {method === 'bank' && quote
                                            ? formatIDR(parseFloat(quote.outputAmount))
                                            : `$${formatAmount(numericAmount)}`
                                        }
                                    </span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Estimated Time</span>
                                    <span>{method === 'bank' ? '1-3 business days' : '~5 minutes'}</span>
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
                            <p>Convert your stablecoins to fiat or crypto</p>
                        </div>
                    </div>

                    {/* Balance Card */}
                    <div className={styles.balanceCard}>
                        {loadingBalance ? (
                            <div className={styles.loadingBalance}>
                                <Loader2 size={24} className={styles.spinner} />
                            </div>
                        ) : (
                            <>
                                <div className={styles.balanceLabel}>Available Balance</div>
                                <div className={styles.balanceAmount}>${formatAmount(availableBalance)}</div>
                                <div className={styles.balanceCurrency}>USDC</div>
                            </>
                        )}
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
                                    <option value="bank">Bank Transfer (to IDR)</option>
                                    <option value="crypto">Crypto Wallet (USDC)</option>
                                </select>
                            </div>

                            {method === 'bank' && (
                                <>
                                    <div className={styles.formGroup}>
                                        <label>Bank Name</label>
                                        <select
                                            value={bankName}
                                            onChange={(e) => setBankName(e.target.value)}
                                            required
                                        >
                                            <option value="">Select Bank</option>
                                            <option value="BCA">BCA</option>
                                            <option value="Mandiri">Mandiri</option>
                                            <option value="BNI">BNI</option>
                                            <option value="BRI">BRI</option>
                                            <option value="CIMB">CIMB Niaga</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Account Number</label>
                                        <input
                                            type="text"
                                            value={accountNumber}
                                            onChange={(e) => setAccountNumber(e.target.value)}
                                            placeholder="Enter account number"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Account Holder Name</label>
                                        <input
                                            type="text"
                                            value={accountName}
                                            onChange={(e) => setAccountName(e.target.value)}
                                            placeholder="Enter account holder name"
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            {method === 'crypto' && (
                                <div className={styles.formGroup}>
                                    <label>Wallet Address</label>
                                    <input
                                        type="text"
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                        placeholder="0x..."
                                        pattern="^0x[a-fA-F0-9]{40}$"
                                        required
                                    />
                                </div>
                            )}

                            {error && (
                                <div className={styles.error}>{error}</div>
                            )}

                            {numericAmount > 0 && (
                                <div className={styles.summary}>
                                    <div className={styles.summaryRow}>
                                        <span>Withdrawal Amount</span>
                                        <span>${formatAmount(numericAmount)} USDC</span>
                                    </div>
                                    {method === 'bank' && quote && (
                                        <>
                                            <div className={styles.summaryRow}>
                                                <span>Fee ({((fee / numericAmount) * 100).toFixed(1)}%)</span>
                                                <span>-${formatAmount(fee)} USDC</span>
                                            </div>
                                            <div className={styles.summaryRow}>
                                                <span>Exchange Rate</span>
                                                <span>1 USDC = {formatIDR(quote.exchangeRate)}</span>
                                            </div>
                                            <div className={`${styles.summaryRow} ${styles.total}`}>
                                                <span>You Receive</span>
                                                <span>
                                                    {isFetchingQuote
                                                        ? <Loader2 size={16} className={styles.spinner} />
                                                        : formatIDR(youReceive)
                                                    }
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    {method === 'crypto' && (
                                        <div className={`${styles.summaryRow} ${styles.total}`}>
                                            <span>You Receive</span>
                                            <span>${formatAmount(numericAmount)} USDC</span>
                                        </div>
                                    )}
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
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={18} className={styles.spinner} />
                                            Processing...
                                        </>
                                    ) : 'Withdraw'}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useDisconnect } from 'wagmi';
import { Loader2 } from 'lucide-react';
import { WalletButtons } from '@/components/wallet/WalletButtons';
import styles from './page.module.css';

export default function LoginPage() {
    const router = useRouter();
    const { isConnected, address } = useAccount();
    const { disconnect } = useDisconnect();
    const [isChecking, setIsChecking] = useState(false);
    const [notRegistered, setNotRegistered] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isConnected || !address) {
            setNotRegistered(false);
            setError(null);
            return;
        }

        const checkWallet = async () => {
            setIsChecking(true);
            setError(null);
            setNotRegistered(false);

            try {
                const response = await fetch(`/api/auth/wallet?address=${encodeURIComponent(address)}`);
                if (!response.ok) {
                    const data = await response.json().catch(() => ({}));
                    const message = typeof data?.error === 'string'
                        ? data.error
                        : 'Authentication failed. Please try again.';
                    throw new Error(message);
                }
                const data = await response.json();

                if (data.registered) {
                    // Wallet is registered, redirect to dashboard
                    router.push(data.redirectTo);
                } else {
                    // Not registered - show message but don't auto-redirect
                    setNotRegistered(true);
                }
            } catch (err) {
                console.error('Auth check failed:', err);
                setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
            } finally {
                setIsChecking(false);
            }
        };

        checkWallet();
    }, [isConnected, address, router]);

    const handleTryAnotherWallet = () => {
        disconnect();
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>◆</span>
                    Cheqq
                </Link>

                <h1 className={styles.title}>Welcome Back</h1>
                <p className={styles.subtitle}>
                    Connect your wallet to sign in
                </p>

                <div className={styles.walletSection}>
                    {isChecking ? (
                        <div className={styles.checking}>
                            <Loader2 className={styles.spinner} size={32} />
                            <p>Verifying wallet...</p>
                        </div>
                    ) : isConnected ? (
                        <div className={styles.connected}>
                            <div className={styles.walletInfo}>
                                <span className={styles.walletLabel}>Connected</span>
                                <span className={styles.walletAddress}>
                                    {address?.slice(0, 6)}...{address?.slice(-4)}
                                </span>
                            </div>

                            {notRegistered && (
                                <div className={styles.notRegistered}>
                                    <p>This wallet is not registered.</p>
                                    <div className={styles.notRegisteredActions}>
                                        <Link href="/get-started" className={styles.registerButton}>
                                            Register Now
                                        </Link>
                                        <button
                                            onClick={handleTryAnotherWallet}
                                            className={styles.tryAnotherButton}
                                        >
                                            Try Another Wallet
                                        </button>
                                    </div>
                                </div>
                            )}

                            {error && <p className={styles.error}>{error}</p>}

                            {!notRegistered && !error && (
                                <button
                                    onClick={handleTryAnotherWallet}
                                    className={styles.disconnectButton}
                                >
                                    Connect Different Wallet
                                </button>
                            )}
                        </div>
                    ) : (
                        <WalletButtons />
                    )}
                </div>

                <div className={styles.divider}>
                    <span>or</span>
                </div>

                <Link href="/get-started" className={styles.registerLink}>
                    New to Cheqq? Register here
                </Link>

                <p className={styles.footer}>
                    Secure wallet authentication · Powered by Base
                </p>
            </div>
        </div>
    );
}

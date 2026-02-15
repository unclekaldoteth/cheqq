'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Mail, Wallet } from 'lucide-react';
import styles from './page.module.css';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';

const hasPrivyAppId = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);

export default function LoginPage() {
    if (!hasPrivyAppId) {
        return <MissingPrivyConfig />;
    }

    return <PrivyLogin />;
}

function MissingPrivyConfig() {
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <Link href="/" className={styles.logo}>
                    <Image
                        src="/brand/tempo-mark-black.svg"
                        alt="Cheqq"
                        width={48}
                        height={48}
                        style={{ objectFit: 'contain' }}
                    />
                    Cheqq
                </Link>

                <h1 className={styles.title}>Login Unavailable</h1>
                <p className={styles.subtitle}>
                    Privy is not configured. Set NEXT_PUBLIC_PRIVY_APP_ID in your environment.
                </p>

                <Link href="/get-started" className={styles.registerButton}>
                    Go to Get Started
                </Link>
            </div>
        </div>
    );
}

function PrivyLogin() {
    const router = useRouter();
    const { ready, authenticated, user, login, logout } = usePrivy();
    const [isChecking, setIsChecking] = useState(false);
    const [notRegistered, setNotRegistered] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get wallet address from Privy user (may be undefined for email-only users initially)
    const address = user?.wallet?.address;
    // Get email from Privy user
    const email = user?.email?.address;

    useEffect(() => {
        if (!ready || !authenticated) {
            setNotRegistered(false);
            setError(null);
            return;
        }

        // If user is authenticated but has no wallet yet (email login, wallet still creating),
        // wait a moment then show registration options
        if (!address) {
            // Privy is still creating the embedded wallet, wait briefly
            const timeout = setTimeout(() => {
                if (!address) {
                    // Still no wallet after waiting — treat as not registered
                    setNotRegistered(true);
                }
            }, 3000);
            return () => clearTimeout(timeout);
        }

        const checkWallet = async () => {
            setIsChecking(true);
            setError(null);
            setNotRegistered(false);

            try {
                const response = await fetch(`/api/auth/wallet?address=${encodeURIComponent(address)}`);
                if (!response.ok) {
                    // If the API fails (e.g., DB down), treat as not registered
                    // so the user can still proceed to registration
                    console.warn('Auth check API returned error, treating as not registered');
                    setNotRegistered(true);
                    return;
                }
                const data = await response.json();

                if (data.registered) {
                    router.push(data.redirectTo);
                } else {
                    setNotRegistered(true);
                }
            } catch (err) {
                console.warn('Auth check failed, treating as not registered:', err);
                // Don't block the user — let them register even if DB is temporarily down
                setNotRegistered(true);
            } finally {
                setIsChecking(false);
            }
        };

        checkWallet();
    }, [ready, authenticated, address, router]);

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('cheqq:manual-logout', '1');
        }
        logout();
    };

    const handleEmailLogin = () => {
        login({ loginMethods: ['email'] });
    };

    const handleWalletLogin = () => {
        login({ loginMethods: ['wallet'] });
    };

    // Show loading while Privy initializes
    if (!ready) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.checking}>
                        <Loader2 className={styles.spinner} size={32} />
                        <p>Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <Link href="/" className={styles.logo}>
                    <Image
                        src="/brand/tempo-mark-black.svg"
                        alt="Cheqq"
                        width={48}
                        height={48}
                        style={{ objectFit: 'contain' }}
                    />
                    Cheqq
                </Link>

                <h1 className={styles.title}>Welcome Back</h1>
                <p className={styles.subtitle}>
                    Sign in with email or connect your wallet
                </p>

                <div className={styles.walletSection}>
                    {isChecking ? (
                        <div className={styles.checking}>
                            <Loader2 className={styles.spinner} size={32} />
                            <p>Verifying account...</p>
                        </div>
                    ) : authenticated ? (
                        <div className={styles.connected}>
                            <div className={styles.walletInfo}>
                                <span className={styles.walletLabel}>
                                    {email ? 'Email' : 'Connected'}
                                </span>
                                <span className={styles.walletAddress}>
                                    {email || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                                </span>
                            </div>

                            {notRegistered && (
                                <div className={styles.notRegistered}>
                                    <p>This account is not registered yet.</p>
                                    <div className={styles.notRegisteredActions}>
                                        <Link href="/get-started" className={styles.registerButton}>
                                            Register Now
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className={styles.tryAnotherButton}
                                        >
                                            Try Another Account
                                        </button>
                                    </div>
                                </div>
                            )}

                            {error && <p className={styles.error}>{error}</p>}

                            {!notRegistered && !error && (
                                <button
                                    onClick={handleLogout}
                                    className={styles.disconnectButton}
                                >
                                    Sign Out
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Primary: Email Login */}
                            <button
                                onClick={handleEmailLogin}
                                className={styles.emailButton}
                            >
                                <Mail size={20} />
                                Continue with Email
                            </button>

                            <div className={styles.divider}>
                                <span>or continue with wallet</span>
                            </div>

                            <button
                                onClick={handleWalletLogin}
                                className={styles.connectButton}
                            >
                                <Wallet size={20} />
                                Continue with Wallet
                            </button>
                        </>
                    )}
                </div>

                <Link href="/get-started" className={styles.registerLink}>
                    New to Cheqq? Register here
                </Link>

                <p className={styles.footer}>
                    {authenticated ? 'Secure authentication' : 'Email or wallet · Powered by Privy'}
                </p>
            </div>
        </div>
    );
}

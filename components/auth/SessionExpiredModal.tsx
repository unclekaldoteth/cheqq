'use client';

import { useState } from 'react';
import { usePrivy, useToken } from '@privy-io/react-auth';
import { AlertTriangle } from 'lucide-react';
import styles from './SessionExpiredModal.module.css';

/**
 * SessionExpiredModal
 * Shows a modal when the user's session expires while they have the app open.
 * Only triggers if the user WAS authenticated and then became unauthenticated.
 */
export function SessionExpiredModal() {
    const { login } = usePrivy();
    const [showModal, setShowModal] = useState(false);
    const MANUAL_LOGOUT_KEY = 'cheqq:manual-logout';

    useToken({
        onAccessTokenGranted: () => {
            setShowModal(false);
        },
        onAccessTokenRemoved: () => {
            if (typeof window !== 'undefined') {
                const manualLogout = sessionStorage.getItem(MANUAL_LOGOUT_KEY) === '1';
                if (manualLogout) {
                    sessionStorage.removeItem(MANUAL_LOGOUT_KEY);
                    return;
                }
            }
            setShowModal(true);
        },
    });

    const handleSignIn = () => {
        setShowModal(false);
        login();
    };

    const handleDismiss = () => {
        setShowModal(false);
    };

    if (!showModal) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.iconWrapper}>
                    <AlertTriangle size={48} color="#f97316" />
                </div>
                <h2 className={styles.title}>Your session has expired</h2>
                <p className={styles.message}>
                    Your session has expired or is invalid. Please sign in again.
                </p>
                <button onClick={handleSignIn} className={styles.signInButton}>
                    Sign in
                </button>
                <button onClick={handleDismiss} className={styles.dismissButton}>
                    Dismiss
                </button>
            </div>
        </div>
    );
}

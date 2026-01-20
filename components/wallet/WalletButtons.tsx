'use client';

import { useConnect } from 'wagmi';
import styles from './WalletButtons.module.css';

interface WalletButtonsProps {
    onConnecting?: () => void;
}

// Wallet SVG Icons
const WalletIcons = {
    coinbase: (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#0052FF" />
            <path d="M16 6C10.48 6 6 10.48 6 16C6 21.52 10.48 26 16 26C21.52 26 26 21.52 26 16C26 10.48 21.52 6 16 6ZM13.5 18.5C12.67 18.5 12 17.83 12 17V15C12 14.17 12.67 13.5 13.5 13.5H18.5C19.33 13.5 20 14.17 20 15V17C20 17.83 19.33 18.5 18.5 18.5H13.5Z" fill="white" />
        </svg>
    ),
    metamask: (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M27.2 3L17.4 10.4L19.1 6L27.2 3Z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4.8 3L14.5 10.5L13 6L4.8 3Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M23.8 21.9L21.2 26L26.6 27.5L28.2 22L23.8 21.9Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3.9 22L5.4 27.5L10.9 26L8.2 21.9L3.9 22Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.6 14.1L9 16.5L14.4 16.8L14.2 11L10.6 14.1Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21.4 14.1L17.7 10.9L17.6 16.8L23 16.5L21.4 14.1Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.9 26L14 24.4L11.3 22L10.9 26Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18 24.4L21.2 26L20.7 22L18 24.4Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    walletconnect: (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#3B99FC" />
            <path d="M10.3 12.3C13.5 9.2 18.5 9.2 21.7 12.3L22.1 12.7C22.3 12.9 22.3 13.2 22.1 13.4L20.8 14.7C20.7 14.8 20.5 14.8 20.4 14.7L19.8 14.2C17.7 12.1 14.3 12.1 12.1 14.2L11.5 14.8C11.4 14.9 11.2 14.9 11.1 14.8L9.8 13.5C9.6 13.3 9.6 13 9.8 12.8L10.3 12.3ZM24.3 14.9L25.5 16C25.7 16.2 25.7 16.5 25.5 16.7L20.1 22C19.9 22.2 19.6 22.2 19.4 22L15.6 18.3C15.5 18.2 15.4 18.2 15.3 18.3L11.5 22C11.3 22.2 11 22.2 10.8 22L5.5 16.7C5.3 16.5 5.3 16.2 5.5 16L6.6 14.9C6.8 14.7 7.1 14.7 7.3 14.9L11.1 18.6C11.2 18.7 11.3 18.7 11.4 18.6L15.2 14.9C15.4 14.7 15.7 14.7 15.9 14.9L19.7 18.6C19.8 18.7 19.9 18.7 20 18.6L23.8 14.9C24 14.7 24.2 14.7 24.3 14.9Z" fill="white" />
        </svg>
    ),
    brave: (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M26 10L24 6L20 7L16 4L12 7L8 6L6 10L4 16L8 26L16 28L24 26L28 16L26 10Z" fill="#FB542B" />
            <path d="M16 8L12 10V18L16 22L20 18V10L16 8Z" fill="white" />
        </svg>
    ),
    rabby: (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#8697FF" />
            <ellipse cx="12" cy="12" rx="3" ry="4" fill="white" />
            <ellipse cx="20" cy="12" rx="3" ry="4" fill="white" />
            <ellipse cx="16" cy="20" rx="6" ry="4" fill="white" />
            <circle cx="11" cy="11" r="1.5" fill="#8697FF" />
            <circle cx="21" cy="11" r="1.5" fill="#8697FF" />
        </svg>
    ),
    phantom: (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#AB9FF2" />
            <path d="M16 8C11 8 7 12 7 17C7 22 11 26 16 26C21 26 25 22 25 17C25 12 21 8 16 8ZM12 16C12 14.9 12.9 14 14 14C15.1 14 16 14.9 16 16C16 17.1 15.1 18 14 18C12.9 18 12 17.1 12 16ZM20 18C18.9 18 18 17.1 18 16C18 14.9 18.9 14 20 14C21.1 14 22 14.9 22 16C22 17.1 21.1 18 20 18Z" fill="white" />
        </svg>
    ),
    trust: (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 4L6 8V14C6 20.6 10.2 26.6 16 28C21.8 26.6 26 20.6 26 14V8L16 4Z" fill="#3375BB" />
            <path d="M16 7L9 10V14C9 19.1 12.1 23.7 16 25C19.9 23.7 23 19.1 23 14V10L16 7Z" fill="white" />
        </svg>
    ),
    rainbow: (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#001E59" />
            <path d="M16 6C10.5 6 6 10.5 6 16C6 21.5 10.5 26 16 26" stroke="#FF6B00" strokeWidth="2" />
            <path d="M16 9C12.1 9 9 12.1 9 16C9 19.9 12.1 23 16 23" stroke="#FFD700" strokeWidth="2" />
            <path d="M16 12C13.8 12 12 13.8 12 16C12 18.2 13.8 20 16 20" stroke="#00FF00" strokeWidth="2" />
            <path d="M16 15C15.4 15 15 15.4 15 16C15 16.6 15.4 17 16 17" stroke="#00BFFF" strokeWidth="2" />
        </svg>
    ),
    default: (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#666" />
            <path d="M16 8C11.6 8 8 11.6 8 16C8 20.4 11.6 24 16 24C20.4 24 24 20.4 24 16C24 11.6 20.4 8 16 8ZM16 10C19.3 10 22 12.7 22 16C22 19.3 19.3 22 16 22C12.7 22 10 19.3 10 16C10 12.7 12.7 10 16 10Z" fill="white" />
        </svg>
    ),
};

export function WalletButtons({ onConnecting }: WalletButtonsProps) {
    const { connectors, connect, isPending } = useConnect();

    const handleConnect = (connector: typeof connectors[number]) => {
        onConnecting?.();
        connect({ connector });
    };

    // Filter to show only main connector types (Coinbase, WalletConnect, Injected/Browser)
    // This avoids showing duplicates like Brave, Rabby, Phantom separately
    const filteredConnectors = connectors.filter((connector) => {
        const id = connector.id.toLowerCase();
        const name = connector.name.toLowerCase();

        // Keep Coinbase Wallet
        if (id.includes('coinbase')) return true;

        // Keep WalletConnect
        if (id.includes('walletconnect')) return true;

        // Keep only the generic "injected" connector, not specific ones
        if (id === 'injected' && !name.includes('metamask') && !name.includes('brave') &&
            !name.includes('rabby') && !name.includes('phantom')) {
            return true;
        }

        return false;
    });

    // Get wallet info based on connector
    const getWalletInfo = (connector: typeof connectors[number]) => {
        const id = connector.id.toLowerCase();
        const name = connector.name.toLowerCase();

        if (id.includes('coinbase') || name.includes('coinbase')) {
            return { name: 'Coinbase Wallet', icon: WalletIcons.coinbase, color: '#0052FF' };
        }
        if (id.includes('walletconnect') || name.includes('walletconnect')) {
            return { name: 'WalletConnect', icon: WalletIcons.walletconnect, color: '#3B99FC' };
        }

        // Rename "Injected" to "Browser Wallet"
        return { name: 'Browser Wallet', icon: WalletIcons.default, color: '#8B5CF6' };
    };

    return (
        <div className={styles.container}>
            <p className={styles.label}>Choose your wallet</p>
            <div className={styles.walletList}>
                {filteredConnectors.map((connector) => {
                    const info = getWalletInfo(connector);

                    return (
                        <button
                            key={connector.id}
                            onClick={() => handleConnect(connector)}
                            disabled={isPending}
                            className={styles.walletButton}
                            style={{ '--wallet-color': info.color } as React.CSSProperties}
                        >
                            <span className={styles.walletIcon}>{info.icon}</span>
                            <span className={styles.walletName}>{info.name}</span>
                            {isPending && <span className={styles.connecting}>...</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

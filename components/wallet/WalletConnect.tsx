'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import type { EIP1193Provider } from 'viem';
import styles from './WalletConnect.module.css';

const truncateAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

const getInjectedProvider = () => {
    if (typeof window === 'undefined') return undefined;
    const ethereum = (window as Window & {
        ethereum?: (EIP1193Provider & { isRabby?: boolean; providers?: EIP1193Provider[] }) | undefined;
    }).ethereum;

    if (!ethereum) return undefined;
    if (Array.isArray(ethereum.providers) && ethereum.providers.length > 0) {
        const providers = ethereum.providers as Array<EIP1193Provider & { isRabby?: boolean }>;
        const rabbyProvider = providers.find(
            (provider: EIP1193Provider & { isRabby?: boolean }) => provider.isRabby
        );
        return rabbyProvider ?? providers[0];
    }
    return ethereum;
};

export function WalletConnect() {
    const { ready, authenticated, user, login, logout } = usePrivy();
    const { status, address } = useAccount();
    const { connect, status: connectStatus } = useConnect();
    const { disconnect } = useDisconnect();
    const privyAddress = user?.wallet?.address;

    const isWagmiConnected = status === 'connected' && !!address;

    const handleSyncWallet = async () => {
        if (!privyAddress || connectStatus === 'pending') return;
        const provider = getInjectedProvider();
        if (provider?.request) {
            await provider.request({ method: 'eth_requestAccounts' });
        }
        const connector = provider
            ? injected({
                shimDisconnect: true,
                target: {
                    id: (provider as { isRabby?: boolean }).isRabby ? 'rabby_wallet' : 'injected',
                    name: (provider as { isRabby?: boolean }).isRabby ? 'Rabby Wallet' : 'Injected Wallet',
                    provider,
                },
            })
            : injected({ shimDisconnect: true });
        connect({ connector });
    };

    const handleDisconnect = () => {
        disconnect();
        logout();
    };

    if (!authenticated) {
        return (
            <div className={styles.walletWrapper}>
                <button
                    type="button"
                    className={styles.linkedButton}
                    onClick={() => login()}
                    disabled={!ready}
                >
                    Sign In
                </button>
            </div>
        );
    }

    if (authenticated && privyAddress && !isWagmiConnected) {
        return (
            <div className={styles.walletWrapper}>
                <button
                    type="button"
                    className={styles.linkedButton}
                    onClick={handleSyncWallet}
                    disabled={connectStatus === 'pending'}
                >
                    <span className={styles.linkedStatus}>Wallet Linked</span>
                    <span className={styles.linkedAddress}>
                        {truncateAddress(privyAddress)}
                    </span>
                </button>
            </div>
        );
    }

    return (
        <div className={styles.walletWrapper}>
            <div className={styles.connectedWallet}>
                <div className={styles.walletInfo}>
                    <div className={styles.walletAvatar}>
                        {address?.slice(2, 4).toUpperCase()}
                    </div>
                    <div className={styles.walletDetails}>
                        <div className={styles.walletLabel}>Connected</div>
                        <div className={styles.walletAddress}>
                            {address ? truncateAddress(address) : ''}
                        </div>
                    </div>
                </div>
                <div className={styles.walletActions}>
                    <a
                        href={`https://explore.tempo.xyz/address/${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.explorerLink}
                    >
                        Explorer ↗
                    </a>
                    <button
                        type="button"
                        className={styles.disconnectButton}
                        onClick={handleDisconnect}
                    >
                        Disconnect
                    </button>
                </div>
            </div>
        </div>
    );
}

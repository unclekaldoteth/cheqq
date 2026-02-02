'use client';

import { usePrivy } from '@privy-io/react-auth';
import {
    ConnectWallet,
    Wallet,
    WalletDropdown,
    WalletDropdownDisconnect,
    WalletDropdownLink,
} from '@coinbase/onchainkit/wallet';
import {
    Address,
    Avatar,
    Name,
} from '@coinbase/onchainkit/identity';
import { useAccount, useConnect } from 'wagmi';
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
    const { ready, authenticated, user, login } = usePrivy();
    const { status, address } = useAccount();
    const { connect, status: connectStatus } = useConnect();
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
            <Wallet>
                <ConnectWallet>
                    <Avatar className={styles.avatar} />
                    <Name className={styles.name} />
                </ConnectWallet>
                <WalletDropdown
                    className={styles.dropdownPortal}
                    classNames={{ container: styles.dropdownContent }}
                >
                    <div className={styles.dropdownInner}>
                        {address && (
                            <div className={styles.dropdownHeader}>
                                <Avatar address={address} className={styles.dropdownAvatar} />
                                <div className={styles.dropdownHeaderText}>
                                    <div className={styles.dropdownLabel}>Connected</div>
                                    <Address
                                        address={address}
                                        className={styles.dropdownAddress}
                                        hasCopyAddressOnClick
                                    />
                                </div>
                            </div>
                        )}
                        <WalletDropdownLink
                            className={styles.dropdownItem}
                            icon="wallet"
                            href="https://wallet.coinbase.com"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Go to Wallet Dashboard
                        </WalletDropdownLink>
                        <WalletDropdownDisconnect className={styles.dropdownDisconnect} />
                    </div>
                </WalletDropdown>
            </Wallet>
        </div>
    );
}

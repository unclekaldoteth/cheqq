'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import { WagmiProvider as PrivyWagmiProvider, createConfig as createPrivyConfig, useSetActiveWallet, type SetActiveWalletForWagmiType } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider as BaseWagmiProvider, createConfig as createWagmiConfig, http, useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { SessionExpiredModal } from '@/components/auth/SessionExpiredModal';
import type { EIP1193Provider, Chain } from 'viem';

const TEMPO_RPC_HTTP = process.env.NEXT_PUBLIC_TEMPO_RPC_URL || 'https://rpc.moderato.tempo.xyz';
const TEMPO_RPC_WS = process.env.NEXT_PUBLIC_TEMPO_WS_URL || 'wss://rpc.moderato.tempo.xyz';

// Define Tempo Testnet chain
export const tempoTestnet: Chain = {
    id: 42431,
    name: 'Tempo Testnet',
    nativeCurrency: {
        name: 'USD',
        symbol: 'USD',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: [TEMPO_RPC_HTTP],
            webSocket: [TEMPO_RPC_WS],
        },
    },
    blockExplorers: {
        default: {
            name: 'Tempo Explorer',
            url: 'https://explore.tempo.xyz',
        },
    },
    testnet: true,
};

const chain = tempoTestnet;
const wagmiTransports = {
    [tempoTestnet.id]: http(TEMPO_RPC_HTTP),
};

const selectActiveWalletForWagmi: SetActiveWalletForWagmiType = ({ wallets, user }) => {
    if (!wallets.length) return undefined;
    const userWalletAddress = user?.wallet?.address?.toLowerCase();
    if (userWalletAddress) {
        const match = wallets.find(wallet => wallet.address?.toLowerCase() === userWalletAddress);
        if (match) return match;
    }
    return wallets[0];
};

function PrivyWagmiSync() {
    const { user, authenticated, ready } = usePrivy();
    const { wallets, ready: walletsReady } = useWallets();
    const { address, status } = useAccount();
    const { setActiveWallet } = useSetActiveWallet();
    const { connect } = useConnect();
    const syncingRef = useRef<string | null>(null);
    const fallbackTriedRef = useRef(false);

    useEffect(() => {
        if (!ready || !authenticated || !walletsReady) return;

        const targetAddress = user?.wallet?.address?.trim().toLowerCase();
        if (!targetAddress) return;

        if (status === 'connected' && address?.toLowerCase() === targetAddress) {
            syncingRef.current = targetAddress;
            return;
        }

        const wallet = wallets.find(candidate => candidate.address?.toLowerCase() === targetAddress);
        if (!wallet) return;

        if (syncingRef.current === targetAddress) return;
        syncingRef.current = targetAddress;

        setActiveWallet(wallet).catch((error) => {
            console.warn('Failed to sync Privy wallet to wagmi:', error);
            syncingRef.current = null;
        });
    }, [ready, authenticated, walletsReady, user?.wallet?.address, wallets, status, address, setActiveWallet]);

    useEffect(() => {
        if (!ready || !authenticated) {
            fallbackTriedRef.current = false;
            return;
        }

        if (status !== 'disconnected') return;

        const privyAddress = user?.wallet?.address?.trim().toLowerCase();
        if (!privyAddress) return;
        if (typeof window === 'undefined') return;

        const provider = (window as Window & {
            ethereum?: (EIP1193Provider & { isRabby?: boolean }) | undefined;
        }).ethereum;
        if (!provider?.request) return;
        if (fallbackTriedRef.current) return;

        const attemptInjectedConnect = async () => {
            try {
                const accounts = await provider.request({ method: 'eth_accounts' });
                if (!Array.isArray(accounts)) return;

                const matchesPrivy = accounts.some((account) => {
                    if (typeof account !== 'string') return false;
                    return account.toLowerCase() === privyAddress;
                });

                if (!matchesPrivy) return;

                fallbackTriedRef.current = true;
                const connector = injected({
                    shimDisconnect: true,
                    target: {
                        id: provider.isRabby ? 'rabby_wallet' : 'injected',
                        name: provider.isRabby ? 'Rabby Wallet' : 'Injected Wallet',
                        provider,
                    },
                });

                connect({ connector });
            } catch (error) {
                console.warn('Auto-connect via injected wallet failed:', error);
                fallbackTriedRef.current = false;
            }
        };

        attemptInjectedConnect();
    }, [ready, authenticated, status, user?.wallet?.address, connect]);

    return null;
}

// Get connectors - using injected wallets only
// Privy handles wallet connection through its own modal
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedConnectors: any[] | null = null;

function getWagmiConnectors() {
    if (cachedConnectors) {
        return cachedConnectors;
    }

    cachedConnectors = [
        // Injected connector for browser extension wallets
        injected({
            shimDisconnect: true,
        }),
    ];

    return cachedConnectors;
}

// Cache configs at module level to prevent recreation
let cachedPrivyConfig: ReturnType<typeof createPrivyConfig> | null = null;
let cachedFallbackConfig: ReturnType<typeof createWagmiConfig> | null = null;

function getPrivyWagmiConfig() {
    if (cachedPrivyConfig) {
        return cachedPrivyConfig;
    }
    cachedPrivyConfig = createPrivyConfig({
        chains: [chain],
        transports: wagmiTransports,
        ssr: true,
    });
    return cachedPrivyConfig;
}

function getFallbackWagmiConfig() {
    if (cachedFallbackConfig) {
        return cachedFallbackConfig;
    }
    cachedFallbackConfig = createWagmiConfig({
        chains: [chain],
        transports: wagmiTransports,
        ssr: true,
        connectors: getWagmiConnectors(),
    });
    return cachedFallbackConfig;
}

interface OnchainProviderProps {
    children: ReactNode;
}

export function OnchainProvider({ children }: OnchainProviderProps) {
    // Create stable instances that persist across renders
    const [queryClient] = useState(() => new QueryClient());
    const [privyWagmiConfig] = useState(() => getPrivyWagmiConfig());
    const [fallbackWagmiConfig] = useState(() => getFallbackWagmiConfig());

    const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

    // If Privy is not configured, return without PrivyProvider
    if (!privyAppId) {
        console.warn('NEXT_PUBLIC_PRIVY_APP_ID not set, rendering without Privy');
        return (
            <QueryClientProvider client={queryClient}>
                <BaseWagmiProvider config={fallbackWagmiConfig}>
                    {children}
                </BaseWagmiProvider>
            </QueryClientProvider>
        );
    }

    return (
        <PrivyProvider
            appId={privyAppId}
            config={{
                loginMethods: ['email', 'wallet'],
                appearance: {
                    theme: 'dark',
                    accentColor: '#0052ff',
                    logo: '/favicon.ico',
                },
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: 'users-without-wallets',
                    },
                },
                defaultChain: chain,
                supportedChains: [chain],
            }}
        >
            <SessionExpiredModal />
            <QueryClientProvider client={queryClient}>
                <PrivyWagmiProvider config={privyWagmiConfig} setActiveWalletForWagmi={selectActiveWalletForWagmi}>
                    <PrivyWagmiSync />
                    {children}
                </PrivyWagmiProvider>
            </QueryClientProvider>
        </PrivyProvider>
    );
}

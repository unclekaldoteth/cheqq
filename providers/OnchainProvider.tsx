'use client';

import { ReactNode, useState, useEffect, useRef, type ComponentType, type PropsWithChildren } from 'react';
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import { WagmiProvider as PrivyWagmiProvider, createConfig as createPrivyConfig, useSetActiveWallet, type SetActiveWalletForWagmiType } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { WagmiProvider as BaseWagmiProvider, createConfig as createWagmiConfig, http, useAccount, useConnect } from 'wagmi';
import type { WagmiProviderProps } from 'wagmi';
import { baseSepolia, base } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';
import { SessionExpiredModal } from '@/components/auth/SessionExpiredModal';
import { sdk } from '@farcaster/miniapp-sdk';
import type { EIP1193Provider } from 'viem';

const chain = process.env.NEXT_PUBLIC_CHAIN === 'base' ? base : baseSepolia;
const wagmiTransports = {
    [baseSepolia.id]: http(),
    [base.id]: http(),
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

// Get connectors - using Coinbase Wallet and injected only
// Privy handles wallet connection through its own modal
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedConnectors: any[] | null = null;

function getWagmiConnectors() {
    if (cachedConnectors) {
        return cachedConnectors;
    }

    cachedConnectors = [
        coinbaseWallet({
            appName: 'Cheqq',
            preference: 'all', // Allow both smart wallet and browser extension
        }),
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

    // Signal Base Mini App that the app is ready to be displayed
    useEffect(() => {
        // Only call ready() in browser and wrap in try-catch to handle 
        // cases where the app is not running inside a Farcaster frame
        if (typeof window !== 'undefined') {
            try {
                sdk.actions.ready();
            } catch (error) {
                // Silently ignore - not running in a Farcaster frame
                console.debug('Farcaster SDK not available:', error);
            }
        }
    }, []);

    const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

    const baseProviders = (
        Provider: ComponentType<PropsWithChildren<WagmiProviderProps>>,
        config: WagmiProviderProps['config'],
        providerProps?: Record<string, unknown>,
        extraContent?: ReactNode,
    ) => (
        <QueryClientProvider client={queryClient}>
            <Provider config={config} {...providerProps}>
                <OnchainKitProvider
                    apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_CDP_KEY}
                    chain={chain}
                    config={{
                        appearance: {
                            name: 'Cheqq',
                            mode: 'auto',
                            theme: 'default',
                        },
                    }}
                >
                    {extraContent}
                    {children}
                </OnchainKitProvider>
            </Provider>
        </QueryClientProvider>
    );

    // If Privy is not configured, return without PrivyProvider
    if (!privyAppId) {
        console.warn('NEXT_PUBLIC_PRIVY_APP_ID not set, rendering without Privy');
        return baseProviders(BaseWagmiProvider, fallbackWagmiConfig);
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
            {baseProviders(PrivyWagmiProvider, privyWagmiConfig, {
                setActiveWalletForWagmi: selectActiveWalletForWagmi,
            }, <PrivyWagmiSync />)}
        </PrivyProvider>
    );
}

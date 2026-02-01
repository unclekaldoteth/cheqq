'use client';

import { ReactNode, useState, useEffect, type ComponentType, type PropsWithChildren } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider as PrivyWagmiProvider, createConfig as createPrivyConfig } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { WagmiProvider as BaseWagmiProvider, createConfig as createWagmiConfig, http } from 'wagmi';
import type { WagmiProviderProps } from 'wagmi';
import { baseSepolia, base } from 'wagmi/chains';
import { coinbaseWallet, walletConnect, injected } from 'wagmi/connectors';
import { SessionExpiredModal } from '@/components/auth/SessionExpiredModal';
import { sdk } from '@farcaster/miniapp-sdk';

const chain = process.env.NEXT_PUBLIC_CHAIN === 'base' ? base : baseSepolia;
const wagmiTransports = {
    [baseSepolia.id]: http(),
    [base.id]: http(),
};

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';
const fallbackAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function getAppUrl() {
    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
    }
    return fallbackAppUrl;
}

function getAppIconUrl(appUrl: string) {
    try {
        return new URL('/favicon.ico', appUrl).toString();
    } catch {
        return `${fallbackAppUrl}/favicon.ico`;
    }
}

function makeWalletConnectMetadata() {
    const appUrl = getAppUrl();
    return {
        name: 'Cheqq',
        description: 'Payroll & DeFi. Unified on Base.',
        url: appUrl,
        icons: [getAppIconUrl(appUrl)],
    };
}

// Log warning once on client for missing WalletConnect project ID
let hasWarnedWalletConnect = false;
function warnMissingWalletConnect() {
    if (!hasWarnedWalletConnect && typeof window !== 'undefined' && !walletConnectProjectId) {
        console.warn('NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID not set, WalletConnect disabled');
        hasWarnedWalletConnect = true;
    }
}

// Cache connectors at module level to prevent double initialization
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedConnectors: any[] | null = null;

function getWagmiConnectors() {
    if (cachedConnectors) {
        return cachedConnectors;
    }

    warnMissingWalletConnect();

    cachedConnectors = [
        coinbaseWallet({
            appName: 'Cheqq',
            preference: 'all', // Allow both smart wallet and browser extension
        }),
        // WalletConnect supports 300+ wallets (MetaMask, Trust, Rainbow, etc.)
        ...(walletConnectProjectId ? [
            walletConnect({
                projectId: walletConnectProjectId,
                showQrModal: typeof window !== 'undefined',
                metadata: makeWalletConnectMetadata(),
            }),
        ] : []),
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
        connectors: getWagmiConnectors(),
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
    ) => (
        <QueryClientProvider client={queryClient}>
            <Provider config={config}>
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
            {baseProviders(PrivyWagmiProvider, privyWagmiConfig)}
        </PrivyProvider>
    );
}

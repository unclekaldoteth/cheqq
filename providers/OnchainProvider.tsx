'use client';

import { ReactNode, useState, useEffect, type ComponentType, type PropsWithChildren } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider as PrivyWagmiProvider, createConfig as createPrivyConfig } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { WagmiProvider as BaseWagmiProvider, createConfig as createWagmiConfig, http } from 'wagmi';
import type { WagmiProviderProps } from 'wagmi';
import { baseSepolia, base } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';
import { SessionExpiredModal } from '@/components/auth/SessionExpiredModal';
import { sdk } from '@farcaster/miniapp-sdk';

const chain = process.env.NEXT_PUBLIC_CHAIN === 'base' ? base : baseSepolia;
const wagmiTransports = {
    [baseSepolia.id]: http(),
    [base.id]: http(),
};

// Create wagmi config (stable reference)
function makePrivyWagmiConfig() {
    return createPrivyConfig({
        chains: [chain],
        transports: wagmiTransports,
        // Need connectors for OnchainKit's ConnectWallet to work
        connectors: [
            coinbaseWallet({
                appName: 'Cheqq',
                preference: 'all', // Allow both smart wallet and browser extension
            }),
        ],
    });
}

function makeFallbackWagmiConfig() {
    return createWagmiConfig({
        chains: [chain],
        transports: wagmiTransports,
        ssr: true,
        // Use Coinbase Smart Wallet to avoid MetaMask/extension conflicts
        connectors: [
            coinbaseWallet({
                appName: 'Cheqq',
                preference: 'smartWalletOnly', // Avoid injected wallet conflicts
            }),
        ],
    });
}

interface OnchainProviderProps {
    children: ReactNode;
}

export function OnchainProvider({ children }: OnchainProviderProps) {
    // Create stable instances that persist across renders
    const [queryClient] = useState(() => new QueryClient());
    const [privyWagmiConfig] = useState(() => makePrivyWagmiConfig());
    const [fallbackWagmiConfig] = useState(() => makeFallbackWagmiConfig());

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

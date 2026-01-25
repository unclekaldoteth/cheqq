'use client';

import { ReactNode, useState, type ComponentType, type PropsWithChildren } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider as PrivyWagmiProvider, createConfig as createPrivyConfig } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { WagmiProvider as BaseWagmiProvider, createConfig as createWagmiConfig, http } from 'wagmi';
import type { WagmiProviderProps } from 'wagmi';
import { baseSepolia, base } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';

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
            {baseProviders(PrivyWagmiProvider, privyWagmiConfig)}
        </PrivyProvider>
    );
}

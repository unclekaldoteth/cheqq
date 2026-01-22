'use client';

import { ReactNode, useState } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider, createConfig } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { http } from 'wagmi';
import { baseSepolia, base } from 'wagmi/chains';

const chain = process.env.NEXT_PUBLIC_CHAIN === 'base' ? base : baseSepolia;

// Create wagmi config (stable reference)
function makeWagmiConfig() {
    return createConfig({
        chains: [chain],
        transports: {
            [baseSepolia.id]: http(),
            [base.id]: http(),
        },
    });
}

interface OnchainProviderProps {
    children: ReactNode;
}

export function OnchainProvider({ children }: OnchainProviderProps) {
    // Create stable instances that persist across renders
    const [queryClient] = useState(() => new QueryClient());
    const [wagmiConfig] = useState(() => makeWagmiConfig());

    const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

    // Inner content wrapper with all providers
    const innerContent = (
        <QueryClientProvider client={queryClient}>
            <WagmiProvider config={wagmiConfig}>
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
            </WagmiProvider>
        </QueryClientProvider>
    );

    // If Privy is not configured, return without PrivyProvider
    if (!privyAppId) {
        return innerContent;
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
            {innerContent}
        </PrivyProvider>
    );
}

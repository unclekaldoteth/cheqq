'use client';

import { ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider, createConfig } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { http } from 'wagmi';
import { baseSepolia, base } from 'wagmi/chains';

const queryClient = new QueryClient();

const chain = process.env.NEXT_PUBLIC_CHAIN === 'base' ? base : baseSepolia;

// Wagmi config for Privy integration
const wagmiConfig = createConfig({
    chains: [chain],
    transports: {
        [baseSepolia.id]: http(),
        [base.id]: http(),
    },
});

interface OnchainProviderProps {
    children: ReactNode;
}

export function OnchainProvider({ children }: OnchainProviderProps) {
    const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

    if (!privyAppId) {
        console.warn('NEXT_PUBLIC_PRIVY_APP_ID not set');
        return <>{children}</>;
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
        </PrivyProvider>
    );
}

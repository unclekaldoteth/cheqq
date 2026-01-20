'use client';

import { ReactNode } from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia, base } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

const queryClient = new QueryClient();

const chain = process.env.NEXT_PUBLIC_CHAIN === 'base' ? base : baseSepolia;

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

const wagmiConfig = createConfig({
    chains: [chain],
    connectors: [
        coinbaseWallet({
            appName: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Cheqq',
            preference: 'smartWalletOnly',
        }),
        ...(walletConnectProjectId
            ? [
                walletConnect({
                    projectId: walletConnectProjectId,
                }),
            ]
            : []),
        injected(),
    ],
    transports: {
        [baseSepolia.id]: http(),
        [base.id]: http(),
    },
});

interface OnchainProviderProps {
    children: ReactNode;
}

export function OnchainProvider({ children }: OnchainProviderProps) {
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
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
            </QueryClientProvider>
        </WagmiProvider>
    );
}

'use client';

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
    Identity,
} from '@coinbase/onchainkit/identity';
import styles from './WalletConnect.module.css';

export function WalletConnect() {
    return (
        <div className={styles.walletWrapper}>
            <Wallet>
                <ConnectWallet>
                    <Avatar className={styles.avatar} />
                    <Name className={styles.name} />
                </ConnectWallet>
                <WalletDropdown>
                    <Identity className={styles.identity} hasCopyAddressOnClick>
                        <Avatar />
                        <Name />
                        <Address />
                    </Identity>
                    <WalletDropdownLink
                        icon="wallet"
                        href="https://wallet.coinbase.com"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Go to Wallet Dashboard
                    </WalletDropdownLink>
                    <WalletDropdownDisconnect />
                </WalletDropdown>
            </Wallet>
        </div>
    );
}

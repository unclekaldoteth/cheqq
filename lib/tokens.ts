// Token configuration for supported currencies on Tempo

import { normalizeCurrency, SUPPORTED_CURRENCIES, type SupportedCurrency } from './currency';

export interface TokenConfig {
    symbol: string;
    name: string;
    decimals: number;
    address: {
        'tempo-testnet': string;
    };
    logoUrl?: string;
}

export const TOKENS: Record<string, TokenConfig> = {
    AlphaUSD: {
        symbol: 'AlphaUSD',
        name: 'Alpha USD',
        decimals: 6,
        address: {
            'tempo-testnet': '0x20c0000000000000000000000000000000000001',
        },
        logoUrl: 'https://tokenlist.tempo.xyz/icon/42431/0x20c0000000000000000000000000000000000001',
    },
    BetaUSD: {
        symbol: 'BetaUSD',
        name: 'Beta USD',
        decimals: 6,
        address: {
            'tempo-testnet': '0x20c0000000000000000000000000000000000002',
        },
        logoUrl: 'https://tokenlist.tempo.xyz/icon/42431/0x20c0000000000000000000000000000000000002',
    },
    pathUSD: {
        symbol: 'pathUSD',
        name: 'Path USD',
        decimals: 6,
        address: {
            'tempo-testnet': '0x20c0000000000000000000000000000000000000',
        },
        logoUrl: 'https://tokenlist.tempo.xyz/icon/42431/0x20c0000000000000000000000000000000000000',
    },
};

/**
 * Get token config for current network
 */
export function getTokenConfig(symbol: string): TokenConfig | undefined {
    const normalized = normalizeCurrency(symbol);
    if (!normalized) return undefined;
    return TOKENS[normalized];
}

/**
 * Get token address for current network (Tempo Testnet)
 */
export function getTokenAddress(symbol: string): string {
    const token = getTokenConfig(symbol);
    if (!token) throw new Error(`Unknown token: ${symbol}`);
    return token.address['tempo-testnet'];
}

/**
 * Parse amount to smallest unit based on token decimals
 */
export function parseTokenAmount(amount: string, symbol: string): bigint {
    const token = getTokenConfig(symbol);
    if (!token) throw new Error(`Unknown token: ${symbol}`);
    const normalizedAmount = amount.trim();
    if (!/^(?:\d+|\d*\.\d+)$/.test(normalizedAmount)) {
        throw new Error('Amount must be a valid numeric string');
    }

    const [whole, decimal = ''] = normalizedAmount.split('.');
    const paddedDecimal = decimal.padEnd(token.decimals, '0').slice(0, token.decimals);
    return BigInt(whole + paddedDecimal);
}

/**
 * Format amount from smallest unit to display string
 */
export function formatTokenAmount(amount: bigint, symbol: string): string {
    const token = getTokenConfig(symbol);
    if (!token) throw new Error(`Unknown token: ${symbol}`);

    const str = amount.toString().padStart(token.decimals + 1, '0');
    const whole = str.slice(0, -token.decimals) || '0';
    const decimal = str.slice(-token.decimals);
    return `${whole}.${decimal}`;
}

/**
 * Get display name with symbol
 */
export function formatCurrency(amount: string, symbol: string): string {
    const num = parseFloat(amount);
    const safeValue = Number.isFinite(num) ? num : 0;
    return `$${safeValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${symbol}`;
}

/**
 * Available currencies for selection
 */
export { SUPPORTED_CURRENCIES };
export type { SupportedCurrency };

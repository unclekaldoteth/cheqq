// Token configuration for supported currencies on Base

export interface TokenConfig {
    symbol: string;
    name: string;
    decimals: number;
    address: {
        base: string;
        'base-sepolia': string;
    };
    logoUrl?: string;
}

export const TOKENS: Record<string, TokenConfig> = {
    USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: {
            base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
        },
        logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
    },
    IDRX: {
        symbol: 'IDRX',
        name: 'Indonesian Rupiah Token',
        decimals: 2, // IDR typically uses 2 decimals
        address: {
            base: '0x501D8569D2B7e3d1503Ff306837CeB28F5703122', // TODO: Confirm mainnet address
            'base-sepolia': '0x501D8569D2B7e3d1503Ff306837CeB28F5703122',
        },
        logoUrl: '/idrx-logo.png',
    },
    ETH: {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        address: {
            base: '0x0000000000000000000000000000000000000000',
            'base-sepolia': '0x0000000000000000000000000000000000000000',
        },
        logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    },
};

/**
 * Get token config for current network
 */
export function getTokenConfig(symbol: string): TokenConfig | undefined {
    return TOKENS[symbol.toUpperCase()];
}

/**
 * Get token address for current network
 */
export function getTokenAddress(symbol: string): string {
    const network = (process.env.NEXT_PUBLIC_CHAIN || 'base-sepolia') as 'base' | 'base-sepolia';
    const token = TOKENS[symbol.toUpperCase()];
    if (!token) throw new Error(`Unknown token: ${symbol}`);
    return token.address[network];
}

/**
 * Parse amount to smallest unit based on token decimals
 */
export function parseTokenAmount(amount: string, symbol: string): bigint {
    const token = getTokenConfig(symbol);
    if (!token) throw new Error(`Unknown token: ${symbol}`);

    const [whole, decimal = ''] = amount.split('.');
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
    if (symbol === 'IDRX') {
        return `Rp ${num.toLocaleString('id-ID')}`;
    }
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${symbol}`;
}

/**
 * Available currencies for selection
 */
export const SUPPORTED_CURRENCIES = ['USDC', 'IDRX'] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

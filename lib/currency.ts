/**
 * Canonical currency helpers for Tempo migration.
 * Keep this as the single source of truth to avoid case-sensitivity bugs.
 */

export const SUPPORTED_CURRENCIES = ['AlphaUSD', 'BetaUSD', 'pathUSD'] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

const CURRENCY_LOOKUP: Record<string, SupportedCurrency> = {
    ALPHAUSD: 'AlphaUSD',
    BETAUSD: 'BetaUSD',
    PATHUSD: 'pathUSD',
};

export function normalizeCurrency(
    value: string | null | undefined,
    fallback?: SupportedCurrency
): SupportedCurrency | null {
    if (typeof value !== 'string') {
        return fallback ?? null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return fallback ?? null;
    }

    return CURRENCY_LOOKUP[trimmed.toUpperCase()] ?? null;
}

export function isSupportedCurrency(value: string | null | undefined): value is SupportedCurrency {
    return normalizeCurrency(value) !== null;
}

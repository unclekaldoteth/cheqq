/**
 * Off-Ramp Service
 * 
 * Handles conversion of crypto to fiat currency.
 * For hackathon purposes, this is a simulated implementation.
 * In production, integrate with Circle, Ramp, or TransFi.
 */

import { normalizeCurrency } from './currency';

export interface OffRampQuote {
    inputAmount: string;
    inputCurrency: string;
    outputAmount: string;
    outputCurrency: string;
    exchangeRate: number;
    fee: string;
    feeCurrency: string;
    expiresAt: Date;
}

export interface OffRampTransaction {
    id: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    inputAmount: string;
    inputCurrency: string;
    outputAmount: string;
    outputCurrency: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    createdAt: Date;
    completedAt?: Date;
    txHash?: string;
}

// Simulated exchange rates (in production, fetch from API)
const EXCHANGE_RATES: Record<string, Record<string, number>> = {
    AlphaUSD: {
        USD: 1.0,
        IDR: 15700,
    },
    BetaUSD: {
        IDR: 1.0,
        USD: 0.0000637,
    },
};

// Fee percentage for off-ramp
const OFF_RAMP_FEE_PERCENT = 1.5;

/**
 * Get quote for off-ramp transaction
 */
export async function getOffRampQuote(
    inputAmount: string,
    inputCurrency: string,
    outputCurrency: string
): Promise<OffRampQuote> {
    const amount = parseFloat(inputAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Amount must be greater than zero');
    }
    const normalizedInputCurrency = normalizeCurrency(inputCurrency);
    const normalizedOutputCurrency = outputCurrency.trim().toUpperCase();
    const rates = normalizedInputCurrency ? EXCHANGE_RATES[normalizedInputCurrency] : null;

    if (!rates || !rates[normalizedOutputCurrency]) {
        throw new Error(`Unsupported conversion: ${inputCurrency} to ${outputCurrency}`);
    }

    const exchangeRate = rates[normalizedOutputCurrency];
    const fee = amount * (OFF_RAMP_FEE_PERCENT / 100);
    const netOutput = (amount - fee) * exchangeRate;

    return {
        inputAmount,
        inputCurrency: normalizedInputCurrency ?? inputCurrency,
        outputAmount: netOutput.toFixed(2),
        outputCurrency: normalizedOutputCurrency,
        exchangeRate,
        fee: fee.toFixed(6),
        feeCurrency: normalizedInputCurrency ?? inputCurrency,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    };
}

/**
 * Initiate off-ramp transaction (simulated)
 * In production, this would:
 * 1. Lock the crypto from user's wallet
 * 2. Initiate bank transfer via off-ramp provider
 * 3. Return tracking info
 */
export async function initiateOffRamp(
    userId: string,
    inputAmount: string,
    inputCurrency: string,
    outputCurrency: string,
    bankDetails: {
        bankName: string;
        accountNumber: string;
        accountName: string;
        swiftCode?: string;
    }
): Promise<OffRampTransaction> {
    const quote = await getOffRampQuote(inputAmount, inputCurrency, outputCurrency);

    // Generate simulated transaction
    const transaction: OffRampTransaction = {
        id: `offramp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        status: 'PENDING',
        inputAmount: quote.inputAmount,
        inputCurrency: quote.inputCurrency,
        outputAmount: quote.outputAmount,
        outputCurrency: quote.outputCurrency,
        bankName: bankDetails.bankName,
        accountNumber: maskAccountNumber(bankDetails.accountNumber),
        accountName: bankDetails.accountName,
        createdAt: new Date(),
    };

    // Simulate processing
    setTimeout(() => {
        // In production, update database status
        console.log(`[OffRamp] Transaction ${transaction.id} would be processed`);
    }, 5000);

    return transaction;
}

/**
 * Check off-ramp transaction status (simulated)
 */
export async function getOffRampStatus(transactionId: string): Promise<OffRampTransaction | null> {
    // In production, query database and off-ramp provider API
    // For now, return simulated completed status
    return {
        id: transactionId,
        status: 'COMPLETED',
        inputAmount: '100.00',
        inputCurrency: 'AlphaUSD',
        outputAmount: '1545500.00',
        outputCurrency: 'IDR',
        bankName: 'BCA',
        accountNumber: '****5678',
        accountName: 'John Doe',
        createdAt: new Date(Date.now() - 3600000),
        completedAt: new Date(),
    };
}

/**
 * Mask account number for display
 */
function maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) return '****';
    return '****' + accountNumber.slice(-4);
}

/**
 * Get supported output currencies for a given input currency
 */
export function getSupportedOutputCurrencies(inputCurrency: string): string[] {
    const normalizedCurrency = normalizeCurrency(inputCurrency);
    const rates = normalizedCurrency ? EXCHANGE_RATES[normalizedCurrency] : null;
    return rates ? Object.keys(rates) : [];
}

/**
 * Validate bank details
 */
export function validateBankDetails(details: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
}): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!details.bankName?.trim()) {
        errors.push('Bank name is required');
    }

    if (!details.accountNumber?.trim()) {
        errors.push('Account number is required');
    } else if (details.accountNumber.length < 8) {
        errors.push('Account number must be at least 8 digits');
    }

    if (!details.accountName?.trim()) {
        errors.push('Account holder name is required');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

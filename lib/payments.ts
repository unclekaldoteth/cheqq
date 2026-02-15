/**
 * Payment Utilities for Tempo
 * Handles invoice payments and payment status tracking using on-chain TIP-20 transfers.
 */

export interface PaymentResult {
    id: string;
    status: 'pending' | 'completed' | 'failed';
    txHash?: string;
    amount?: string;
    recipientAddress?: string;
    createdAt?: string;
}

/**
 * Create a payment request for an invoice
 * On Tempo, payments are tracked via on-chain TIP-20 transfers
 * @param amount Amount in AlphaUSD
 * @param recipientAddress Wallet address to receive payment
 * @returns Payment result with ID
 */
export async function createInvoicePayment(
    amount: string,
    recipientAddress: string
): Promise<PaymentResult> {
    // Generate a payment ID for tracking
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return {
        id: paymentId,
        status: 'pending',
        amount,
        recipientAddress,
        createdAt: new Date().toISOString(),
    };
}

/**
 * Check the status of a payment by looking up the transaction on-chain
 * @param paymentId Payment ID
 * @returns Payment status
 */
export async function checkPaymentStatus(paymentId: string): Promise<PaymentResult> {
    // In production, look up the transaction status on Tempo
    // For now, returns pending - the frontend will poll for confirmation
    return {
        id: paymentId,
        status: 'pending',
    };
}

/**
 * Generate a payment link for an invoice
 * @param invoiceId ID of the invoice
 * @param amount Amount in stablecoin
 * @returns Payment URL
 */
export function generatePaymentLink(invoiceId: string, amount: string): string {
    const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return `${baseUrl}/pay/${invoiceId}?amount=${encodeURIComponent(amount)}`;
}

/**
 * Format wallet address for display
 * @param address Full wallet address
 * @param chars Number of characters to show at start/end
 * @returns Shortened address
 */
export function shortenAddress(address: string, chars: number = 4): string {
    if (!address) return '';
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Parse amount to proper decimals for AlphaUSD (6 decimals)
 */
export function parseAlphaUSDAmount(amount: string): bigint {
    const [whole, decimal = ''] = amount.split('.');
    const paddedDecimal = decimal.padEnd(6, '0').slice(0, 6);
    return BigInt(whole + paddedDecimal);
}

/**
 * Format AlphaUSD amount from bigint to string
 */
export function formatAlphaUSDAmount(amount: bigint): string {
    const str = amount.toString().padStart(7, '0');
    const whole = str.slice(0, -6) || '0';
    const decimal = str.slice(-6);
    return `${whole}.${decimal}`;
}

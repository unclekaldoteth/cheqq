import { pay, getPaymentStatus } from '@base-org/account';

export interface PaymentResult {
    id: string;
    status: 'pending' | 'completed' | 'failed';
}

/**
 * Create a payment request for an invoice using Base Pay
 * @param amount Amount in USDC
 * @param recipientAddress Wallet address to receive payment
 * @returns Payment result with ID
 */
export async function createInvoicePayment(
    amount: string,
    recipientAddress: string
): Promise<PaymentResult> {
    try {
        const isTestnet = process.env.NEXT_PUBLIC_CHAIN !== 'base';

        const payment = await pay({
            amount,
            to: recipientAddress,
            testnet: isTestnet,
        });

        return {
            id: payment.id,
            status: 'pending',
        };
    } catch (error) {
        console.error('Payment creation failed:', error);
        throw error;
    }
}

/**
 * Check the status of a payment
 * @param paymentId Payment ID from createInvoicePayment
 * @returns Payment status
 */
export async function checkPaymentStatus(paymentId: string): Promise<PaymentResult> {
    try {
        const isTestnet = process.env.NEXT_PUBLIC_CHAIN !== 'base';

        const status = await getPaymentStatus({
            id: paymentId,
            testnet: isTestnet,
        });

        // SDK returns 'pending' | 'completed' | 'failed' | 'not_found'
        // Map 'not_found' to 'failed' for our simplified type
        const paymentStatus: 'pending' | 'completed' | 'failed' =
            status.status === 'not_found' ? 'failed' : status.status;

        return {
            id: paymentId,
            status: paymentStatus,
        };
    } catch (error) {
        console.error('Payment status check failed:', error);
        throw error;
    }
}

/**
 * Generate a payment link for an invoice
 * @param invoiceId ID of the invoice
 * @param amount Amount in USDC
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
 * Parse amount to proper decimals for USDC (6 decimals)
 */
export function parseUSDCAmount(amount: string): bigint {
    const [whole, decimal = ''] = amount.split('.');
    const paddedDecimal = decimal.padEnd(6, '0').slice(0, 6);
    return BigInt(whole + paddedDecimal);
}

/**
 * Format USDC amount from bigint to string
 */
export function formatUSDCAmount(amount: bigint): string {
    const str = amount.toString().padStart(7, '0');
    const whole = str.slice(0, -6) || '0';
    const decimal = str.slice(-6);
    return `${whole}.${decimal}`;
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ConnectWallet, Wallet } from '@coinbase/onchainkit/wallet';
import { useAccount } from 'wagmi';
import { createInvoicePayment } from '@/lib/payments';
import { TOKENS, formatCurrency, type SupportedCurrency } from '@/lib/tokens';
import styles from './page.module.css';

interface Invoice {
    id: string;
    clientName: string;
    amount: string;
    currency: string;
    description: string;
    status: string;
    company?: {
        id: string;
        name: string;
        walletAddress: string | null;
    } | null;
    freelancer?: {
        id: string;
        name: string;
        walletAddress: string | null;
    } | null;
}

const normalizeCurrency = (value: string | null | undefined): SupportedCurrency => {
    return value === 'IDRX' ? 'IDRX' : 'USDC';
};

export default function PaymentPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const invoiceId = params.invoiceId as string;
    const amountParam = searchParams.get('amount') || '0';
    const currencyParam = normalizeCurrency(searchParams.get('currency'));
    const recipientParam = searchParams.get('recipient') || searchParams.get('to');

    const { isConnected, address } = useAccount();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(currencyParam);
    const [paymentComplete, setPaymentComplete] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fallbackInvoice: Invoice = {
            id: invoiceId,
            clientName: 'Client',
            amount: amountParam,
            currency: currencyParam,
            description: `Payment for invoice ${invoiceId}`,
            status: 'pending',
        };

        const loadInvoice = async () => {
            try {
                const response = await fetch(`/api/invoices?id=${invoiceId}`);
                if (!response.ok) {
                    if (isMounted) {
                        setInvoice(fallbackInvoice);
                    }
                    return;
                }
                const data = await response.json();
                if (!isMounted) return;
                const loadedInvoice = data.invoice as Invoice;
                setInvoice({
                    ...loadedInvoice,
                    amount: loadedInvoice.amount?.toString?.() || amountParam,
                    currency: normalizeCurrency(loadedInvoice.currency),
                });
            } catch (error) {
                if (isMounted) {
                    setInvoice(fallbackInvoice);
                }
            }
        };

        loadInvoice();
        return () => {
            isMounted = false;
        };
    }, [invoiceId, amountParam, currencyParam]);

    useEffect(() => {
        if (invoice?.currency) {
            setSelectedCurrency(normalizeCurrency(invoice.currency));
        }
    }, [invoice?.currency]);

    const recipientAddress =
        invoice?.company?.walletAddress ||
        invoice?.freelancer?.walletAddress ||
        recipientParam ||
        null;

    const payableAmount = invoice?.amount || amountParam;
    const parsedAmount = Number.parseFloat(payableAmount);
    const hasValidAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;

    const handlePay = async () => {
        if (!recipientAddress) {
            setPaymentError('Recipient wallet is not configured for this invoice.');
            return;
        }
        if (!hasValidAmount) {
            setPaymentError('Invoice amount is invalid.');
            return;
        }
        if (selectedCurrency !== 'USDC') {
            setPaymentError('Only USDC payments are supported right now.');
            return;
        }

        setIsPaying(true);
        setPaymentError(null);

        try {
            const payment = await createInvoicePayment(payableAmount, recipientAddress);

            await fetch('/api/payments/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId,
                    amount: payableAmount,
                    currency: selectedCurrency,
                    status: 'COMPLETED',
                    txHash: payment.id,
                    payerAddress: address || null,
                }),
            });

            setPaymentComplete(true);
        } catch (error) {
            console.error('Payment failed:', error);
            setPaymentError('Payment failed. Please try again.');
        } finally {
            setIsPaying(false);
        }
    };

    const getDisplayAmount = () => {
        if (selectedCurrency === 'IDRX') {
            return formatCurrency(payableAmount, 'IDRX');
        }
        return `$${payableAmount} USDC`;
    };

    if (!invoice) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading invoice...</div>
            </div>
        );
    }

    if (paymentComplete) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.successIcon}>✓</div>
                    <h1 className={styles.title}>Payment Complete!</h1>
                    <p className={styles.subtitle}>
                        Thank you for your payment of {getDisplayAmount()}
                    </p>
                    <p className={styles.invoiceId}>Invoice: {invoice.id}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.logo}>
                    <span className={styles.logoIcon}>💰</span>
                    <span className={styles.logoText}>Cheqq</span>
                </div>

                <h1 className={styles.title}>Pay Invoice</h1>

                <div className={styles.invoiceDetails}>
                    <div className={styles.row}>
                        <span className={styles.label}>Invoice</span>
                        <span className={styles.value}>{invoice.id}</span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Description</span>
                        <span className={styles.value}>{invoice.description}</span>
                    </div>

                    <div className={styles.currencySection}>
                        <span className={styles.label}>Pay with</span>
                        <div className={styles.currencyOptions}>
                            {(['USDC', 'IDRX'] as SupportedCurrency[]).map((currency) => (
                                <button
                                    key={currency}
                                    className={`${styles.currencyButton} ${selectedCurrency === currency ? styles.currencyButtonActive : ''
                                        }`}
                                    onClick={() => setSelectedCurrency(currency)}
                                    type="button"
                                >
                                    <span className={styles.currencyIcon}>
                                        {currency === 'USDC' ? '💵' : '🇮🇩'}
                                    </span>
                                    <span className={styles.currencyName}>{currency}</span>
                                    <span className={styles.currencyFullName}>
                                        {TOKENS[currency].name}
                                    </span>
                                </button>
                            ))}
                        </div>
                        {selectedCurrency === 'IDRX' && (
                            <p className={styles.notice}>
                                IDRX payments are coming soon.
                            </p>
                        )}
                    </div>

                    <div className={styles.divider}></div>
                    <div className={styles.amountRow}>
                        <span className={styles.amountLabel}>Amount Due</span>
                        <span className={styles.amount}>{getDisplayAmount()}</span>
                    </div>
                </div>

                {!isConnected ? (
                    <div className={styles.connectSection}>
                        <p className={styles.connectText}>Connect your wallet to pay</p>
                        <Wallet>
                            <ConnectWallet className={styles.connectButton} />
                        </Wallet>
                    </div>
                ) : (
                    <div className={styles.checkoutSection}>
                        <button
                            className={styles.payButton}
                            disabled={!hasValidAmount || !recipientAddress || isPaying || selectedCurrency !== 'USDC'}
                            onClick={handlePay}
                            type="button"
                        >
                            {isPaying ? 'Processing...' : 'Pay Invoice'}
                        </button>
                        {paymentError && (
                            <p className={styles.error}>{paymentError}</p>
                        )}
                    </div>
                )}

                <p className={styles.footer}>
                    Powered by Base · Secured by Coinbase
                </p>
            </div>
        </div>
    );
}

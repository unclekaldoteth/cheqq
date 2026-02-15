'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Sidebar, TopBar } from '@/components/dashboard';
import { InvoiceForm, PaymentLinkModal } from '@/components/dashboard/invoice';
import { useUser } from '@/contexts/UserContext';
import styles from './page.module.css';

interface InvoiceFormData {
    clientName: string;
    clientEmail: string;
    amount: string;
    currency: 'AlphaUSD' | 'BetaUSD' | 'pathUSD';
    dueDate: string;
    memo: string;
}

export default function NewInvoicePage() {
    const router = useRouter();
    const { user, userType } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [createdInvoice, setCreatedInvoice] = useState<{
        invoiceNumber: string;
        clientName: string;
        amount: number;
        currency: string;
        paymentLink: string;
    } | null>(null);

    const handleSubmit = async (data: InvoiceFormData) => {
        setIsLoading(true);
        setError(null);

        // Get company ID
        const companyId = userType === 'company' && user?.id ? user.id : null;
        if (!companyId) {
            setError('Unable to identify company. Please try logging in again.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyId,
                    clientName: data.clientName,
                    clientEmail: data.clientEmail,
                    description: data.memo || 'Invoice for services',
                    amount: data.amount,
                    currency: data.currency,
                    dueDate: data.dueDate,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create invoice');
            }

            // Generate invoice number from the real ID
            const invoiceNumber = `INV-${result.invoice.id.slice(-8).toUpperCase()}`;

            const walletAddress = user?.walletAddress?.trim();
            let paymentLink = result.paymentLink as string;
            if (paymentLink) {
                try {
                    const url = new URL(paymentLink, window.location.origin);
                    const hasRecipient = url.searchParams.get('recipient') || url.searchParams.get('to');
                    if (!hasRecipient && walletAddress) {
                        url.searchParams.set('recipient', walletAddress);
                        paymentLink = url.toString();
                    }
                } catch {
                    // Keep the original link if parsing fails.
                }
            }

            setCreatedInvoice({
                invoiceNumber,
                clientName: data.clientName,
                amount: parseFloat(data.amount),
                currency: data.currency,
                paymentLink,
            });

            setShowModal(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create invoice');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        router.push('/dashboard/invoices');
    };

    return (
        <div className={styles.dashboardLayout}>
            <Sidebar />
            <div className={styles.mainContent}>
                <TopBar />
                <main className={styles.main}>
                    {/* Page Header */}
                    <div className={styles.pageHeader}>
                        <button
                            className={styles.backBtn}
                            onClick={() => router.push('/dashboard/invoices')}
                        >
                            <ArrowLeft size={20} />
                            Back to Invoices
                        </button>
                        <h1>Create New Invoice</h1>
                        <p>Fill in the details to generate a payment link</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className={styles.errorBanner}>
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <div className={styles.formContainer}>
                        <InvoiceForm
                            onSubmit={handleSubmit}
                            onCancel={() => router.push('/dashboard/invoices')}
                            isLoading={isLoading}
                        />
                    </div>
                </main>
            </div>

            {/* Payment Link Modal */}
            {createdInvoice && (
                <PaymentLinkModal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                    invoiceNumber={createdInvoice.invoiceNumber}
                    clientName={createdInvoice.clientName}
                    amount={createdInvoice.amount}
                    currency={createdInvoice.currency}
                    paymentLink={createdInvoice.paymentLink}
                />
            )}
        </div>
    );
}

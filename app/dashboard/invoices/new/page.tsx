'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Sidebar, TopBar } from '@/components/dashboard';
import { InvoiceForm, PaymentLinkModal } from '@/components/dashboard/invoice';
import styles from './page.module.css';

interface InvoiceFormData {
    clientName: string;
    clientEmail: string;
    amount: string;
    currency: 'USDC' | 'IDRX';
    dueDate: string;
    memo: string;
}

export default function NewInvoicePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
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

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Generate mock invoice
        const invoiceNumber = `INV-2024-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        const paymentLink = `${window.location.origin}/pay/${invoiceNumber.toLowerCase()}`;

        setCreatedInvoice({
            invoiceNumber,
            clientName: data.clientName,
            amount: parseFloat(data.amount),
            currency: data.currency,
            paymentLink,
        });

        setShowModal(true);
        setIsLoading(false);
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

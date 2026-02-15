'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Link as LinkIcon, Copy, Check, AlertCircle } from 'lucide-react';
import { FreelancerSidebar, FreelancerTopBar } from '@/components/freelancer';
import { useUser } from '@/contexts/UserContext';
import styles from './page.module.css';

interface InvoiceFormData {
    clientName: string;
    clientEmail: string;
    amount: string;
    currency: 'AlphaUSD' | 'BetaUSD' | 'pathUSD';
    description: string;
    dueDate: string;
}

export default function NewInvoicePage() {
    const router = useRouter();
    const { user, userType } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPaymentLink, setShowPaymentLink] = useState(false);
    const [paymentLink, setPaymentLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [formData, setFormData] = useState<InvoiceFormData>({
        clientName: '',
        clientEmail: '',
        amount: '',
        currency: 'AlphaUSD',
        description: '',
        dueDate: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Get freelancer ID
        const freelancerId = userType === 'freelancer' && user?.id ? user.id : null;
        if (!freelancerId) {
            setError('Unable to identify freelancer. Please try logging in again.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    freelancerId,
                    clientName: formData.clientName,
                    clientEmail: formData.clientEmail,
                    description: formData.description || 'Invoice for services',
                    amount: formData.amount,
                    currency: formData.currency,
                    dueDate: formData.dueDate,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create invoice');
            }

            const walletAddress = user?.walletAddress?.trim();
            let paymentLinkValue = data.paymentLink as string;
            if (paymentLinkValue) {
                try {
                    const url = new URL(paymentLinkValue, window.location.origin);
                    const hasRecipient = url.searchParams.get('recipient') || url.searchParams.get('to');
                    if (!hasRecipient && walletAddress) {
                        url.searchParams.set('recipient', walletAddress);
                        paymentLinkValue = url.toString();
                    }
                } catch {
                    // Keep the original link if parsing fails.
                }
            }

            setPaymentLink(paymentLinkValue);
            setShowPaymentLink(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create invoice');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(paymentLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (showPaymentLink) {
        return (
            <div className={styles.dashboardLayout}>
                <FreelancerSidebar />
                <div className={styles.mainContent}>
                    <FreelancerTopBar />
                    <main className={styles.main}>
                        <div className={styles.successCard}>
                            <div className={styles.successIcon}>
                                <Check size={32} />
                            </div>
                            <h2>Invoice Created!</h2>
                            <p>Share this payment link with your client</p>

                            <div className={styles.linkBox}>
                                <LinkIcon size={18} />
                                <span>{paymentLink}</span>
                                <button onClick={handleCopyLink} className={styles.copyBtn}>
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                            </div>

                            <div className={styles.successDetails}>
                                <div className={styles.detailRow}>
                                    <span>Client</span>
                                    <span>{formData.clientName}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Amount</span>
                                    <span>{formData.amount} {formData.currency}</span>
                                </div>
                            </div>

                            <div className={styles.successActions}>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => router.push('/freelancer/invoices')}
                                >
                                    View All Invoices
                                </button>
                                <button
                                    className="btn btn-primary"
                                    style={{ background: '#00D395' }}
                                    onClick={() => {
                                        setShowPaymentLink(false);
                                        setFormData({
                                            clientName: '',
                                            clientEmail: '',
                                            amount: '',
                                            currency: 'AlphaUSD',
                                            description: '',
                                            dueDate: '',
                                        });
                                    }}
                                >
                                    Create Another
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dashboardLayout}>
            <FreelancerSidebar />
            <div className={styles.mainContent}>
                <FreelancerTopBar />
                <main className={styles.main}>
                    {/* Page Header */}
                    <div className={styles.pageHeader}>
                        <button
                            className={styles.backBtn}
                            onClick={() => router.push('/freelancer/invoices')}
                        >
                            <ArrowLeft size={20} />
                            Back to Invoices
                        </button>
                        <h1>Create Invoice</h1>
                        <p>Send an invoice to your client</p>
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
                        <form className={styles.form} onSubmit={handleSubmit}>
                            {/* Client Information */}
                            <div className={styles.formSection}>
                                <h3>Client Details</h3>
                                <div className={styles.formGrid}>
                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label htmlFor="clientName">Client Name</label>
                                        <input
                                            type="text"
                                            id="clientName"
                                            name="clientName"
                                            value={formData.clientName}
                                            onChange={handleChange}
                                            placeholder="Company or person name"
                                            required
                                        />
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label htmlFor="clientEmail">Client Email</label>
                                        <input
                                            type="email"
                                            id="clientEmail"
                                            name="clientEmail"
                                            value={formData.clientEmail}
                                            onChange={handleChange}
                                            placeholder="client@company.com"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Invoice Details */}
                            <div className={styles.formSection}>
                                <h3>Invoice Details</h3>
                                <div className={styles.formGrid}>
                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label htmlFor="amount">Amount</label>
                                        <div className={styles.amountGroup}>
                                            <input
                                                type="number"
                                                id="amount"
                                                name="amount"
                                                value={formData.amount}
                                                onChange={handleChange}
                                                placeholder="1000"
                                                min="0"
                                                step="0.01"
                                                className={styles.amountInput}
                                                required
                                            />
                                            <select
                                                name="currency"
                                                value={formData.currency}
                                                onChange={handleChange}
                                                className={styles.currencySelect}
                                            >
                                                <option value="AlphaUSD">AlphaUSD</option>
                                                <option value="BetaUSD">BetaUSD</option>
                                                <option value="pathUSD">pathUSD</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label htmlFor="dueDate">Due Date</label>
                                        <input
                                            type="date"
                                            id="dueDate"
                                            name="dueDate"
                                            value={formData.dueDate}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label htmlFor="description">Description</label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="Services rendered, project details..."
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className={styles.formActions}>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => router.push('/freelancer/invoices')}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ background: '#00D395' }}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Creating...' : 'Create & Get Link'}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}

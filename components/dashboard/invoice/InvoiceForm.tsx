'use client';

import { useState } from 'react';
import { Calendar, DollarSign, User, Mail, FileText } from 'lucide-react';
import styles from './InvoiceForm.module.css';

interface InvoiceFormData {
    clientName: string;
    clientEmail: string;
    amount: string;
    currency: 'AlphaUSD' | 'BetaUSD' | 'pathUSD';
    dueDate: string;
    memo: string;
}

interface InvoiceFormProps {
    onSubmit: (data: InvoiceFormData) => void;
    onCancel?: () => void;
    isLoading?: boolean;
}

export default function InvoiceForm({ onSubmit, onCancel, isLoading }: InvoiceFormProps) {
    const [formData, setFormData] = useState<InvoiceFormData>({
        clientName: '',
        clientEmail: '',
        amount: '',
        currency: 'AlphaUSD',
        dueDate: '',
        memo: '',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof InvoiceFormData, string>>>({});

    const validateForm = () => {
        const newErrors: Partial<Record<keyof InvoiceFormData, string>> = {};

        if (!formData.clientName.trim()) {
            newErrors.clientName = 'Client name is required';
        }

        if (!formData.clientEmail.trim()) {
            newErrors.clientEmail = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
            newErrors.clientEmail = 'Invalid email address';
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Valid amount is required';
        }

        if (!formData.dueDate) {
            newErrors.dueDate = 'Due date is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    const handleChange = (field: keyof InvoiceFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Client Details</h3>
                <div className={styles.fieldGroup}>
                    <div className={styles.field}>
                        <label className={styles.label}>
                            <User size={16} />
                            Client Name
                        </label>
                        <input
                            type="text"
                            className={`${styles.input} ${errors.clientName ? styles.error : ''}`}
                            placeholder="Enter client name"
                            value={formData.clientName}
                            onChange={(e) => handleChange('clientName', e.target.value)}
                        />
                        {errors.clientName && (
                            <span className={styles.errorText}>{errors.clientName}</span>
                        )}
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>
                            <Mail size={16} />
                            Email Address
                        </label>
                        <input
                            type="email"
                            className={`${styles.input} ${errors.clientEmail ? styles.error : ''}`}
                            placeholder="client@example.com"
                            value={formData.clientEmail}
                            onChange={(e) => handleChange('clientEmail', e.target.value)}
                        />
                        {errors.clientEmail && (
                            <span className={styles.errorText}>{errors.clientEmail}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Payment Details</h3>
                <div className={styles.fieldGroup}>
                    <div className={styles.field}>
                        <label className={styles.label}>
                            <DollarSign size={16} />
                            Amount
                        </label>
                        <div className={styles.amountWrapper}>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className={`${styles.input} ${styles.amountInput} ${errors.amount ? styles.error : ''}`}
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => handleChange('amount', e.target.value)}
                            />
                            <select
                                className={styles.currencySelect}
                                value={formData.currency}
                                onChange={(e) => handleChange('currency', e.target.value)}
                            >
                                <option value="AlphaUSD">AlphaUSD</option>
                                <option value="BetaUSD">BetaUSD</option>
                                <option value="pathUSD">pathUSD</option>
                            </select>
                        </div>
                        {errors.amount && (
                            <span className={styles.errorText}>{errors.amount}</span>
                        )}
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>
                            <Calendar size={16} />
                            Due Date
                        </label>
                        <input
                            type="date"
                            className={`${styles.input} ${errors.dueDate ? styles.error : ''}`}
                            value={formData.dueDate}
                            onChange={(e) => handleChange('dueDate', e.target.value)}
                        />
                        {errors.dueDate && (
                            <span className={styles.errorText}>{errors.dueDate}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Additional Details</h3>
                <div className={styles.field}>
                    <label className={styles.label}>
                        <FileText size={16} />
                        Memo / Notes (Optional)
                    </label>
                    <textarea
                        className={styles.textarea}
                        placeholder="Add any additional notes or payment instructions..."
                        rows={4}
                        value={formData.memo}
                        onChange={(e) => handleChange('memo', e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.formActions}>
                {onCancel && (
                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                >
                    {isLoading ? 'Creating...' : 'Create Invoice'}
                </button>
            </div>
        </form>
    );
}

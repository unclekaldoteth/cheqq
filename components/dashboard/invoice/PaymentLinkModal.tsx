'use client';

import { useState } from 'react';
import { X, Copy, Check, ExternalLink, QrCode } from 'lucide-react';
import styles from './PaymentLinkModal.module.css';

interface PaymentLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoiceNumber: string;
    clientName: string;
    amount: number;
    currency: string;
    paymentLink: string;
}

export default function PaymentLinkModal({
    isOpen,
    onClose,
    invoiceNumber,
    clientName,
    amount,
    currency,
    paymentLink,
}: PaymentLinkModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(paymentLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={20} />
                </button>

                <div className={styles.header}>
                    <div className={styles.successIcon}>✓</div>
                    <h2>Invoice Created!</h2>
                    <p>Share the payment link with your client</p>
                </div>

                <div className={styles.invoiceInfo}>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Invoice</span>
                        <span className={styles.infoValue}>#{invoiceNumber}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Client</span>
                        <span className={styles.infoValue}>{clientName}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Amount</span>
                        <span className={`${styles.infoValue} ${styles.amount}`}>
                            {formatAmount(amount)} {currency}
                        </span>
                    </div>
                </div>

                <div className={styles.linkSection}>
                    <label className={styles.linkLabel}>Payment Link</label>
                    <div className={styles.linkBox}>
                        <input
                            type="text"
                            readOnly
                            value={paymentLink}
                            className={styles.linkInput}
                        />
                        <button
                            className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
                            onClick={handleCopy}
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                <div className={styles.qrSection}>
                    <div className={styles.qrPlaceholder}>
                        <QrCode size={32} />
                        <span>QR Code</span>
                    </div>
                    <p className={styles.qrHint}>Scan to pay with mobile wallet</p>
                </div>

                <div className={styles.actions}>
                    <button className="btn btn-outline" onClick={onClose}>
                        Close
                    </button>
                    <a
                        href={paymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                    >
                        <ExternalLink size={18} />
                        Open Link
                    </a>
                </div>
            </div>
        </div>
    );
}

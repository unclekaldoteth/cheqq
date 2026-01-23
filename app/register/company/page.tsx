'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight, ArrowLeft, Check, Upload } from 'lucide-react';
import { ConnectWallet, Wallet } from '@coinbase/onchainkit/wallet';
import { useAccount } from 'wagmi';
import styles from '../register.module.css';

interface FormData {
    companyName: string;
    registrationNumber: string;
    country: string;
    address: string;
    email: string;
    phone: string;
    industry: string;
    employeeCount: string;
    kybDocument: File | null;
}

const steps = [
    { id: 1, title: 'Company Info', description: 'Basic business details' },
    { id: 2, title: 'Verification', description: 'KYB documents' },
    { id: 3, title: 'Connect Wallet', description: 'Treasury setup' },
];

export default function CompanyRegisterPage() {
    const router = useRouter();
    const { isConnected, address } = useAccount();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({
        companyName: '',
        registrationNumber: '',
        country: '',
        address: '',
        email: '',
        phone: '',
        industry: '',
        employeeCount: '',
        kybDocument: null,
    });

    const updateFormData = (field: keyof FormData, value: string | File | null) => {
        setSubmitError(null);
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        setSubmitError(null);
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        setSubmitError(null);
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        if (!address) {
            setSubmitError('Please connect your wallet to continue.');
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        // In production, submit to API
        try {
            const payload = new FormData();
            for (const [key, value] of Object.entries(formData)) {
                if (value === null) continue;
                payload.append(key, value);
            }
            payload.append('walletAddress', address);

            const response = await fetch('/api/companies', {
                method: 'POST',
                body: payload,
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                const message = typeof data?.error === 'string'
                    ? data.error
                    : 'Registration failed. Please try again.';
                throw new Error(message);
            }

            // Redirect to dashboard
            router.push('/dashboard');
        } catch (error) {
            console.error('Registration failed:', error);
            setSubmitError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return formData.companyName && formData.email && formData.country;
            case 2:
                return formData.registrationNumber;
            case 3:
                return isConnected;
            default:
                return false;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.iconWrapper} style={{ background: 'linear-gradient(135deg, #0052FF, #0066FF)' }}>
                        <Building2 size={28} color="white" />
                    </div>
                    <h1 className={styles.title}>Company Registration</h1>
                    <p className={styles.subtitle}>Set up your business account</p>
                </div>

                {/* Progress Steps */}
                <div className={styles.steps}>
                    {steps.map((step, index) => (
                        <div
                            key={step.id}
                            className={`${styles.step} ${currentStep >= step.id ? styles.stepActive : ''} ${currentStep > step.id ? styles.stepComplete : ''}`}
                        >
                            <div className={styles.stepNumber}>
                                {currentStep > step.id ? <Check size={16} /> : step.id}
                            </div>
                            <div className={styles.stepInfo}>
                                <span className={styles.stepTitle}>{step.title}</span>
                                <span className={styles.stepDesc}>{step.description}</span>
                            </div>
                            {index < steps.length - 1 && <div className={styles.stepLine} />}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className={styles.formContent}>
                    {currentStep === 1 && (
                        <div className={styles.formStep}>
                            <div className={styles.inputGroup}>
                                <label>Company Name *</label>
                                <input
                                    type="text"
                                    value={formData.companyName}
                                    onChange={(e) => updateFormData('companyName', e.target.value)}
                                    placeholder="Acme Corporation"
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.inputRow}>
                                <div className={styles.inputGroup}>
                                    <label>Business Email *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => updateFormData('email', e.target.value)}
                                        placeholder="finance@company.com"
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => updateFormData('phone', e.target.value)}
                                        placeholder="+62 xxx xxx xxxx"
                                        className={styles.input}
                                    />
                                </div>
                            </div>
                            <div className={styles.inputRow}>
                                <div className={styles.inputGroup}>
                                    <label>Country *</label>
                                    <select
                                        value={formData.country}
                                        onChange={(e) => updateFormData('country', e.target.value)}
                                        className={styles.input}
                                    >
                                        <option value="">Select country</option>
                                        <option value="ID">Indonesia</option>
                                        <option value="SG">Singapore</option>
                                        <option value="MY">Malaysia</option>
                                        <option value="US">United States</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Industry</label>
                                    <select
                                        value={formData.industry}
                                        onChange={(e) => updateFormData('industry', e.target.value)}
                                        className={styles.input}
                                    >
                                        <option value="">Select industry</option>
                                        <option value="tech">Technology</option>
                                        <option value="finance">Finance</option>
                                        <option value="retail">Retail</option>
                                        <option value="services">Services</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className={styles.formStep}>
                            <div className={styles.kybNotice}>
                                <h3>🔒 KYB Verification Required</h3>
                                <p>To comply with regulations, we need to verify your business identity.</p>
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Business Registration Number *</label>
                                <input
                                    type="text"
                                    value={formData.registrationNumber}
                                    onChange={(e) => updateFormData('registrationNumber', e.target.value)}
                                    placeholder="e.g., NIB or SIUP number"
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Business Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => updateFormData('address', e.target.value)}
                                    placeholder="Full business address"
                                    className={styles.textarea}
                                    rows={3}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Upload Business Document</label>
                                <div className={`${styles.uploadArea} ${formData.kybDocument ? styles.uploadSuccess : ''}`}>
                                    {formData.kybDocument ? (
                                        <>
                                            <Check size={32} color="#22c55e" />
                                            <p style={{ color: '#22c55e', fontWeight: 600 }}>Document Uploaded</p>
                                            <span>{formData.kybDocument.name}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={32} />
                                            <p>Drag & drop or click to upload</p>
                                            <span>SIUP, NIB, or Company Certificate</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => updateFormData('kybDocument', e.target.files?.[0] || null)}
                                        className={styles.fileInput}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className={styles.formStep}>
                            <div className={styles.walletSection}>
                                <h3>Connect Treasury Wallet</h3>
                                <p>This wallet will be used for payroll and receiving payments.</p>

                                {isConnected ? (
                                    <div className={styles.walletConnected}>
                                        <Check size={24} color="#22c55e" />
                                        <div>
                                            <span className={styles.walletLabel}>Connected</span>
                                            <span className={styles.walletAddress}>
                                                {address?.slice(0, 6)}...{address?.slice(-4)}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <Wallet>
                                        <ConnectWallet className={styles.connectButton} />
                                    </Wallet>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {submitError && (
                    <p className={styles.submitError}>{submitError}</p>
                )}
                <div className={styles.actions}>
                    {currentStep > 1 && (
                        <button onClick={handleBack} className={styles.backButton}>
                            <ArrowLeft size={18} /> Back
                        </button>
                    )}

                    {currentStep < 3 ? (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className={styles.nextButton}
                        >
                            Continue <ArrowRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!canProceed() || isSubmitting}
                            className={styles.submitButton}
                        >
                            {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

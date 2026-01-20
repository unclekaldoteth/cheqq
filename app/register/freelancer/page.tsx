'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, ArrowRight, ArrowLeft, Check, Upload, Shield } from 'lucide-react';
import { ConnectWallet, Wallet } from '@coinbase/onchainkit/wallet';
import { useAccount } from 'wagmi';
import styles from '../register.module.css';

interface FormData {
    fullName: string;
    email: string;
    phone: string;
    country: string;
    idType: string;
    idNumber: string;
    idDocument: File | null;
    profession: string;
}

const steps = [
    { id: 1, title: 'Personal Info', description: 'Basic details' },
    { id: 2, title: 'KYC Verification', description: 'Identity check' },
    { id: 3, title: 'Connect Wallet', description: 'Payment setup' },
];

export default function FreelancerRegisterPage() {
    const router = useRouter();
    const { isConnected, address } = useAccount();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        email: '',
        phone: '',
        country: '',
        idType: '',
        idNumber: '',
        idDocument: null,
        profession: '',
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

        try {
            const response = await fetch('/api/freelancers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    walletAddress: address,
                }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                const message = typeof data?.error === 'string'
                    ? data.error
                    : 'Registration failed. Please try again.';
                throw new Error(message);
            }

            router.push('/freelancer/dashboard');
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
                return formData.fullName && formData.email && formData.country;
            case 2:
                return formData.idType && formData.idNumber;
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
                    <div className={styles.iconWrapper} style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}>
                        <User size={28} color="white" />
                    </div>
                    <h1 className={styles.title}>Freelancer Registration</h1>
                    <p className={styles.subtitle}>Create your personal account</p>
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
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => updateFormData('fullName', e.target.value)}
                                    placeholder="John Doe"
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.inputRow}>
                                <div className={styles.inputGroup}>
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => updateFormData('email', e.target.value)}
                                        placeholder="you@email.com"
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
                                    <label>Profession</label>
                                    <select
                                        value={formData.profession}
                                        onChange={(e) => updateFormData('profession', e.target.value)}
                                        className={styles.input}
                                    >
                                        <option value="">Select profession</option>
                                        <option value="developer">Developer</option>
                                        <option value="designer">Designer</option>
                                        <option value="writer">Writer</option>
                                        <option value="marketing">Marketing</option>
                                        <option value="consultant">Consultant</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className={styles.formStep}>
                            <div className={styles.kybNotice}>
                                <Shield size={24} />
                                <div>
                                    <h3>KYC Verification</h3>
                                    <p>We need to verify your identity to enable payments.</p>
                                </div>
                            </div>
                            <div className={styles.inputRow}>
                                <div className={styles.inputGroup}>
                                    <label>ID Type *</label>
                                    <select
                                        value={formData.idType}
                                        onChange={(e) => updateFormData('idType', e.target.value)}
                                        className={styles.input}
                                    >
                                        <option value="">Select ID type</option>
                                        <option value="ktp">KTP (Indonesia)</option>
                                        <option value="passport">Passport</option>
                                        <option value="nric">NRIC (Singapore)</option>
                                        <option value="other">Other National ID</option>
                                    </select>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>ID Number *</label>
                                    <input
                                        type="text"
                                        value={formData.idNumber}
                                        onChange={(e) => updateFormData('idNumber', e.target.value)}
                                        placeholder="Enter ID number"
                                        className={styles.input}
                                    />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Upload ID Document</label>
                                <div className={styles.uploadArea}>
                                    <Upload size={32} />
                                    <p>Drag & drop or click to upload</p>
                                    <span>Photo of your ID (front side)</span>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.png"
                                        onChange={(e) => updateFormData('idDocument', e.target.files?.[0] || null)}
                                        className={styles.fileInput}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className={styles.formStep}>
                            <div className={styles.walletSection}>
                                <h3>Connect Your Wallet</h3>
                                <p>Receive payments directly to your crypto wallet.</p>

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

                                <div className={styles.withdrawNote}>
                                    <p>💡 You can also withdraw to bank account after connecting your wallet.</p>
                                </div>
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

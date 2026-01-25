'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, ArrowRight, ArrowLeft, Check, Upload, Shield, Linkedin, Github, Twitter, Globe, Star } from 'lucide-react';
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
    // Social connections (optional)
    linkedinUrl: string;
    githubUrl: string;
    twitterUrl: string;
    portfolioUrl: string;
    bio: string;
}

const steps = [
    { id: 1, title: 'Personal Info', description: 'Basic details' },
    { id: 2, title: 'Social Links', description: 'Boost reputation' },
    { id: 3, title: 'KYC Verification', description: 'Identity check' },
    { id: 4, title: 'Connect Wallet', description: 'Payment setup' },
];

// Reputation score calculation
function calculateReputationBoost(formData: FormData): number {
    let score = 0;
    if (formData.linkedinUrl) score += 15;
    if (formData.githubUrl) score += 15;
    if (formData.twitterUrl) score += 10;
    if (formData.portfolioUrl) score += 10;
    if (formData.bio && formData.bio.length >= 50) score += 10;
    return score;
}

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
        linkedinUrl: '',
        githubUrl: '',
        twitterUrl: '',
        portfolioUrl: '',
        bio: '',
    });

    const updateFormData = (field: keyof FormData, value: string | File | null) => {
        setSubmitError(null);
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        setSubmitError(null);
        if (currentStep < 4) {
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
            const payload = new FormData();
            for (const [key, value] of Object.entries(formData)) {
                if (value === null) continue;
                payload.append(key, value);
            }
            payload.append('walletAddress', address);

            const response = await fetch('/api/freelancers', {
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
                return true; // Social links are optional
            case 3:
                return formData.idType && formData.idNumber;
            case 4:
                return isConnected;
            default:
                return false;
        }
    };

    const reputationBoost = calculateReputationBoost(formData);

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
                            <div className={styles.kybNotice} style={{ background: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                                <Star size={24} color="#22c55e" />
                                <div>
                                    <h3>Boost Your Reputation</h3>
                                    <p>Link your social profiles to increase trust with clients. <em>(Optional)</em></p>
                                </div>
                            </div>

                            {reputationBoost > 0 && (
                                <div className={styles.reputationBoost}>
                                    <Star size={18} color="#f59e0b" />
                                    <span>+{reputationBoost} reputation points</span>
                                </div>
                            )}

                            <div className={styles.inputGroup}>
                                <label><Linkedin size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />LinkedIn URL</label>
                                <input
                                    type="url"
                                    value={formData.linkedinUrl}
                                    onChange={(e) => updateFormData('linkedinUrl', e.target.value)}
                                    placeholder="https://linkedin.com/in/johndoe"
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.inputRow}>
                                <div className={styles.inputGroup}>
                                    <label><Github size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />GitHub URL</label>
                                    <input
                                        type="url"
                                        value={formData.githubUrl}
                                        onChange={(e) => updateFormData('githubUrl', e.target.value)}
                                        placeholder="https://github.com/johndoe"
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label><Twitter size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />Twitter/X URL</label>
                                    <input
                                        type="url"
                                        value={formData.twitterUrl}
                                        onChange={(e) => updateFormData('twitterUrl', e.target.value)}
                                        placeholder="https://twitter.com/johndoe"
                                        className={styles.input}
                                    />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label><Globe size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />Portfolio Website</label>
                                <input
                                    type="url"
                                    value={formData.portfolioUrl}
                                    onChange={(e) => updateFormData('portfolioUrl', e.target.value)}
                                    placeholder="https://johndoe.com"
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Professional Bio <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>(50+ chars = +10 pts)</span></label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => updateFormData('bio', e.target.value)}
                                    placeholder="Tell clients about your expertise, experience, and what makes you stand out..."
                                    className={styles.textarea}
                                    rows={3}
                                />
                                <span style={{ fontSize: 12, color: formData.bio.length >= 50 ? '#22c55e' : 'rgba(255,255,255,0.4)' }}>
                                    {formData.bio.length}/50 characters
                                </span>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
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
                                <div className={`${styles.uploadArea} ${formData.idDocument ? styles.uploadSuccess : ''}`}>
                                    {formData.idDocument ? (
                                        <>
                                            <Check size={32} color="#22c55e" />
                                            <p style={{ color: '#22c55e', fontWeight: 600 }}>Document Uploaded</p>
                                            <span>{formData.idDocument.name}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={32} />
                                            <p>Drag & drop or click to upload</p>
                                            <span>Photo of your ID (front side)</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => updateFormData('idDocument', e.target.files?.[0] || null)}
                                        className={styles.fileInput}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
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

                    {currentStep < 4 ? (
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

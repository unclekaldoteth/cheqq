'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, ArrowRight, ArrowLeft, Check, Upload, Shield, Linkedin, Github, Twitter, Star, ExternalLink, Wallet } from 'lucide-react';
import { usePrivy, useLogin, useLinkAccount } from '@privy-io/react-auth';
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
    bio: string;
}

type ValidationErrors = Partial<Record<keyof FormData, string>>;

interface LinkedAccounts {
    linkedin: string | null;
    github: string | null;
    twitter: string | null;
}

const steps = [
    { id: 1, title: 'Personal Info', description: 'Basic details' },
    { id: 2, title: 'Social Links', description: 'Boost reputation' },
    { id: 3, title: 'KYC Verification', description: 'Identity check' },
    { id: 4, title: 'Connect Wallet', description: 'Payment setup' },
];

// Validation helpers
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Reputation score calculation
function calculateReputationBoost(linkedAccounts: LinkedAccounts, bio: string): number {
    let score = 0;
    if (linkedAccounts.linkedin) score += 15;
    if (linkedAccounts.github) score += 15;
    if (linkedAccounts.twitter) score += 10;
    if (bio && bio.length >= 50) score += 10;
    return score;
}

export default function FreelancerRegisterPage() {
    const router = useRouter();
    const { user, authenticated, ready } = usePrivy();
    const { login } = useLogin();
    const { linkTwitter, linkGithub, linkLinkedIn } = useLinkAccount({
        onSuccess: () => {
            // Account linked successfully
        },
        onError: (error) => {
            console.error('Link account error:', error);
        },
    });

    // Wallet state from Privy
    const address = user?.wallet?.address;
    const isConnected = authenticated && !!address;

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        email: '',
        phone: '',
        country: '',
        idType: '',
        idNumber: '',
        idDocument: null,
        profession: '',
        bio: '',
    });

    // Extract linked accounts from Privy user
    const linkedAccounts: LinkedAccounts = {
        linkedin: user?.linkedAccounts?.find(a => a.type === 'linkedin_oauth')?.subject || null,
        github: user?.linkedAccounts?.find(a => a.type === 'github_oauth')?.subject || null,
        twitter: user?.linkedAccounts?.find(a => a.type === 'twitter_oauth')?.subject || null,
    };

    const updateFormData = (field: keyof FormData, value: string | File | null) => {
        setSubmitError(null);
        // Clear validation error for this field
        setValidationErrors(prev => ({ ...prev, [field]: undefined }));
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateStep = useCallback((step: number): boolean => {
        const errors: ValidationErrors = {};

        if (step === 1) {
            if (!formData.fullName || formData.fullName.trim().length < 2) {
                errors.fullName = 'Full name is required (min 2 characters)';
            }
            if (!formData.email) {
                errors.email = 'Email is required';
            } else if (!isValidEmail(formData.email)) {
                errors.email = 'Invalid email format';
            }
            if (!formData.country) {
                errors.country = 'Please select a country';
            }
        }

        if (step === 3) {
            if (!formData.idType) {
                errors.idType = 'Please select ID type';
            }
            if (!formData.idNumber || formData.idNumber.trim().length < 3) {
                errors.idNumber = 'ID number is required (min 3 characters)';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    const handleNext = () => {
        setSubmitError(null);

        if (!validateStep(currentStep)) {
            return;
        }

        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        setSubmitError(null);
        setValidationErrors({});
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;

        if (!isConnected || !address) {
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

            // Add linked social accounts
            if (linkedAccounts.linkedin) payload.append('linkedinUrl', `https://linkedin.com/in/${linkedAccounts.linkedin}`);
            if (linkedAccounts.github) payload.append('githubUrl', `https://github.com/${linkedAccounts.github}`);
            if (linkedAccounts.twitter) payload.append('twitterUrl', `https://twitter.com/${linkedAccounts.twitter}`);

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

    const reputationBoost = calculateReputationBoost(linkedAccounts, formData.bio);

    const handleLinkSocial = async (platform: 'linkedin' | 'github' | 'twitter') => {
        if (!authenticated) {
            // Need to login first
            login();
            return;
        }

        switch (platform) {
            case 'linkedin':
                linkLinkedIn();
                break;
            case 'github':
                linkGithub();
                break;
            case 'twitter':
                linkTwitter();
                break;
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
                                    className={`${styles.input} ${validationErrors.fullName ? styles.inputError : ''}`}
                                />
                                {validationErrors.fullName && (
                                    <span className={styles.fieldError}>{validationErrors.fullName}</span>
                                )}
                            </div>
                            <div className={styles.inputRow}>
                                <div className={styles.inputGroup}>
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => updateFormData('email', e.target.value)}
                                        placeholder="you@email.com"
                                        className={`${styles.input} ${validationErrors.email ? styles.inputError : ''}`}
                                    />
                                    {validationErrors.email && (
                                        <span className={styles.fieldError}>{validationErrors.email}</span>
                                    )}
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
                                        className={`${styles.input} ${validationErrors.country ? styles.inputError : ''}`}
                                    >
                                        <option value="">Select country</option>
                                        <option value="ID">Indonesia</option>
                                        <option value="SG">Singapore</option>
                                        <option value="MY">Malaysia</option>
                                        <option value="US">United States</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                    {validationErrors.country && (
                                        <span className={styles.fieldError}>{validationErrors.country}</span>
                                    )}
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
                                    <p>Connect your social profiles to increase trust with clients. <em>(Optional)</em></p>
                                </div>
                            </div>

                            {reputationBoost > 0 && (
                                <div className={styles.reputationBoost}>
                                    <Star size={18} color="#f59e0b" />
                                    <span>+{reputationBoost} reputation points</span>
                                </div>
                            )}

                            {/* Social Connect Buttons */}
                            <div className={styles.socialConnectGrid}>
                                <button
                                    type="button"
                                    onClick={() => handleLinkSocial('linkedin')}
                                    className={`${styles.socialConnectButton} ${linkedAccounts.linkedin ? styles.socialConnected : ''}`}
                                    disabled={!!linkedAccounts.linkedin}
                                >
                                    <Linkedin size={20} />
                                    <div className={styles.socialConnectInfo}>
                                        <span className={styles.socialConnectLabel}>
                                            {linkedAccounts.linkedin ? 'LinkedIn Connected' : 'Connect LinkedIn'}
                                        </span>
                                        {linkedAccounts.linkedin ? (
                                            <span className={styles.socialConnectUsername}>@{linkedAccounts.linkedin}</span>
                                        ) : (
                                            <span className={styles.socialConnectPoints}>+15 pts</span>
                                        )}
                                    </div>
                                    {linkedAccounts.linkedin ? <Check size={18} color="#22c55e" /> : <ExternalLink size={16} />}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleLinkSocial('github')}
                                    className={`${styles.socialConnectButton} ${linkedAccounts.github ? styles.socialConnected : ''}`}
                                    disabled={!!linkedAccounts.github}
                                >
                                    <Github size={20} />
                                    <div className={styles.socialConnectInfo}>
                                        <span className={styles.socialConnectLabel}>
                                            {linkedAccounts.github ? 'GitHub Connected' : 'Connect GitHub'}
                                        </span>
                                        {linkedAccounts.github ? (
                                            <span className={styles.socialConnectUsername}>@{linkedAccounts.github}</span>
                                        ) : (
                                            <span className={styles.socialConnectPoints}>+15 pts</span>
                                        )}
                                    </div>
                                    {linkedAccounts.github ? <Check size={18} color="#22c55e" /> : <ExternalLink size={16} />}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleLinkSocial('twitter')}
                                    className={`${styles.socialConnectButton} ${linkedAccounts.twitter ? styles.socialConnected : ''}`}
                                    disabled={!!linkedAccounts.twitter}
                                >
                                    <Twitter size={20} />
                                    <div className={styles.socialConnectInfo}>
                                        <span className={styles.socialConnectLabel}>
                                            {linkedAccounts.twitter ? 'Twitter Connected' : 'Connect Twitter'}
                                        </span>
                                        {linkedAccounts.twitter ? (
                                            <span className={styles.socialConnectUsername}>@{linkedAccounts.twitter}</span>
                                        ) : (
                                            <span className={styles.socialConnectPoints}>+10 pts</span>
                                        )}
                                    </div>
                                    {linkedAccounts.twitter ? <Check size={18} color="#22c55e" /> : <ExternalLink size={16} />}
                                </button>
                            </div>

                            <div className={styles.inputGroup} style={{ marginTop: 24 }}>
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
                                        className={`${styles.input} ${validationErrors.idType ? styles.inputError : ''}`}
                                    >
                                        <option value="">Select ID type</option>
                                        <option value="ktp">KTP (Indonesia)</option>
                                        <option value="passport">Passport</option>
                                        <option value="nric">NRIC (Singapore)</option>
                                        <option value="other">Other National ID</option>
                                    </select>
                                    {validationErrors.idType && (
                                        <span className={styles.fieldError}>{validationErrors.idType}</span>
                                    )}
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>ID Number *</label>
                                    <input
                                        type="text"
                                        value={formData.idNumber}
                                        onChange={(e) => updateFormData('idNumber', e.target.value)}
                                        placeholder="Enter ID number"
                                        className={`${styles.input} ${validationErrors.idNumber ? styles.inputError : ''}`}
                                    />
                                    {validationErrors.idNumber && (
                                        <span className={styles.fieldError}>{validationErrors.idNumber}</span>
                                    )}
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
                                    <button
                                        onClick={() => login({ loginMethods: ['wallet'] })}
                                        className={styles.connectButton}
                                        disabled={!ready}
                                    >
                                        <Wallet size={20} />
                                        Connect Wallet
                                    </button>
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

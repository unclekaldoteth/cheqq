'use client';

import { FileText, TrendingUp, Building2, User, Mail } from 'lucide-react';
import { WobbleCard } from '@/components/ui/wobble-card';
import styles from './HowItWorks.module.css';

const steps = [
    {
        number: '01',
        icon: <Mail size={28} />,
        title: 'Sign Up',
        description: 'Create an account with just your email — no wallet needed. We automatically create a smart wallet for you using Privy.',
    },
    {
        number: '02',
        icon: <FileText size={28} />,
        title: 'Manage',
        description: 'Companies: Create invoices, add employees, and run batch payroll. Freelancers: Send invoices and track payments.',
    },
    {
        number: '03',
        icon: <TrendingUp size={28} />,
        title: 'Grow',
        description: 'Companies: Earn yield on treasury via DeFi. Freelancers: Withdraw earnings to bank (IDR) or crypto wallet.',
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className={`section ${styles.howItWorks}`}>
            <div className="container">
                <div className="section-header">
                    <span className="badge">How It Works</span>
                    <h2>Get started in minutes, not days</h2>
                    <p>
                        One platform for Companies (B2B) and Freelancers (B2C).
                        Sign up with email and start managing your finances instantly.
                    </p>
                </div>

                {/* B2B vs B2C Cards with WobbleCard */}
                <div className={styles.audienceCards}>
                    <WobbleCard containerClassName={styles.wobbleContainer}>
                        <div className={styles.audienceIcon}><Building2 size={32} /></div>
                        <h3>For Companies (B2B)</h3>
                        <ul className={styles.audienceList}>
                            <li>Batch payroll in AlphaUSD/BetaUSD</li>
                            <li>Employee salary advances</li>
                            <li>Treasury DeFi yield</li>
                            <li>Invoice management</li>
                        </ul>
                    </WobbleCard>
                    <WobbleCard containerClassName={styles.wobbleContainer}>
                        <div className={styles.audienceIcon}><User size={32} /></div>
                        <h3>For Freelancers (B2C)</h3>
                        <ul className={styles.audienceList}>
                            <li>Create and send invoices</li>
                            <li>Accept crypto payments</li>
                            <li>Withdraw to bank (IDR)</li>
                            <li>Track earnings</li>
                        </ul>
                    </WobbleCard>
                </div>

                <div className={styles.stepsContainer}>
                    {steps.map((step, index) => (
                        <div key={index} className={styles.step}>
                            <div className={styles.stepNumber}>{step.number}</div>
                            <div className={styles.stepContent}>
                                <div className={styles.stepIcon}>{step.icon}</div>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={styles.connector}>
                                    <div className={styles.connectorLine}></div>
                                    <div className={styles.connectorArrow}>→</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className={styles.ctaContainer}>
                    <a href="/get-started" className="btn btn-primary">
                        Get Started Now
                    </a>
                </div>
            </div>
        </section>
    );
}

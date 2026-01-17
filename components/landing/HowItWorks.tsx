import { Wallet, FileText, TrendingUp } from 'lucide-react';
import styles from './HowItWorks.module.css';

const steps = [
    {
        number: '01',
        icon: <Wallet size={28} />,
        title: 'Connect',
        description: 'Link your wallet and set up your company profile. No seed phrases to manage — we use smart account abstraction for seamless onboarding.',
    },
    {
        number: '02',
        icon: <FileText size={28} />,
        title: 'Manage',
        description: 'Create invoices, add employees, and set up payroll schedules. Everything syncs in real-time with instant stablecoin settlements.',
    },
    {
        number: '03',
        icon: <TrendingUp size={28} />,
        title: 'Grow',
        description: 'Deposit treasury funds into DeFi protocols to earn yield. Offer salary advances to employees using their future payroll as collateral.',
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
                        Skip the paperwork. Connect your wallet and start managing your business finances instantly.
                    </p>
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
                    <a href="/dashboard" className="btn btn-primary">
                        Get Started Now
                    </a>
                </div>
            </div>
        </section>
    );
}

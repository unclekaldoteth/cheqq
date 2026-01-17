import { Zap, Globe, TrendingUp, Shield, Bot, CheckCircle } from 'lucide-react';
import styles from './Advantages.module.css';

const advantages = [
    {
        icon: <Zap size={24} />,
        title: 'Instant Payments',
        description: 'Settle transactions in seconds on Base L2. No more waiting days for bank transfers.',
    },
    {
        icon: <Globe size={24} />,
        title: 'IDRX Native',
        description: 'Built-in support for Indonesian Rupiah stablecoin. Perfect for local businesses going global.',
    },
    {
        icon: <TrendingUp size={24} />,
        title: 'Earn DeFi Yield',
        description: 'Put idle treasury to work via Morpho and Aerodrome. Earn up to 8% APY automatically.',
    },
    {
        icon: <Shield size={24} />,
        title: 'Self-Custody',
        description: 'Your keys, your funds. Non-custodial by design. We never touch your treasury.',
    },
    {
        icon: <Bot size={24} />,
        title: 'AI-Ready Payments',
        description: 'Programmable payments for AI agents and automated workflows. Future-proof your finance stack.',
    },
    {
        icon: <CheckCircle size={24} />,
        title: 'Compliance Built-in',
        description: 'Automatic tax reporting, employee records, and audit trails. Stay compliant effortlessly.',
    },
];

export default function Advantages() {
    return (
        <section id="advantages" className={`section ${styles.advantages}`}>
            <div className="container">
                <div className="section-header">
                    <span className="badge">Why Cheqq</span>
                    <h2>Built different. Built on Base.</h2>
                    <p>
                        Traditional payroll is slow, expensive, and outdated. Cheqq brings the speed of crypto
                        with the reliability your business needs.
                    </p>
                </div>

                <div className={styles.advantagesGrid}>
                    {advantages.map((item, index) => (
                        <div key={index} className={styles.advantageCard}>
                            <div className={styles.iconBox}>
                                {item.icon}
                            </div>
                            <h4>{item.title}</h4>
                            <p>{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

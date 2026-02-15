import { FileText, Wallet, TrendingUp, ArrowRight } from 'lucide-react';
import styles from './Products.module.css';

const products = [
    {
        icon: <FileText size={32} />,
        emoji: '📄',
        title: 'Invoice',
        description: 'Create, send, and track professional invoices. Get paid in AlphaUSD, BetaUSD, or any stablecoin. Automatic reminders and instant settlement.',
        features: ['E-signature support', 'Multi-currency', 'Auto-reminders', 'Instant settlement'],
        cta: 'Create Invoice',
        color: '#0052FF',
    },
    {
        icon: <Wallet size={32} />,
        emoji: '💰',
        title: 'Payroll',
        description: 'Pay your global team instantly in stablecoins. No banks, no delays, no borders. Automated scheduling and compliance tracking.',
        features: ['Global payments', 'Batch processing', 'Tax reports', 'Employee portal'],
        cta: 'Run Payroll',
        color: '#00D395',
    },
    {
        icon: <TrendingUp size={32} />,
        emoji: '📈',
        title: 'DeFi',
        description: 'Put your treasury to work. Earn yield on idle funds via Tempo DeFi protocols. Offer salary advances to employees with built-in collateral.',
        features: ['Up to 8% APY', 'Employee lending', 'Auto-compound', 'Risk management'],
        cta: 'Start Earning',
        color: '#8B5CF6',
    },
];

export default function Products() {
    return (
        <section id="products" className={`section ${styles.products}`}>
            <div className="container">
                <div className="section-header">
                    <span className="badge">Our Products</span>
                    <h2>Everything you need to manage business finance</h2>
                    <p>
                        From invoicing to payroll to DeFi yield — all in one unified platform built on Tempo.
                    </p>
                </div>

                <div className={styles.productGrid}>
                    {products.map((product, index) => (
                        <div key={index} className={styles.productCard}>
                            <div
                                className={styles.iconBox}
                                style={{ background: `${product.color}15`, color: product.color }}
                            >
                                <span className={styles.emoji}>{product.emoji}</span>
                            </div>
                            <h3>{product.title}</h3>
                            <p>{product.description}</p>
                            <ul className={styles.featureList}>
                                {product.features.map((feature, i) => (
                                    <li key={i}>
                                        <span className={styles.check}>✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <a
                                href="/dashboard"
                                className={styles.productCta}
                                style={{ color: product.color }}
                            >
                                {product.cta} <ArrowRight size={16} />
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

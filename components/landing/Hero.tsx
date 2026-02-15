'use client';

import { ArrowRight } from 'lucide-react';
import { Spotlight } from '@/components/ui/spotlight';
import { FlipWords } from '@/components/ui/flip-words';
import styles from './Hero.module.css';

const flipWords = ['DeFi', 'Invoicing', 'Payroll', 'Treasury'];

export default function Hero() {
    return (
        <section className={styles.hero}>
            {/* Spotlight Effect */}
            <Spotlight className={styles.spotlight} />

            <div className={`container ${styles.heroContainer}`}>
                <div className={styles.heroContent}>
                    {/* Badge */}
                    <div className="badge">
                        <span>🚀</span>
                        Built on Tempo • Tempo Hackathon 2026
                    </div>

                    {/* Headline with FlipWords */}
                    <h1 className={styles.headline}>
                        <FlipWords words={flipWords} className={styles.flipWord} /> & More.{' '}
                        <span className="text-gradient">Unified on Tempo.</span>
                    </h1>

                    {/* Subheadline */}
                    <p className={styles.subheadline}>
                        The all-in-one platform for invoice management, borderless payroll payments,
                        and DeFi yield generation. Pay employees instantly in AlphaUSD or BetaUSD,
                        and earn yield on your treasury.
                    </p>

                    {/* CTAs */}
                    <div className={styles.ctas}>
                        <a href="/get-started" className="btn btn-primary">
                            Get Started <ArrowRight size={18} />
                        </a>
                        <a href="#how-it-works" className="btn btn-outline">
                            How It Works
                        </a>
                    </div>

                    {/* Stats */}
                    <div className={styles.stats}>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>$0</span>
                            <span className={styles.statLabel}>Transaction Fees</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.stat}>
                            <span className={styles.statValue}>&lt;1s</span>
                            <span className={styles.statLabel}>Settlement Time</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.stat}>
                            <span className={styles.statValue}>4-8%</span>
                            <span className={styles.statLabel}>APY on Treasury</span>
                        </div>
                    </div>
                </div>

                {/* Hero Visual */}
                <div className={styles.heroVisual}>
                    <div className={styles.mockupContainer}>
                        {/* Dashboard Preview Card */}
                        <div className={styles.previewCard}>
                            <div className={styles.previewHeader}>
                                <div className={styles.previewDots}>
                                    <span></span><span></span><span></span>
                                </div>
                                <span className={styles.previewTitle}>Cheqq Dashboard</span>
                            </div>
                            <div className={styles.previewContent}>
                                {/* Balance Cards */}
                                <div className={styles.balanceRow}>
                                    <div className={styles.balanceCard}>
                                        <span className={styles.balanceLabel}>AlphaUSD Balance</span>
                                        <span className={styles.balanceValue}>$50,000.00</span>
                                    </div>
                                    <div className={styles.balanceCard}>
                                        <span className={styles.balanceLabel}>BetaUSD Balance</span>
                                        <span className={styles.balanceValue}>Rp 750,000,000</span>
                                    </div>
                                </div>
                                {/* Quick Actions */}
                                <div className={styles.quickActions}>
                                    <button className={styles.actionBtn}>📄 New Invoice</button>
                                    <button className={styles.actionBtn}>💰 Run Payroll</button>
                                    <button className={styles.actionBtn}>📈 Deposit</button>
                                </div>
                                {/* Yield Preview */}
                                <div className={styles.yieldPreview}>
                                    <div className={styles.yieldHeader}>
                                        <span>🏦 DeFi Yield</span>
                                        <span className={styles.yieldApy}>+5.2% APY</span>
                                    </div>
                                    <div className={styles.yieldBar}>
                                        <div className={styles.yieldProgress}></div>
                                    </div>
                                    <span className={styles.yieldEarned}>Earned: $2,156.00 this month</span>
                                </div>
                            </div>
                        </div>

                        {/* Floating Elements */}
                        <div className={`${styles.floatingCard} ${styles.float1}`}>
                            <span>✅</span> Payroll sent to 25 employees
                        </div>
                        <div className={`${styles.floatingCard} ${styles.float2}`}>
                            <span>💵</span> +$5,000 Invoice paid
                        </div>
                    </div>
                </div>
            </div>

            {/* Background Glow */}
            <div className={styles.bgGlow}></div>
        </section>
    );
}

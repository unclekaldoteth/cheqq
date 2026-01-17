import { ArrowRight } from 'lucide-react';
import styles from './CTA.module.css';

export default function CTA() {
    return (
        <section className={`section ${styles.cta}`}>
            <div className="container">
                <div className={styles.ctaCard}>
                    <div className={styles.ctaContent}>
                        <h2>Ready to transform your business finance?</h2>
                        <p>
                            Join innovative companies already using Cheqq to manage payroll, invoices,
                            and treasury — all on Base.
                        </p>
                        <div className={styles.ctaButtons}>
                            <a href="/dashboard" className="btn btn-primary">
                                Launch App <ArrowRight size={18} />
                            </a>
                            <a href="https://t.me/cheqq" className="btn btn-outline" style={{ background: 'white' }}>
                                Join Community
                            </a>
                        </div>
                    </div>

                    <div className={styles.ctaVisual}>
                        <div className={styles.statCard}>
                            <span className={styles.statEmoji}>🚀</span>
                            <div>
                                <span className={styles.statLabel}>Base Indonesia Hackathon</span>
                                <span className={styles.statValue}>2025</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

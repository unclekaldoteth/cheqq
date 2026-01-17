import { TrendingUp, ExternalLink, Info } from 'lucide-react';
import styles from './YieldCard.module.css';

export default function YieldCard() {
    return (
        <div className={styles.yieldCard}>
            <div className={styles.header}>
                <div className={styles.title}>
                    <TrendingUp size={20} />
                    <h3>DeFi Yield</h3>
                </div>
                <a href="/dashboard/defi" className={styles.link}>
                    Manage <ExternalLink size={14} />
                </a>
            </div>

            <div className={styles.content}>
                <div className={styles.mainStat}>
                    <span className={styles.apyLabel}>Current APY</span>
                    <span className={styles.apyValue}>5.24%</span>
                </div>

                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <span className={styles.statLabel}>Deposited</span>
                        <span className={styles.statValue}>$30,000.00</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statLabel}>Earned (Total)</span>
                        <span className={styles.statValue}>$1,572.00</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statLabel}>This Month</span>
                        <span className={styles.statValue}>$156.32</span>
                    </div>
                </div>

                <div className={styles.protocols}>
                    <div className={styles.protocol}>
                        <span className={styles.protocolIcon}>🦋</span>
                        <div className={styles.protocolInfo}>
                            <span className={styles.protocolName}>Morpho USDC Vault</span>
                            <span className={styles.protocolAmount}>$20,000</span>
                        </div>
                        <span className={styles.protocolApy}>5.8% APY</span>
                    </div>
                    <div className={styles.protocol}>
                        <span className={styles.protocolIcon}>✈️</span>
                        <div className={styles.protocolInfo}>
                            <span className={styles.protocolName}>Aerodrome LP</span>
                            <span className={styles.protocolAmount}>$10,000</span>
                        </div>
                        <span className={styles.protocolApy}>4.2% APY</span>
                    </div>
                </div>

                <div className={styles.notice}>
                    <Info size={14} />
                    <span>Auto-compound enabled. Rewards are reinvested daily.</span>
                </div>
            </div>
        </div>
    );
}

import styles from './Partners.module.css';

const partners = [
    {
        name: 'Tempo',
        logo: '⚫',
        description: 'Built on Tempo',
    },
    {
        name: 'BetaUSD',
        logo: '🇮🇩',
        description: 'Indonesian Rupiah Stablecoin',
    },
    {
        name: 'Morpho',
        logo: '🦋',
        description: 'DeFi Lending Protocol',
    },
    {
        name: 'Aerodrome',
        logo: '✈️',
        description: 'Tempo DEX & Liquidity',
    },
];

export default function Partners() {
    return (
        <section className={`section ${styles.partners}`}>
            <div className="container">
                <div className={styles.partnersHeader}>
                    <span className={styles.label}>Powered By</span>
                </div>

                <div className={styles.partnerGrid}>
                    {partners.map((partner, index) => (
                        <div key={index} className={styles.partnerCard}>
                            <span className={styles.partnerLogo}>{partner.logo}</span>
                            <div className={styles.partnerInfo}>
                                <h4>{partner.name}</h4>
                                <p>{partner.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

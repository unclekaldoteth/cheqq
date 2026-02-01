'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Building2, User, ArrowRight } from 'lucide-react';
import styles from './page.module.css';

const roles = [
    {
        id: 'company',
        title: 'Company',
        description: 'Manage payroll, invoices, and treasury for your business',
        icon: Building2,
        features: ['Payroll management', 'Invoice clients', 'Treasury & DeFi yields', 'Employee loans'],
        href: '/register/company',
        gradient: 'linear-gradient(135deg, #0052FF 0%, #0066FF 100%)',
    },
    {
        id: 'freelancer',
        title: 'Freelancer',
        description: 'Create invoices, get paid, and withdraw to bank or crypto',
        icon: User,
        features: ['Create invoices', 'Accept crypto payments', 'Withdraw to bank', 'Track payments'],
        href: '/register/freelancer',
        gradient: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
    },
];

export default function GetStartedPage() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.header}>
                    <Link href="/" className={styles.logo}>
                        <Image src="/logo.png" alt="Cheqq" width={48} height={48} className={styles.logoImage} />
                        Cheqq
                    </Link>
                    <h1 className={styles.title}>Get Started</h1>
                    <p className={styles.subtitle}>
                        Choose how you want to use Cheqq
                    </p>
                </div>

                <div className={styles.rolesGrid}>
                    {roles.map((role) => (
                        <Link
                            key={role.id}
                            href={role.href}
                            className={styles.roleCard}
                        >
                            <div
                                className={styles.roleIconWrapper}
                                style={{ background: role.gradient }}
                            >
                                <role.icon size={32} className={styles.roleIcon} />
                            </div>

                            <h2 className={styles.roleTitle}>{role.title}</h2>
                            <p className={styles.roleDescription}>{role.description}</p>

                            <ul className={styles.featureList}>
                                {role.features.map((feature, index) => (
                                    <li key={index} className={styles.featureItem}>
                                        <span className={styles.checkmark}>✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <div className={styles.roleAction}>
                                Continue as {role.title}
                                <ArrowRight size={18} />
                            </div>
                        </Link>
                    ))}
                </div>

                <p className={styles.footer}>
                    ⚠️ This choice is permanent. KYB (Company) or KYC (Freelancer) verification required.
                </p>
            </div>
        </div>
    );
}

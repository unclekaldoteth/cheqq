import { Twitter, MessageCircle, Github, Mail } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './Footer.module.css';

const footerLinks = {
    products: [
        { label: 'Invoice', href: '#products' },
        { label: 'Payroll', href: '#products' },
        { label: 'DeFi Yield', href: '#products' },
        { label: 'Employee Lending', href: '#products' },
    ],
    resources: [
        { label: 'Documentation', href: 'https://docs.cheqq.io' },
        { label: 'API Reference', href: 'https://docs.cheqq.io/api' },
        { label: 'Blog', href: '/blog' },
        { label: 'Changelog', href: '/changelog' },
    ],
    company: [
        { label: 'About Us', href: '/about' },
        { label: 'Careers', href: '/careers' },
        { label: 'Contact', href: '/contact' },
        { label: 'Press Kit', href: '/press' },
    ],
    legal: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '/cookies' },
    ],
};

const socialLinks = [
    { icon: <Twitter size={20} />, href: 'https://twitter.com/cheqq', label: 'Twitter' },
    { icon: <MessageCircle size={20} />, href: 'https://t.me/cheqq', label: 'Telegram' },
    { icon: <Github size={20} />, href: 'https://github.com/cheqq', label: 'GitHub' },
    { icon: <Mail size={20} />, href: 'mailto:hello@cheqq.io', label: 'Email' },
];

export default function Footer() {
    const renderLink = (href: string, label: ReactNode, className?: string) => {
        if (href.startsWith('/')) {
            return (
                <Link href={href} className={className}>
                    {label}
                </Link>
            );
        }
        return (
            <a href={href} className={className}>
                {label}
            </a>
        );
    };

    return (
        <footer className={styles.footer}>
            <div className="container">
                <div className={styles.footerGrid}>
                    {/* Brand */}
                    <div className={styles.brand}>
                        {renderLink(
                            '/',
                            <>
                                <span className={styles.logoIcon}>◆</span>
                                Cheqq
                            </>,
                            styles.logo
                        )}
                        <p>
                            Payroll & DeFi. Unified on Tempo. The future of business finance.
                        </p>
                        <div className={styles.socialLinks}>
                            {socialLinks.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.href}
                                    className={styles.socialLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.label}
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    <div className={styles.linkColumn}>
                        <h4>Products</h4>
                        <ul>
                            {footerLinks.products.map((link, index) => (
                                <li key={index}>
                                    {renderLink(link.href, link.label)}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className={styles.linkColumn}>
                        <h4>Resources</h4>
                        <ul>
                            {footerLinks.resources.map((link, index) => (
                                <li key={index}>
                                    {renderLink(link.href, link.label)}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className={styles.linkColumn}>
                        <h4>Company</h4>
                        <ul>
                            {footerLinks.company.map((link, index) => (
                                <li key={index}>
                                    {renderLink(link.href, link.label)}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className={styles.linkColumn}>
                        <h4>Legal</h4>
                        <ul>
                            {footerLinks.legal.map((link, index) => (
                                <li key={index}>
                                    {renderLink(link.href, link.label)}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className={styles.footerBottom}>
                    <p>© {new Date().getFullYear()} Cheqq. All rights reserved.</p>
                    <p className={styles.hackathonBadge}>
                        Built for Tempo Hackathon 2026
                    </p>
                </div>
            </div>
        </footer>
    );
}

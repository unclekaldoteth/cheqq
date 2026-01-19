'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProductsOpen, setIsProductsOpen] = useState(false);

    return (
        <nav className={styles.navbar}>
            <div className={`container ${styles.navContainer}`}>
                {/* Logo */}
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>◆</span>
                    Cheqq
                </Link>

                {/* Desktop Navigation */}
                <div className={styles.navLinks}>
                    <div
                        className={styles.dropdown}
                        onMouseEnter={() => setIsProductsOpen(true)}
                        onMouseLeave={() => setIsProductsOpen(false)}
                    >
                        <button className={styles.navLink}>
                            Products <ChevronDown size={16} />
                        </button>
                        {isProductsOpen && (
                            <div className={styles.dropdownMenu}>
                                <a href="#products" className={styles.dropdownItem}>
                                    <span className={styles.dropdownIcon}>📄</span>
                                    <div>
                                        <strong>Invoice</strong>
                                        <p>Create and send professional invoices</p>
                                    </div>
                                </a>
                                <a href="#products" className={styles.dropdownItem}>
                                    <span className={styles.dropdownIcon}>💰</span>
                                    <div>
                                        <strong>Payroll</strong>
                                        <p>Instant global salary payments</p>
                                    </div>
                                </a>
                                <a href="#products" className={styles.dropdownItem}>
                                    <span className={styles.dropdownIcon}>📈</span>
                                    <div>
                                        <strong>DeFi</strong>
                                        <p>Earn yield & employee lending</p>
                                    </div>
                                </a>
                            </div>
                        )}
                    </div>
                    <a href="#how-it-works" className={styles.navLink}>How It Works</a>
                    <a href="#advantages" className={styles.navLink}>Why Cheqq</a>
                    <a href="https://docs.cheqq.io" className={styles.navLink} target="_blank" rel="noopener noreferrer">Docs</a>
                </div>

                {/* CTA Buttons */}
                <div className={styles.navActions}>
                    <Link href="/dashboard" className="btn btn-outline">Sign In</Link>
                    <Link href="/dashboard" className="btn btn-primary">Launch App</Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className={styles.menuButton}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className={styles.mobileMenu}>
                    <a href="#products" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>Products</a>
                    <a href="#how-it-works" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>How It Works</a>
                    <a href="#advantages" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>Why Cheqq</a>
                    <a href="https://docs.cheqq.io" className={styles.mobileLink}>Docs</a>
                    <div className={styles.mobileActions}>
                        <Link href="/dashboard" className="btn btn-outline" style={{ width: '100%' }}>Sign In</Link>
                        <Link href="/dashboard" className="btn btn-primary" style={{ width: '100%' }}>Launch App</Link>
                    </div>
                </div>
            )}
        </nav>
    );
}

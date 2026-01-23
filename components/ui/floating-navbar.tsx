'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface NavItem {
    name: string;
    link: string;
}

interface FloatingNavProps {
    navItems: NavItem[];
    className?: string;
}

export function FloatingNav({ navItems, className }: FloatingNavProps) {
    const [visible, setVisible] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY < 100) {
                setVisible(true);
            } else if (currentScrollY > lastScrollY.current) {
                setVisible(false);
            } else {
                setVisible(true);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <AnimatePresence mode="wait">
            <motion.nav
                initial={{ opacity: 1, y: 0 }}
                animate={{
                    y: visible ? 0 : -100,
                    opacity: visible ? 1 : 0,
                }}
                transition={{
                    duration: 0.2,
                }}
                className={cn(
                    'fixed top-4 inset-x-0 max-w-fit mx-auto z-50',
                    'flex items-center justify-center gap-6',
                    'px-8 py-3 rounded-full',
                    'bg-white/80 dark:bg-black/80 backdrop-blur-md',
                    'border border-gray-200 dark:border-white/10',
                    'shadow-lg',
                    className
                )}
            >
                {navItems.map((navItem, idx) => (
                    <Link
                        key={idx}
                        href={navItem.link}
                        className={cn(
                            'text-sm font-medium',
                            'text-gray-600 dark:text-gray-300',
                            'hover:text-gray-900 dark:hover:text-white',
                            'transition-colors'
                        )}
                    >
                        {navItem.name}
                    </Link>
                ))}
                <Link
                    href="/get-started"
                    className={cn(
                        'px-4 py-2 rounded-full text-sm font-semibold',
                        'bg-[#0052FF] text-white',
                        'hover:bg-[#0066FF] transition-colors'
                    )}
                >
                    Get Started
                </Link>
            </motion.nav>
        </AnimatePresence>
    );
}

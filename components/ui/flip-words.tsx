'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FlipWordsProps {
    words: string[];
    duration?: number;
    className?: string;
}

export function FlipWords({
    words,
    duration = 3000,
    className,
}: FlipWordsProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const startAnimation = useCallback(() => {
        setIsAnimating(true);
        setCurrentIndex((prev) => (prev + 1) % words.length);
    }, [words.length]);

    useEffect(() => {
        const interval = setInterval(() => {
            startAnimation();
        }, duration);

        return () => clearInterval(interval);
    }, [duration, startAnimation]);

    return (
        <AnimatePresence
            onExitComplete={() => setIsAnimating(false)}
        >
            <motion.span
                key={words[currentIndex]}
                initial={{
                    opacity: 0,
                    y: 10,
                    filter: 'blur(8px)',
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                    filter: 'blur(0px)',
                }}
                exit={{
                    opacity: 0,
                    y: -10,
                    filter: 'blur(8px)',
                }}
                transition={{
                    duration: 0.4,
                    ease: 'easeInOut',
                }}
                className={cn(
                    'inline-block',
                    className
                )}
            >
                {words[currentIndex]}
            </motion.span>
        </AnimatePresence>
    );
}

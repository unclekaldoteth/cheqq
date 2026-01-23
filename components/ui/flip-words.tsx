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
    const wordsCount = words.length;
    const [currentIndex, setCurrentIndex] = useState(0);

    const startAnimation = useCallback(() => {
        if (wordsCount < 2) return;
        setCurrentIndex((prev) => (prev + 1) % wordsCount);
    }, [wordsCount]);

    useEffect(() => {
        if (wordsCount < 2) {
            return;
        }
        const interval = setInterval(() => {
            startAnimation();
        }, duration);

        return () => clearInterval(interval);
    }, [duration, startAnimation, wordsCount]);

    if (!wordsCount) {
        return null;
    }

    return (
        <AnimatePresence
            mode="wait"
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

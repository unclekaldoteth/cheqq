'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HoverBorderGradientProps {
    children: React.ReactNode;
    containerClassName?: string;
    className?: string;
    as?: React.ElementType;
    [key: string]: unknown;
}

export function HoverBorderGradient({
    children,
    containerClassName,
    className,
    as: Component = 'button',
    ...props
}: HoverBorderGradientProps) {
    return (
        <Component
            className={cn(
                'relative flex rounded-full border border-transparent bg-black/10 dark:bg-white/10 content-center items-center justify-center overflow-hidden p-[1px] transition duration-500',
                containerClassName
            )}
            {...props}
        >
            <div
                className="absolute inset-0 -z-10"
                style={{
                    background:
                        'conic-gradient(from 90deg at 50% 50%, #0052FF 0%, #00C6FF 50%, #0052FF 100%)',
                }}
            />
            <motion.div
                className="absolute inset-0 -z-10 opacity-0 hover:opacity-100 transition-opacity"
                style={{
                    background:
                        'conic-gradient(from 90deg at 50% 50%, #0052FF 0%, #7C3AED 25%, #00C6FF 50%, #7C3AED 75%, #0052FF 100%)',
                }}
                animate={{
                    rotate: 360,
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />
            <div
                className={cn(
                    'relative z-10 flex items-center justify-center gap-2 bg-white dark:bg-[#0f0f1a] rounded-full px-6 py-3 font-semibold text-sm',
                    className
                )}
            >
                {children}
            </div>
        </Component>
    );
}

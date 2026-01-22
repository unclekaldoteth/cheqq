'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BentoGridProps {
    className?: string;
    children?: ReactNode;
}

export function BentoGrid({ className, children }: BentoGridProps) {
    return (
        <div
            className={cn(
                'grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto',
                className
            )}
        >
            {children}
        </div>
    );
}

interface BentoGridItemProps {
    className?: string;
    title?: string | ReactNode;
    description?: string | ReactNode;
    header?: ReactNode;
    icon?: ReactNode;
}

export function BentoGridItem({
    className,
    title,
    description,
    header,
    icon,
}: BentoGridItemProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ duration: 0.2 }}
            className={cn(
                'group relative flex flex-col justify-between overflow-hidden rounded-2xl',
                'bg-white dark:bg-gray-900',
                'border border-gray-200 dark:border-gray-800',
                'p-6 space-y-4',
                'shadow-sm hover:shadow-xl transition-shadow',
                className
            )}
        >
            {header && (
                <div className="w-full h-40 rounded-xl overflow-hidden">
                    {header}
                </div>
            )}
            <div className="flex flex-col gap-2">
                {icon && (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#0052FF] to-[#00C6FF] flex items-center justify-center text-white">
                        {icon}
                    </div>
                )}
                {title && (
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                        {title}
                    </h3>
                )}
                {description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
        </motion.div>
    );
}

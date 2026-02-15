'use client';

import { useRef, ReactNode, MouseEvent } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WobbleCardProps {
    children: ReactNode;
    containerClassName?: string;
    className?: string;
}

export function WobbleCard({
    children,
    containerClassName,
    className,
}: WobbleCardProps) {
    const ref = useRef<HTMLDivElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const xSpring = useSpring(x, { stiffness: 300, damping: 30 });
    const ySpring = useSpring(y, { stiffness: 300, damping: 30 });

    const transform = useMotionTemplate`rotateX(${xSpring}deg) rotateY(${ySpring}deg)`;

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xRotation = ((mouseY - height / 2) / height) * -10;
        const yRotation = ((mouseX - width / 2) / width) * 10;

        x.set(xRotation);
        y.set(yRotation);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={containerClassName}
            style={{ perspective: '1000px', position: 'relative', overflow: 'hidden' }}
        >
            <motion.div
                style={{
                    transform,
                    borderRadius: '16px',
                    padding: '1.5rem',
                    background: 'white',
                    border: '1px solid var(--border-light)',
                    boxShadow: 'var(--shadow-lg)',
                    transition: 'box-shadow 0.2s ease',
                }}
                className={className}
            >
                {children}
            </motion.div>
        </div>
    );
}

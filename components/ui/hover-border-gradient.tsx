'use client';

import { motion } from 'framer-motion';

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
    const isButton = Component === 'button';
    const componentProps =
        isButton && !('type' in props) ? { type: 'button' } : {};

    return (
        <Component
            className={containerClassName}
            style={{
                position: 'relative',
                display: 'flex',
                borderRadius: '9999px',
                border: '1px solid transparent',
                background: 'rgba(0, 0, 0, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                padding: '1px',
                transition: 'all 500ms',
            }}
            {...componentProps}
            {...props}
        >
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: -1,
                    pointerEvents: 'none',
                    background:
                        'conic-gradient(from 90deg at 50% 50%, #000000 0%, #333333 50%, #000000 100%)',
                }}
            />
            <motion.div
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: -1,
                    pointerEvents: 'none',
                    opacity: 0,
                    background:
                        'conic-gradient(from 90deg at 50% 50%, #000000 0%, #555555 25%, #333333 50%, #555555 75%, #000000 100%)',
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
                className={className}
                style={{
                    position: 'relative',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    background: 'white',
                    borderRadius: '9999px',
                    padding: '0.75rem 1.5rem',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                }}
            >
                {children}
            </div>
        </Component>
    );
}

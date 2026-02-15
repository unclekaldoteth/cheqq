'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SpotlightProps {
    className?: string;
    fill?: string;
}

export function Spotlight({ className, fill }: SpotlightProps) {
    const divRef = useRef<HTMLDivElement>(null);
    const mouseXRef = useRef(0);
    const mouseYRef = useRef(0);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!divRef.current) return;
            const rect = divRef.current.getBoundingClientRect();
            mouseXRef.current = e.clientX - rect.left;
            mouseYRef.current = e.clientY - rect.top;
            divRef.current.style.setProperty('--mouse-x', `${mouseXRef.current}px`);
            divRef.current.style.setProperty('--mouse-y', `${mouseYRef.current}px`);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div
            ref={divRef}
            className={className}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 30,
                pointerEvents: 'none',
                transition: 'opacity 300ms',
                background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${fill || 'rgba(0, 0, 0, 0.08)'}, transparent 40%)`,
            }}
        />
    );
}

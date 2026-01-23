'use client';

import { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

const MouseEnterContext = createContext<
    [boolean, React.Dispatch<React.SetStateAction<boolean>>] | undefined
>(undefined);

export function CardContainer({
    children,
    className,
    containerClassName,
}: {
    children: ReactNode;
    className?: string;
    containerClassName?: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMouseEntered, setIsMouseEntered] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const { left, top, width, height } =
            containerRef.current.getBoundingClientRect();
        const x = (e.clientX - left - width / 2) / 25;
        const y = (e.clientY - top - height / 2) / 25;
        containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
    };

    const handleMouseEnter = () => {
        setIsMouseEntered(true);
    };

    const handleMouseLeave = () => {
        setIsMouseEntered(false);
        if (containerRef.current) {
            containerRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`;
        }
    };

    return (
        <MouseEnterContext.Provider value={[isMouseEntered, setIsMouseEntered]}>
            <div
                className={cn('py-10 flex items-center justify-center', containerClassName)}
                style={{ perspective: '1000px' }}
            >
                <div
                    ref={containerRef}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleMouseMove}
                    className={cn(
                        'flex items-center justify-center relative transition-all duration-200 ease-linear',
                        className
                    )}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    {children}
                </div>
            </div>
        </MouseEnterContext.Provider>
    );
}

export function CardBody({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'h-auto w-auto [transform-style:preserve-3d] [&>*]:[transform-style:preserve-3d]',
                className
            )}
        >
            {children}
        </div>
    );
}

export function CardItem({
    as: Component = 'div',
    children,
    className,
    translateX = 0,
    translateY = 0,
    translateZ = 0,
    rotateX = 0,
    rotateY = 0,
    rotateZ = 0,
    ...rest
}: {
    as?: React.ElementType;
    children: ReactNode;
    className?: string;
    translateX?: number | string;
    translateY?: number | string;
    translateZ?: number | string;
    rotateX?: number | string;
    rotateY?: number | string;
    rotateZ?: number | string;
    [key: string]: unknown;
}) {
    const context = useContext(MouseEnterContext);
    const isMouseEntered = context ? context[0] : false;
    const toCssValue = (value: number | string, unit: string) =>
        typeof value === 'number' ? `${value}${unit}` : value;

    return (
        <Component
            className={cn('w-fit transition duration-200 ease-linear', className)}
            style={{
                transform: isMouseEntered
                    ? `translateX(${toCssValue(translateX, 'px')}) translateY(${toCssValue(translateY, 'px')}) translateZ(${toCssValue(translateZ, 'px')}) rotateX(${toCssValue(rotateX, 'deg')}) rotateY(${toCssValue(rotateY, 'deg')}) rotateZ(${toCssValue(rotateZ, 'deg')})`
                    : 'translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
            }}
            {...rest}
        >
            {children}
        </Component>
    );
}

export function useMouseEnter() {
    const context = useContext(MouseEnterContext);
    if (context === undefined) {
        throw new Error('useMouseEnter must be used within a MouseEnterProvider');
    }
    return context;
}

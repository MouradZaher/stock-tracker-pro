import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to detect price changes and return a flash class name
 * @param price Current price
 * @returns 'flash-up' | 'flash-down' | ''
 */
export const usePriceFlash = (price: number) => {
    const [flashClass, setFlashClass] = useState('');
    const prevPriceRef = useRef<number>(price);
    const timeoutRef = useRef<any>(null);

    useEffect(() => {
        if (price !== prevPriceRef.current) {
            const isUp = price > prevPriceRef.current;

            // Clear previous timeout if any
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            setFlashClass(isUp ? 'flash-up' : 'flash-down');
            prevPriceRef.current = price;

            // Reset class after animation duration
            timeoutRef.current = setTimeout(() => {
                setFlashClass('');
            }, 1500);
        }
    }, [price]);

    return flashClass;
};

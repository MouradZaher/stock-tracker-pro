import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { usePriceFlash } from '../hooks/usePriceFlash';

interface RealTimePriceProps {
    price: number;
    className?: string;
    style?: React.CSSProperties;
    showCurrency?: boolean;
    isFallback?: boolean;
}

const RealTimePrice: React.FC<RealTimePriceProps> = ({ 
    price, 
    className = '', 
    style = {}, 
    showCurrency = true,
    isFallback = false
}) => {
    const flashClass = usePriceFlash(price);

    return (
        <span
            className={`${className} ${flashClass} group relative cursor-help`}
            style={{
                ...style,
                transition: 'all 0.5s ease',
                padding: '2px 8px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace"
            }}
        >
            {showCurrency ? formatCurrency(price) : price.toFixed(2)}
            {isFallback && (
                <span 
                    className="text-[10px] px-1 bg-amber-500/20 text-amber-400 rounded-sm border border-amber-500/30 font-sans"
                    title="Live API source failed. Using high-precision fallback data calibrated to January 2025."
                >
                    Est.
                </span>
            )}
        </span>
    );
};

export default RealTimePrice;

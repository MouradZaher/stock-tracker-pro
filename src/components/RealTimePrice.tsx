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
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                padding: '2px 6px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 950,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '-0.02em'
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

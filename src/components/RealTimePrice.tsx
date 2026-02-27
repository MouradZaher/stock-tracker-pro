import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { usePriceFlash } from '../hooks/usePriceFlash';

interface RealTimePriceProps {
    price: number;
    className?: string;
    style?: React.CSSProperties;
    showCurrency?: boolean;
}

/**
 * A reusable component for displaying prices with real-time flash animations.
 * When the price prop changes, it triggers a subtle green/red flash background.
 */
const RealTimePrice: React.FC<RealTimePriceProps> = ({ price, className = '', style = {}, showCurrency = true }) => {
    const flashClass = usePriceFlash(price);

    return (
        <span
            className={`${className} ${flashClass}`}
            style={{
                ...style,
                transition: 'background-color 0.5s ease',
                padding: '2px 4px',
                borderRadius: '4px',
                display: 'inline-block'
            }}
        >
            {showCurrency ? formatCurrency(price) : price.toFixed(2)}
        </span>
    );
};

export default RealTimePrice;

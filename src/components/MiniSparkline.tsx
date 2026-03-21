import React, { useState, useEffect, useMemo } from 'react';
import { getHistoricalPrices } from '../services/stockDataService';

interface MiniSparklineProps {
    symbol: string;
    width?: number;
    height?: number;
    color?: string;
}

/**
 * MiniSparkline
 * A high-density micro-chart component that renders a 7-day price trend.
 * Designed for use in tables and lists (Mega Deep Dive Innovation).
 */
const MiniSparkline: React.FC<MiniSparklineProps> = ({ 
    symbol, 
    width = 80, 
    height = 24,
    color
}) => {
    const [prices, setPrices] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchHistory = async () => {
            try {
                // Fetch 7 days of history for high-density "spark"
                const history = await getHistoricalPrices(symbol, 7);
                if (isMounted) {
                    setPrices(history);
                    setLoading(false);
                }
            } catch (err) {
                if (isMounted) setLoading(false);
            }
        };
        fetchHistory();
        return () => { isMounted = false; };
    }, [symbol]);

    const pathData = useMemo(() => {
        if (prices.length < 2) return '';

        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min || 1;

        return prices
            .map((price, i) => {
                const x = (i / (prices.length - 1)) * width;
                const y = height - ((price - min) / range) * height;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            })
            .join(' ');
    }, [prices, width, height]);

    const trendColor = useMemo(() => {
        if (color) return color;
        if (prices.length < 2) return 'var(--color-text-tertiary)';
        return prices[prices.length - 1] >= prices[0] ? '#10b981' : '#ef4444';
    }, [prices, color]);

    if (loading || prices.length < 2) {
        return (
            <div style={{ width, height, background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }} className="animate-pulse" />
        );
    }

    return (
        <svg width={width} height={height} style={{ overflow: 'visible', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))', transform: 'translateZ(0)', willChange: 'transform' }}>
            <path
                d={pathData}
                fill="none"
                stroke={trendColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 0.8 }}
            />
            {/* Gradient Area */}
            <path
                d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
                fill={`url(#gradient-${symbol})`}
                style={{ opacity: 0.1 }}
            />
            <defs>
                <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={trendColor} />
                    <stop offset="100%" stopColor="transparent" />
                </linearGradient>
            </defs>
        </svg>
    );
};

export default MiniSparkline;

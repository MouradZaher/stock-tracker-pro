import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const TICKER_DATA = [
    { symbol: 'TSLA', price: '185.10', change: '-0.85%', isPositive: false },
    { symbol: 'AMZN', price: '178.35', change: '+0.32%', isPositive: true },
    { symbol: 'GOOGL', price: '146.40', change: '-0.15%', isPositive: false },
    { symbol: 'META', price: '478.15', change: '+0.75%', isPositive: true },
    { symbol: 'S&P 500', price: '5,085.60', change: '+0.12%', isPositive: true },
    { symbol: 'AAPL', price: '188.45', change: '+0.25%', isPositive: true },
    { symbol: 'NVDA', price: '785.30', change: '+1.15%', isPositive: true },
    { symbol: 'MSFT', price: '412.50', change: '+0.45%', isPositive: true },
    { symbol: 'NFLX', price: '635.00', change: '+1.50%', isPositive: true }
];

const LiveTicker: React.FC = () => {
    return (
        <div style={{
            width: '100%',
            height: '46px',
            overflow: 'hidden',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-bg-secondary)', // Solid background as requested
            display: 'flex',
            alignItems: 'center',
            position: 'relative'
        }}>
            <style>
                {`
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .ticker-content {
                    display: flex;
                    animation: ticker 30s linear infinite;
                    white-space: nowrap;
                }
                .ticker-content:hover {
                    animation-play-state: paused;
                }
                `}
            </style>
            <div className="ticker-content">
                {/* Duplicate the array to create seamless loop */}
                {[...TICKER_DATA, ...TICKER_DATA, ...TICKER_DATA].map((item, index) => (
                    <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '0 2rem',
                        fontSize: '0.9rem',
                        borderRight: '1px solid var(--color-border-light)'
                    }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{item.symbol}</span>
                        <span style={{ color: 'var(--color-text-primary)' }}>{item.price}</span>
                        <span style={{
                            color: item.isPositive ? 'var(--color-success)' : 'var(--color-error)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600
                        }}>
                            {item.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {item.change}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LiveTicker;

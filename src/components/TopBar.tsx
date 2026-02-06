import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMultipleQuotes } from '../services/stockDataService';

const SYMBOLS = ['^DJI', 'AAPL', 'NVDA', 'TSLA', '^GSPC', '^IXIC', 'MSFT', 'AMZN', 'GOOGL'];

// Fallback data when API is unavailable - shows last known approximate prices
const FALLBACK_DATA = [
    { symbol: 'DOWJ', price: 44298.46, change: 0.35, isUp: true },
    { symbol: 'AAPL', price: 232.47, change: 1.24, isUp: true },
    { symbol: 'NVDA', price: 118.42, change: -0.89, isUp: false },
    { symbol: 'TSLA', price: 361.62, change: 2.15, isUp: true },
    { symbol: 'S&P 500', price: 6061.48, change: 0.42, isUp: true },
    { symbol: 'NASDAQ', price: 19791.99, change: 0.78, isUp: true },
    { symbol: 'MSFT', price: 410.23, change: 0.56, isUp: true },
    { symbol: 'AMZN', price: 235.42, change: -0.32, isUp: false },
    { symbol: 'GOOGL', price: 196.89, change: 1.12, isUp: true }
];

const TopBar: React.FC = () => {
    const { data: quotes } = useQuery({
        queryKey: ['topBarQuotes'],
        queryFn: async () => {
            const data = await getMultipleQuotes(SYMBOLS);
            return data;
        },
        refetchInterval: 15000,
        staleTime: 5000,
        retry: 2,
    });

    const formatPrice = (price: number) => {
        return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatChange = (change: number) => {
        const sign = change > 0 ? '+' : '';
        return `${sign}${change.toFixed(2)}%`;
    };

    const getDisplayName = (symbol: string) => {
        switch (symbol) {
            case '^DJI': return 'DOWJ';
            case '^GSPC': return 'S&P 500';
            case '^IXIC': return 'NASDAQ';
            default: return symbol;
        }
    };

    // Build ticker items from API data or use fallback
    let tickerItems: { symbol: string; price: number; change: number; isUp: boolean }[] = [];

    if (quotes && quotes.size > 0) {
        tickerItems = SYMBOLS.map(sym => {
            const quote = quotes.get(sym);
            if (!quote || quote.price === 0) return null;
            return {
                symbol: getDisplayName(sym),
                price: quote.price,
                change: quote.changePercent,
                isUp: quote.changePercent >= 0
            };
        }).filter(Boolean) as typeof tickerItems;
    }

    // Use fallback if no real data available
    if (tickerItems.length === 0) {
        tickerItems = FALLBACK_DATA;
    }

    return (
        <div className="top-bar glass-effect" style={{
            width: '100%',
            height: '32px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 1rem',
            fontSize: '0.75rem',
            background: 'rgba(0,0,0,0.3)',
            zIndex: 50,
            overflow: 'hidden',
            whiteSpace: 'nowrap'
        }}>
            <div className="scrolling-content" style={{ display: 'flex', gap: '2rem' }}>
                {[...tickerItems, ...tickerItems, ...tickerItems].map((item, idx) => (
                    <div key={`${item.symbol}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-text-secondary)' }}>{item.symbol}</span>
                        <span style={{ fontFamily: 'monospace' }}>{formatPrice(item.price)}</span>
                        <span style={{
                            color: item.isUp ? 'var(--color-success)' : 'var(--color-error)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                        }}>
                            {formatChange(item.change)}
                        </span>
                    </div>
                ))}
            </div>

            <style>{`
                .scrolling-content {
                    animation: scroll 120s linear infinite;
                }
                @media (max-width: 768px) {
                    .scrolling-content {
                        animation-duration: 180s !important;
                    }
                }
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .top-bar:hover .scrolling-content {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
};

export default TopBar;

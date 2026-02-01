import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Percent, Activity } from 'lucide-react';
import { getMultipleQuotes } from '../services/stockDataService';

const SYMBOLS = ['^DJI', 'AAPL', 'NVDA', 'TSLA', '^GSPC', '^IXIC', 'MSFT', 'AMZN', 'GOOGL'];

const TopBar: React.FC = () => {
    const { data: quotes, isLoading } = useQuery({
        queryKey: ['topBarQuotes'],
        queryFn: async () => {
            const data = await getMultipleQuotes(SYMBOLS);
            return data;
        },
        refetchInterval: 30000,
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

    if (isLoading || !quotes) return <div className="h-8 bg-black w-full"></div>;

    const tickerItems = SYMBOLS.map(sym => {
        const quote = quotes.get(sym);
        if (!quote) return null;
        return {
            symbol: getDisplayName(sym),
            price: quote.price,
            change: quote.changePercent,
            isUp: quote.changePercent >= 0
        };
    }).filter(Boolean);

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
            <div style={{ display: 'flex', alignItems: 'center', marginRight: '1rem', color: 'var(--color-accent)' }}>
                <Activity size={14} />
            </div>

            <div className="scrolling-content" style={{ display: 'flex', gap: '2rem', animation: 'scroll 40s linear infinite' }}>
                {[...tickerItems, ...tickerItems, ...tickerItems].map((item: any, idx) => (
                    <div key={`${item.symbol}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-text-secondary)' }}>{item.symbol}</span>
                        <span style={{ fontFamily: 'monospace' }}>{formatPrice(item.price)}</span>
                        <span style={{
                            color: item.isUp ? 'var(--color-success)' : 'var(--color-error)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                        }}>
                            {item.isUp ? '+' : ''}{item.change.toFixed(2)}%
                        </span>
                    </div>
                ))}
            </div>

            <style>{`
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

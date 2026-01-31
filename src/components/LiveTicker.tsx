import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { getMultipleQuotes } from '../services/stockDataService';

const INDICES = ['^GSPC', '^IXIC', '^DJI'];
const STOCKS = ['AAPL', 'NVDA', 'TSLA'];
const SYMBOLS = [...INDICES, ...STOCKS];

const LiveTicker: React.FC = () => {

    const { data: tickerData, isLoading, error } = useQuery({
        queryKey: ['liveTicker', SYMBOLS.join(',')],
        queryFn: async () => {
            const getDisplayName = (sym: string) => {
                if (sym === '^GSPC') return 'S&P 500';
                if (sym === '^IXIC') return 'NASDAQ';
                if (sym === '^DJI') return 'DOWJ';
                return sym;
            };

            const quotesMap = await getMultipleQuotes(SYMBOLS);

            return SYMBOLS.map(sym => {
                const quote = quotesMap.get(sym);
                if (!quote) return null;
                return {
                    symbol: getDisplayName(sym),
                    price: quote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    change: (quote.changePercent > 0 ? '+' : '') + quote.changePercent.toFixed(2) + '%',
                    isUp: quote.changePercent >= 0
                };
            }).filter(Boolean);
        },
        // Polling interval is inherited from QueryClient default (15s), or can be overridden here
        refetchInterval: 10000, // Slightly faster for the ticker
    });

    if (isLoading && !tickerData) return <div className="p-2 text-center text-xs text-muted">Loading ticker...</div>;
    if (error || !tickerData || tickerData.length === 0) return null;

    // Double the data for seamless looping
    const displayData = [...tickerData, ...tickerData];

    return (
        <div className="ticker-wrapper" style={{ overflow: 'hidden', whiteSpace: 'nowrap', width: '100%', background: 'rgba(0,0,0,0.2)', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
            <div className="ticker-content" style={{ display: 'inline-block', animation: `ticker ${Math.max(30, displayData.length * 3)}s linear infinite` }}>
                {displayData.map((item: any, index: number) => (
                    <div key={`${item.symbol}-${index}`} className="ticker-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', margin: '0 2rem' }}>
                        <span className="ticker-symbol" style={{ fontWeight: 700, color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{item.symbol}</span>
                        <span className="ticker-price" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{item.price}</span>
                        <span className={`ticker-change ${item.isUp ? 'positive' : 'negative'}`} style={{ color: item.isUp ? 'var(--color-success)' : 'var(--color-error)', display: 'flex', alignItems: 'center', fontSize: '0.8rem', fontWeight: 500 }}>
                            {item.isUp ? <TrendingUp size={12} style={{ marginRight: 2 }} /> : <TrendingDown size={12} style={{ marginRight: 2 }} />}
                            {item.change}
                        </span>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .ticker-wrapper:hover .ticker-content {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
};

export default LiveTicker;

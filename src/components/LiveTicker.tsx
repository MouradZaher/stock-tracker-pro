import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const INDICES = ['^GSPC', '^IXIC', '^DJI'];
const STOCKS = ['AAPL', 'NVDA', 'TSLA'];
const SYMBOLS = [...INDICES, ...STOCKS];

const LiveTicker: React.FC = () => {
    const [tickerData, setTickerData] = React.useState<any[]>([]);

    React.useEffect(() => {
        const fetchTicker = async () => {
            // Mock initial data to prevent empty flash if needed, but safe to wait
            try {
                // Determine symbol mapping for display
                const getDisplayName = (sym: string) => {
                    if (sym === '^GSPC') return 'S&P 500';
                    if (sym === '^IXIC') return 'NASDAQ';
                    if (sym === '^DJI') return 'DOWJ';
                    return sym;
                };

                const quotesMap = await import('../services/stockDataService').then(m => m.getMultipleQuotes(SYMBOLS));

                const data = SYMBOLS.map(sym => {
                    const quote = quotesMap.get(sym);
                    if (!quote) return null;
                    return {
                        symbol: getDisplayName(sym),
                        price: quote.price.toLocaleString(),
                        change: (quote.changePercent > 0 ? '+' : '') + quote.changePercent.toFixed(2) + '%',
                        isUp: quote.changePercent >= 0
                    };
                }).filter(Boolean);

                setTickerData(data);
            } catch (e) {
                console.error("Ticker fetch failed", e);
            }
        };

        fetchTicker();
        const interval = setInterval(fetchTicker, 10000); // 10s refresh
        return () => clearInterval(interval);
    }, []);

    if (tickerData.length === 0) return null;

    return (
        <div className="ticker-wrapper" style={{ overflow: 'hidden', whiteSpace: 'nowrap', width: '100%', background: 'rgba(0,0,0,0.2)', padding: '4px 0' }}>
            <div className="ticker-content" style={{ display: 'inline-block', animation: 'ticker 30s linear infinite' }}>
                {[...tickerData, ...tickerData].map((item, index) => (
                    <div key={index} className="ticker-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', margin: '0 1.5rem' }}>
                        <span className="ticker-symbol" style={{ fontWeight: 700, color: 'var(--color-text-secondary)' }}>{item.symbol}</span>
                        <span className="ticker-price" style={{ fontFamily: 'monospace' }}>{item.price}</span>
                        <span className={`ticker-change ${item.isUp ? 'positive' : 'negative'}`} style={{ color: item.isUp ? 'var(--color-success)' : 'var(--color-error)', display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}>
                            {item.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
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
            `}</style>
        </div>
    );
};

export default LiveTicker;

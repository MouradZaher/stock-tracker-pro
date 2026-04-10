import React, { useEffect, useState } from 'react';
import { getMultipleQuotes } from '../services/stockDataService';
import { formatCurrency, formatPercent } from '../utils/formatters';

const MACRO_TICKERS = ['SPY', 'GLD', 'USO', 'BTC-USD', 'DX-Y.NYB'];
const TICKER_LABELS: Record<string, string> = {
    'SPY': 'S&P 500',
    'GLD': 'GOLD',
    'USO': 'CRUDE OIL',
    'BTC-USD': 'BITCOIN',
    'DX-Y.NYB': 'DXY INDEX'
};

const MacroPulseHeader: React.FC = () => {
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const quotes = await getMultipleQuotes(MACRO_TICKERS);
                const items = MACRO_TICKERS.map(ticker => {
                    const q = quotes.get(ticker);
                    return {
                        symbol: ticker,
                        label: TICKER_LABELS[ticker] || ticker,
                        price: q?.price || 0,
                        change: q?.changePercent || 0
                    };
                });
                setData(items);
            } catch (err) {
                console.error('Macro feed failed', err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    if (data.length === 0) return null;

    return (
        <div style={{ 
            height: '28px', 
            background: 'rgba(0,0,0,0.8)', 
            borderBottom: '1px solid rgba(255,255,255,0.05)', 
            display: 'flex', 
            alignItems: 'center', 
            overflow: 'hidden',
            position: 'relative',
            zIndex: 1000
        }}>
            <div className="macro-scroll-container" style={{ 
                display: 'flex', 
                gap: '40px', 
                whiteSpace: 'nowrap',
                animation: 'macroScroll 40s linear infinite',
                paddingLeft: '20px'
            }}>
                {[...data, ...data].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.6rem', fontWeight: 900 }}>
                        <span style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.05em' }}>{item.label}</span>
                        <span style={{ color: 'white' }}>{formatCurrency(item.price)}</span>
                        <span style={{ color: item.change >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                            {item.change >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(item.change))}
                        </span>
                    </div>
                ))}
            </div>
            
            <style>{`
                @keyframes macroScroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .macro-scroll-container:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
};

export default MacroPulseHeader;

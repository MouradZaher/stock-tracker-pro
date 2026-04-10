import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketIndex {
    symbol: string;
    label: string;
    price: number;
    change: number;
}

const INDICES: MarketIndex[] = [
    { symbol: '^GSPC', label: 'S&P 500', price: 0, change: 0 },
    { symbol: '^DJI', label: 'DOW', price: 0, change: 0 },
    { symbol: '^IXIC', label: 'NASDAQ', price: 0, change: 0 },
    { symbol: 'GC=F', label: 'GOLD', price: 0, change: 0 },
    { symbol: 'CL=F', label: 'OIL', price: 0, change: 0 },
    { symbol: 'BTC-USD', label: 'BTC', price: 0, change: 0 },
    { symbol: '^VIX', label: 'VIX', price: 0, change: 0 },
    { symbol: 'DX-Y.NYB', label: 'DXY', price: 0, change: 0 },
];

const MacroPulseHeader: React.FC = () => {
    const [indices, setIndices] = useState<MarketIndex[]>(INDICES);

    useEffect(() => {
        const fetchIndices = async () => {
            try {
                const symbols = INDICES.map(i => i.symbol).join(',');
                const res = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`);
                const data = await res.json();
                if (data?.quoteResponse?.result) {
                    setIndices(prev => prev.map(idx => {
                        const quote = data.quoteResponse.result.find((q: any) => q.symbol === idx.symbol);
                        return quote ? { ...idx, price: quote.regularMarketPrice || 0, change: quote.regularMarketChangePercent || 0 } : idx;
                    }));
                }
            } catch {
                // Silent fail — ribbon is non-critical
            }
        };
        fetchIndices();
        const interval = setInterval(fetchIndices, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            height: '24px',
            background: '#000',
            borderBottom: '1px solid #111',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            fontSize: '0.6rem',
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
        }}>
            <div style={{
                display: 'flex',
                gap: '2rem',
                animation: 'scroll-left 60s linear infinite',
                whiteSpace: 'nowrap',
                paddingLeft: '100%'
            }}>
                {indices.concat(indices).map((idx, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#444' }}>{idx.label}</span>
                        <span style={{ color: '#666' }}>{idx.price > 0 ? idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}</span>
                        <span style={{ color: idx.change >= 0 ? '#4ade80' : '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            {idx.change >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                            {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)}%
                        </span>
                    </span>
                ))}
            </div>
            <style>{`
                @keyframes scroll-left {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
};

export default MacroPulseHeader;

import React from 'react';
import { useMarket } from '../contexts/MarketContext';
import { formatCurrency } from '../utils/formatters';
import { Zap, TrendingUp, TrendingDown } from 'lucide-react';

const US_DATA = [
    { symbol: 'NVDA', price: 135.58, change: 1.66 },
    { symbol: 'AAPL', price: 228.02, change: -0.47 },
    { symbol: 'MSFT', price: 415.10, change: 0.31 },
    { symbol: 'GOOGL', price: 168.21, change: -0.15 },
    { symbol: 'AMZN', price: 189.05, change: 3.88 },
    { symbol: 'META', price: 512.30, change: 1.93 },
    { symbol: 'TSLA', price: 220.45, change: 3.44 },
    { symbol: 'AVGO', price: 165.40, change: 1.18 },
];

const EGYPT_DATA = [
    { symbol: 'COMI', price: 82.50, change: 1.2 },
    { symbol: 'TMGH', price: 35.10, change: -0.5 },
    { symbol: 'EFID', price: 28.40, change: 2.1 },
    { symbol: 'FWRY', price: 5.85, change: 0.8 },
];

const ABUDHABI_DATA = [
    { symbol: 'IHC', price: 414.00, change: 0.0 },
    { symbol: 'FAB', price: 13.10, change: 0.5 },
    { symbol: 'ALDAR', price: 5.80, change: 1.2 },
    { symbol: 'ADNOC', price: 3.95, change: -0.2 },
];

const DATA_MAP: Record<string, any[]> = { us: US_DATA, egypt: EGYPT_DATA, abudhabi: ABUDHABI_DATA };

const HeatmapMobileFallback: React.FC = () => {
    const { effectiveMarket } = useMarket();
    const data = DATA_MAP[effectiveMarket.id] || US_DATA;

    return (
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '1rem',
            background: 'var(--color-bg-primary)',
            overflowY: 'auto',
            gap: '12px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Zap size={14} color="var(--color-warning)" fill="var(--color-warning)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                    Top {effectiveMarket.indexName} Movers
                </span>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px'
            }}>
                {data.map((stock) => (
                    <div key={stock.symbol} style={{
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>{stock.symbol}</span>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                color: stock.change >= 0 ? 'var(--color-success)' : 'var(--color-error)'
                            }}>
                                {stock.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {Math.abs(stock.change)}%
                            </div>
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {formatCurrency(stock.price)}
                        </span>
                        <div style={{
                            width: '100%',
                            height: '4px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '2px',
                            marginTop: '4px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${Math.min(Math.abs(stock.change) * 20, 100)}%`,
                                height: '100%',
                                background: stock.change >= 0 ? 'var(--color-success)' : 'var(--color-error)'
                            }} />
                        </div>
                    </div>
                ))}
            </div>

            <p style={{
                fontSize: '0.65rem',
                color: 'var(--color-text-tertiary)',
                textAlign: 'center',
                marginTop: '1rem',
                lineHeight: 1.4
            }}>
                Heatmap view is optimized for desktop and tablet resolutions.
            </p>
        </div>
    );
};

export default HeatmapMobileFallback;

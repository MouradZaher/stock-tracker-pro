import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useMarket } from '../contexts/MarketContext';

interface IndexData {
    symbol: string;
    price: number | null;
    change: number | null;
    changePercent: number | null;
    name: string;
    lastUpdated: Date | null;
}

const MarketIndexCard: React.FC = () => {
    const { selectedMarket } = useMarket();
    const [data, setData] = useState<IndexData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchIndex = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/quote?symbol=${selectedMarket.indexSymbol}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const json = await res.json();
            setData({
                symbol: selectedMarket.indexSymbol,
                price: json.price ?? null,
                change: json.change ?? null,
                changePercent: json.changePercent ?? null,
                name: selectedMarket.indexName,
                lastUpdated: new Date(),
            });
        } catch (e) {
            setError('Index data unavailable');
            // Use fallback static data so the card still renders
            setData({
                symbol: selectedMarket.indexSymbol,
                price: null,
                change: null,
                changePercent: null,
                name: selectedMarket.indexName,
                lastUpdated: null,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIndex();
        const interval = setInterval(fetchIndex, 60000);
        return () => clearInterval(interval);
    }, [selectedMarket.id]);

    const isPositive = (data?.changePercent ?? 0) >= 0;
    const color = isPositive ? 'var(--color-success)' : 'var(--color-error)';

    return (
        <div className="desktop-only" style={{ width: '100%' }}>
            <div className="glass-card" style={{
                padding: '1.25rem 1.5rem',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: `linear-gradient(135deg, rgba(20,20,30,0.95) 0%, rgba(25,25,40,0.9) 100%)`,
                border: `1px solid ${selectedMarket.color}33`,
                boxShadow: `0 0 24px ${selectedMarket.color}22`,
                gap: '1rem',
                flexWrap: 'wrap',
            }}>
                {/* Market Identity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '2rem', lineHeight: 1 }}>{selectedMarket.flag}</span>
                    <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
                            {selectedMarket.name} — Live Index
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                            {selectedMarket.indexName}
                        </div>
                    </div>
                </div>

                {/* Index Value */}
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-tertiary)', fontSize: '0.8rem' }}>
                        <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        Loading…
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>
                                {data?.price != null
                                    ? data.price.toLocaleString('en-US', { maximumFractionDigits: 2 })
                                    : '—'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
                                {data?.changePercent != null ? (
                                    <>
                                        {isPositive ? <TrendingUp size={14} color={color} /> : <TrendingDown size={14} color={color} />}
                                        <span style={{ color, fontWeight: 700, fontSize: '0.9rem' }}>
                                            {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
                                        </span>
                                        <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem' }}>
                                            ({isPositive ? '+' : ''}{data.change?.toFixed(2)})
                                        </span>
                                    </>
                                ) : (
                                    <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem' }}>{error ?? 'No data'}</span>
                                )}
                            </div>
                            {data?.lastUpdated && (
                                <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                                    Updated {data.lastUpdated.toLocaleTimeString()}
                                </div>
                            )}
                        </div>

                        {/* Colored accent strip */}
                        <div style={{
                            width: '4px',
                            height: '48px',
                            borderRadius: '4px',
                            background: selectedMarket.color,
                            boxShadow: `0 0 12px ${selectedMarket.color}`,
                            flexShrink: 0,
                        }} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketIndexCard;

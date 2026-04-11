import React, { useEffect, useState, useMemo } from 'react';
import { Activity, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useMarket } from '../contexts/MarketContext';
import { getMultipleQuotes } from '../services/stockDataService';
import { STOCKS_BY_INDEX } from '../data/sectors';
import type { Stock } from '../types';

interface InstitutionalHeatmapGridProps {
    onSelectSymbol?: (symbol: string) => void;
}

const InstitutionalHeatmapGrid: React.FC<InstitutionalHeatmapGridProps> = ({ onSelectSymbol }) => {
    const { effectiveMarket } = useMarket();
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [retryKey, setRetryKey] = useState(0);

    const indexName = effectiveMarket.id === 'egypt' ? 'EGX 30' : 
                      effectiveMarket.id === 'abudhabi' ? 'FTSE ADX 15' : 'S&P 500';

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);

        const fetchData = async () => {
            const indexConstituents = STOCKS_BY_INDEX[indexName] || [];
            if (indexConstituents.length === 0) {
                setIsLoading(false);
                return;
            }

            const symbols = indexConstituents.map(s => s.symbol);
            try {
                const stockMap = await getMultipleQuotes(symbols);
                if (isMounted) {
                    // Convert map to array and sort by change percent (descending)
                    const sortedStocks = Array.from(stockMap.values()).sort((a, b) => 
                        (b.changePercent || 0) - (a.changePercent || 0)
                    );
                    setStocks(sortedStocks);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Failed to fetch synthetic heatmap data:", error);
                if (isMounted) setIsLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30s

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [indexName, retryKey]);

    const getHeatmapColor = (change: number) => {
        if (change > 2) return '#22c55e'; // Bright Green
        if (change > 0.5) return '#166534'; // Dark Green
        if (change < -2) return '#ef4444'; // Bright Red
        if (change < -0.5) return '#991b1b'; // Dark Red
        return '#262626'; // Neutral Gray
    };

    if (isLoading) {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', gap: '1rem' }}>
                <Activity size={24} color="var(--color-accent)" className="animate-pulse" />
                <span style={{ fontSize: '0.6rem', color: '#666', fontWeight: 900, letterSpacing: '0.1em' }}>RECONSTRUCTING {indexName} HEATMAP...</span>
            </div>
        );
    }

    return (
        <div style={{ 
            height: '100%', 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            background: '#0a0a0a',
            overflow: 'hidden',
            padding: '4px'
        }}>
            {/* Legend / Info Bar */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '4px 8px', 
                fontSize: '0.5rem', 
                color: '#444', 
                borderBottom: '1px solid #111',
                marginBottom: '4px'
            }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: 'var(--color-accent)' }}>{indexName} SQUARE HUB</span>
                    <span style={{ opacity: 0.5 }}>|</span>
                    <span style={{ color: '#22c55e' }}>+2%</span>
                    <span style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '1px' }} />
                    <span style={{ width: '8px', height: '8px', background: '#e5e7eb', opacity: 0.1, borderRadius: '1px' }} />
                    <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '1px' }} />
                    <span style={{ color: '#ef4444' }}>-2%</span>
                </div>
                <button onClick={() => setRetryKey(k => k + 1)} style={{ background: 'transparent', border: 'none', color: '#444', cursor: 'pointer' }}>
                    <RefreshCw size={10} />
                </button>
            </div>

            {/* The Grid */}
            <div style={{ 
                flex: 1, 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                gridAutoRows: 'minmax(60px, 1fr)',
                gap: '2px',
                overflowY: 'auto',
                paddingRight: '2px'
            }} className="custom-scrollbar">
                {stocks.map(stock => (
                    <div
                        key={stock.symbol}
                        onClick={() => onSelectSymbol?.(stock.symbol)}
                        style={{
                            background: getHeatmapColor(stock.changePercent),
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            border: '1px solid rgba(255,255,255,0.03)',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.filter = 'brightness(1.2)';
                            e.currentTarget.style.transform = 'scale(0.98)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.filter = 'none';
                            e.currentTarget.style.transform = 'none';
                        }}
                    >
                        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                            {stock.symbol}
                        </span>
                        <span style={{ fontSize: '0.55rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                            {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </span>
                        
                        {/* Mini Micro-Chart simulation */}
                        <div style={{ 
                            position: 'absolute', 
                            bottom: '2px', 
                            left: '4px', 
                            right: '4px', 
                            height: '2px', 
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '1px'
                        }}>
                            <div style={{ 
                                width: `${Math.min(100, Math.abs(stock.changePercent) * 20)}%`, 
                                height: '100%', 
                                background: 'rgba(255,255,255,0.5)',
                                borderRadius: '1px',
                                float: stock.changePercent >= 0 ? 'left' : 'right'
                            }} />
                        </div>
                    </div>
                ))}

                {stocks.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '0.6rem' }}>
                        NO TICKER DATA AVAILABLE FOR {indexName}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstitutionalHeatmapGrid;

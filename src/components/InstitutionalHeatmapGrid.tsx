import React, { useEffect, useState, useMemo } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
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
                    // Enrich stocks with weight and sector from the index definition
                    const enrichedStocks = Array.from(stockMap.values()).map(stock => {
                        const constituent = indexConstituents.find(c => c.symbol === stock.symbol);
                        return {
                            ...stock,
                            sector: constituent?.sector || 'Other',
                            weight: constituent?.weight || 1
                        };
                    });
                    
                    setStocks(enrichedStocks);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Failed to fetch synthetic heatmap data:", error);
                if (isMounted) setIsLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); 

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [indexName, retryKey]);

    // Group stocks by sector
    const sectorGroups = useMemo(() => {
        const groups: Record<string, Stock[]> = {};
        stocks.forEach(stock => {
            const s = stock.sector || 'Other';
            if (!groups[s]) groups[s] = [];
            groups[s].push(stock);
        });
        
        // Sort groups by total weight
        return Object.entries(groups).sort(([, a], [, b]) => {
            const weightA = a.reduce((sum, s) => sum + (s.weight || 1), 0);
            const weightB = b.reduce((sum, s) => sum + (s.weight || 1), 0);
            return weightB - weightA;
        });
    }, [stocks]);

    const getHeatmapColor = (change: number) => {
        if (change > 3) return '#00C853'; // Bright Green TV
        if (change > 1) return '#007E33'; // Dark Green TV
        if (change > 0) return '#052A18'; // Very Dark Green
        if (change < -3) return '#FF3D00'; // Bright Red TV
        if (change < -1) return '#990000'; // Dark Red TV
        if (change < 0) return '#2A0505'; // Very Dark Red
        return '#131722'; // Neutral Background
    };

    if (isLoading) {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', gap: '1rem' }}>
                <Activity size={24} color="var(--color-accent)" className="animate-pulse" />
                <span style={{ fontSize: '0.6rem', color: '#666', fontWeight: 900, letterSpacing: '0.1em' }}>ALGORITHMIC RECONSTRUCTION IN PROGRESS...</span>
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
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Legend / Info Bar */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '6px 12px', 
                background: '#131722',
                fontSize: '0.6rem', 
                color: '#868993',
                borderBottom: '1px solid #2a2e39',
                fontWeight: 600
            }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ color: '#d1d4dc', letterSpacing: '0.05em' }}>{indexName.toUpperCase()} DATA HUB</span>
                    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                         <div style={{ width: '30px', height: '4px', background: 'linear-gradient(to right, #990000, #007E33)', borderRadius: '2px' }} />
                    </div>
                </div>
                <RefreshCw 
                    size={12} 
                    style={{ cursor: 'pointer', opacity: 0.5 }} 
                    onClick={() => setRetryKey(k => k + 1)}
                />
            </div>

            {/* The Surface Map */}
            <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: '2px',
                padding: '2px',
                overflowY: 'auto',
                alignContent: 'flex-start'
            }} className="custom-scrollbar">
                {sectorGroups.map(([sector, sectorStocks]) => (
                    <div
                        key={sector}
                        style={{
                            flex: `1 1 ${sectorStocks.reduce((sum, s) => sum + (s.weight || 1), 0) * 8}px`,
                            minWidth: '150px',
                            display: 'flex',
                            flexDirection: 'column',
                            border: '1px solid #2a2e39',
                            background: '#131722',
                            margin: '1px'
                        }}
                    >
                        {/* Sector Header */}
                        <div style={{
                            padding: '4px 8px',
                            fontSize: '0.55rem',
                            fontWeight: 800,
                            color: '#868993',
                            background: 'rgba(255,255,255,0.03)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid #1e222d'
                        }}>
                            {sector}
                        </div>

                        {/* Stocks in Sector */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '1px',
                            padding: '1px'
                        }}>
                            {sectorStocks.sort((a,b) => (b.weight || 0) - (a.weight || 0)).map(stock => (
                                <div
                                    key={stock.symbol}
                                    onClick={() => onSelectSymbol?.(stock.symbol)}
                                    style={{
                                        flex: `1 1 ${stock.weight * 12}px`,
                                        height: stock.weight > 20 ? '120px' : stock.weight > 10 ? '80px' : '50px',
                                        background: getHeatmapColor(stock.changePercent),
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        position: 'relative',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.3)'}
                                    onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
                                >
                                    <span style={{ 
                                        fontSize: stock.weight > 10 ? '1rem' : '0.65rem', 
                                        fontWeight: 900, 
                                        color: '#fff',
                                        letterSpacing: '-0.02em'
                                    }}>
                                        {stock.symbol}
                                    </span>
                                    <span style={{ 
                                        fontSize: stock.weight > 10 ? '0.7rem' : '0.5rem', 
                                        fontWeight: 600, 
                                        color: 'rgba(255,255,255,0.7)' 
                                    }}>
                                        {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InstitutionalHeatmapGrid;

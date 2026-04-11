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

    const sectorGroups = useMemo(() => {
        const groups: Record<string, Stock[]> = {};
        stocks.forEach(stock => {
            const s = stock.sector || 'Other';
            if (!groups[s]) groups[s] = [];
            groups[s].push(stock);
        });
        
        return Object.entries(groups).sort(([, a], [, b]) => {
            const weightA = a.reduce((sum, s) => sum + (s.weight || 1), 0);
            const weightB = b.reduce((sum, s) => sum + (s.weight || 1), 0);
            return weightB - weightA;
        });
    }, [stocks]);

    // TradingView Official Color Ramp
    const getHeatmapColor = (change: number) => {
        if (change > 3) return '#089981';    // Bright Green
        if (change > 2) return '#057d69';    // Green tier 2
        if (change > 1) return '#045245';    // Green tier 3
        if (change > 0) return '#02342c';    // Green tier 4 (Very Dark)
        if (change === 0) return '#1e222d';  // Neutral
        if (change < -3) return '#f23645';   // Bright Red
        if (change < -2) return '#c21a2a';   // Red tier 2
        if (change < -1) return '#86252b';   // Red tier 3
        if (change < 0) return '#411e21';    // Red tier 4 (Very Dark)
        return '#1e222d';
    };

    if (isLoading) {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', gap: '1rem' }}>
                <Activity size={24} color="#089981" className="animate-pulse" />
                <span style={{ fontSize: '0.6rem', color: '#666', fontWeight: 900, letterSpacing: '0.1em' }}>RECONSTRUCTING REGIONAL HUB...</span>
            </div>
        );
    }

    return (
        <div style={{ 
            height: '100%', 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            background: '#000000', // Pure black like TV
            overflow: 'hidden',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        }}>
            {/* The Surface Map */}
            <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: '2px', // Exact TV gap
                padding: '2px',
                overflowY: 'auto',
                alignContent: 'flex-start',
                backgroundColor: '#000000'
            }} className="custom-scrollbar">
                {sectorGroups.map(([sector, sectorStocks]) => {
                    const totalWeight = sectorStocks.reduce((sum, s) => sum + (s.weight || 1), 0);
                    
                    return (
                        <div
                            key={sector}
                            style={{
                                flex: `1 1 ${totalWeight * 8}px`,
                                minWidth: '160px',
                                display: 'flex',
                                flexDirection: 'column',
                                border: '1px solid #1e222d',
                                background: '#131722',
                                position: 'relative',
                                margin: '0'
                            }}
                        >
                            {/* Sector Header - Minimalist integrated style */}
                            <div style={{
                                position: 'absolute',
                                top: '4px',
                                left: '6px',
                                fontSize: '10px',
                                fontWeight: 600,
                                color: 'rgba(255,255,255,0.4)',
                                pointerEvents: 'none',
                                textTransform: 'uppercase',
                                letterSpacing: '0.02em',
                                zIndex: 5
                            }}>
                                {sector} <span style={{ opacity: 0.5 }}>&gt;</span>
                            </div>

                            {/* Stocks in Sector */}
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '2px',
                                padding: '2px',
                                paddingTop: '20px', // Space for sector header
                                background: '#000000'
                            }}>
                                {sectorStocks.sort((a,b) => (b.weight || 0) - (a.weight || 0)).map(stock => (
                                    <div
                                        key={stock.symbol}
                                        onClick={() => onSelectSymbol?.(stock.symbol)}
                                        style={{
                                            flex: `1 1 ${stock.weight * 12}px`,
                                            minHeight: stock.weight > 15 ? '100px' : stock.weight > 8 ? '70px' : '45px',
                                            background: getHeatmapColor(stock.changePercent),
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            transition: 'filter 0.1s ease',
                                            position: 'relative',
                                            border: '1px solid rgba(255,255,255,0.02)'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.15)'}
                                        onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
                                    >
                                        <span style={{ 
                                            fontSize: stock.weight > 10 ? '1.1rem' : '0.75rem', 
                                            fontWeight: 700, 
                                            color: '#ffffff',
                                            lineHeight: 1.1
                                        }}>
                                            {stock.symbol.split(':')[1] || stock.symbol}
                                        </span>
                                        <span style={{ 
                                            fontSize: stock.weight > 10 ? '0.75rem' : '0.65rem', 
                                            fontWeight: 500, 
                                            color: 'rgba(255,255,255,0.8)',
                                            marginTop: '2px'
                                        }}>
                                            {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Minimalist Data Status Bar (matching TV widget bottom bar slightly) */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                alignItems: 'center', 
                padding: '4px 12px', 
                background: '#131722',
                fontSize: '9px', 
                color: '#868993',
                borderTop: '1px solid #1e222d',
                fontWeight: 600
            }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ opacity: 0.6 }}>{indexName} LIVE HUB</span>
                    <RefreshCw 
                        size={10} 
                        style={{ cursor: 'pointer', opacity: 0.4 }} 
                        onClick={() => setRetryKey(k => k + 1)}
                    />
                </div>
            </div>
        </div>
    );
};

export default InstitutionalHeatmapGrid;

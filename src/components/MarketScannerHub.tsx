import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useMarket } from '../contexts/MarketContext';
import { useWatchlist } from '../hooks/useWatchlist';
import { getMultipleQuotes } from '../services/stockDataService';
import { STOCKS_BY_INDEX } from '../data/sectors';
import { Globe, TrendingUp, TrendingDown, Activity, ChevronRight, BarChart2 } from 'lucide-react';
import { formatCurrencyForMarket, formatPercent } from '../utils/formatters';
import { soundService } from '../services/soundService';
import type { Stock } from '../types';

const MarketScannerHub: React.FC = () => {
    const { selectedMarket } = useMarket();
    const { getWatchlistByMarket } = useWatchlist();
    const [liveData, setLiveData] = useState<Stock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const prevLeaderRef = useRef<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        
        const fetchScannerData = async () => {
            setIsLoading(true);
            try {
                // Determine symbols to scan (Index components + Watchlist)
                const indexNameMap: Record<string, string> = {
                    'us': 'S&P 500',
                    'egypt': 'EGX 30',
                    'abudhabi': 'FTSE ADX 15'
                };
                const indexComponents = STOCKS_BY_INDEX[indexNameMap[selectedMarket.id] || 'S&P 500'] || [];
                const indexSymbols = indexComponents.map(s => s.symbol).slice(0, 15); // Top 15 to prevent overload
                const watchlistSymbols = getWatchlistByMarket(selectedMarket.id);
                
                // Combine and deduplicate
                const uniqueSymbols = Array.from(new Set([...indexSymbols, ...watchlistSymbols]));
                
                if (uniqueSymbols.length > 0) {
                    const quoteMap = await getMultipleQuotes(uniqueSymbols);
                    if (isMounted) {
                        setLiveData(Array.from(quoteMap.values()));
                    }
                }
            } catch (error) {
                console.error("Scanner fetch failed:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchScannerData();
        const interval = setInterval(fetchScannerData, 3000); // 3-cycle fast polling for terminal feel
        
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [selectedMarket.id, getWatchlistByMarket]);

    // Derived Metrics
    const metrics = useMemo(() => {
        if (liveData.length === 0) return { advances: 0, declines: 0, topGainers: [], topLosers: [] };

        let advances = 0;
        let declines = 0;
        const validStocks = liveData.filter(s => s.changePercent !== 0);

        validStocks.forEach(s => {
            if (s.changePercent > 0) advances++;
            else if (s.changePercent < 0) declines++;
        });

        // Sort by change
        const sorted = [...validStocks].sort((a, b) => b.changePercent - a.changePercent);
        
        return {
            advances,
            declines,
            topGainers: sorted.slice(0, 3), // Top 3
            topLosers: sorted.slice(-3).reverse() // Bottom 3 (worst first)
        };
    }, [liveData]);

    const totalTracked = metrics.advances + metrics.declines || 1;
    const breadthPct = (metrics.advances / totalTracked) * 100;

    // Trigger Audio Anomaly Alert on Leadership Swap
    useEffect(() => {
        if (metrics.topGainers.length > 0) {
            const currentLeader = metrics.topGainers[0].symbol;
            if (prevLeaderRef.current && prevLeaderRef.current !== currentLeader) {
                // Anomaly detected: Market structure shifted!
                soundService.playSuccess();
            }
            prevLeaderRef.current = currentLeader;
        }
    }, [metrics.topGainers]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
            
            {/* Sector Breadth & Global Pulse */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '1rem' }}>
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BarChart2 size={14} /> SECTOR BREADTH
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: breadthPct > 50 ? 'var(--color-success)' : 'var(--color-error)' }}>
                                {breadthPct.toFixed(0)}%
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>Advancing Volume</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-success)' }}>{metrics.advances} Up</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-error)' }}>{metrics.declines} Down</div>
                        </div>
                    </div>
                    {/* Breadth Bar */}
                    <div style={{ height: '6px', width: '100%', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${breadthPct}%`, background: 'var(--color-success)', borderRadius: '3px', transition: 'width 0.5s ease-out' }}></div>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-warning)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Globe size={14} /> LIVE INSTITUTIONAL SENTIMENT
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                        {breadthPct > 60 ? (
                            <span>Broad market accumulation detected across <strong style={{color:'white'}}>{selectedMarket.indexName}</strong> components. Institutional tracking algorithms indicate a robust <strong>BULLISH</strong> structural momentum.</span>
                        ) : breadthPct < 40 ? (
                            <span>Distribution phase active. Liquidity is exiting key <strong style={{color:'white'}}>{selectedMarket.indexName}</strong> assets. Institutional tracking indicates a <strong>BEARISH</strong> tightening of exposure.</span>
                        ) : (
                            <span>Market internals are tightly fought. <strong style={{color:'white'}}>{selectedMarket.indexName}</strong> breadth shows significant <strong>CONSOLIDATION</strong> with capital rotating rather than exiting.</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Real-Time Movers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1, minHeight: 0 }}>
                {/* Breakouts */}
                <div className="glass-card scrollable-panel" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-success)', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={16} /> MOMENTUM BREAKOUTS
                    </div>
                    {metrics.topGainers.length === 0 ? (
                        <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem' }}>Awaiting ticks...</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {metrics.topGainers.map(stock => (
                                <div key={stock.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', borderLeft: '2px solid var(--color-success)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'white' }}>{stock.symbol}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>{stock.name}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 800, color: 'var(--color-success)' }}>+{stock.changePercent.toFixed(2)}%</div>
                                        <div style={{ fontSize: '0.75rem', color: 'white' }}>{formatCurrencyForMarket(stock.price, selectedMarket.currency)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Drawdowns */}
                <div className="glass-card scrollable-panel" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-error)', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingDown size={16} /> LIQUIDITY DRAWDOWNS
                    </div>
                    {metrics.topLosers.length === 0 ? (
                        <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem' }}>Awaiting ticks...</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {metrics.topLosers.map(stock => (
                                <div key={stock.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', borderLeft: '2px solid var(--color-error)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'white' }}>{stock.symbol}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>{stock.name}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 800, color: 'var(--color-error)' }}>{stock.changePercent.toFixed(2)}%</div>
                                        <div style={{ fontSize: '0.75rem', color: 'white' }}>{formatCurrencyForMarket(stock.price, selectedMarket.currency)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
        </div>
    );
};

export default MarketScannerHub;

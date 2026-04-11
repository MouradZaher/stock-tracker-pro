import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Activity, RefreshCw, Maximize2, Camera, Settings, ChevronDown } from 'lucide-react';
import { useMarket } from '../contexts/MarketContext';
import { getMultipleQuotes } from '../services/stockDataService';
import { STOCKS_BY_INDEX } from '../data/sectors';
import type { Stock } from '../types';

interface InstitutionalHeatmapGridProps {
    onSelectSymbol?: (symbol: string) => void;
    blockSize?: 'market_cap_basic' | 'volume';
    blockColor?: 'change' | 'high_low_range';
}

interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
    data: any;
}

const InstitutionalHeatmapGrid: React.FC<InstitutionalHeatmapGridProps> = ({ 
    onSelectSymbol,
    blockSize = 'market_cap_basic',
    blockColor = 'change'
}) => {
    const { effectiveMarket } = useMarket();
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [retryKey, setRetryKey] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const indexName = effectiveMarket.id === 'egypt' ? 'EGX 30 Index' : 
                      effectiveMarket.id === 'abudhabi' ? 'FTSE ADX 15' : 'S&P 500 Index';

    // Track dimensions for treemap calculation
    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);

        const fetchData = async () => {
            const indexConstituents = STOCKS_BY_INDEX[effectiveMarket.name === 'Egypt' ? 'EGX 30' : 'FTSE ADX 15'] || STOCKS_BY_INDEX['S&P 500'] || [];
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
    }, [effectiveMarket.id, retryKey]);

    // Squarified Treemap Algorithm implementation
    const squarify = (values: number[], width: number, height: number, offset: { x: number, y: number }) => {
        const rects: { w: number, h: number, x: number, y: number }[] = [];
        const totalValue = values.reduce((a, b) => a + b, 0);
        const scale = (width * height) / totalValue;

        const worstAspectRatio = (row: number[], width: number) => {
            if (row.length === 0) return Infinity;
            const sum = row.reduce((a, b) => a + b, 0) * scale;
            const min = Math.min(...row) * scale;
            const max = Math.max(...row) * scale;
            return Math.max((width * width * max) / (sum * sum), (sum * sum) / (width * width * min));
        };

        const layoutRow = (row: number[], width: number, vertical: boolean, pos: { x: number, y: number }) => {
            const rowValue = row.reduce((a, b) => a + b, 0);
            const rowThickness = (rowValue * scale) / width;
            let currentPos = vertical ? pos.y : pos.x;

            row.forEach(val => {
                const length = (val * scale) / rowThickness;
                rects.push({
                    x: vertical ? pos.x : currentPos,
                    y: vertical ? currentPos : pos.y,
                    w: vertical ? rowThickness : length,
                    h: vertical ? length : rowThickness,
                });
                currentPos += length;
            });
            
            if (vertical) pos.x += rowThickness;
            else pos.y += rowThickness;
        };

        let remainingData = [...values];
        let currentPos = { ...offset };
        let currentWidth = width;
        let currentHeight = height;

        while (remainingData.length > 0) {
            let row: number[] = [];
            let side = Math.min(currentWidth, currentHeight);
            let vertical = side === currentWidth;

            while (remainingData.length > 0) {
                const nextVal = remainingData[0];
                if (worstAspectRatio([...row, nextVal], side) <= worstAspectRatio(row, side)) {
                    row.push(remainingData.shift()!);
                } else {
                    break;
                }
            }

            layoutRow(row, side, vertical, currentPos);
            if (vertical) currentHeight -= (row.reduce((a, b) => a + b, 0) * scale) / side;
            else currentWidth -= (row.reduce((a, b) => a + b, 0) * scale) / side;
        }

        return rects;
    };

    const heatmapData = useMemo(() => {
        if (dimensions.width === 0 || stocks.length === 0) return [];

        // 1. Group by sector
        const sectors: Record<string, Stock[]> = {};
        stocks.forEach(s => {
            if (!sectors[s.sector]) sectors[s.sector] = [];
            sectors[s.sector].push(s);
        });

        const sectorList = Object.entries(sectors).map(([name, items]) => ({
            name,
            items,
            value: items.reduce((sum, i) => sum + (i.weight || 1), 0)
        })).sort((a, b) => b.value - a.value);

        // 2. Squarify Sectors
        const sectorRects = squarify(sectorList.map(s => s.value), dimensions.width, dimensions.height, { x: 0, y: 0 });

        // 3. Squarify Stocks within Sectors
        const finalBlocks: any[] = [];
        sectorList.forEach((sector, idx) => {
            const rect = sectorRects[idx];
            const sortedStocks = sector.items.sort((a, b) => b.weight - a.weight);
            const stockRects = squarify(sortedStocks.map(s => s.weight), rect.w, rect.h, { x: rect.x, y: rect.y });
            
            stockRects.forEach((sr, sidx) => {
                finalBlocks.push({
                    ...sr,
                    stock: sortedStocks[sidx],
                    isSectorFirst: sidx === 0,
                    sectorName: sector.name
                });
            });
        });

        return finalBlocks;
    }, [stocks, dimensions]);

    const getHeatmapColor = (change: number) => {
        if (change > 3) return '#089981';
        if (change > 2) return '#057d69';
        if (change > 1) return '#045245';
        if (change > 0) return '#02342c';
        if (change === 0) return '#1e222d';
        if (change < -3) return '#f23645';
        if (change < -2) return '#c21a2a';
        if (change < -1) return '#86252b';
        if (change < 0) return '#411e21';
        return '#1e222d';
    };

    if (isLoading) {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                <Activity size={24} color="#089981" className="animate-pulse" />
            </div>
        );
    }

    return (
        <div style={{ 
            height: '100%', 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            background: '#000000',
            overflow: 'hidden',
        }}>
            {/* Replicated TradingView Control Bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                background: '#131722',
                borderBottom: '1px solid #2a2e39',
                gap: '16px',
                userSelect: 'none'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#2a2e39',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    color: '#fff',
                    fontWeight: 600,
                    gap: '4px',
                    cursor: 'pointer'
                }}>
                    {indexName} <ChevronDown size={14} />
                </div>

                <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#d1d4dc', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        Market cap <ChevronDown size={14} opacity={0.5} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        Change D, % <ChevronDown size={14} opacity={0.5} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        Sector <ChevronDown size={14} opacity={0.5} />
                    </div>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px', color: '#868993' }}>
                    <Camera size={16} style={{ cursor: 'pointer' }} />
                    <Settings size={16} style={{ cursor: 'pointer' }} />
                    <Maximize2 size={16} style={{ cursor: 'pointer' }} />
                </div>
            </div>

            {/* The Treemap Surface */}
            <div 
                ref={containerRef}
                style={{ 
                    flex: 1, 
                    position: 'relative',
                    background: '#000000',
                    overflow: 'hidden'
                }}
            >
                {heatmapData.map((block, i) => (
                    <div
                        key={i}
                        onClick={() => onSelectSymbol?.(block.stock.symbol)}
                        style={{
                            position: 'absolute',
                            left: block.x + 1,
                            top: block.y + 1,
                            width: block.w - 2,
                            height: block.h - 2,
                            background: getHeatmapColor(block.stock.changePercent),
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.03)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.15)'}
                        onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
                    >
                        {/* Sector Header (Only show in the largest block of a sector if space permits) */}
                        {block.isSectorFirst && block.h > 40 && block.w > 60 && (
                            <div style={{
                                position: 'absolute',
                                top: '4px',
                                left: '6px',
                                fontSize: '10px',
                                fontWeight: 700,
                                color: 'rgba(255,255,255,0.4)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.02em'
                            }}>
                                {block.sectorName} &gt;
                            </div>
                        )}

                        <span style={{ 
                            fontSize: block.w > 80 ? '1.1rem' : block.w > 50 ? '0.8rem' : '0.65rem', 
                            fontWeight: 700, 
                            color: '#ffffff',
                            lineHeight: 1
                        }}>
                            {block.stock.symbol.split(':')[1] || block.stock.symbol}
                        </span>
                        {block.h > 35 && (
                            <span style={{ 
                                fontSize: block.w > 80 ? '0.75rem' : '0.65rem', 
                                fontWeight: 500, 
                                color: 'rgba(255,255,255,0.8)',
                                marginTop: '4px'
                            }}>
                                {block.stock.changePercent > 0 ? '+' : ''}{block.stock.changePercent.toFixed(2)}%
                            </span>
                        )}
                    </div>
                ))}
            </div>
            
            {/* Legend / Status Bar */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                alignItems: 'center', 
                padding: '4px 12px', 
                background: '#131722',
                fontSize: '9px', 
                color: '#868993',
                borderTop: '1px solid #1e222d',
            }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                        <span>-3%</span>
                        <div style={{ width: '40px', height: '4px', background: 'linear-gradient(to right, #f23645, #1e222d, #089981)', borderRadius: '2px' }} />
                        <span>+3%</span>
                    </div>
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

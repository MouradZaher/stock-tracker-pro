import React, { useEffect, useState } from 'react';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuth } from '../contexts/AuthContext';
import { getStockData, getMultipleQuotes } from '../services/stockDataService';
import { formatCurrency, formatPercent, getChangeClass } from '../utils/formatters';
import type { Stock } from '../types';
import { TrendingUp, TrendingDown, Trash2, Star, Bell, Search, Zap, Minus, Activity } from 'lucide-react';
import { usePriceAlerts } from '../hooks/usePriceAlerts';
import PriceAlertsModal from './PriceAlertsModal';
import SymbolSearchInput from './SymbolSearchInput';
import { analyzeSymbol } from '../services/aiRecommendationService';
import type { StockRecommendation } from '../types';
import { useMarket } from '../contexts/MarketContext';

import IndexComponents from './IndexComponents';
import FamousHoldings from './FamousHoldings';
import RealTimePrice from './RealTimePrice';

interface WatchlistPageProps {
    onSelectSymbol: (symbol: string) => void;
}

interface SparklineProps {
    data: number[];
    color: string;
}

const InteractiveSparkline: React.FC<SparklineProps> = ({ data, color }) => {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const width = 120;
    const height = 40;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 10) - 5; // Padding 5px
        return `${x},${y}`;
    }).join(' ');

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const idx = Math.min(data.length - 1, Math.max(0, Math.round((x / width) * (data.length - 1))));
        setHoverIndex(idx);
    };

    return (
        <div style={{ position: 'relative', width: width, height: height }}>
            <svg
                width={width}
                height={height}
                style={{ overflow: 'visible', cursor: 'crosshair' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverIndex(null)}
            >
                <defs>
                    <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path
                    d={`M0,${height} ${points.split(' ').map(p => `L${p}`).join(' ')} L${width},${height}`}
                    fill={`url(#gradient-${color})`}
                    stroke="none"
                />
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                />
                {hoverIndex !== null && (
                    <circle
                        cx={(hoverIndex / (data.length - 1)) * width}
                        cy={height - ((data[hoverIndex] - min) / range) * (height - 10) - 5}
                        r="3"
                        fill="#fff"
                        stroke={color}
                        strokeWidth="2"
                    />
                )}
            </svg>
            {hoverIndex !== null && (
                <div style={{
                    position: 'absolute',
                    top: '-25px',
                    left: `${(hoverIndex / (data.length - 1)) * 100}%`,
                    transform: 'translateX(-50%)',
                    background: 'var(--color-bg-secondary)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    zIndex: 10
                }}>
                    {formatCurrency(data[hoverIndex])}
                </div>
            )}
        </div>
    );
};

const WatchlistPage: React.FC<WatchlistPageProps> = ({ onSelectSymbol }) => {
    const { user } = useAuth();
    const { selectedMarket } = useMarket();
    const { marketWatchlists, removeFromWatchlist, addToWatchlist } = useWatchlist();

    const watchlist = marketWatchlists[selectedMarket.id] || [];

    const [stockData, setStockData] = useState<Record<string, Stock>>({});
    const [aiRecs, setAiRecs] = useState<Record<string, StockRecommendation>>({});
    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{ symbol: string; price: number } | null>(null);
    const { checkPrice } = usePriceAlerts();

    useEffect(() => {
        const fetchWatchlistData = async () => {
            const indexSym = selectedMarket.indexSymbol.replace('%5E', '^');
            const symbolsToFetch = [...new Set([indexSym, ...watchlist])];

            setLoading(true);
            try {
                const quotesMap = await getMultipleQuotes(symbolsToFetch);
                const newData: Record<string, Stock> = {};
                quotesMap.forEach((value, key) => {
                    newData[key] = value;
                    if (watchlist.includes(key)) {
                        checkPrice(key, value.price);
                    }
                });
                setStockData(newData);
            } catch (error) {
                console.error("Failed to fetch watchlist data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWatchlistData();
        const interval = setInterval(fetchWatchlistData, 15000);
        return () => clearInterval(interval);
    }, [watchlist, selectedMarket.id]);

    useEffect(() => {
        const fetchAIRecs = async () => {
            if (watchlist.length === 0) return;
            const recs: Record<string, StockRecommendation> = {};
            for (const sym of watchlist) {
                const rec = await analyzeSymbol(sym);
                if (rec) recs[sym] = rec;
            }
            setAiRecs(recs);
        };

        fetchAIRecs();
        const interval = setInterval(fetchAIRecs, 60000);
        return () => clearInterval(interval);
    }, [watchlist.length]);

    const getRecIcon = (rec?: string) => {
        if (rec === 'Buy') return <TrendingUp size={14} color="var(--color-success)" />;
        if (rec === 'Sell') return <TrendingDown size={14} color="var(--color-error)" />;
        return <Minus size={14} color="var(--color-warning)" />;
    };

    const EmptyState = () => (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 2rem',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--glass-border)'
        }}>
            <Star size={40} color="var(--color-warning)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Your watchlist is empty</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', maxWidth: '300px' }}>
                Search for symbols above or use the quick add options below.
            </p>
        </div>
    );

    return (
        <div className="watchlist-page" style={{ padding: '0 var(--spacing-md)', paddingBottom: 'var(--spacing-2xl)' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-md)',
                flexWrap: 'wrap',
                gap: 'var(--spacing-sm)',
                paddingTop: 'var(--spacing-sm)'
            }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <Star size={24} fill="currentColor" className="text-warning" />
                    {selectedMarket.name} Watchlist
                </h2>
                <div style={{ width: '100%', maxWidth: '350px' }}>
                    <SymbolSearchInput
                        placeholder={`Quick add ${selectedMarket.name} symbol...`}
                        marketId={selectedMarket.id}
                        onSelect={(symbol) => addToWatchlist(symbol, selectedMarket.id, user?.id)}
                    />
                </div>
            </div>

            {loading && Object.keys(stockData).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                    <p style={{ color: 'var(--color-text-tertiary)' }}>Fetching market data...</p>
                </div>
            ) : (
                <div className="watchlist-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, clamp(280px, 30vw, 350px)), 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    {/* Market Benchmark Card (Always Visible) */}
                    {selectedMarket && (
                        <div
                            className="watchlist-card glass-card"
                            style={{
                                padding: 'var(--spacing-md)',
                                border: `1px solid ${selectedMarket.color}44`,
                                background: `linear-gradient(135deg, rgba(255,255,255,0.03) 0%, ${selectedMarket.color}0a 100%)`,
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ position: 'absolute', top: '-15px', right: '-15px', opacity: 0.05, pointerEvents: 'none' }}>
                                <Activity size={80} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Zap size={14} style={{ color: selectedMarket.color }} />
                                        <span style={{ fontSize: '0.6rem', fontWeight: 900, color: selectedMarket.color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Market Index</span>
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '4px 0 0 0' }}>{selectedMarket.indexName}</h3>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>
                                        {stockData[selectedMarket.indexSymbol.replace('%5E', '^')] ? (
                                            <RealTimePrice price={stockData[selectedMarket.indexSymbol.replace('%5E', '^')].price} />
                                        ) : '--'}
                                    </div>
                                    {stockData[selectedMarket.indexSymbol.replace('%5E', '^')] && (
                                        <div className={getChangeClass(stockData[selectedMarket.indexSymbol.replace('%5E', '^')].change)} style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                            {formatPercent(stockData[selectedMarket.indexSymbol.replace('%5E', '^')].changePercent)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                Live tracking of the {selectedMarket.name} flagship benchmark for institutional reference.
                            </div>
                        </div>
                    )}

                    {/* Personal Watchlist Items */}
                    {watchlist.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <EmptyState />
                        </div>
                    ) : (
                        watchlist.map(symbol => {
                            const stock = stockData[symbol];
                            if (!stock) return null;
                            const trendColor = stock.change >= 0 ? '#10B981' : '#EF4444';
                            const mockTrend = Array.from({ length: 8 }, () => stock.price * (0.99 + Math.random() * 0.02));

                            return (
                                <div
                                    key={symbol}
                                    className="watchlist-card glass-card"
                                    onClick={() => onSelectSymbol(symbol)}
                                    style={{
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                            <div style={{
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                background: 'rgba(99, 102, 241, 0.1)',
                                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                                fontSize: '0.8rem',
                                                fontWeight: 800,
                                                color: 'var(--color-accent)'
                                            }}>
                                                {symbol}
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{stock.name}</p>
                                                {aiRecs[symbol] && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                        {getRecIcon(aiRecs[symbol].recommendation)}
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-tertiary)' }}>
                                                            {aiRecs[symbol].recommendation} ({aiRecs[symbol].score})
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                                                <RealTimePrice price={stock.price} />
                                            </div>
                                            <div className={getChangeClass(stock.change)} style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                                {formatPercent(stock.changePercent)}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <InteractiveSparkline data={mockTrend} color={trendColor} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className="btn-icon glass-button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setAlertConfig({ symbol, price: stock.price });
                                                }}
                                                style={{ padding: '6px', borderRadius: '50%', color: 'var(--color-text-tertiary)' }}
                                            >
                                                <Bell size={14} />
                                            </button>
                                            <button
                                                className="btn-icon glass-button text-error"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFromWatchlist(symbol, selectedMarket.id, user?.id);
                                                }}
                                                style={{ padding: '6px', borderRadius: '50%' }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            <div style={{ marginTop: '3rem' }}>
                <IndexComponents onQuickAdd={(symbol) => addToWatchlist(symbol, selectedMarket.id, user?.id)} />
            </div>

            {selectedMarket.id === 'us' && (
                <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
                    <FamousHoldings onQuickAdd={(symbol) => addToWatchlist(symbol, selectedMarket.id, user?.id)} />
                </div>
            )}

            {alertConfig && (
                <PriceAlertsModal
                    symbol={alertConfig.symbol}
                    currentPrice={alertConfig.price}
                    onClose={() => setAlertConfig(null)}
                />
            )}
        </div>
    );
};

export default WatchlistPage;

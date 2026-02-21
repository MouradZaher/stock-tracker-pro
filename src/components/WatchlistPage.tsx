import React, { useEffect, useState } from 'react';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuth } from '../contexts/AuthContext';
import { getStockData, getMultipleQuotes } from '../services/stockDataService';
import { formatCurrency, formatPercent, getChangeClass } from '../utils/formatters';
import type { Stock } from '../types';
import { TrendingUp, TrendingDown, Trash2, Star, Bell, Search, Zap, Minus } from 'lucide-react';
import { usePriceAlerts } from '../hooks/usePriceAlerts';
import PriceAlertsModal from './PriceAlertsModal';
import SymbolSearchInput from './SymbolSearchInput';
import { analyzeSymbol } from '../services/aiRecommendationService';
import type { StockRecommendation } from '../types';

import FamousHoldings from './FamousHoldings';

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
    const { watchlist, removeFromWatchlist, addToWatchlist } = useWatchlist();
    const [stockData, setStockData] = useState<Record<string, Stock>>({});
    const [aiRecs, setAiRecs] = useState<Record<string, StockRecommendation>>({});
    const [loading, setLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const categories = ['All', 'Tech', 'Growth', 'Dividends'];

    const [alertConfig, setAlertConfig] = useState<{ symbol: string; price: number } | null>(null);
    const { checkPrice } = usePriceAlerts();

    useEffect(() => {
        const fetchWatchlistData = async () => {
            if (watchlist.length === 0) {
                setStockData({});
                return;
            }

            setLoading(true);
            try {
                // Use batch fetching for better performance
                const quotesMap = await getMultipleQuotes(watchlist);
                const newData: Record<string, Stock> = {};
                quotesMap.forEach((value, key) => {
                    newData[key] = value;
                    // Check price alerts
                    checkPrice(key, value.price);
                });
                setStockData(newData);
            } catch (error) {
                console.error("Failed to fetch watchlist data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWatchlistData();
        // Poll every 15 seconds
        const interval = setInterval(fetchWatchlistData, 15000);
        return () => clearInterval(interval);
    }, [watchlist]);

    // Fetch AI Recs for watchlist
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
        <div className="empty-state" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            padding: '3rem',
            textAlign: 'center'
        }}>
            <div style={{
                width: '80px',
                height: '80px',
                background: 'var(--color-bg-secondary)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
            }}>
                <Star size={40} color="var(--color-warning)" fill="var(--color-warning)" style={{ opacity: 0.5 }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Your watchlist is empty</h2>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', marginBottom: '2rem' }}>
                Search for symbols above or star them to add them here for quick access.
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
                    My Watchlist
                </h2>
                <div style={{ width: '100%', maxWidth: '350px' }}>
                    <SymbolSearchInput
                        placeholder="Quick add symbol..."
                        onSelect={(symbol) => addToWatchlist(symbol, user?.id)}
                    />
                </div>
            </div>

            {watchlist.length === 0 ? <EmptyState /> : (
                <>
                    {loading && Object.keys(stockData).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                            Loading watchlist data...
                        </div>
                    ) : (
                        <div className="watchlist-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, clamp(250px, 30vw, 320px)), 1fr))',
                            gap: '1.25rem',
                            paddingBottom: '2rem'
                        }}>
                            {watchlist.map(symbol => {
                                const stock = stockData[symbol];
                                if (!stock) return null;

                                // Mock trend data for sparkline
                                const mockTrend = Array.from({ length: 10 }, () => stock.price * (0.98 + Math.random() * 0.04));
                                const trendColor = stock.change >= 0 ? 'var(--color-success)' : 'var(--color-error)';

                                return (
                                    <div
                                        key={symbol}
                                        className="watchlist-card glass-card"
                                        style={{
                                            padding: 'var(--spacing-md)',
                                            cursor: 'pointer',
                                            position: 'relative'
                                        }}
                                        onClick={() => onSelectSymbol(symbol)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                                <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{symbol}</h3>
                                                <button
                                                    className="btn-icon glass-button"
                                                    style={{ padding: '4px', borderRadius: 'var(--radius-full)', color: 'var(--color-text-tertiary)' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setAlertConfig({ symbol, price: stock.price });
                                                    }}
                                                    title="Set Price Alert"
                                                >
                                                    <Bell size={14} />
                                                </button>
                                                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', marginLeft: 'auto' }}>{stock.name}</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 'var(--font-size-base)', fontWeight: '700', color: 'var(--color-text-primary)' }}>{formatCurrency(stock.price)}</div>
                                                <div className={getChangeClass(stock.change)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--spacing-xs)', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
                                                    {stock.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                    {formatPercent(stock.changePercent)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* AI Signal Strip */}
                                        {aiRecs[symbol] && (
                                            <div style={{
                                                margin: '0.5rem 0 0.75rem 0',
                                                padding: '6px 10px',
                                                background: 'rgba(99, 102, 241, 0.04)',
                                                borderRadius: '8px',
                                                border: '1px solid var(--glass-border)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Zap size={14} color="var(--color-accent)" />
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Conviction:</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 800,
                                                        color: aiRecs[symbol].score >= 75 ? 'var(--color-success)' : (aiRecs[symbol].score >= 50 ? 'var(--color-warning)' : 'var(--color-error)')
                                                    }}>
                                                        {aiRecs[symbol].recommendation?.toUpperCase()}
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-tertiary)' }}>
                                                        ({aiRecs[symbol].score})
                                                    </span>
                                                    {getRecIcon(aiRecs[symbol].recommendation)}
                                                </div>
                                            </div>
                                        )}

                                        {/* Fundamentals Mini-Stats */}
                                        <div style={{
                                            display: 'flex',
                                            gap: '12px',
                                            margin: '0 0 1rem 0',
                                            padding: '0 4px'
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>P/E Ratio</div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{stock.peRatio ? stock.peRatio.toFixed(1) : '—'}</div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>Market Cap</div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{stock.marketCap ? (stock.marketCap / 1e9).toFixed(1) + 'B' : '—'}</div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>Div Yield</div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-success)' }}>{stock.dividendYield ? stock.dividendYield.toFixed(1) + '%' : '—'}</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.5rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>7D Trend</div>
                                                <InteractiveSparkline data={mockTrend} color={trendColor} />
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <button
                                                    className="btn-icon delete-btn glass-button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFromWatchlist(symbol, user?.id);
                                                    }}
                                                    title="Remove from watchlist"
                                                    style={{ color: 'var(--color-text-tertiary)', borderRadius: '50%', padding: '6px' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* Famous Holdings Section */}
            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
                <FamousHoldings onQuickAdd={(symbol) => addToWatchlist(symbol, user?.id)} />
            </div>

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

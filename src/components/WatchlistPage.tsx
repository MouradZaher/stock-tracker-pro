import React, { useEffect, useState } from 'react';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuth } from '../contexts/AuthContext';
import { getStockData, getMultipleQuotes } from '../services/stockDataService';
import { REFRESH_INTERVALS } from '../services/api';
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
        const interval = setInterval(fetchWatchlistData, REFRESH_INTERVALS.WATCHLIST);
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
        <div className="watchlist-page dashboard-container">
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 0',
                borderBottom: '1px solid var(--glass-border)',
                marginBottom: '1rem'
            }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.25rem' }}>
                    <Star size={24} fill="currentColor" className="text-warning" />
                    {selectedMarket.name} Terminal
                </h2>
                <div style={{ width: '100%', maxWidth: '350px' }}>
                    <SymbolSearchInput
                        placeholder={`Quick add ${selectedMarket.name} symbol...`}
                        marketId={selectedMarket.id}
                        onSelect={(symbol) => addToWatchlist(symbol, selectedMarket.id, user?.id)}
                    />
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Main Content: Personal Watchlist Table */}
                <div className="dashboard-column">
                    {loading && Object.keys(stockData).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                            <p style={{ color: 'var(--color-text-tertiary)' }}>Fetching market data...</p>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <table className="compact-table">
                                <thead>
                                    <tr>
                                        <th>Asset</th>
                                        <th>Price</th>
                                        <th>Change</th>
                                        <th>AI Intelligence</th>
                                        <th>Trend (24h)</th>
                                        <th style={{ textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Market Benchmark Row */}
                                    {selectedMarket && stockData[selectedMarket.indexSymbol.replace('%5E', '^')] && (
                                        <tr style={{ background: `${selectedMarket.color}0a` }}>
                                            <td style={{ borderRadius: '8px 0 0 8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <Zap size={14} style={{ color: selectedMarket.color }} />
                                                    <div>
                                                        <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{selectedMarket.indexName}</div>
                                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>MARKET BENCHMARK</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 800 }}>
                                                <RealTimePrice price={stockData[selectedMarket.indexSymbol.replace('%5E', '^')].price} />
                                            </td>
                                            <td className={getChangeClass(stockData[selectedMarket.indexSymbol.replace('%5E', '^')].change)}>
                                                {formatPercent(stockData[selectedMarket.indexSymbol.replace('%5E', '^')].changePercent)}
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Institutional Reference</span>
                                            </td>
                                            <td>
                                                <div style={{ opacity: 0.5, transform: 'scale(0.8)', transformOrigin: 'left' }}>
                                                    <InteractiveSparkline data={[100, 102, 101, 104, 103, 106]} color={selectedMarket.color} />
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center', borderRadius: '0 8px 8px 0' }}>
                                                <Activity size={16} style={{ opacity: 0.3 }} />
                                            </td>
                                        </tr>
                                    )}

                                    {/* Empty Watchlist */}
                                    {watchlist.length === 0 && (
                                        <tr>
                                            <td colSpan={6} style={{ padding: 0 }}>
                                                <EmptyState />
                                            </td>
                                        </tr>
                                    )}

                                    {/* Watchlist Items */}
                                    {watchlist.map(symbol => {
                                        const stock = stockData[symbol];
                                        if (!stock) return null;
                                        const trendColor = stock.change >= 0 ? '#10B981' : '#EF4444';
                                        const mockTrend = Array.from({ length: 8 }, () => stock.price * (0.99 + Math.random() * 0.02));

                                        return (
                                            <tr key={symbol} onClick={() => onSelectSymbol(symbol)} style={{ cursor: 'pointer' }}>
                                                <td style={{ borderRadius: '8px 0 0 8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '6px',
                                                            background: 'rgba(99, 102, 241, 0.1)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 900,
                                                            fontSize: '0.75rem',
                                                            color: 'var(--color-accent)'
                                                        }}>
                                                            {symbol}
                                                        </div>
                                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{stock.name}</div>
                                                    </div>
                                                </td>
                                                <td style={{ fontWeight: 800 }}>
                                                    <RealTimePrice price={stock.price} />
                                                </td>
                                                <td className={getChangeClass(stock.change)} style={{ fontWeight: 700 }}>
                                                    {formatPercent(stock.changePercent)}
                                                </td>
                                                <td>
                                                    {aiRecs[symbol] ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            {getRecIcon(aiRecs[symbol].recommendation)}
                                                            <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>
                                                                {aiRecs[symbol].recommendation} ({aiRecs[symbol].score})
                                                            </span>
                                                        </div>
                                                    ) : '--'}
                                                </td>
                                                <td>
                                                    <InteractiveSparkline data={mockTrend} color={trendColor} />
                                                </td>
                                                <td style={{ textAlign: 'center', borderRadius: '0 8px 8px 0' }}>
                                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                                                        <button
                                                            className="btn-icon glass-button"
                                                            onClick={() => setAlertConfig({ symbol, price: stock.price })}
                                                            style={{ padding: '6px', borderRadius: '6px' }}
                                                        >
                                                            <Bell size={14} />
                                                        </button>
                                                        <button
                                                            className="btn-icon glass-button text-error"
                                                            onClick={() => removeFromWatchlist(symbol, selectedMarket.id, user?.id)}
                                                            style={{ padding: '6px', borderRadius: '6px' }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Sidebar Content: Discovery Widgets */}
                <div className="dashboard-column">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass-card" style={{ padding: '1.25rem' }}>
                            <IndexComponents onQuickAdd={(symbol) => addToWatchlist(symbol, selectedMarket.id, user?.id)} />
                        </div>
                        
                        {selectedMarket.id === 'us' && (
                            <div className="glass-card" style={{ padding: '1.25rem' }}>
                                <FamousHoldings onQuickAdd={(symbol) => addToWatchlist(symbol, selectedMarket.id, user?.id)} />
                            </div>
                        )}
                    </div>
                </div>
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

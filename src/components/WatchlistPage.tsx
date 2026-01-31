import React, { useEffect, useState } from 'react';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuth } from '../contexts/AuthContext';
import { getStockData } from '../services/stockDataService';
import { formatCurrency, formatPercent, getChangeClass } from '../utils/formatters';
import type { Stock } from '../types';
import { TrendingUp, TrendingDown, Trash2, Star } from 'lucide-react';

interface WatchlistPageProps {
    onSelectSymbol: (symbol: string) => void;
}

const Sparkline: React.FC<{ data: number[], color: string }> = ({ data, color }) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    const width = 100;
    const height = 30;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / (range || 1)) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} style={{ overflow: 'visible' }}>
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
};

const WatchlistPage: React.FC<WatchlistPageProps> = ({ onSelectSymbol }) => {
    const { user } = useAuth();
    const { watchlist, removeFromWatchlist } = useWatchlist();
    const [stockData, setStockData] = useState<Record<string, Stock>>({});
    const [loading, setLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const categories = ['All', 'Tech', 'Growth', 'Dividends'];

    useEffect(() => {
        const fetchWatchlistData = async () => {
            if (watchlist.length === 0) return;

            setLoading(true);
            const newData: Record<string, Stock> = {};

            await Promise.all(
                watchlist.map(async (symbol) => {
                    try {
                        const { stock } = await getStockData(symbol);
                        newData[symbol] = stock;
                    } catch (error) {
                        console.error(`Failed to fetch data for ${symbol}`, error);
                    }
                })
            );

            setStockData(newData);
            setLoading(false);
        };

        fetchWatchlistData();
        // Poll every 15 seconds
        const interval = setInterval(fetchWatchlistData, 15000);
        return () => clearInterval(interval);
    }, [watchlist]);

    if (watchlist.length === 0) {
        return (
            <div className="empty-state" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
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
                <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px' }}>
                    Star symbols to add them here for quick access.
                </p>
            </div>
        );
    }

    return (
        <div className="watchlist-page" style={{ padding: '0 var(--spacing-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Star size={24} fill="currentColor" className="text-warning" />
                    My Watchlist
                </h2>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`glass-button ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                            style={{
                                padding: '6px 16px',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.875rem',
                                border: activeCategory === cat ? '1px solid var(--color-accent)' : '1px solid var(--glass-border)',
                                background: activeCategory === cat ? 'var(--color-accent-light)' : 'rgba(255,255,255,0.05)',
                                color: activeCategory === cat ? 'var(--color-accent)' : 'var(--color-text-secondary)'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {loading && Object.keys(stockData).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                    Loading watchlist data...
                </div>
            ) : (
                <div className="watchlist-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                    gap: '1.5rem',
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
                                    padding: '1.5rem',
                                    cursor: 'pointer',
                                    position: 'relative'
                                }}
                                onClick={() => onSelectSymbol(symbol)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{symbol}</h3>
                                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{stock.name}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>{formatCurrency(stock.price)}</div>
                                        <div className={getChangeClass(stock.change)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontSize: '0.875rem', fontWeight: 600 }}>
                                            {stock.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            {formatPercent(stock.changePercent)}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.5rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>7D Trend</div>
                                        <Sparkline data={mockTrend} color={trendColor} />
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
        </div>
    );
};

export default WatchlistPage;

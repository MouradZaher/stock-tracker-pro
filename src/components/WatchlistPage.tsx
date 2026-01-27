import React, { useEffect, useState } from 'react';
import { useWatchlist } from '../hooks/useWatchlist';
import { getStockData } from '../services/stockDataService';
import { formatCurrency, formatPercent, getChangeClass } from '../utils/formatters';
import type { Stock } from '../types';
import { TrendingUp, TrendingDown, Trash2, Star } from 'lucide-react';

interface WatchlistPageProps {
    onSelectSymbol: (symbol: string) => void;
}

const WatchlistPage: React.FC<WatchlistPageProps> = ({ onSelectSymbol }) => {
    const { watchlist, removeFromWatchlist } = useWatchlist();
    const [stockData, setStockData] = useState<Record<string, Stock>>({});
    const [loading, setLoading] = useState(false);

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
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Star size={24} fill="currentColor" className="text-warning" />
                My Watchlist
            </h2>

            {loading && Object.keys(stockData).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading watchlist data...</div>
            ) : (
                <div className="watchlist-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {watchlist.map(symbol => {
                        const stock = stockData[symbol];
                        if (!stock) return null;

                        return (
                            <div
                                key={symbol}
                                className="watchlist-card"
                                style={{
                                    background: 'var(--color-bg-elevated)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '1.5rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    position: 'relative'
                                }}
                                onClick={() => onSelectSymbol(symbol)}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{symbol}</h3>
                                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{stock.name}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>{formatCurrency(stock.price)}</div>
                                        <div className={getChangeClass(stock.change)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontSize: '0.9rem' }}>
                                            {stock.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            {formatPercent(stock.changePercent)}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                                        Vol: {stock.volume.toLocaleString()}
                                    </span>
                                    <button
                                        className="btn-icon delete-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFromWatchlist(symbol);
                                        }}
                                        title="Remove from watchlist"
                                        style={{ color: 'var(--color-text-tertiary)' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
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

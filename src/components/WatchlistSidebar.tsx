import React, { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuth } from '../contexts/AuthContext';
import { getStockData, getMultipleQuotes } from '../services/stockDataService';
import { formatCurrency, formatPercent, getChangeClass } from '../utils/formatters';
import type { Stock } from '../types';
import { useMarket } from '../contexts/MarketContext';

interface WatchlistSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSymbol: (symbol: string) => void;
}

const WatchlistSidebar: React.FC<WatchlistSidebarProps> = ({ isOpen, onClose, onSelectSymbol }) => {
    const { user } = useAuth();
    const { selectedMarket } = useMarket();
    const { marketWatchlists, removeFromWatchlist } = useWatchlist();

    // Get watchlist for current market
    const watchlist = marketWatchlists[selectedMarket.id] || [];

    const [stockData, setStockData] = useState<Record<string, Stock>>({});

    useEffect(() => {
        const fetchWatchlistData = async () => {
            if (watchlist.length === 0) return;

            try {
                const indexSym = selectedMarket.indexSymbol.replace('%5E', '^');
                const symbolsToFetch = [...new Set([indexSym, ...watchlist])];

                // Fetch all data in one batch request
                const stocksMap = await getMultipleQuotes(symbolsToFetch);

                // Convert Map to Record object for state
                const newData: Record<string, Stock> = {};
                stocksMap.forEach((value, key) => {
                    newData[key] = value;
                });

                setStockData(newData);
            } catch (error) {
                console.error('Failed to fetch watchlist data', error);
            }
        };

        if (isOpen) {
            fetchWatchlistData();
            // Poll every 15 seconds while open
            const interval = setInterval(fetchWatchlistData, 15000);
            return () => clearInterval(interval);
        }
    }, [isOpen, watchlist]);

    return (
        <>
            {/* Overlay */}
            <div
                className={`watchlist-overlay ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className={`watchlist-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="watchlist-header">
                    <h2>{selectedMarket.name} Watchlist</h2>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="watchlist-content">
                    {watchlist.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                            <p>Your watchlist is empty.</p>
                            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                Star symbols to add them here for quick access.
                            </p>
                        </div>
                    ) : (
                        <div className="watchlist-list">
                            {/* Market Index Row */}
                            {(() => {
                                const indexSym = selectedMarket.indexSymbol.replace('%5E', '^');
                                const indexStock = stockData[indexSym];
                                if (!indexStock) return null;
                                return (
                                    <div
                                        className="watchlist-item"
                                        style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            paddingBottom: '12px',
                                            marginBottom: '8px'
                                        }}
                                        onClick={() => {
                                            onSelectSymbol(indexSym);
                                            onClose();
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                <span style={{ fontWeight: 800, fontSize: '0.75rem', color: selectedMarket.color, textTransform: 'uppercase' }}>{selectedMarket.indexName}</span>
                                                <span style={{ fontWeight: 700 }}>{formatCurrency(indexStock.price)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                                <span style={{ color: 'var(--color-text-tertiary)' }}>Market Index</span>
                                                <span className={getChangeClass(indexStock.change)} style={{ fontWeight: 600 }}>
                                                    {formatPercent(indexStock.changePercent)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {watchlist.map(symbol => {
                                const stock = stockData[symbol];
                                return (
                                    <div key={symbol} className="watchlist-item" onClick={() => {
                                        onSelectSymbol(symbol);
                                        onClose();
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                <span style={{ fontWeight: 'bold' }}>{symbol}</span>
                                                {stock && (
                                                    <span style={{ fontWeight: 600 }}>{formatCurrency(stock.price)}</span>
                                                )}
                                            </div>
                                            {stock ? (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                                    <span style={{ color: 'var(--color-text-secondary)' }}>{stock.name.substring(0, 15)}{stock.name.length > 15 ? '...' : ''}</span>
                                                    <span className={getChangeClass(stock.change)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        {stock.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                        {formatPercent(stock.changePercent)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="skeleton" style={{ height: '1rem', width: '100%' }} />
                                            )}
                                        </div>
                                        <button
                                            className="btn-icon delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFromWatchlist(symbol, selectedMarket.id, user?.id);
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default WatchlistSidebar;

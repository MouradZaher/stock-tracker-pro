import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';

import { getStockData } from '../services/stockDataService';
import { formatCurrency, formatPercent, formatNumber, formatNumberPlain, formatTimeAgo, getChangeClass } from '../utils/formatters';
import TradingViewChart from './TradingViewChart';
import MarketStatus from './MarketStatus';
import { useWatchlist } from '../hooks/useWatchlist';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';

interface StockDetailProps {
    symbol: string;
}

const StockDetail: React.FC<StockDetailProps> = ({ symbol }) => {
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['stock', symbol],
        queryFn: () => getStockData(symbol),
        refetchInterval: 10000, // Refetch every 10 seconds
        staleTime: 5000,
    });

    useEffect(() => {
        if (data) {
            setLastUpdate(new Date());
        }
    }, [data]);

    if (isLoading) {
        return (
            <div className="stock-detail" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" style={{ width: '40px', height: '40px' }} />
                <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>Loading {symbol}...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="stock-detail" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--color-error)' }}>Failed to load stock data for {symbol}</p>
                <button className="btn btn-primary" onClick={() => refetch()} style={{ marginTop: '1rem' }}>
                    Retry
                </button>
            </div>
        );
    }

    const { stock, profile } = data;

    const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
    const inWatchlist = isInWatchlist(stock.symbol);

    const toggleWatchlist = () => {
        if (inWatchlist) {
            removeFromWatchlist(stock.symbol);
            toast.success(`${stock.symbol} removed from watchlist`);
        } else {
            addToWatchlist(stock.symbol);
            toast.success(`${stock.symbol} added to watchlist`);
        }
    };

    return (
        <div className="stock-detail">
            {/* Header */}
            <div className="stock-header">
                <div className="stock-title">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="stock-symbol">{stock.symbol}</div>
                        <button
                            className={`btn-icon ${inWatchlist ? 'text-warning' : ''}`}
                            onClick={toggleWatchlist}
                            style={{ color: inWatchlist ? 'var(--color-warning)' : 'var(--color-text-tertiary)' }}
                            title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                        >
                            <Star size={24} fill={inWatchlist ? "currentColor" : "none"} />
                        </button>
                    </div>
                    <div className="stock-name">{stock.name}</div>
                    {profile?.ceo && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
                            CEO: {profile.ceo} {profile.founded && `• Founded: ${profile.founded}`}
                        </div>
                    )}
                    {!profile?.ceo && profile?.founded && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
                            Founded: {profile.founded}
                        </div>
                    )}
                </div>

                <div className="stock-price-section">
                    <div className="stock-price">{formatCurrency(stock.price)}</div>
                    <div className={`stock-change ${getChangeClass(stock.change)}`}>
                        {stock.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {formatCurrency(Math.abs(stock.change))} ({formatPercent(stock.changePercent)})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                        <div className="last-updated">
                            <Clock size={12} />
                            Updated {formatTimeAgo(lastUpdate)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MarketStatus />
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <TradingViewChart symbol={symbol} />

            {/* Stats Grid */}
            <div className="section">
                <h3 className="section-title">Market Statistics</h3>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-label">Open</div>
                        <div className="stat-value">{formatCurrency(stock.open)}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">High</div>
                        <div className="stat-value">{formatCurrency(stock.high)}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Low</div>
                        <div className="stat-value">{formatCurrency(stock.low)}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Prev Close</div>
                        <div className="stat-value">{formatCurrency(stock.previousClose)}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Volume</div>
                        <div className="stat-value">{formatNumberPlain(stock.volume)}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Avg Volume</div>
                        <div className="stat-value">{formatNumberPlain(stock.avgVolume)}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Market Cap</div>
                        <div className="stat-value">{formatNumber(stock.marketCap)}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">P/E Ratio</div>
                        <div className="stat-value">{stock.peRatio ? stock.peRatio.toFixed(2) : 'N/A'}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">EPS</div>
                        <div className="stat-value">{stock.eps ? formatCurrency(stock.eps) : 'N/A'}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Dividend Yield</div>
                        <div className="stat-value">{stock.dividendYield ? `${stock.dividendYield.toFixed(2)}%` : 'N/A'}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">52W High</div>
                        <div className="stat-value">{stock.fiftyTwoWeekHigh ? formatCurrency(stock.fiftyTwoWeekHigh) : 'N/A'}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">52W Low</div>
                        <div className="stat-value">{stock.fiftyTwoWeekLow ? formatCurrency(stock.fiftyTwoWeekLow) : 'N/A'}</div>
                    </div>
                </div>
            </div>

            {/* About */}
            {profile?.description && (
                <div className="section">
                    <h3 className="section-title">About {stock.name}</h3>
                    <div className="section-content">
                        {profile.description}
                        {profile.sector && (
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                                <span>
                                    <strong>Sector:</strong> {profile.sector}
                                </span>
                                {profile.industry && (
                                    <span>
                                        <strong>Industry:</strong> {profile.industry}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockDetail;

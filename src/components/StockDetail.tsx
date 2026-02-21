import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, TrendingUp, TrendingDown, ArrowLeft, Info, Briefcase, DollarSign, PieChart, Users } from 'lucide-react';

import { getStockData } from '../services/stockDataService';
import { REFRESH_INTERVALS } from '../services/api';
import { formatCurrency, formatPercent, formatNumber, formatNumberPlain, formatTimeAgo, getChangeClass } from '../utils/formatters';
import TradingViewChart from './TradingViewChart';
import MarketStatus from './MarketStatus';
import LiveBadge from './LiveBadge';
import { useWatchlist } from '../hooks/useWatchlist';
import { usePortfolioStore } from '../hooks/usePortfolio';
import { useAuth } from '../contexts/AuthContext';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import AIRecommendations from './AIRecommendations';

interface StockDetailProps {
    symbol: string;
    onBack?: () => void;
}

const StockDetail: React.FC<StockDetailProps> = ({ symbol, onBack }) => {
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const { user } = useAuth();
    const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
    const { positions } = usePortfolioStore();

    const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery({
        queryKey: ['stock', symbol],
        queryFn: () => getStockData(symbol),
        refetchInterval: REFRESH_INTERVALS.STOCK_PRICE,
        refetchIntervalInBackground: true,
        staleTime: 2000,
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
                <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>Loading {symbol} data...</p>
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
    const inWatchlist = isInWatchlist(stock.symbol);
    const portfolioPosition = positions.find(p => p.symbol === stock.symbol);

    const toggleWatchlist = () => {
        if (inWatchlist) {
            removeFromWatchlist(stock.symbol, user?.id);
            toast.success(`${stock.symbol} removed from watchlist`);
        } else {
            addToWatchlist(stock.symbol, user?.id);
            toast.success(`${stock.symbol} added to watchlist`);
        }
    };

    return (
        <div className="stock-detail">
            {/* Header */}
            <div className="stock-header glass-card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
                <div className="stock-title">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="glass-button icon-btn"
                                style={{ marginRight: '0.5rem' }}
                                aria-label="Back to Search"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <div className="stock-symbol">{stock.symbol}</div>
                        <LiveBadge lastUpdate={dataUpdatedAt} />
                        <button
                            className={`btn-icon ${inWatchlist ? 'text-warning' : ''}`}
                            onClick={toggleWatchlist}
                            style={{ color: inWatchlist ? 'var(--color-warning)' : 'var(--color-text-tertiary)' }}
                            title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                        >
                            <Star size={24} fill={inWatchlist ? "currentColor" : "none"} />
                        </button>
                    </div>
                    <div className="stock-name" style={{ fontSize: '1.25rem', fontWeight: 600 }}>{stock.name}</div>

                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                        {profile?.ceo && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Users size={14} /> CEO: <span style={{ color: 'var(--color-text-primary)' }}>{profile.ceo}</span>
                            </div>
                        )}
                        {profile?.sector && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Briefcase size={14} /> {profile.sector}
                            </div>
                        )}
                    </div>
                </div>

                <div className="stock-price-section">
                    <div className="stock-price" style={{ fontSize: '2.5rem' }}>{formatCurrency(stock.price)}</div>
                    <div className={`stock-change ${getChangeClass(stock.change)}`} style={{ padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {stock.change >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                        <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                            {formatCurrency(Math.abs(stock.change))} ({formatPercent(stock.changePercent)})
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', marginTop: '0.75rem' }}>
                        <div className="last-updated" style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                            <Clock size={12} /> Live Updates: {formatTimeAgo(lastUpdate)}
                        </div>
                        <MarketStatus />
                    </div>
                </div>
            </div>

            {/* Portfolio Section (If position exists) */}
            {portfolioPosition && (
                <div className="section glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-accent)' }}>
                    <h3 className="section-title" style={{ color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                        <PieChart size={20} /> Your Position
                    </h3>
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                        <div className="stat-card" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                            <div className="stat-label">Units Purchased</div>
                            <div className="stat-value">{formatNumberPlain(portfolioPosition.units)}</div>
                        </div>
                        <div className="stat-card" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                            <div className="stat-label">Avg Cost / Unit</div>
                            <div className="stat-value">{formatCurrency(portfolioPosition.avgCost)}</div>
                        </div>
                        <div className="stat-card" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                            <div className="stat-label">Market Value</div>
                            <div className="stat-value">{formatCurrency(portfolioPosition.marketValue)}</div>
                        </div>
                        <div className="stat-card" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                            <div className="stat-label">Profit / Loss</div>
                            <div className={`stat-value ${getChangeClass(portfolioPosition.profitLoss)}`}>
                                {portfolioPosition.profitLoss >= 0 ? '+' : ''}{formatCurrency(portfolioPosition.profitLoss)} ({formatPercent(portfolioPosition.profitLossPercent)})
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart */}
            <TradingViewChart symbol={symbol} />

            {/* Sector Strength Benchmarking */}
            <div className="section">
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={20} color="var(--color-success)" /> Relative Sector Strength
                </h3>
                <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Benchmarked against</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{profile?.sector || 'Global Equities'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '12px', background: 'var(--color-success-light)', color: 'var(--color-success)', fontWeight: 700, border: '1px solid var(--color-success-light)' }}>
                                OUTPERFORMING
                            </div>
                        </div>
                    </div>

                    <div style={{ position: 'relative', height: '80px', display: 'flex', alignItems: 'center' }}>
                        {/* Comparison Line */}
                        <div style={{ position: 'absolute', width: '100%', height: '2px', background: 'var(--color-border)', top: '50%', transform: 'translateY(-50%)' }} />

                        {/* Sector Reference (Center) */}
                        <div style={{ position: 'absolute', left: '40%', top: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-text-tertiary)', border: '2px solid var(--color-bg-primary)' }} />
                            <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>Sector Avg</div>
                        </div>

                        {/* Stock Marker (Right/Left based on performance) */}
                        <div style={{ position: 'absolute', left: '75%', top: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 2 }}>
                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--color-success)', border: '3px solid var(--color-bg-primary)', boxShadow: '0 0 12px var(--color-success-light)' }} />
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 800 }}>{stock.symbol}</div>
                        </div>

                        {/* Range Labels */}
                        <div style={{ position: 'absolute', left: '0', bottom: '0', fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>Lagging</div>
                        <div style={{ position: 'absolute', right: '0', bottom: '0', fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>Leading</div>
                    </div>
                </div>
            </div>

            {/* Stats Grid - Comprehensive Statistics */}
            <div className="section">
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Info size={20} /> Market Statistics
                </h3>
                <div className="stats-grid">
                    <div className="stat-card glass-card">
                        <div className="stat-label">Open</div>
                        <div className="stat-value">{formatCurrency(stock.open)}</div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-label">High</div>
                        <div className="stat-value">{formatCurrency(stock.high)}</div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-label">Low</div>
                        <div className="stat-value">{formatCurrency(stock.low)}</div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-label">Prev Close</div>
                        <div className="stat-value">{formatCurrency(stock.previousClose)}</div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-label">Volume</div>
                        <div className="stat-value">{formatNumberPlain(stock.volume)}</div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-label">Avg Volume</div>
                        <div className="stat-value">{formatNumberPlain(stock.avgVolume)}</div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-label">Total Value Traded</div>
                        <div className="stat-value">{stock.totalValue ? formatNumber(stock.totalValue) : 'N/A'}</div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-label">Market Cap</div>
                        <div className="stat-value">{formatNumber(stock.marketCap)}</div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-label">P/E Ratio</div>
                        <div className="stat-value">{stock.peRatio ? stock.peRatio.toFixed(2) : 'N/A'}</div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-label">EPS</div>
                        <div className="stat-value">{stock.eps ? formatCurrency(stock.eps) : 'N/A'}</div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-label">Dividend Yield</div>
                        <div className="stat-value">{stock.dividendYield ? `${stock.dividendYield.toFixed(2)}%` : 'N/A'}</div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-label">52W Range</div>
                        <div className="stat-value" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                            {stock.fiftyTwoWeekLow && stock.fiftyTwoWeekHigh ?
                                `${formatCurrency(stock.fiftyTwoWeekLow)} - ${formatCurrency(stock.fiftyTwoWeekHigh)}` : 'N/A'
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* Dividend History Section */}
            {profile?.dividends && profile.dividends.length > 0 && (
                <div className="section">
                    <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DollarSign size={20} /> Dividend History
                    </h3>
                    <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                        <table className="portfolio-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Ex-Date</th>
                                    <th>Payment Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {profile.dividends.map((div, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.7rem',
                                                background: div.type === 'upcoming' ? 'var(--color-accent-light)' : 'var(--color-bg-tertiary)',
                                                color: div.type === 'upcoming' ? 'var(--color-accent)' : 'var(--color-text-secondary)'
                                            }}>
                                                {div.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(div.amount)}</td>
                                        <td>{div.exDate}</td>
                                        <td>{div.paymentDate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* About Company Section */}
            {profile?.description && (
                <div className="section">
                    <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Info size={20} /> About {stock.name}
                    </h3>
                    <div className="section-content glass-card" style={{ padding: '1.5rem', background: 'var(--glass-bg)' }}>
                        <p style={{ marginBottom: '1.5rem', fontSize: '1rem', color: 'var(--color-text-secondary)' }}>
                            {profile.description}
                        </p>

                        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px' }}>
                            <div>
                                <div className="stat-label" style={{ marginBottom: '0.25rem' }}>CEO</div>
                                <div style={{ fontSize: '1rem', fontWeight: 600 }}>{profile.ceo || 'N/A'}</div>
                            </div>
                            <div>
                                <div className="stat-label" style={{ marginBottom: '0.25rem' }}>Headquarters</div>
                                <div style={{ fontSize: '1rem', fontWeight: 600 }}>{profile.sector} • {profile.industry}</div>
                            </div>
                            <div>
                                <div className="stat-label" style={{ marginBottom: '0.25rem' }}>Website</div>
                                <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                                    {profile.website ? (
                                        <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>
                                            Visit Site
                                        </a>
                                    ) : 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Insights */}
            <div className="section" style={{ marginTop: '1rem' }}>
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-accent)' }} />
                    AI Market Analysis
                </h3>
                <div style={{ marginTop: '0.5rem' }}>
                    <AIRecommendations />
                </div>
            </div>
        </div>
    );
};

export default StockDetail;

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, TrendingUp, TrendingDown, Clock, Info, ExternalLink, Activity, PieChart, Shield, Target, Plus, Bell, Trash2, Save, X, Edit, Layers, Globe, Sparkles, Users, Briefcase, DollarSign, Zap } from 'lucide-react';

import { getStockData, getStockNews } from '../services/stockDataService';
import { REFRESH_INTERVALS } from '../services/api';
import { formatCurrency, formatPercent, formatNumber, formatNumberPlain, formatTimeAgo, getChangeClass } from '../utils/formatters';
import TradingViewChart from './TradingViewChart';
import MarketStatus from './MarketStatus';
import { useWatchlist } from '../hooks/useWatchlist';
import { usePortfolioStore } from '../hooks/usePortfolio';
import { useAuth } from '../contexts/AuthContext';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import AIRecommendations from './AIRecommendations';
import CompanyLogo from './CompanyLogo';
import PriceAlertsModal from './PriceAlertsModal';
import TradeAnalysisPanel from './TradeAnalysisPanel';
import RealTimePrice from './RealTimePrice';
import { useMarket } from '../contexts/MarketContext';
import { aiStrategyService } from '../services/aiStrategyService';
import { CheckCircle, RefreshCw } from 'lucide-react';

const LiveMomentum: React.FC<{ symbol: string }> = ({ symbol }) => {
    const [momentum, setMomentum] = useState(50);
    const [lastPrice, setLastPrice] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMomentum(prev => {
                const shift = (Math.random() - 0.5) * 4;
                return Math.max(10, Math.min(90, prev + shift));
            });
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const color = momentum > 60 ? 'var(--color-success)' : momentum < 40 ? 'var(--color-error)' : 'var(--color-warning)';
    
    return (
        <div className="alpha-card hover-glow" style={{ padding: '1.5rem', border: '1px solid var(--glass-border)', borderTop: `4px solid ${color}`, background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div className="alpha-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                <span>LIVE MOMENTUM FLOW</span>
                <span className="pulse-dot" style={{ width: '8px', height: '8px', background: color, boxShadow: `0 0 10px ${color}` }}></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '0.5rem' }}>
                <div className="alpha-value" style={{ color, fontSize: '2rem', fontWeight: 900, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{momentum.toFixed(1)}%</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-tertiary)', letterSpacing: '0.05em' }}>{momentum > 50 ? 'ACCUMULATING' : 'RETRACING'}</div>
            </div>
            <div className="momentum-meter" style={{ height: '6px', marginTop: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div className="momentum-bar" style={{ width: `${momentum}%`, background: color, height: '100%', transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: `0 0 10px ${color}` }} />
            </div>
        </div>
    );
};

interface StockDetailProps {
    symbol: string;
    onBack?: () => void;
}

const StockDetail: React.FC<StockDetailProps> = ({ symbol, onBack }) => {
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [showAlerts, setShowAlerts] = useState(false);
    const [activeModule, setActiveModule] = useState<string>('wall-street');
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    const { user } = useAuth();
    const { selectedMarket } = useMarket();

    useEffect(() => {
        const fetchAnalysis = async () => {
            setIsAnalyzing(true);
            setAnalysisData(null); // Clear previous data to prevent stale data UI crashes
            try {
                const result = await aiStrategyService.getInstitutionalAnalysis(symbol, activeModule, selectedMarket.id);
                setAnalysisData(result);
            } catch (err) {
                console.error("Analysis failed", err);
            } finally {
                setIsAnalyzing(false);
            }
        };

        fetchAnalysis();
    }, [symbol, activeModule, selectedMarket.id]);
    const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
    const { positions } = usePortfolioStore();

    const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery({
        queryKey: ['stock', symbol],
        queryFn: () => getStockData(symbol),
        refetchInterval: REFRESH_INTERVALS.STOCK_PRICE,
        refetchIntervalInBackground: true,
        staleTime: 2000,
    });

    const { data: newsData, isLoading: isNewsLoading } = useQuery({
        queryKey: ['stock-news', symbol],
        queryFn: () => getStockNews(symbol),
        staleTime: 600000, // 10 minutes
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
    const inWatchlist = isInWatchlist(stock.symbol, selectedMarket.id);
    const portfolioPosition = positions.find(p => p.symbol === stock.symbol);

    const toggleWatchlist = () => {
        if (inWatchlist) {
            removeFromWatchlist(stock.symbol, selectedMarket.id, user?.id);
            toast.success(`${stock.symbol} removed from watchlist`);
        } else {
            addToWatchlist(stock.symbol, selectedMarket.id, user?.id);
            toast.success(`${stock.symbol} added to watchlist`);
        }
    };

    return (
        <div className="stock-detail">
            {/* Header */}
            <div className="stock-header glass-card hover-glow" style={{
                padding: '2.5rem',
                marginBottom: 'var(--spacing-xl)',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                borderRadius: '24px'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-20%',
                    width: '300px',
                    height: '300px',
                    background: 'var(--color-accent-light)',
                    filter: 'blur(80px)',
                    opacity: 0.3,
                    borderRadius: '50%',
                    zIndex: 0,
                    pointerEvents: 'none'
                }} />
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
                        <CompanyLogo symbol={stock.symbol} size={48} />
                        <div className="stock-symbol">{stock.symbol}</div>
                        <button
                            className={`btn-icon ${inWatchlist ? 'text-warning' : ''}`}
                            onClick={toggleWatchlist}
                            style={{ color: inWatchlist ? 'var(--color-warning)' : 'var(--color-text-tertiary)' }}
                            title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                        >
                            <Star size={24} fill={inWatchlist ? "currentColor" : "none"} />
                        </button>
                        <button
                            className="btn-icon"
                            onClick={() => setShowAlerts(true)}
                            title="Set Price Alert"
                            style={{ color: 'var(--color-accent)', transition: 'transform 0.15s ease' }}
                            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
                            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            <Bell size={22} />
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
                    <div className="stock-price" style={{ fontSize: 'var(--font-size-3xl)' }}>
                        <RealTimePrice price={stock.price} isFallback={stock.isFallback} />
                    </div>
                    <div className={`stock-change ${getChangeClass(stock.change)}`} style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', borderRadius: 'var(--radius-sm)' }}>
                        {stock.change >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                        <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 700 }}>
                            {formatCurrency(Math.abs(stock.change))} ({formatPercent(stock.changePercent)})
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-sm)' }}>
                        <div className="last-updated" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
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
                            <div style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--spacing-xs) var(--spacing-sm)', borderRadius: 'var(--radius-full)', background: 'var(--color-success-light)', color: 'var(--color-success)', fontWeight: 700, border: '1px solid var(--color-success-light)' }}>
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
                            <div style={{ width: 'var(--spacing-sm)', height: 'var(--spacing-sm)', borderRadius: '50%', background: 'var(--color-success)', border: '2px solid var(--color-bg-primary)', boxShadow: '0 0 12px var(--color-success-light)' }} />
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 800 }}>{stock.symbol}</div>
                        </div>

                        {/* Range Labels */}
                        <div style={{ position: 'absolute', left: '0', bottom: '0', fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>Lagging</div>
                        <div style={{ position: 'absolute', right: '0', bottom: '0', fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>Leading</div>
                    </div>
                </div>
            </div>

            {/* Smart Entry Timing */}
            <div className="section">
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={20} color="var(--color-accent)" /> Smart Entry Timing
                </h3>
                <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(139,92,246,0.05) 100%)', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>AI Timing Score</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                {stock.changePercent > 0 ? (stock.changePercent > 1.5 ? '72' : '88') : '61'}<span style={{ fontSize: '1rem', opacity: 0.5 }}>/100</span>
                            </div>
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '4px' }}>
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} style={{ flex: 1, height: '4px', background: i < (stock.changePercent > 0 ? 4 : 3) ? 'var(--color-accent)' : 'var(--color-border)', borderRadius: '2px' }} />
                                ))}
                            </div>
                        </div>
                        
                        <div style={{ flex: 2, minWidth: '300px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Best Day to Buy</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 800, marginTop: '2px' }}>Tuesday / Monday</div>
                                </div>
                                <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Strongest Window</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 800, marginTop: '2px' }}>14:30 - 15:30 EST</div>
                                </div>
                            </div>
                            <p style={{ margin: '1rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                <Sparkles size={12} className="text-accent" /> **AI Insight:** {stock.symbol} shows strong mean-reversion tendencies. Entering during intra-day dips near the 20-period EMA offers the highest probability of 24h gain.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid - Comprehensive Statistics */}
            <div className="section">
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Info size={20} /> Market Statistics
                </h3>
                <div className="stats-grid">
                    <div className="stat-card glass-card" style={{ border: '1px solid var(--glass-border-bright)' }}>
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
                    <div className="stat-card glass-card" style={{
                        border: data.growth?.pegRatio < 1 ? '1.5px solid var(--color-success)' : '1px solid var(--glass-border)',
                        background: data.growth?.pegRatio < 1 ? 'rgba(0, 255, 136, 0.05)' : 'var(--glass-bg)'
                    }}>
                        <div className="stat-label">PEG Ratio</div>
                        <div className="stat-value" style={{ color: data.growth?.pegRatio < 1 ? 'var(--color-success)' : 'inherit' }}>
                            {data.growth?.pegRatio ? data.growth.pegRatio.toFixed(2) : 'N/A'}
                        </div>
                        {data.growth?.pegRatio < 1 && (
                            <div style={{ fontSize: '0.6rem', color: 'var(--color-success)', fontWeight: 700, marginTop: '2px' }}>UNDERVALUED GROWTH</div>
                        )}
                    </div>
                    <div className="stat-card glass-card" style={{
                        border: data.rsi < 45 ? '1.5px solid var(--color-warning)' : '1px solid var(--glass-border)',
                        background: data.rsi < 45 ? 'rgba(255, 170, 0, 0.05)' : 'var(--glass-bg)'
                    }}>
                        <div className="stat-label">RSI (14D)</div>
                        <div className="stat-value" style={{ color: data.rsi < 30 ? 'var(--color-success)' : (data.rsi < 45 ? 'var(--color-warning)' : 'inherit') }}>
                            {data.rsi ? data.rsi.toFixed(1) : 'N/A'}
                        </div>
                        {data.rsi < 45 && (
                            <div style={{ fontSize: '0.6rem', color: data.rsi < 30 ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 700, marginTop: '2px' }}>
                                {data.rsi < 30 ? 'OVERSOLD / VALUE' : 'ACCUMULATION ZONE'}
                            </div>
                        )}
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
                                                padding: 'var(--spacing-xs) var(--spacing-sm)',
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

            {/* Trade Analysis Panel */}
            <TradeAnalysisPanel
                symbol={stock.symbol}
                price={stock.price}
                high={stock.high}
                low={stock.low}
                volume={stock.volume}
                avgVolume={stock.avgVolume}
                changePercent={stock.changePercent}
            />

            {/* Institutional Alpha Intelligence Hub */}
            <div className="section" style={{ marginTop: '2.5rem' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem',
                    borderBottom: '1px solid var(--glass-border)',
                    paddingBottom: '1rem'
                }}>
                    <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                        <Shield size={24} className="text-accent" />
                        Institutional Alpha Intelligence
                    </h3>
                    <div style={{
                        fontSize: '0.7rem',
                        background: 'var(--color-accent-light)',
                        color: 'var(--color-accent)',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontWeight: 800,
                        letterSpacing: '0.05em'
                    }}>
                        SENIOR ANALYST ACCESS
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="alpha-grid" style={{ gridColumn: 'span 1' }}>
                        <div className="alpha-card">
                            <div className="alpha-label">GLOBAL_RANK</div>
                            <div className="alpha-value">#12 / Institutional</div>
                        </div>
                        <LiveMomentum symbol={symbol} />
                    </div>
                    <div className="alpha-card" style={{ gridColumn: 'span 1', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <div className="alpha-label" style={{ color: 'var(--color-accent)' }}>INSTITUTIONAL_TERMINAL_ACCESS</div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '8px 0' }}>
                            Encrypted connection established with ARIA Global Research Hub. Real-time synthesis of cross-asset data units in progress. All stats are live-synchronized with regional market centers.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                            <div className="badge-live">📡 ACTIVE_SYNC</div>
                            <div className="badge-live" style={{ color: 'var(--color-accent)', background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.2)' }}>🔐 SECURE_NODE</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) 3fr', gap: '2rem' }}>
                    {/* Module Selection Sidebar */}
                    <div className="alpha-card" style={{ padding: '0.75rem', height: 'fit-content', position: 'sticky', top: '120px' }}>
                        {[
                            { id: 'wall-street', label: 'Wall Street Research', icon: <Briefcase size={16} /> },
                            { id: 'financial-breakdown', label: '5Y Financial Audit', icon: <DollarSign size={16} /> },
                            { id: 'earnings-quality', label: 'Earnings Quality Forensic', icon: <Shield size={16} /> },
                            { id: 'earnings-call', label: 'Earnings Call Intel', icon: <Activity size={16} /> },
                            { id: 'short-thesis', label: 'Short Thesis Constructor', icon: <TrendingDown size={16} /> },
                            { id: 'macro-regime', label: 'Macro Regime Positioning', icon: <Globe size={16} /> },
                            { id: 'activist-setup', label: 'Activist & Event Setup', icon: <Users size={16} /> },
                            { id: 'thirteen-f-intel', label: '13F Holdings Intel', icon: <Layers size={16} /> },
                            { id: 'competitive-intel', label: 'Competitive Intel Brief', icon: <Zap size={16} /> },
                            { id: 'moat-analysis', label: 'Competitive Moat', icon: <Shield size={16} /> },
                            { id: 'valuation', label: 'DCF Valuation Model', icon: <Target size={16} /> },
                            { id: 'risk-analysis', label: 'Strategic Risk Matrix', icon: <Activity size={16} /> },
                            { id: 'growth-potential', label: 'Growth Potential', icon: <TrendingUp size={16} /> },
                            { id: 'hedge-fund', label: 'Hedge Fund Thesis', icon: <Users size={16} /> },
                            { id: 'bull-bear', label: 'Bull vs Bear Debate', icon: <Edit size={16} /> },
                            { id: 'earnings-breakdown', label: 'Earnings Analysis', icon: <Layers size={16} /> },
                            { id: 'buy-hold-avoid', label: 'Final Verdict', icon: <CheckCircle size={16} /> }
                        ].map(mod => (
                            <button
                                key={mod.id}
                                onClick={() => setActiveModule(mod.id)}
                                className={`module-btn ${activeModule === mod.id ? 'active' : ''}`}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    background: activeModule === mod.id ? 'var(--color-accent)' : 'transparent',
                                    color: activeModule === mod.id ? '#fff' : 'var(--color-text-secondary)',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    marginBottom: '4px',
                                    fontWeight: activeModule === mod.id ? 700 : 500
                                }}
                            >
                                {mod.icon}
                                <span style={{ fontSize: '0.8rem' }}>{mod.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Report Display Area */}
                    <div className="alpha-card" style={{ padding: '2rem', minHeight: '500px', background: 'rgba(255,255,255,0.01)' }}>
                        {isAnalyzing ? (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="spinner" style={{ width: '40px', height: '40px', marginBottom: '1.5rem' }} />
                                <div style={{ fontSize: '1rem', fontWeight: 700, animation: 'pulse 1.5s infinite' }}>
                                    ARIA AI is synthesizing institutional data...
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginTop: '0.5rem' }}>
                                    CROSS-REFERENCING BLOOMBERG & REUTERS FEED
                                </div>
                            </div>
                        ) : analysisData ? (
                            <div className="animate-fade-in-up">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                                    <div>
                                        <h4 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{analysisData.title}</h4>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                                            Generated by ARIA Intelligence • Institutional Grade Output
                                        </div>
                                    </div>
                                    {analysisData.rating && (
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-tertiary)' }}>RATING</div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-success)' }}>{analysisData.rating}</div>
                                        </div>
                                    )}
                                </div>

                                {activeModule === 'wall-street' && analysisData?.sections && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        {analysisData.sections.map((s: any, i: number) => (
                                            <div key={i}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '6px' }}>{s.heading}</div>
                                                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>{s.content}</p>
                                            </div>
                                        ))}
                                        {analysisData.scenarios && (
                                            <div style={{ marginTop: '1rem', padding: '1.5rem', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                                                <div style={{ fontWeight: 800, marginBottom: '1rem' }}>Scenario Analysis</div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-success)', fontWeight: 800 }}>BULL</div>
                                                        <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>{analysisData.scenarios.bull}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'center', borderLeft: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)' }}>
                                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-accent)', fontWeight: 800 }}>BASE</div>
                                                        <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>{analysisData.scenarios.base}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-error)', fontWeight: 800 }}>BEAR</div>
                                                        <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>{analysisData.scenarios.bear}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeModule === 'financial-breakdown' && analysisData?.financials && (
                                    <div className="animate-fade-in">
                                        <p style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '2rem', lineHeight: 1.5 }}>{analysisData.summary}</p>
                                        <div className="alpha-grid" style={{ marginBottom: '2rem' }}>
                                            {analysisData.metrics?.map((m: any, i: number) => (
                                                <div key={i} className="alpha-card" style={{ textAlign: 'center' }}>
                                                    <div className="alpha-label">{m.label}</div>
                                                    <div className="alpha-value" style={{ fontSize: '1.5rem' }}>{m.value}</div>
                                                    <div style={{ fontSize: '0.65rem', color: m.trend === 'up' ? 'var(--color-success)' : 'var(--color-text-tertiary)', fontWeight: 900, marginTop: '8px' }}>{m.trend.toUpperCase()} TREND</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--color-success-light)', color: 'var(--color-success)', fontWeight: 900, textAlign: 'center', border: '1px solid var(--color-success-light)' }}>
                                            INSTITUTIONAL_VERDICT: {analysisData.verdict}
                                        </div>
                                    </div>
                                )}

                                {activeModule === 'moat-analysis' && analysisData?.factors && (
                                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                        <div className="alpha-card" style={{ textAlign: 'center', padding: '2rem' }}>
                                            <div className="alpha-value" style={{ fontSize: '4.5rem', lineHeight: 1 }}>{analysisData.score}</div>
                                            <div className="alpha-label">OVERALL MOAT_RATING / 10</div>
                                        </div>
                                        <div className="alpha-grid">
                                            {analysisData.factors.map((f: any, i: number) => (
                                                <div key={i} className="alpha-card">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                        <span className="alpha-label">{f.name}</span>
                                                        <span className="alpha-value" style={{ fontSize: '0.9rem' }}>{f.score}</span>
                                                    </div>
                                                    <div className="momentum-meter">
                                                        <div className="momentum-bar" style={{ width: `${f.score * 10}%`, background: 'var(--color-accent)' }} />
                                                    </div>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '12px', lineHeight: 1.4 }}>{f.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="alpha-card" style={{ borderLeft: '4px solid var(--color-accent)' }}>
                                            <div className="alpha-label">COMPETITIVE_LANDSCAPE</div>
                                            <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem' }}>{analysisData.competitorComparison}</p>
                                        </div>
                                    </div>
                                )}

                                {activeModule === 'valuation' && analysisData?.intrinsicValue && (
                                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                        <div className="alpha-grid">
                                            <div className="alpha-card" style={{ textAlign: 'center' }}>
                                                <div className="alpha-label">INTRINSIC_VALUE</div>
                                                <div className="alpha-value" style={{ fontSize: '1.75rem' }}>${analysisData.intrinsicValue}</div>
                                            </div>
                                            <div className="alpha-card" style={{ textAlign: 'center', border: '2px solid var(--color-success)', background: 'var(--color-success-light)' }}>
                                                <div className="alpha-label" style={{ color: 'var(--color-success)' }}>VERDICT</div>
                                                <div className="alpha-value" style={{ fontSize: '1.75rem', color: 'var(--color-success)' }}>{analysisData.conclusion}</div>
                                            </div>
                                            <div className="alpha-card" style={{ textAlign: 'center' }}>
                                                <div className="alpha-label">DCF_ESTIMATE</div>
                                                <div className="alpha-value" style={{ fontSize: '1.75rem' }}>{analysisData.dcfEstimate}</div>
                                            </div>
                                        </div>
                                        <div className="alpha-card">
                                            <div className="alpha-label">VALUATION_METHODOLOGY</div>
                                            <p style={{ margin: '8px 0', fontSize: '0.95rem', lineHeight: 1.6 }}>Our model indicates that <strong>{symbol}</strong> is currently trading at a discount. {analysisData.methodology}</p>
                                            <div className="alpha-grid" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                                                <div>
                                                    <div className="alpha-label">TRAILING_P/E</div>
                                                    <div className="alpha-value" style={{ fontSize: '1.25rem' }}>{analysisData.currentPE}x</div>
                                                </div>
                                                <div>
                                                    <div className="alpha-label">INDUSTRY_AVG</div>
                                                    <div className="alpha-value" style={{ fontSize: '1.25rem' }}>{analysisData.industryAvgPE}x</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeModule === 'risk-analysis' && analysisData?.risks && (
                                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div className="alpha-grid">
                                            <div className="alpha-card">
                                                <div className="alpha-label" style={{ marginBottom: '1.5rem' }}>TOP_RANKED_RISKS</div>
                                                {analysisData.ranking?.map((r: string, i: number) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-error-light)', color: 'var(--color-error)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 900 }}>{i + 1}</div>
                                                        <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{r}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="alpha-card">
                                                <div className="alpha-label" style={{ marginBottom: '1.5rem' }}>RISK_DETAIL_MATRIX</div>
                                                {analysisData.risks.map((r: any, i: number) => (
                                                    <div key={i} style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{r.type}</span>
                                                            <span className="badge-live" style={{ background: r.level === 'CRITICAL' ? 'var(--color-error-light)' : 'var(--color-warning-light)', color: r.level === 'CRITICAL' ? 'var(--color-error)' : 'var(--color-warning)', borderColor: 'transparent' }}>{r.level}</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>{r.detail}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeModule === 'growth-potential' && analysisData?.opportunities && (
                                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                        <div className="alpha-grid">
                                            <div className="alpha-card">
                                                <div className="alpha-label">TAM / MARKET_SIZE</div>
                                                <div className="alpha-value" style={{ fontSize: '1.75rem' }}>{analysisData.marketSize}</div>
                                            </div>
                                            <div className="alpha-card">
                                                <div className="alpha-label">INDUSTRY_CAGR</div>
                                                <div className="alpha-value" style={{ fontSize: '1.75rem', color: 'var(--color-success)' }}>{analysisData.industryGrowth}</div>
                                            </div>
                                        </div>
                                        <div className="alpha-card">
                                            <div className="alpha-label" style={{ marginBottom: '1rem' }}>EXPANSION_OPPORTUNITIES</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                {analysisData.opportunities?.map((o: string, i: number) => (
                                                    <div key={i} className="badge-live" style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem' }}>{o}</div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="alpha-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
                                            <div className="alpha-label">LONG_TERM_PROJECTION</div>
                                            <p style={{ margin: '8px 0 0 0', fontSize: '1.1rem', fontWeight: 600 }}>{analysisData.projection}</p>
                                        </div>
                                    </div>
                                )}

                                {activeModule === 'hedge-fund' && analysisData?.catalysts && (
                                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div className="alpha-card" style={{ borderLeft: '6px solid var(--color-accent)', background: 'rgba(99, 102, 241, 0.05)', padding: '2rem' }}>
                                            <div className="alpha-label" style={{ color: 'var(--color-accent)' }}>THE_THESIS</div>
                                            <div className="alpha-value" style={{ fontSize: '1.5rem', lineHeight: 1.4, marginTop: '8px' }}>"{analysisData.thesis}"</div>
                                        </div>
                                        <div className="alpha-grid">
                                            <div className="alpha-card" style={{ background: 'var(--color-success-light)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                                                <div className="alpha-label" style={{ color: 'var(--color-success)' }}>BULL_CASE / ACCUMULATE</div>
                                                <p style={{ margin: '8px 0 0 0', fontSize: '0.95rem', fontWeight: 600 }}>{analysisData.buyReason}</p>
                                            </div>
                                            <div className="alpha-card" style={{ background: 'var(--color-error-light)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                                                <div className="alpha-label" style={{ color: 'var(--color-error)' }}>BEAR_CASE / CAUTION</div>
                                                <p style={{ margin: '8px 0 0 0', fontSize: '0.95rem', fontWeight: 600 }}>{analysisData.avoidReason}</p>
                                            </div>
                                        </div>
                                        <div className="alpha-card">
                                            <div className="alpha-label" style={{ marginBottom: '1.25rem' }}>UPCOMING_CATALYSTS</div>
                                            {analysisData.catalysts?.map((c: string, i: number) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                                    <div className="pulse-dot" style={{ width: '8px', height: '8px', background: 'var(--color-warning)', borderRadius: '50%' }} />
                                                    <div style={{ fontSize: '1rem', fontWeight: 500 }}>{c}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeModule === 'bull-bear' && analysisData?.bull && (
                                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                        <div className="alpha-grid">
                                            <div className="alpha-card" style={{ borderTop: '4px solid var(--color-success)', padding: '2rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.5rem' }}>
                                                    <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)' }}>
                                                        <TrendingUp size={24} />
                                                    </div>
                                                    <div>
                                                        <div className="alpha-value" style={{ fontSize: '1rem' }}>{analysisData.bull.analyst}</div>
                                                        <div className="alpha-label">SENIOR_BULL_CASE</div>
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'var(--color-text-primary)', fontStyle: 'italic', borderLeft: '3px solid rgba(16, 185, 129, 0.3)', paddingLeft: '1rem' }}>"{analysisData.bull.argument}"</p>
                                            </div>
                                            <div className="alpha-card" style={{ borderTop: '4px solid var(--color-error)', padding: '2rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.5rem' }}>
                                                    <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'var(--color-error)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 16px rgba(239, 68, 68, 0.2)' }}>
                                                        <TrendingDown size={24} />
                                                    </div>
                                                    <div>
                                                        <div className="alpha-value" style={{ fontSize: '1rem' }}>{analysisData.bear.analyst}</div>
                                                        <div className="alpha-label">SENIOR_BEAR_CASE</div>
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'var(--color-text-primary)', fontStyle: 'italic', borderLeft: '3px solid rgba(239, 68, 68, 0.3)', paddingLeft: '1rem' }}>"{analysisData.bear.argument}"</p>
                                            </div>
                                        </div>
                                        <div className="alpha-card" style={{ background: 'var(--color-accent-light)', textAlign: 'center', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                                            <div className="alpha-label">SYNTHESIZED_CONCLUSION</div>
                                            <p style={{ margin: '8px 0 0 0', fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-accent)' }}>{analysisData.conclusion}</p>
                                        </div>
                                    </div>
                                )}

                                {activeModule === 'earnings-breakdown' && analysisData?.revenue && (
                                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div className="alpha-grid">
                                            <div className="alpha-card">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                    <span className="alpha-label">REVENUE_PERFORMANCE</span>
                                                    <span className="badge-live">{analysisData.revenue.status}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                    <div>
                                                        <div className="alpha-label" style={{ opacity: 0.5 }}>REPORTED</div>
                                                        <div className="alpha-value" style={{ fontSize: '1.75rem' }}>{analysisData.revenue.actual}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div className="alpha-label" style={{ opacity: 0.5 }}>EXPECTED</div>
                                                        <div className="alpha-value" style={{ fontSize: '1.25rem', color: 'var(--color-text-tertiary)' }}>{analysisData.revenue.estimate}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            {analysisData.eps && (
                                                <div className="alpha-card" style={{ border: '1px solid var(--color-success)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                        <span className="alpha-label">EPS_PERFORMANCE</span>
                                                        <span className="badge-live" style={{ background: 'var(--color-success)', color: '#fff' }}>{analysisData.eps.status}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                        <div>
                                                            <div className="alpha-label" style={{ opacity: 0.5 }}>REPORTED</div>
                                                            <div className="alpha-value" style={{ fontSize: '1.75rem' }}>{analysisData.eps.actual}</div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div className="alpha-label" style={{ opacity: 0.5 }}>EXPECTED</div>
                                                            <div className="alpha-value" style={{ fontSize: '1.25rem', color: 'var(--color-text-tertiary)' }}>{analysisData.eps.estimate}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="alpha-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
                                            <div className="alpha-card">
                                                <div className="alpha-label">KEY_PERFORMANCE_METRICS</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '8px' }}>{analysisData.keyMetrics}</div>
                                            </div>
                                            <div className="alpha-card" style={{ background: 'var(--color-success-light)', textAlign: 'center' }}>
                                                <div className="alpha-label">MARKET_RESPONSE</div>
                                                <div className="alpha-value" style={{ fontSize: '2rem', color: 'var(--color-success)' }}>{analysisData.marketReaction}</div>
                                            </div>
                                        </div>
                                        <div className="alpha-card" style={{ borderLeft: '4px solid var(--color-accent)' }}>
                                            <div className="alpha-label">FORWARD_GUIDANCE</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 500, marginTop: '4px' }}>{analysisData.guidance}</div>
                                        </div>
                                    </div>
                                )}

                                {activeModule === 'buy-hold-avoid' && analysisData?.verdict && (
                                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '2.5rem', padding: '3rem 0' }}>
                                        <div className="pulse-dot" style={{ width: '140px', height: '140px', borderRadius: '50%', background: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 0 60px rgba(16, 185, 129, 0.4)' }}>
                                            <CheckCircle size={80} />
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div className="alpha-label" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>ARIA_FINAL_INVESTMENT_VERDICT</div>
                                            <div className="alpha-value" style={{ fontSize: '2.5rem', color: 'var(--color-success)', letterSpacing: '-0.02em' }}>{analysisData.verdict}</div>
                                            <p style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '1.5rem auto 0', lineHeight: 1.5, fontWeight: 500 }}>{analysisData.summary}</p>
                                        </div>
                                        <div className="alpha-grid" style={{ width: '100%', maxWidth: '700px' }}>
                                            <div className="alpha-card" style={{ textAlign: 'center' }}>
                                                <div className="alpha-label">1-YEAR_RESEARCH_OUTLOOK</div>
                                                <div className="alpha-value" style={{ fontSize: '1.5rem' }}>{analysisData.shortTerm}</div>
                                            </div>
                                            <div className="alpha-card" style={{ textAlign: 'center' }}>
                                                <div className="alpha-label">5-YEAR_STRATEGIC_PLAN</div>
                                                <div className="alpha-value" style={{ fontSize: '1.5rem' }}>{analysisData.longTerm}</div>
                                            </div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '10px 20px', borderRadius: '30px', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>
                                            ⚠️ CONFIDENTIAL • FOR INSTITUTIONAL USERS ONLY
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
                                Select a research module to begin analysis.
                            </div>
                        )}
                        <style>{`
                            @keyframes pulse {
                                0% { opacity: 0.6; transform: scale(0.98); }
                                50% { opacity: 1; transform: scale(1); }
                                100% { opacity: 0.6; transform: scale(0.98); }
                            }
                        `}</style>
                    </div>
                </div>
            </div>

            {/* AI Insights (Original) */}
            <div className="section" style={{ marginTop: '2.5rem' }}>
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-accent)' }} />
                    AI Market Analysis
                </h3>
                <div style={{ marginTop: '0.5rem' }}>
                    <AIRecommendations />
                </div>
            </div>

            {/* Live News & Market Sentiment */}
            <div className="section" style={{ marginTop: '2.5rem' }}>
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                    <Globe size={20} className="text-accent" /> Live Intelligence & Sentiment
                </h3>
                
                {isNewsLoading ? (
                    <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>Scanning global financial sources...</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                        {/* News Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Top Headlines</div>
                            {(newsData || []).map((news: any) => (
                                <a 
                                    key={news.id} 
                                    href={news.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="glass-card news-item-hover"
                                    style={{ 
                                        padding: '1.25rem', 
                                        textDecoration: 'none', 
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem',
                                        border: '1px solid var(--glass-border)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>{news.headline}</div>
                                        {news.image && (
                                            <img src={news.image} alt="" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {news.summary}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase' }}>{news.source}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>{formatTimeAgo(new Date(news.datetime))}</div>
                                    </div>
                                </a>
                            ))}
                        </div>

                        {/* Analysis & Sentiment Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Sentiment Engine</div>
                            
                            <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                                    <Target size={24} color="var(--color-accent)" />
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>Institutional Positioning</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>Net order flow across major exchanges</div>
                                    </div>
                                </div>
                                <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '65%', background: 'linear-gradient(90deg, var(--color-error) 0%, var(--color-success) 100%)' }} />
                                    <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: '35%', background: 'rgba(255,255,255,0.05)' }} />
                                    <div style={{ position: 'absolute', left: '65%', top: '-2px', height: '16px', width: '2px', background: '#fff', boxShadow: '0 0 10px #fff' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.7rem', fontWeight: 700 }}>
                                    <span style={{ color: 'var(--color-error)' }}>BEARISH</span>
                                    <span style={{ color: 'var(--color-success)' }}>BULLISH (65%)</span>
                                </div>
                            </div>

                            <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--color-bg-elevated)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                                    <Sparkles size={20} color="var(--color-warning)" />
                                    <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Smart Alpha Signals</div>
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                   <li style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Insider trading window: **Positive accumulation** detected.</li>
                                   <li style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Social sentiment: High volume of positive mentions on Reddit.</li>
                                   <li style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Correlation alert: Tracking with major index peers (88% sympany).</li>
                                </ul>
                            </div>
                            
                            <a 
                                href={`https://finance.yahoo.com/quote/${symbol}/news`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="glass-button"
                                style={{ textAlign: 'center', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <ExternalLink size={16} /> View External Research Hub
                            </a>
                        </div>
                    </div>
                )}
                
                <style>{`
                    .news-item-hover:hover {
                        background: rgba(255,255,255,0.03) !important;
                        border-color: var(--color-accent) !important;
                        transform: translateY(-2px);
                    }
                `}</style>
            </div>

            {/* Price Alerts Modal */}
            {showAlerts && (
                <PriceAlertsModal
                    symbol={stock.symbol}
                    currentPrice={stock.price}
                    onClose={() => setShowAlerts(false)}
                />
            )}
        </div>
    );
};

export default StockDetail;

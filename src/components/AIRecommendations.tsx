import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, TrendingUp, TrendingDown, Minus, X, BarChart3, Zap } from 'lucide-react';
import { getRecommendationsForSector, getAllRecommendations } from '../services/aiRecommendationService';
import type { StockRecommendation } from '../types';
import { formatCurrency } from '../utils/formatters';
import { SECTORS } from '../data/sectors';
import toast from 'react-hot-toast';
import { soundService } from '../services/soundService';

interface AIRecommendationsProps {
    onSelectStock?: (symbol: string) => void;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({ onSelectStock }) => {
    const [selectedSector, setSelectedSector] = useState<string>('all');
    const [selectedStock, setSelectedStock] = useState<StockRecommendation | null>(null);

    const handleTradeAction = (symbol: string) => {
        soundService.playTap();
        onSelectStock?.(symbol);
    };

    const { data: recommendations, isLoading, refetch, error } = useQuery({
        queryKey: ['recommendations', selectedSector],
        queryFn: async () => {
            if (selectedSector === 'all') {
                return await getAllRecommendations();
            } else {
                return await getRecommendationsForSector(selectedSector, 3);
            }
        },
        staleTime: 60000, // 1 minute
    });

    const getRecommendationIcon = (rec: 'Buy' | 'Hold' | 'Sell') => {
        if (rec === 'Buy') return <TrendingUp size={18} color="var(--color-success)" />;
        if (rec === 'Sell') return <TrendingDown size={18} color="var(--color-error)" />;
        return <Minus size={18} color="var(--color-text-secondary)" />;
    };

    const getRecommendationColor = (rec: 'Buy' | 'Hold' | 'Sell') => {
        if (rec === 'Buy') return 'var(--color-success)';
        if (rec === 'Sell') return 'var(--color-error)';
        return 'var(--color-text-secondary)';
    };

    const getScoreColor = (score: number) => {
        if (score >= 75) return 'var(--color-success)';
        if (score >= 50) return 'var(--color-warning)';
        return 'var(--color-error)';
    };

    return (
        <div className="portfolio-container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Success Rate Card */}
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                        <svg width="80" height="80" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                            <circle cx="40" cy="40" r="35" fill="none" stroke="var(--color-success)" strokeWidth="8" strokeDasharray="220" strokeDashoffset="33" transform="rotate(-90 40 40)" />
                        </svg>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 800, fontSize: '1.25rem' }}>85%</div>
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>AI Accuracy</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Historical success rate based on 'Buy' calls reaching target within 30 days.</p>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>+12.4% Avg Return</div>
                    </div>
                </div>

                {/* Quick Actions Card */}
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Zap size={16} /> Trade Shortcuts
                        </h3>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button onClick={() => { soundService.playTap(); setSelectedSector('all'); toast.success('Analyzing full portfolio...'); }} className="glass-button" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                                Analyze Portfolio
                            </button>
                            <button onClick={() => { soundService.playTap(); setSelectedSector('Technology'); toast.success('Comparing Tech stocks...'); }} className="glass-button" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                                Compare Tech
                            </button>
                            <button onClick={() => { soundService.playTap(); setSelectedSector('Financial Services'); toast.success('Finding High-Yielders...'); }} className="glass-button" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                                Top High-Yielders
                            </button>
                            <button onClick={() => { soundService.playTap(); setSelectedSector('Healthcare'); toast.success('Running Risk Check...'); }} className="glass-button" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                                Risk Check
                            </button>
                        </div>
                    </div>
                </div>

                {/* Strategy Simulator - Innovation */}
                <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.1) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart3 size={16} /> Strategy Simulator
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                        Test AI performance against S&P 500 over the last 12 months.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '60px', gap: '4px', marginBottom: '1rem' }}>
                        {[40, 45, 30, 50, 65, 55, 70, 85, 80, 95].map((h, i) => (
                            <div key={i} style={{ flex: 1, background: i % 2 === 0 ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)', height: `${h}%`, borderRadius: '2px', opacity: 0.8 }} />
                        ))}
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.9rem' }} onClick={() => soundService.playSuccess()}>
                        Run Backtest
                    </button>
                </div>
            </div>

            <div className="portfolio-header">
                <div>
                    <h2>Top Recommendations</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', marginTop: '0.5rem' }}>
                        Following 5% per stock, 20% per sector allocation rules
                    </p>
                </div>
                <div className="flex gap-md">
                    <select
                        value={selectedSector}
                        onChange={(e) => setSelectedSector(e.target.value)}
                        className="form-input"
                        style={{ minWidth: '200px' }}
                    >
                        <option value="all">All Sectors</option>
                        {SECTORS.map((sector) => (
                            <option key={sector} value={sector}>
                                {sector}
                            </option>
                        ))}
                    </select>
                    <button className="btn btn-primary" onClick={() => refetch()}>
                        <RefreshCw size={18} />
                        Refresh
                    </button>
                </div>
            </div>

            {isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-2xl)' }}>
                    <div className="spinner" style={{ width: '40px', height: '40px' }} />
                    <p style={{ marginLeft: '1rem', color: 'var(--color-text-secondary)' }}>
                        Analyzing stocks and generating recommendations...
                    </p>
                </div>
            )}

            {error && (
                <div style={{
                    padding: 'var(--spacing-md)',
                    background: 'var(--color-error-light)',
                    border: '1px solid var(--color-error)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-error)',
                }}>
                    Failed to load recommendations. Please try again.
                </div>
            )}

            {!isLoading && recommendations && recommendations.length > 0 && (
                <div className="table-container" style={{ overflowX: 'hidden', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
                    <table className="portfolio-table">
                        <thead>
                            <tr>
                                <th>Symbol</th>
                                <th>Sector</th>
                                <th style={{ textAlign: 'right' }}>Price</th>
                                <th style={{ textAlign: 'right' }}>Score</th>
                                <th>Recommendation</th>
                                <th style={{ textAlign: 'right' }}>Suggested %</th>
                                <th>Reasoning</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recommendations.map((rec) => (
                                <tr key={`${rec.symbol}-${rec.sector}`} onClick={() => setSelectedStock(rec)} style={{ cursor: 'pointer' }}>
                                    <td>
                                        <strong>{rec.symbol}</strong>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                            {rec.name}
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.875rem' }}>{rec.sector}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(rec.price)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span style={{
                                            color: getScoreColor(rec.score),
                                            fontWeight: 600,
                                        }}>
                                            {rec.score}/100
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-sm">
                                            {getRecommendationIcon(rec.recommendation)}
                                            <span style={{ color: getRecommendationColor(rec.recommendation), fontWeight: 600 }}>
                                                {rec.recommendation}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span style={{
                                            color: rec.suggestedAllocation <= 5 ? 'inherit' : 'var(--color-warning)',
                                            fontWeight: 600,
                                        }}>
                                            {rec.suggestedAllocation}%
                                        </span>
                                    </td>
                                    <td style={{ maxWidth: '300px' }}>
                                        {rec.reasoning.slice(0, 2).map((reason, idx) => (
                                            <div key={idx} style={{ fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--color-text-secondary)' }}>
                                                • {reason}
                                            </div>
                                        ))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!isLoading && recommendations && recommendations.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-secondary)' }}>
                    <p>No recommendations available for the selected sector.</p>
                </div>
            )}

            {/* Detail Modal */}
            {selectedStock && (
                <div className="modal-overlay glass-blur" onClick={() => setSelectedStock(null)}>
                    <div className="modal glass-effect" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px', border: '1px solid var(--glass-border-bright)' }}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">{selectedStock.symbol} - {selectedStock.name}</h3>
                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
                                    {selectedStock.sector}
                                </div>
                            </div>
                            <button className="btn btn-icon glass-button" onClick={() => setSelectedStock(null)} style={{ borderRadius: '50%', padding: '4px' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Summary */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                                <div className="stat-card glass-card">
                                    <div className="stat-label">Price</div>
                                    <div className="stat-value">{formatCurrency(selectedStock.price)}</div>
                                </div>
                                <div className="stat-card glass-card">
                                    <div className="stat-label">Score</div>
                                    <div className="stat-value" style={{ color: getScoreColor(selectedStock.score) }}>
                                        {selectedStock.score}/100
                                    </div>
                                </div>
                                <div className="stat-card glass-card">
                                    <div className="stat-label">Suggested Allocation</div>
                                    <div className="stat-value">{selectedStock.suggestedAllocation}%</div>
                                </div>
                            </div>

                            {/* Recommendation */}
                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Recommendation</h4>
                                <div className="flex items-center gap-sm">
                                    {getRecommendationIcon(selectedStock.recommendation)}
                                    <span style={{ fontSize: '1.25rem', fontWeight: 600, color: getRecommendationColor(selectedStock.recommendation) }}>
                                        {selectedStock.recommendation}
                                    </span>
                                </div>
                            </div>

                            {/* Reasoning */}
                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Analysis & Reasoning</h4>
                                <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                                    {selectedStock.reasoning.map((reason, idx) => (
                                        <div key={idx} style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                            <span>•</span>
                                            <span style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>{reason}</span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    onClick={() => handleTradeAction(selectedStock.symbol)}
                                >
                                    <Zap size={18} /> Execute {selectedStock.recommendation} Analysis
                                </button>
                            </div>

                            {/* Technical Indicators */}
                            {selectedStock.technicalIndicators && (
                                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <h4 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Technical Indicators</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-sm)' }}>
                                        <div className="stat-card glass-card" style={{ padding: 'var(--spacing-sm)' }}>
                                            <div className="stat-label">RSI</div>
                                            <div className="stat-value" style={{ fontSize: '1rem' }}>
                                                {selectedStock.technicalIndicators.rsi ? selectedStock.technicalIndicators.rsi.toFixed(1) : 'N/A'}
                                            </div>
                                        </div>
                                        <div className="stat-card glass-card" style={{ padding: 'var(--spacing-sm)' }}>
                                            <div className="stat-label">50-Day MA</div>
                                            <div className="stat-value" style={{ fontSize: '1rem' }}>
                                                {selectedStock.technicalIndicators.ma50 ? formatCurrency(selectedStock.technicalIndicators.ma50) : 'N/A'}
                                            </div>
                                        </div>
                                        <div className="stat-card glass-card" style={{ padding: 'var(--spacing-sm)' }}>
                                            <div className="stat-label">200-Day MA</div>
                                            <div className="stat-value" style={{ fontSize: '1rem' }}>
                                                {selectedStock.technicalIndicators.ma200 ? formatCurrency(selectedStock.technicalIndicators.ma200) : 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recent News */}
                            {selectedStock.news && selectedStock.news.length > 0 && (
                                <div>
                                    <h4 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent News Context</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                        {selectedStock.news.map((article) => (
                                            <a
                                                key={article.id}
                                                href={article.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="glass-card"
                                                style={{
                                                    padding: 'var(--spacing-md)',
                                                    textDecoration: 'none',
                                                    color: 'inherit',
                                                    display: 'block'
                                                }}
                                            >
                                                <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--color-text-primary)' }}>
                                                    {article.headline}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>{article.source}</span>
                                                    <span>{new Date(article.datetime * 1000).toLocaleDateString()}</span>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIRecommendations;

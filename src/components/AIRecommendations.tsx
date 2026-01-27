import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getRecommendationsForSector, getAllRecommendations } from '../services/aiRecommendationService';
import type { StockRecommendation } from '../types';
import { formatCurrency } from '../utils/formatters';
import { SECTORS } from '../data/sectors';

const AIRecommendations: React.FC = () => {
    const [selectedSector, setSelectedSector] = useState<string>('all');
    const [selectedStock, setSelectedStock] = useState<StockRecommendation | null>(null);

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
            <div className="portfolio-header">
                <div>
                    <h2>AI Stock Recommendations</h2>
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
                <div className="modal-overlay" onClick={() => setSelectedStock(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">{selectedStock.symbol} - {selectedStock.name}</h3>
                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
                                    {selectedStock.sector}
                                </div>
                            </div>
                            <button className="btn btn-icon" onClick={() => setSelectedStock(null)}>
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Summary */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                                <div className="stat-card">
                                    <div className="stat-label">Price</div>
                                    <div className="stat-value">{formatCurrency(selectedStock.price)}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Score</div>
                                    <div className="stat-value" style={{ color: getScoreColor(selectedStock.score) }}>
                                        {selectedStock.score}/100
                                    </div>
                                </div>
                                <div className="stat-card">
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
                                <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                                    {selectedStock.reasoning.map((reason, idx) => (
                                        <div key={idx} style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                            <span>•</span>
                                            <span style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>{reason}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Technical Indicators */}
                            {selectedStock.technicalIndicators && (
                                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Technical Indicators</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-sm)' }}>
                                        <div className="stat-card">
                                            <div className="stat-label">RSI</div>
                                            <div className="stat-value">
                                                {selectedStock.technicalIndicators.rsi ? selectedStock.technicalIndicators.rsi.toFixed(1) : 'N/A'}
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-label">50-Day MA</div>
                                            <div className="stat-value">
                                                {selectedStock.technicalIndicators.ma50 ? formatCurrency(selectedStock.technicalIndicators.ma50) : 'N/A'}
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-label">200-Day MA</div>
                                            <div className="stat-value">
                                                {selectedStock.technicalIndicators.ma200 ? formatCurrency(selectedStock.technicalIndicators.ma200) : 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recent News */}
                            {selectedStock.news && selectedStock.news.length > 0 && (
                                <div>
                                    <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Recent News</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                        {selectedStock.news.map((article) => (
                                            <a
                                                key={article.id}
                                                href={article.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    padding: 'var(--spacing-md)',
                                                    background: 'var(--color-bg-tertiary)',
                                                    borderRadius: 'var(--radius-md)',
                                                    textDecoration: 'none',
                                                    color: 'inherit',
                                                    transition: 'background var(--transition-fast)',
                                                    cursor: 'pointer',
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-hover)')}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-bg-tertiary)')}
                                            >
                                                <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                                                    {article.headline}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                                    {article.source} • {new Date(article.datetime * 1000).toLocaleDateString()}
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

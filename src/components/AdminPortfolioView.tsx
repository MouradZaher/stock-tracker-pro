import React, { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { fetchUserPortfolios } from '../services/portfolioService';
import type { PortfolioPosition } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface AdminPortfolioViewProps {
    userId: string;
    userEmail: string;
    onClose: () => void;
}

const AdminPortfolioView: React.FC<AdminPortfolioViewProps> = ({ userId, userEmail, onClose }) => {
    const [positions, setPositions] = useState<PortfolioPosition[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        totalValue: 0,
        totalCost: 0,
        totalPL: 0,
        totalPLPercent: 0
    });

    useEffect(() => {
        const loadPortfolio = async () => {
            setLoading(true);
            try {
                const data = await fetchUserPortfolios(userId);
                setPositions(data);

                // Calculate summary
                const totalValue = data.reduce((sum, p) => sum + (p.units * p.currentPrice), 0);
                const totalCost = data.reduce((sum, p) => sum + (p.units * p.avgCost), 0);
                const totalPL = totalValue - totalCost;
                const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

                setSummary({ totalValue, totalCost, totalPL, totalPLPercent });
            } catch (error) {
                console.error('Error loading portfolio:', error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            loadPortfolio();
        }
    }, [userId]);

    return (
        <div className="admin-overlay" onClick={onClose}>
            <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                <div className="admin-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="icon-badge">
                            <PieChart size={24} />
                        </div>
                        <div>
                            <h2>Portfolio Inspection</h2>
                            <p className="admin-subtitle">Viewing positions for <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{userEmail}</span></p>
                        </div>
                    </div>
                    <button className="btn-icon" onClick={onClose}><X size={24} /></button>
                </div>

                {loading ? (
                    <div className="text-center p-xl">Loading portfolio data...</div>
                ) : (
                    <>
                        <div className="admin-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            <div className="admin-stat-card">
                                <span className="stat-label">Total Value</span>
                                <span className="stat-value">{formatCurrency(summary.totalValue)}</span>
                            </div>
                            <div className="admin-stat-card">
                                <span className="stat-label">Total Cost</span>
                                <span className="stat-value">{formatCurrency(summary.totalCost)}</span>
                            </div>
                            <div className="admin-stat-card">
                                <span className="stat-label">Total P/L</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span className={`stat-value ${summary.totalPL >= 0 ? 'text-success' : 'text-error'}`}>
                                        {formatCurrency(summary.totalPL)}
                                    </span>
                                    <span className={`badge ${summary.totalPL >= 0 ? 'bg-success-light text-success' : 'bg-error-light text-error'}`}>
                                        {summary.totalPL >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {formatPercent(summary.totalPLPercent)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="admin-content" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {positions.length === 0 ? (
                                <div className="text-center p-xl text-muted">No positions found for this user.</div>
                            ) : (
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Symbol</th>
                                            <th style={{ textAlign: 'right' }}>Units</th>
                                            <th style={{ textAlign: 'right' }}>Avg Cost</th>
                                            <th style={{ textAlign: 'right' }}>Price</th>
                                            <th style={{ textAlign: 'right' }}>Value</th>
                                            <th style={{ textAlign: 'right' }}>P/L</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {positions.map(pos => (
                                            <tr key={pos.id}>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{pos.symbol}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>{pos.name}</div>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>{pos.units}</td>
                                                <td style={{ textAlign: 'right' }}>{formatCurrency(pos.avgCost)}</td>
                                                <td style={{ textAlign: 'right' }}>{formatCurrency(pos.currentPrice)}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                    {formatCurrency(pos.units * pos.currentPrice)}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <span className={pos.profitLoss >= 0 ? 'text-success' : 'text-error'}>
                                                        {formatPercent(pos.profitLossPercent)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}

                <div className="admin-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default AdminPortfolioView;

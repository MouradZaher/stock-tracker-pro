import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { usePortfolioStore } from '../hooks/usePortfolio';
import { getStockQuote } from '../services/stockDataService';
import { getDividends } from '../services/dividendService';
import { formatCurrency, formatPercent, formatDate, getChangeClass } from '../utils/formatters';
import { checkAllocationLimits, calculateAllocation } from '../utils/calculations';
import { getSectorForSymbol } from '../data/sectors';

const Portfolio: React.FC = () => {
    const { positions, addPosition, removePosition, getSummary, updatePrice } = usePortfolioStore();
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        symbol: '',
        units: '',
        avgCost: '',
    });

    const summary = getSummary();

    // Update prices periodically
    useEffect(() => {
        const updatePrices = async () => {
            for (const position of positions) {
                try {
                    const quote = await getStockQuote(position.symbol);
                    updatePrice(position.symbol, quote.price);
                } catch (error) {
                    console.error(`Failed to update price for ${position.symbol}:`, error);
                }
            }
        };

        updatePrices();
        const interval = setInterval(updatePrices, 15000); // Update every 15 seconds

        return () => clearInterval(interval);
    }, [positions]);

    const handleAddPosition = async () => {
        if (!formData.symbol || !formData.units || !formData.avgCost) {
            return;
        }

        try {
            const quote = await getStockQuote(formData.symbol.toUpperCase());
            const dividends = await getDividends(formData.symbol.toUpperCase());

            addPosition({
                symbol: formData.symbol.toUpperCase(),
                name: quote.name,
                units: parseFloat(formData.units),
                avgCost: parseFloat(formData.avgCost),
                currentPrice: quote.price,
                sector: getSectorForSymbol(formData.symbol.toUpperCase()),
                dividends: dividends || [],
            });

            setShowModal(false);
            setFormData({ symbol: '', units: '', avgCost: '' });
        } catch (error) {
            alert('Failed to add position. Please check the symbol and try again.');
        }
    };

    const handleRemove = (id: string) => {
        if (confirm('Are you sure you want to remove this position?')) {
            removePosition(id);
        }
    };

    // Calculate allocations
    const stockAllocations = positions.map((pos) => ({
        symbol: pos.symbol,
        allocation: calculateAllocation(pos.marketValue, summary.totalValue),
        valid: checkAllocationLimits(calculateAllocation(pos.marketValue, summary.totalValue), 'stock'),
    }));

    const sectorAllocations = positions.reduce((acc, pos) => {
        const existing = acc.find((a) => a.sector === pos.sector);
        if (existing) {
            existing.value += pos.marketValue;
        } else {
            acc.push({ sector: pos.sector, value: pos.marketValue });
        }
        return acc;
    }, [] as { sector: string; value: number }[]).map((s) => ({
        ...s,
        allocation: calculateAllocation(s.value, summary.totalValue),
        valid: checkAllocationLimits(calculateAllocation(s.value, summary.totalValue), 'sector'),
    }));

    const hasAllocationWarnings = stockAllocations.some((a) => !a.valid.valid) || sectorAllocations.some((a) => !a.valid.valid);

    return (
        <div className="portfolio-container">
            <div className="portfolio-header">
                <h2>My Portfolio</h2>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    Add Position
                </button>
            </div>

            {/* Summary Cards */}
            <div className="portfolio-summary">
                <div className="summary-card">
                    <div className="summary-label">Total Value</div>
                    <div className="summary-value">{formatCurrency(summary.totalValue)}</div>
                </div>
                <div className={`summary-card ${summary.totalProfitLoss >= 0 ? 'success' : 'error'}`}>
                    <div className="summary-label">Total P/L</div>
                    <div className="summary-value">
                        {formatCurrency(summary.totalProfitLoss)} ({formatPercent(summary.totalProfitLossPercent)})
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-label">Positions</div>
                    <div className="summary-value">{positions.length}</div>
                </div>
            </div>

            {hasAllocationWarnings && (
                <div style={{
                    padding: 'var(--spacing-md)',
                    background: 'var(--color-warning-light)',
                    border: '1px solid var(--color-warning)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-warning)',
                    marginBottom: 'var(--spacing-lg)',
                }}>
                    ⚠️ Warning: Some positions exceed allocation limits (5% per stock, 20% per sector)
                </div>
            )}

            {/* Portfolio Table */}
            {positions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-secondary)' }}>
                    <p>No positions yet. Add your first position to start tracking your portfolio.</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="portfolio-table">
                        <thead>
                            <tr>
                                <th>Symbol</th>
                                <th>Name</th>
                                <th style={{ textAlign: 'right' }}>Units</th>
                                <th style={{ textAlign: 'right' }}>Avg Cost</th>
                                <th style={{ textAlign: 'right' }}>Current Price</th>
                                <th style={{ textAlign: 'right' }}>Market Value</th>
                                <th style={{ textAlign: 'right' }}>P/L ($)</th>
                                <th style={{ textAlign: 'right' }}>P/L (%)</th>
                                <th style={{ textAlign: 'right' }}>Allocation</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {positions.map((position) => {
                                const allocation = calculateAllocation(position.marketValue, summary.totalValue);
                                const allocationCheck = checkAllocationLimits(allocation, 'stock');
                                const upcomingDividend = position.dividends?.find(d => d.type === 'upcoming');

                                return (
                                    <tr key={position.id}>
                                        <td>
                                            <strong>{position.symbol}</strong>
                                            {upcomingDividend && (
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', marginTop: '0.25rem' }}>
                                                    💰 Div: {formatCurrency(upcomingDividend.amount)} on {formatDate(new Date(upcomingDividend.paymentDate))}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {position.name}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>{position.units.toLocaleString()}</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(position.avgCost)}</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(position.currentPrice)}</td>
                                        <td style={{ textAlign: 'right' }}><strong>{formatCurrency(position.marketValue)}</strong></td>
                                        <td style={{ textAlign: 'right' }} className={getChangeClass(position.profitLoss)}>
                                            {formatCurrency(position.profitLoss)}
                                        </td>
                                        <td style={{ textAlign: 'right' }} className={getChangeClass(position.profitLossPercent)}>
                                            {formatPercent(position.profitLossPercent)}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span style={{ color: allocationCheck.valid ? 'inherit' : 'var(--color-error)' }}>
                                                {allocation.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn-icon btn-small" onClick={() => handleRemove(position.id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Position Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add Position</h3>
                            <button className="btn btn-icon" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Symbol</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., AAPL"
                                    value={formData.symbol}
                                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Units</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="e.g., 10"
                                    value={formData.units}
                                    onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Average Cost</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="e.g., 150.00"
                                    step="0.01"
                                    value={formData.avgCost}
                                    onChange={(e) => setFormData({ ...formData, avgCost: e.target.value })}
                                />
                            </div>

                            {formData.units && formData.avgCost && (
                                <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-md)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Purchase Value</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '0.25rem' }}>
                                        {formatCurrency(parseFloat(formData.units) * parseFloat(formData.avgCost))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleAddPosition}>
                                Add Position
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Portfolio;

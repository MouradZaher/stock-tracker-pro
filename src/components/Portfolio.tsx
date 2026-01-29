import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { usePortfolioStore } from '../hooks/usePortfolio';
import { getStockQuote } from '../services/stockDataService';
import { getDividends } from '../services/dividendService';
import { formatCurrency, formatPercent, formatDate, getChangeClass } from '../utils/formatters';
import { checkAllocationLimits, calculateAllocation } from '../utils/calculations';
import { getSectorForSymbol } from '../data/sectors';
import SymbolSearchInput from './SymbolSearchInput';
import { soundService } from '../services/soundService';
import toast from 'react-hot-toast';

const Portfolio: React.FC = () => {
    const { positions, addPosition, removePosition, getSummary, updatePrice } = usePortfolioStore();
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            toast.error('Please fill in all fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const symbol = formData.symbol.toUpperCase();
            const quote = await getStockQuote(symbol);
            const dividends = await getDividends(symbol);

            addPosition({
                symbol,
                name: quote.name,
                units: parseFloat(formData.units),
                avgCost: parseFloat(formData.avgCost),
                currentPrice: quote.price,
                sector: getSectorForSymbol(symbol),
                dividends: dividends || [],
            });

            soundService.playSuccess();
            toast.success(`Position added: ${symbol}`);
            setShowModal(false);
            setFormData({ symbol: '', units: '', avgCost: '' });
        } catch (error) {
            soundService.playError();
            console.error('Add position error:', error);
            toast.error('Failed to add position. Please check the symbol.');
        } finally {
            setIsSubmitting(false);
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
                <div className="summary-card glass-card">
                    <div className="summary-label">Total Value</div>
                    <div className="summary-value">{formatCurrency(summary.totalValue)}</div>
                </div>
                <div className={`summary-card glass-card ${summary.totalProfitLoss >= 0 ? 'success' : 'error'}`}>
                    <div className="summary-label">Total P/L</div>
                    <div className="summary-value">
                        {formatCurrency(summary.totalProfitLoss)} ({formatPercent(summary.totalProfitLossPercent)})
                    </div>
                </div>
                <div className="summary-card glass-card">
                    <div className="summary-label">Portfolio Health</div>
                    <div className="summary-value" style={{ color: !hasAllocationWarnings ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {!hasAllocationWarnings ? 'Diversified' : 'Concentrated'}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Sector Allocation View */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                        Sector Allocation
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {sectorAllocations.sort((a, b) => b.value - a.value).map(sec => (
                            <div key={sec.sector}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                    <span>{sec.sector}</span>
                                    <span style={{ fontWeight: 600 }}>{sec.allocation.toFixed(1)}%</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${Math.min(100, sec.allocation)}%`,
                                        height: '100%',
                                        background: sec.valid.valid ? 'var(--color-accent)' : 'var(--color-error)',
                                        transition: 'width 1s ease-out'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Risk Insights */}
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                        Risk Intelligence
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                {hasAllocationWarnings
                                    ? "Your portfolio is heavily concentrated. Consider rebalancing positions that exceed 5% total weight to minimize idiosyncratic risk."
                                    : "Portfolio is well-diversified according to professional standards. Maintaining allocations below 20% per sector is key to long-term stability."
                                }
                            </p>
                        </div>
                        <div style={{ textAlign: 'center', borderLeft: '1px solid var(--glass-border)', paddingLeft: '2rem' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '0.5rem' }}>RISK SCORE</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: hasAllocationWarnings ? 'var(--color-warning)' : 'var(--color-success)' }}>
                                {hasAllocationWarnings ? 'B-' : 'A+'}
                            </div>
                        </div>
                    </div>
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

            {/* Dividend Calendar Section */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📅 Upcoming Dividends
                </h3>
                {positions.length === 0 ? (
                    <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem' }}>Add positions to see your dividend schedule.</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {positions.slice(0, 4).map(pos => (
                            <div key={pos.symbol} className="glass-card" style={{ padding: '1rem', border: '1px solid var(--glass-border)' }}>
                                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>{pos.symbol}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>Ex-Date: March 12, 2026</div>
                                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--color-success)', fontWeight: 600 }}>+$42.50</span>
                                    <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-success)' }}>3.2% Yield</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Portfolio Table */}
            {positions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-secondary)' }}>
                    <p>No positions yet. Add your first position to start tracking your portfolio.</p>
                </div>
            ) : (
                <div className="table-container glass-card" style={{ padding: '0.5rem' }}>
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
                <div className="modal-overlay glass-blur" onClick={() => setShowModal(false)}>
                    <div className="modal glass-effect" onClick={(e) => e.stopPropagation()} style={{ border: '1px solid var(--glass-border-bright)' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add Position</h3>
                            <button className="btn btn-icon glass-button" onClick={() => setShowModal(false)} style={{ borderRadius: '50%', padding: '4px' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Symbol</label>
                                <SymbolSearchInput
                                    placeholder="Search e.g. AAPL, BTC, NVDA"
                                    onSelect={(symbol) => setFormData({ ...formData, symbol })}
                                    initialValue={formData.symbol}
                                    autoFocus
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
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={isSubmitting}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleAddPosition} disabled={isSubmitting}>
                                {isSubmitting ? 'Adding...' : 'Add Position'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Portfolio;

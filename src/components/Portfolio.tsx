import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { usePortfolioStore } from '../hooks/usePortfolio';
import { useAuth } from '../contexts/AuthContext';
import { getStockQuote } from '../services/stockDataService';
import { getDividends } from '../services/dividendService';
import { formatCurrency, formatPercent, formatDate, getChangeClass } from '../utils/formatters';
import { checkAllocationLimits, calculateAllocation } from '../utils/calculations';
import { getSectorForSymbol } from '../data/sectors';
import SymbolSearchInput from './SymbolSearchInput';
import { soundService } from '../services/soundService';
import toast from 'react-hot-toast';

interface PortfolioProps {
    onSelectSymbol?: (symbol: string) => void;
}

const Portfolio: React.FC<PortfolioProps> = ({ onSelectSymbol }) => {
    const { user } = useAuth();
    // ... existing hooks ...
    const { positions, addPosition, removePosition, getSummary, updatePrice } = usePortfolioStore();
    const [showModal, setShowModal] = useState(false);
    // ... existing state ...
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        symbol: '',
        units: '',
        avgCost: '',
        name: '',
        currentPrice: 0 as number
    });

    const summary = getSummary();

    // Use ref to track symbols for price updates without causing re-renders
    const positionSymbolsRef = useRef<string[]>([]);

    // Update the ref when positions change (but don't trigger effect)
    useEffect(() => {
        positionSymbolsRef.current = positions.map(p => p.symbol);
    }, [positions]);

    // Update prices periodically - only depends on user?.id to avoid infinite loop
    useEffect(() => {
        const updatePrices = async () => {
            const symbols = positionSymbolsRef.current;
            for (const symbol of symbols) {
                try {
                    const quote = await getStockQuote(symbol);
                    updatePrice(symbol, quote.price, user?.id);
                } catch (error) {
                    console.error(`Failed to update price for ${symbol}:`, error);
                }
            }
        };

        // Initial update
        if (positionSymbolsRef.current.length > 0) {
            updatePrices();
        }

        const interval = setInterval(updatePrices, 15000); // Update every 15 seconds

        return () => clearInterval(interval);
    }, [user?.id, updatePrice]);

    const handleAddPosition = async () => {
        if (!formData.symbol || !formData.units || !formData.avgCost) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsSubmitting(true);
        try {
            await addPosition({
                symbol: formData.symbol.toUpperCase(),
                name: formData.name || formData.symbol.toUpperCase(),
                units: parseFloat(formData.units),
                avgCost: parseFloat(formData.avgCost),
                currentPrice: formData.currentPrice || 0,
                sector: getSectorForSymbol(formData.symbol.toUpperCase()),
                dividends: [],
            }, user?.id);

            soundService.playSuccess();
            toast.success(`Position added: ${formData.symbol.toUpperCase()}`);
            setShowModal(false);
            setFormData({ symbol: '', units: '', avgCost: '', name: '', currentPrice: 0 });
        } catch (error) {
            soundService.playError();
            toast.error('Failed to add position.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickAdd = (symbol: string, name: string, price: number) => {
        soundService.playTap();
        setFormData({
            symbol,
            units: '10', // Default units
            avgCost: price.toString(),
            name,
            currentPrice: price
        } as any);
        setShowModal(true);
    };

    const handleRemove = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to remove this position?')) {
            removePosition(id, user?.id);
        }
    };

    const handleRowClick = (symbol: string) => {
        soundService.playTap();
        onSelectSymbol?.(symbol);
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
            {/* ... existing header and summary ... */}
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

            {/* ... allocations ... */}
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
                <>
                    <div style={{
                        padding: 'var(--spacing-md)',
                        background: 'var(--color-warning-light)',
                        border: '1px solid var(--color-warning)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-warning)',
                        marginBottom: 'var(--spacing-md)',
                    }}>
                        ⚠️ Warning: Some positions exceed allocation limits (5% per stock, 20% per sector)
                    </div>

                    {/* Preview Table of Problematic Positions */}
                    <div className="glass-card" style={{ padding: '1rem', marginBottom: 'var(--spacing-lg)', overflow: 'auto' }}>
                        <table className="portfolio-table" style={{ fontSize: '0.85rem' }}>
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
                                </tr>
                            </thead>
                            <tbody>
                                {positions
                                    .filter(pos => {
                                        const allocation = calculateAllocation(pos.marketValue, summary.totalValue);
                                        const check = checkAllocationLimits(allocation, 'stock');
                                        return !check.valid;
                                    })
                                    .map((position) => {
                                        const allocation = calculateAllocation(position.marketValue, summary.totalValue);
                                        return (
                                            <tr key={position.id} style={{ cursor: 'pointer' }} onClick={() => handleRowClick(position.symbol)}>
                                                <td><strong>{position.symbol}</strong></td>
                                                <td>{position.name}</td>
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
                                                    <span style={{ color: 'var(--color-error)', fontWeight: 600 }}>
                                                        {allocation.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </>
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
                            <div key={pos.symbol} className="glass-card" style={{ padding: '1rem', border: '1px solid var(--glass-border)' }} onClick={() => handleRowClick(pos.symbol)}>
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

            {/* Famous Portfolios Section */}
            <div className="section" style={{ marginBottom: '2rem' }}>
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-accent)' }} />
                    Famous Portfolio Holdings
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                    {[
                        {
                            name: "Warren Buffett", firm: "Berkshire Hathaway", holdings: [
                                { symbol: 'AAPL', name: 'Apple Inc.', portPercent: 43.5, change: 1.2, currentPrice: 185.92 },
                                { symbol: 'BAC', name: 'Bank of America', portPercent: 9.1, change: -0.5, currentPrice: 34.12 },
                                { symbol: 'AXP', name: 'American Express', portPercent: 7.2, change: 0.8, currentPrice: 212.45 }
                            ]
                        },
                        {
                            name: "Nancy Pelosi", firm: "Congress", holdings: [
                                { symbol: 'NVDA', name: 'NVIDIA Corp', portPercent: 12.5, change: 4.8, currentPrice: 726.13 },
                                { symbol: 'MSFT', name: 'Microsoft', portPercent: 10.1, change: 1.5, currentPrice: 410.22 },
                                { symbol: 'PANW', name: 'Palo Alto Networks', portPercent: 4.2, change: 0.8, currentPrice: 312.45 }
                            ]
                        },
                        {
                            name: "Michael Burry", firm: "Scion Asset Mgmt", holdings: [
                                { symbol: 'JD', name: 'JD.com', portPercent: 8.2, change: 2.4, currentPrice: 24.15 },
                                { symbol: 'BABA', name: 'Alibaba Group', portPercent: 7.5, change: 1.8, currentPrice: 74.52 },
                                { symbol: 'HCA', name: 'HCA Healthcare', portPercent: 5.9, change: -0.3, currentPrice: 305.12 }
                            ]
                        },
                        {
                            name: "Cathie Wood", firm: "ARK Invest", holdings: [
                                { symbol: 'TSLA', name: 'Tesla Inc.', portPercent: 9.8, change: 3.2, currentPrice: 202.64 },
                                { symbol: 'COIN', name: 'Coinbase Global', portPercent: 8.4, change: 5.1, currentPrice: 165.34 },
                                { symbol: 'ROKU', name: 'Roku Inc.', portPercent: 6.2, change: -1.4, currentPrice: 85.12 }
                            ]
                        }
                    ].map((guru, idx) => (
                        <div key={idx} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease', cursor: 'default' }}>
                            <div style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>{guru.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, letterSpacing: '0.02em' }}>{guru.firm.toUpperCase()}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', flex: 1 }}>
                                {guru.holdings.map(h => (
                                    <div key={h.symbol} className="guru-holding-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span
                                                    style={{ fontWeight: 700, cursor: 'pointer', color: 'var(--color-accent)' }}
                                                    onClick={() => onSelectSymbol?.(h.symbol)}
                                                >
                                                    {h.symbol}
                                                </span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>• {h.portPercent}%</span>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{formatCurrency(h.currentPrice)}</div>
                                                <div style={{ fontSize: '0.7rem', color: h.change >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                                                    {h.change > 0 ? '+' : ''}{h.change}%
                                                </div>
                                            </div>
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleQuickAdd(h.symbol, h.name, h.currentPrice)}
                                                style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', border: '1px solid var(--glass-border)' }}
                                                title="Quick add to portfolio"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Portfolio Content */}
            {positions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-secondary)' }}>
                    <p>No positions yet. Add your first position to start tracking your portfolio.</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="table-container glass-card desktop-only" style={{ padding: '0.5rem' }}>
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
                                        <tr key={position.id} onClick={() => handleRowClick(position.symbol)} style={{ cursor: 'pointer' }}>
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
                                                <button className="btn btn-icon btn-small" onClick={(e) => handleRemove(position.id, e)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {positions.map((position) => {
                            const allocation = calculateAllocation(position.marketValue, summary.totalValue);
                            return (
                                <div key={position.id} className="glass-card" style={{ padding: '1rem' }} onClick={() => handleRowClick(position.symbol)}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{position.symbol}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{position.name}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 600 }}>{formatCurrency(position.currentPrice)}</div>
                                            <span style={{ fontSize: '0.75rem', color: getChangeClass(position.profitLoss) === 'positive' ? 'var(--color-success)' : 'var(--color-error)' }}>
                                                {formatPercent(position.profitLossPercent)}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                        <div style={{ color: 'var(--color-text-tertiary)' }}>Units:</div>
                                        <div style={{ textAlign: 'right' }}>{position.units}</div>

                                        <div style={{ color: 'var(--color-text-tertiary)' }}>Avg Cost:</div>
                                        <div style={{ textAlign: 'right' }}>{formatCurrency(position.avgCost)}</div>

                                        <div style={{ color: 'var(--color-text-tertiary)' }}>Value:</div>
                                        <div style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(position.marketValue)}</div>

                                        <div style={{ color: 'var(--color-text-tertiary)' }}>P/L:</div>
                                        <div className={getChangeClass(position.profitLoss)} style={{ textAlign: 'right' }}>{formatCurrency(position.profitLoss)}</div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--glass-border)' }}>
                                        <button
                                            className="btn btn-icon btn-small text-error"
                                            onClick={(e) => handleRemove(position.id, e)}
                                            style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
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

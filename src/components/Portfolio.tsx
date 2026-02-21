import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, X, Zap, Bell, ShieldCheck, BarChart2, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { usePortfolioStore } from '../hooks/usePortfolio';
import { useAuth } from '../contexts/AuthContext';
import { getStockQuote, getMultipleQuotes } from '../services/stockDataService';
import { formatCurrency, formatPercent, formatDate, getChangeClass } from '../utils/formatters';
import { checkAllocationLimits, calculateAllocation } from '../utils/calculations';
import { getSectorForSymbol } from '../data/sectors';
import SymbolSearchInput from './SymbolSearchInput';
import { soundService } from '../services/soundService';
import toast from 'react-hot-toast';
import FamousHoldings from './FamousHoldings';
import { usePriceAlerts } from '../hooks/usePriceAlerts';
import PriceAlertsModal from './PriceAlertsModal';
import { analyzeSymbol, getTacticalRebalancing, type RebalancingAction } from '../services/aiRecommendationService';
import type { StockRecommendation } from '../types';

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
    const [showAIAdvice, setShowAIAdvice] = useState(false);
    const [aiRecs, setAiRecs] = useState<Record<string, StockRecommendation>>({});

    const [formData, setFormData] = useState({
        symbol: '',
        units: '',
        avgCost: '',
        name: '',
        currentPrice: 0 as number
    });

    const [alertConfig, setAlertConfig] = useState<{ symbol: string; price: number } | null>(null);
    const { checkPrice } = usePriceAlerts();

    // Safety: Ensure getSummary never crashes
    const summary = React.useMemo(() => {
        try {
            return getSummary();
        } catch (error) {
            console.error('Error getting portfolio summary:', error);
            return {
                totalValue: 0,
                totalCost: 0,
                totalProfitLoss: 0,
                totalProfitLossPercent: 0,
                positions: []
            };
        }
    }, [getSummary, positions]); // Recompute when positions change

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
            if (symbols.length === 0) return;

            try {
                const quotes = await getMultipleQuotes(symbols);
                symbols.forEach(symbol => {
                    const quote = quotes.get(symbol);
                    if (quote && quote.price > 0) {
                        updatePrice(symbol, quote.price, user?.id);
                        // Check price alerts
                        checkPrice(symbol, quote.price);
                    }
                });
            } catch (error) {
                console.error(`Failed to update prices:`, error);
            }
        };

        // Initial update
        if (positionSymbolsRef.current.length > 0) {
            updatePrices();
        }

        const interval = setInterval(updatePrices, 1000); // Live update every 1 second

        return () => clearInterval(interval);
    }, [user?.id, updatePrice, checkPrice]);

    // Fetch AI Recommendations for positions
    useEffect(() => {
        const fetchAIRecs = async () => {
            const symbols = positions.map(p => p.symbol);
            if (symbols.length === 0) return;

            const recs: Record<string, StockRecommendation> = {};
            for (const sym of symbols) {
                const rec = await analyzeSymbol(sym);
                if (rec) recs[sym] = rec;
            }
            setAiRecs(recs);
        };

        fetchAIRecs();
        const interval = setInterval(fetchAIRecs, 60000); // Refresh AI recs every minute
        return () => clearInterval(interval);
    }, [positions.length]); // Re-fetch only when a position is added/removed

    const getRecIcon = (rec?: string) => {
        if (rec === 'Buy') return <TrendingUp size={14} color="var(--color-success)" />;
        if (rec === 'Sell') return <TrendingDown size={14} color="var(--color-error)" />;
        return <Minus size={14} color="var(--color-warning)" />;
    };

    // Compute rebalancing advice synchronously — stays live with positions
    const rebalancingActions = React.useMemo(() => {
        if (!showAIAdvice || positions.length === 0) return [];
        const totalValue = positions.reduce((sum, p) => sum + (p.marketValue || 0), 0);
        if (totalValue === 0) return [];

        const actions: import('../services/aiRecommendationService').RebalancingAction[] = [];
        const sectorTotals: Record<string, number> = {};

        for (const p of positions) {
            const allocation = (p.marketValue / totalValue) * 100;
            const sector = p.sector || 'Other';
            sectorTotals[sector] = (sectorTotals[sector] || 0) + allocation;

            if (allocation > 5) {
                actions.push({
                    symbol: p.symbol,
                    action: 'Trim',
                    reason: `Allocation is ${allocation.toFixed(1)}%, exceeding the 5% limit.`,
                    impact: `Trim to ~5% to reduce concentration risk.`,
                    priority: allocation > 10 ? 'High' : 'Medium'
                });
            }

            const plPct = p.profitLossPercent ?? 0;
            if (plPct < -15 && !actions.find(a => a.symbol === p.symbol)) {
                actions.push({
                    symbol: p.symbol,
                    action: plPct < -25 ? 'Exit' : 'Trim',
                    reason: `Down ${Math.abs(plPct).toFixed(1)}% — exceeds drawdown threshold.`,
                    impact: `Cut loss to free capital for higher-conviction positions.`,
                    priority: plPct < -25 ? 'High' : 'Medium'
                });
            }
        }

        for (const [sector, allocation] of Object.entries(sectorTotals)) {
            if (allocation > 20) {
                actions.push({
                    symbol: sector,
                    action: 'Trim',
                    reason: `${sector} is ${allocation.toFixed(1)}% of portfolio — exceeds 20% sector cap.`,
                    impact: `Improve diversification across sectors.`,
                    priority: allocation > 30 ? 'High' : 'Medium'
                });
            }
        }

        if (actions.length === 0) {
            actions.push({
                symbol: 'PORTFOLIO',
                action: 'Hold',
                reason: 'All positions within institutional risk limits (5% stock / 20% sector).',
                impact: 'No rebalancing required. Portfolio is well-diversified.',
                priority: 'Low'
            });
        }

        return actions;
    }, [showAIAdvice, positions]);

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

    const handleRemove = (id: string, symbol: string, e: React.MouseEvent) => {
        e.stopPropagation();
        removePosition(id, symbol, user?.id);
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

    // Risk Meter Calculation (Simulated Beta/Volatility)
    const riskScore = hasAllocationWarnings ? 65 : 88; // 0-100
    const riskLabel = riskScore > 80 ? 'Conservative' : riskScore > 60 ? 'Moderate' : 'Aggressive';
    const riskColor = riskScore > 80 ? 'var(--color-success)' : riskScore > 60 ? 'var(--color-warning)' : 'var(--color-error)';

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
                        {!hasAllocationWarnings ? 'Diversified Optimized' : 'Allocation Warning'}
                    </div>
                </div>
            </div>

            {/* Portfolio Content - Main Table and Cards */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📊 My Positions
                </h3>
                {positions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-secondary)' }}>
                        <p>No positions yet. Add your first position to start tracking your portfolio.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="table-container glass-card desktop-only" style={{ padding: '0.5rem', marginBottom: '1.5rem' }}>
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
                                        <th style={{ textAlign: 'center' }}>AI Strategy</th>
                                        <th style={{ textAlign: 'right' }}>Allocation</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {positions.map((position) => {
                                        const allocation = calculateAllocation(position.marketValue, summary.totalValue);
                                        const allocationCheck = checkAllocationLimits(allocation, 'stock');

                                        return (
                                            <tr key={position.id} onClick={() => handleRowClick(position.symbol)} style={{ cursor: 'pointer' }}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <strong>{position.symbol}</strong>
                                                        <button
                                                            className="btn-icon"
                                                            style={{ padding: '4px', borderRadius: '4px', color: 'var(--color-text-tertiary)' }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setAlertConfig({ symbol: position.symbol, price: position.currentPrice });
                                                            }}
                                                            title="Set Price Alert"
                                                        >
                                                            <Bell size={14} />
                                                        </button>
                                                    </div>
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
                                                <td style={{ textAlign: 'center' }}>
                                                    {aiRecs[position.symbol] ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                padding: '2px 6px',
                                                                background: aiRecs[position.symbol].score >= 75 ? 'rgba(16, 185, 129, 0.1)' : (aiRecs[position.symbol].score >= 50 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)'),
                                                                borderRadius: '4px',
                                                                border: `1px solid ${aiRecs[position.symbol].score >= 75 ? 'var(--color-success)' : (aiRecs[position.symbol].score >= 50 ? 'var(--color-warning)' : 'var(--color-error)')}`
                                                            }}>
                                                                {getRecIcon(aiRecs[position.symbol].recommendation)}
                                                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: aiRecs[position.symbol].score >= 75 ? 'var(--color-success)' : (aiRecs[position.symbol].score >= 50 ? 'var(--color-warning)' : 'var(--color-error)') }}>
                                                                    {aiRecs[position.symbol].recommendation?.toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <span style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                                                                Score: {aiRecs[position.symbol].score}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>Analyzing...</span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <span style={{ color: allocationCheck.valid ? 'inherit' : 'var(--color-error)' }}>
                                                        {allocation.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-icon btn-small text-error"
                                                        onClick={(e) => handleRemove(position.id, position.symbol, e)}
                                                        style={{
                                                            background: 'rgba(239, 68, 68, 0.1)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            padding: '4px 8px',
                                                            borderRadius: '6px'
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                            {positions.map((position) => {
                                const allocation = calculateAllocation(position.marketValue, summary.totalValue);
                                return (
                                    <div key={position.id} className="glass-card" style={{ padding: '1rem' }} onClick={() => handleRowClick(position.symbol)}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {position.symbol}
                                                    <button
                                                        className="btn-icon glass-button"
                                                        style={{ padding: '2px', borderRadius: '50%' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setAlertConfig({ symbol: position.symbol, price: position.currentPrice });
                                                        }}
                                                    >
                                                        <Bell size={14} />
                                                    </button>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{position.name}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 600 }}>{formatCurrency(position.currentPrice)}</div>
                                                <span style={{ fontSize: '0.75rem', color: getChangeClass(position.profitLoss) === 'positive' ? 'var(--color-success)' : 'var(--color-error)' }}>
                                                    {formatPercent(position.profitLossPercent)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Mobile AI Badge */}
                                        {aiRecs[position.symbol] && (
                                            <div style={{
                                                margin: '0 -1rem 0.75rem -1rem',
                                                padding: '4px 1rem',
                                                background: 'rgba(99, 102, 241, 0.05)',
                                                borderTop: '1px solid var(--glass-border)',
                                                borderBottom: '1px solid var(--glass-border)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Strategy Signal</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: 800,
                                                        color: aiRecs[position.symbol].score >= 75 ? 'var(--color-success)' : (aiRecs[position.symbol].score >= 50 ? 'var(--color-warning)' : 'var(--color-error)')
                                                    }}>
                                                        {aiRecs[position.symbol].recommendation?.toUpperCase()} ({aiRecs[position.symbol].score})
                                                    </span>
                                                    {getRecIcon(aiRecs[position.symbol].recommendation)}
                                                </div>
                                            </div>
                                        )}

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

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
                                            <button
                                                className="btn btn-icon btn-small text-error"
                                                onClick={(e) => handleRemove(position.id, position.symbol, e)}
                                                style={{
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '6px 12px',
                                                    borderRadius: '8px'
                                                }}
                                            >
                                                <Trash2 size={16} />
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Delete Position</span>
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Allocation & Risk Intelligence (Moved down to emphasize main portfolio) */}
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

                {/* Risk Intelligence & Benchmarking */}
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={16} /> Risk Intelligence
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
                        <div style={{ position: 'relative', width: '100px', height: '60px' }}>
                            <svg width="100" height="60" viewBox="0 0 100 60">
                                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeLinecap="round" />
                                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={riskColor} strokeWidth="8" strokeLinecap="round" strokeDasharray="126" strokeDashoffset={126 - (riskScore / 100 * 126)} />
                            </svg>
                            <div style={{ position: 'absolute', bottom: '5px', left: '50%', transform: 'translateX(-50%)', fontWeight: 800, fontSize: '1.2rem', color: riskColor }}>
                                {riskScore}%
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Strategy Profile</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{riskLabel}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                                Based on sector concentration and asset volatility.
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '1rem' }}>
                            <span style={{ color: 'var(--color-text-tertiary)' }}>Performance vs S&P 500 (1Y)</span>
                            <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>Outperforming</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '80px', fontSize: '0.75rem' }}>Portfolio</div>
                                <div style={{ flex: 1, height: '12px', background: 'var(--color-accent)', borderRadius: '6px' }} />
                                <div style={{ width: '40px', fontSize: '0.75rem', fontWeight: 700 }}>+24%</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '80px', fontSize: '0.75rem' }}>S&P 500</div>
                                <div style={{ width: '60%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }} />
                                <div style={{ width: '40px', fontSize: '0.75rem' }}>+18%</div>
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
                    marginBottom: 'var(--spacing-md)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <span>⚠️ Warning: Some positions exceed allocation limits (5% per stock, 20% per sector)</span>
                        <button
                            className="btn btn-primary btn-small ai-pulse-button"
                            style={{
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                color: '#000',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                padding: '6px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                                borderRadius: '20px',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={() => setShowAIAdvice(true)}
                        >
                            <Zap size={14} fill="currentColor" /> AI Recommendation Analysis Portfolio
                        </button>
                    </div>
                </div>
            )}

            {/* AI Advice Modal */}
            {showAIAdvice && (
                <div className="modal-overlay glass-blur" onClick={() => setShowAIAdvice(false)}>
                    <div className="modal glass-effect" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
                        <div className="modal-header">
                            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Zap size={20} color="var(--color-warning)" /> Portfolio Optimization Advice
                            </h3>
                            <button className="btn btn-icon glass-button" onClick={() => setShowAIAdvice(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', paddingBottom: '80px' }}>
                            <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid var(--color-accent-light)' }}>
                                <h4 style={{ fontSize: '1rem', color: 'var(--color-accent)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Zap size={16} fill="currentColor" /> AI Alpha Intelligence Advice
                                </h4>
                                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                                    Your portfolio is being analyzed against institutional 5% single-asset and 20% sector-weighted safety rules.
                                </p>
                            </div>

                            {rebalancingActions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-success)' }}>
                                    <ShieldCheck size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                    <p>Your portfolio perfectly aligns with AI Alpha risk parameters.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {rebalancingActions.map((action, idx) => (
                                        <div key={idx} className="glass-card" style={{
                                            padding: '1.25rem',
                                            borderLeft: `4px solid ${action.action === 'Trim' ? 'var(--color-error)' : (action.action === 'Add' ? 'var(--color-success)' : 'var(--color-warning)')}`,
                                            background: 'rgba(255,255,255,0.02)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{action.symbol}</span>
                                                        <span style={{
                                                            fontSize: '0.65rem',
                                                            padding: '2px 8px',
                                                            borderRadius: '10px',
                                                            background: action.priority === 'High' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)',
                                                            color: action.priority === 'High' ? 'var(--color-error)' : 'var(--color-text-tertiary)',
                                                            border: '1px solid currentColor'
                                                        }}>
                                                            {action.priority} Priority
                                                        </span>
                                                    </div>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        marginTop: '4px',
                                                        color: action.action === 'Trim' ? 'var(--color-error)' : 'var(--color-success)',
                                                        fontWeight: 700,
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        {action.action === 'Trim' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                                                        {action.action.toUpperCase()} ACTION RECOMMENDED
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                                    Strategic Setup
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                                                {action.reason} {action.impact}
                                            </p>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '8px 12px',
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '6px',
                                                fontSize: '0.8rem'
                                            }}>
                                                <span style={{ color: 'var(--color-text-tertiary)' }}>Rebalance Execution</span>
                                                <ArrowRight size={14} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={() => setShowAIAdvice(false)}>Apply Strategy</button>
                        </div>
                    </div>
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
            {/* Famous Holdings Quick Add */}
            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
                <FamousHoldings onQuickAdd={handleQuickAdd} />
            </div>

            {/* Price Alerts Modal */}
            {alertConfig && (
                <PriceAlertsModal
                    symbol={alertConfig.symbol}
                    currentPrice={alertConfig.price}
                    onClose={() => setAlertConfig(null)}
                />
            )}
        </div>
    );
};

export default Portfolio;

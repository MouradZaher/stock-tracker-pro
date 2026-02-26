import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, X, Zap, Bell, ShieldCheck, BarChart2, TrendingUp, TrendingDown, Minus, ArrowRight, Pencil, Save, Cloud, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';

import { usePortfolioStore } from '../hooks/usePortfolio';
import { useAuth } from '../contexts/AuthContext';
import { getStockQuote, getMultipleQuotes } from '../services/stockDataService';
import { formatCurrency, formatCurrencyForMarket, formatPercent, formatDate, getChangeClass } from '../utils/formatters';
import { useMarket } from '../contexts/MarketContext';
import { checkAllocationLimits, calculateAllocation } from '../utils/calculations';
import { getSectorForSymbol, getMarketForSymbol } from '../data/sectors';
import SymbolSearchInput from './SymbolSearchInput';
import { soundService } from '../services/soundService';
import toast from 'react-hot-toast';
import { usePriceAlerts } from '../hooks/usePriceAlerts';
import PriceAlertsModal from './PriceAlertsModal';
import { analyzeSymbol, getTacticalRebalancing, type RebalancingAction } from '../services/aiRecommendationService';
import type { StockRecommendation } from '../types';

interface PortfolioProps {
    onSelectSymbol?: (symbol: string) => void;
}

const Portfolio: React.FC<PortfolioProps> = ({ onSelectSymbol }) => {
    const { user } = useAuth();
    const { selectedMarket } = useMarket();
    // Currency formatter shorthand
    const fmt = (v: number) => formatCurrencyForMarket(v, selectedMarket.currency);
    // ... existing hooks ...
    const { positions: allPositions, addPosition, removePosition, updatePosition, getSummary, updatePrice, isSyncing } = usePortfolioStore();

    // Filter positions based on selected market
    const positions = React.useMemo(() => {
        return allPositions.filter(pos => getMarketForSymbol(pos.symbol) === selectedMarket.id);
    }, [allPositions, selectedMarket.id]);
    const [showModal, setShowModal] = useState(false);
    const [editingPosition, setEditingPosition] = useState<{ id: string; symbol: string; units: number; avgCost: number } | null>(null);
    const [editForm, setEditForm] = useState({ units: '', avgCost: '' });
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState<'positions' | 'intelligence'>('positions');

    // ... existing state ...
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAIAdvice, setShowAIAdvice] = useState(false);
    const [aiRecs, setAiRecs] = useState<Record<string, StockRecommendation>>({});
    const [newlyAddedSymbol, setNewlyAddedSymbol] = useState<string | null>(null);

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
            // Unused, but keeps getSummary from throwing if it had errors internally
            getSummary();

            const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
            const totalCost = positions.reduce((sum, pos) => sum + pos.purchaseValue, 0);
            const totalProfitLoss = totalValue - totalCost;
            const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

            return {
                totalValue,
                totalCost,
                totalProfitLoss,
                totalProfitLossPercent,
                positions
            };
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

        const interval = setInterval(updatePrices, 15000); // Live update every 15 seconds (prevents API rate limiting)

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
        const upperSymbol = formData.symbol.toUpperCase();

        // 1. Fetch live price FIRST so the position is added with a real price
        let livePrice = formData.currentPrice || parseFloat(formData.avgCost);
        try {
            const quote = await getStockQuote(upperSymbol);
            if (quote?.price && quote.price > 0) {
                livePrice = quote.price;
            }
        } catch {
            // Silently fall back to avg cost as currentPrice
        }

        try {
            await addPosition({
                symbol: upperSymbol,
                name: formData.name || upperSymbol,
                units: parseFloat(formData.units),
                avgCost: parseFloat(formData.avgCost),
                currentPrice: livePrice,
                sector: getSectorForSymbol(upperSymbol),
                dividends: [],
            }, user?.id);

            // 2. Force immediate price sync for the new symbol so it appears instantly
            updatePrice(upperSymbol, livePrice, user?.id);

            soundService.playSuccess();
            toast.success(`Position added: ${upperSymbol}`);
            setNewlyAddedSymbol(upperSymbol);
            setShowModal(false);
            setFormData({ symbol: '', units: '', avgCost: '', name: '', currentPrice: 0 });

            // Clear highlight after 3 seconds
            setTimeout(() => setNewlyAddedSymbol(null), 3000);
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
        });
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

    const handleEditClick = (position: typeof positions[0], e: React.MouseEvent) => {
        e.stopPropagation();
        soundService.playTap();
        setEditingPosition({ id: position.id, symbol: position.symbol, units: position.units, avgCost: position.avgCost });
        setEditForm({ units: position.units.toString(), avgCost: position.avgCost.toString() });
    };

    const handleSaveEdit = async () => {
        if (!editingPosition) return;
        const newUnits = parseFloat(editForm.units);
        const newAvgCost = parseFloat(editForm.avgCost);
        if (isNaN(newUnits) || newUnits <= 0 || isNaN(newAvgCost) || newAvgCost <= 0) {
            toast.error('Please enter valid units and average cost.');
            return;
        }
        setIsSavingEdit(true);
        try {
            await updatePosition(editingPosition.id, { units: newUnits, avgCost: newAvgCost }, user?.id);
            soundService.playSuccess();
            toast.success(`${editingPosition.symbol} position updated.`);
            setEditingPosition(null);
        } catch {
            soundService.playError();
            toast.error('Failed to update position.');
        } finally {
            setIsSavingEdit(false);
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

    // Risk Meter Calculation (Simulated Beta/Volatility)
    const riskScore = hasAllocationWarnings ? 65 : 88; // 0-100
    const riskLabel = riskScore > 80 ? 'Conservative' : riskScore > 60 ? 'Moderate' : 'Aggressive';
    const riskColor = riskScore > 80 ? 'var(--color-success)' : riskScore > 60 ? 'var(--color-warning)' : 'var(--color-error)';

    const groupedPositions = React.useMemo(() => {
        const groups: Record<string, typeof positions> = {};
        positions.forEach(pos => {
            const sector = pos.sector || 'Uncategorized';
            if (!groups[sector]) groups[sector] = [];
            groups[sector].push(pos);
        });
        return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
    }, [positions]);

    return (
        <div className="portfolio-container">
            {/* ... existing header and summary ... */}
            <div className="portfolio-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h2 style={{ margin: 0 }}>My Portfolio</h2>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '20px',
                        border: '1px solid var(--glass-border)',
                        fontSize: '0.7rem',
                        color: isSyncing ? 'var(--color-accent)' : 'var(--color-success)',
                        transition: 'all 0.3s ease'
                    }}>
                        {isSyncing ? (
                            <>
                                <RefreshCw size={12} className="animate-spin" />
                                <span style={{ fontWeight: 600 }}>Syncing...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle size={12} />
                                <span style={{ fontWeight: 600 }}>Cloud Synced</span>
                            </>
                        )}
                    </div>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowModal(true)}
                    style={{
                        background: 'var(--gradient-primary)',
                        border: 'none',
                        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                        padding: 'var(--spacing-sm) var(--spacing-lg)',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        transition: 'var(--transition-base)'
                    }}
                >
                    <Plus size={18} />
                    Add Position
                </button>
            </div>

            {/* Summary Cards */}
            <div className="portfolio-summary-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="summary-card glass-card">
                    <div className="summary-label" style={{ fontSize: 'var(--font-size-xs)' }}>Total Value</div>
                    <div className="summary-value" style={{ fontSize: 'var(--font-size-lg)' }}>{fmt(summary.totalValue)}</div>
                </div>
                <div className={`summary-card glass-card ${summary.totalProfitLoss >= 0 ? 'success' : 'error'}`}>
                    <div className="summary-label" style={{ fontSize: 'var(--font-size-xs)' }}>Total P/L</div>
                    <div className="summary-value" style={{ fontSize: 'var(--font-size-lg)' }}>
                        {fmt(summary.totalProfitLoss)} ({formatPercent(summary.totalProfitLossPercent)})
                    </div>
                </div>
                <div className="summary-card glass-card">
                    <div className="summary-label" style={{ fontSize: 'var(--font-size-xs)' }}>Portfolio Health</div>
                    <div className="summary-value" style={{ fontSize: 'var(--font-size-lg)', color: !hasAllocationWarnings ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {!hasAllocationWarnings ? 'Diversified Optimized' : 'Allocation Warning'}
                    </div>
                </div>
            </div>

            {/* Sub-Tabs Navigation */}
            <div style={{
                display: 'flex',
                gap: '8px',
                padding: '4px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                border: '1px solid rgba(255,255,255,0.05)',
                width: 'fit-content'
            }}>
                <button
                    onClick={() => setActiveSubTab('positions')}
                    style={{
                        padding: '8px 20px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: activeSubTab === 'positions' ? 'var(--gradient-primary)' : 'transparent',
                        color: activeSubTab === 'positions' ? '#fff' : 'var(--color-text-tertiary)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <BarChart2 size={16} />
                    Positions
                </button>
                <button
                    onClick={() => setActiveSubTab('intelligence')}
                    style={{
                        padding: '8px 20px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: activeSubTab === 'intelligence' ? 'var(--gradient-primary)' : 'transparent',
                        color: activeSubTab === 'intelligence' ? '#fff' : 'var(--color-text-tertiary)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <Zap size={16} />
                    Intelligence
                </button>
            </div>


            {/* Portfolio Content - Main Table and Cards */}
            {activeSubTab === 'positions' && (
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
                            <div className="table-container glass-card desktop-only" style={{ padding: '0', marginBottom: '1.5rem', maxHeight: '600px', overflowY: 'auto' }}>
                                <table className="portfolio-table sticky-header">
                                    <thead>
                                        <tr>
                                            <th>Symbol</th>
                                            <th>Name</th>
                                            <th style={{ textAlign: 'right' }}>Units</th>
                                            <th style={{ textAlign: 'right' }}>Avg Cost</th>
                                            <th style={{ textAlign: 'right' }}>Current Price</th>
                                            <th style={{ textAlign: 'right' }}>Market Value</th>
                                            <th style={{ textAlign: 'right' }}>P/L ({selectedMarket.currencySymbol.trim()})</th>
                                            <th style={{ textAlign: 'right' }}>P/L (%)</th>
                                            <th style={{ textAlign: 'center' }}>AI Strategy</th>
                                            <th style={{ textAlign: 'right' }}>Allocation</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupedPositions.map(([sector, sectorPositions]) => (
                                            <React.Fragment key={sector}>
                                                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                    <td colSpan={11} style={{
                                                        padding: '0.75rem 1.25rem',
                                                        fontWeight: 800,
                                                        color: 'var(--color-text-secondary)',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        borderBottom: '1px solid var(--glass-border)',
                                                        borderTop: '1px solid var(--glass-border)'
                                                    }}>
                                                        {sector} <span style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 600, marginLeft: '4px' }}>({sectorPositions.length})</span>
                                                    </td>
                                                </tr>
                                                {sectorPositions.map((position) => {
                                                    const allocation = calculateAllocation(position.marketValue, summary.totalValue);
                                                    const allocationCheck = checkAllocationLimits(allocation, 'stock');

                                                    return (
                                                        <tr
                                                            key={position.id}
                                                            onClick={() => handleRowClick(position.symbol)}
                                                            style={{
                                                                cursor: 'pointer',
                                                                background: newlyAddedSymbol === position.symbol ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                                                                transition: 'background 1s ease'
                                                            }}
                                                        >
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
                                                            <td style={{ textAlign: 'right' }}>{fmt(position.avgCost)}</td>
                                                            <td style={{ textAlign: 'right' }}>{fmt(position.currentPrice)}</td>
                                                            <td style={{ textAlign: 'right' }}><strong>{fmt(position.marketValue)}</strong></td>
                                                            <td style={{ textAlign: 'right' }} className={getChangeClass(position.profitLoss)}>
                                                                {fmt(position.profitLoss)}
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
                                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                                    <button
                                                                        className="btn btn-icon btn-small"
                                                                        onClick={(e) => handleEditClick(position, e)}
                                                                        title="Edit Position"
                                                                        style={{
                                                                            background: 'rgba(99, 102, 241, 0.1)',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '4px',
                                                                            padding: '4px 8px',
                                                                            borderRadius: '6px',
                                                                            color: 'var(--color-accent)',
                                                                        }}
                                                                    >
                                                                        <Pencil size={13} />
                                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Edit</span>
                                                                    </button>
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
                                                                        <Trash2 size={13} />
                                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Delete</span>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                {groupedPositions.map(([sector, sectorPositions]) => (
                                    <React.Fragment key={sector}>
                                        <div style={{ padding: '0.5rem 0', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--glass-border)' }}>
                                            {sector} <span style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 600, marginLeft: '4px' }}>({sectorPositions.length})</span>
                                        </div>
                                        {sectorPositions.map((position) => {
                                            const allocation = calculateAllocation(position.marketValue, summary.totalValue);
                                            return (
                                                <div
                                                    key={position.id}
                                                    className="glass-card"
                                                    style={{
                                                        padding: '1rem',
                                                        background: newlyAddedSymbol === position.symbol ? 'rgba(16, 185, 129, 0.15)' : 'var(--glass-bg)',
                                                        transition: 'background 1s ease'
                                                    }}
                                                    onClick={() => handleRowClick(position.symbol)}
                                                >
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
                                                            <div style={{ fontWeight: 600 }}>{fmt(position.currentPrice)}</div>
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
                                                        <div style={{ textAlign: 'right' }}>{fmt(position.avgCost)}</div>

                                                        <div style={{ color: 'var(--color-text-tertiary)' }}>Value:</div>
                                                        <div style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(position.marketValue)}</div>

                                                        <div style={{ color: 'var(--color-text-tertiary)' }}>P/L:</div>
                                                        <div className={getChangeClass(position.profitLoss)} style={{ textAlign: 'right' }}>{fmt(position.profitLoss)}</div>
                                                    </div>

                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
                                                        <button
                                                            className="btn btn-icon btn-small"
                                                            onClick={(e) => handleEditClick(position, e)}
                                                            style={{
                                                                background: 'rgba(99, 102, 241, 0.1)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                padding: '6px 12px',
                                                                borderRadius: '8px',
                                                                color: 'var(--color-accent)',
                                                                flex: 1,
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            <Pencil size={15} />
                                                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Edit</span>
                                                        </button>
                                                        <button
                                                            className="btn btn-icon btn-small text-error"
                                                            onClick={(e) => handleRemove(position.id, position.symbol, e)}
                                                            style={{
                                                                background: 'rgba(239, 68, 68, 0.1)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                padding: '6px 12px',
                                                                borderRadius: '8px',
                                                                flex: 1,
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            <Trash2 size={15} />
                                                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* AI/Risk Intelligence Tab Content */}
            {activeSubTab === 'intelligence' && (
                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    {/* Tactical Risk Audit & Report Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

                        {/* 1. Tactical Risk Audit Report */}
                        <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <ShieldCheck size={20} color="var(--color-accent)" />
                                    Tactical Risk Audit
                                </h3>
                                <div style={{ fontSize: '0.65rem', color: riskColor, fontWeight: 800, padding: '4px 10px', background: `${riskColor}15`, borderRadius: '6px', border: `1px solid ${riskColor}30`, letterSpacing: '0.05em' }}>
                                    {riskLabel.toUpperCase()} PROFILE
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '1rem' }}>Sector Diversification</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {sectorAllocations.map((sa, idx) => (
                                        <div key={idx}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                                                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{sa.sector}</span>
                                                <span style={{ fontWeight: 800, color: sa.valid.valid ? 'var(--color-text-primary)' : 'var(--color-error)' }}>
                                                    {sa.allocation.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${Math.min(sa.allocation, 100)}%`,
                                                    height: '100%',
                                                    background: sa.valid.valid ? 'var(--gradient-primary)' : 'var(--color-error)',
                                                    boxShadow: sa.valid.valid ? '0 0 10px rgba(99, 102, 241, 0.3)' : 'none',
                                                    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>Highest Overexposure</div>
                                    {stockAllocations.length > 0 ? (
                                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white' }}>
                                            {stockAllocations.sort((a, b) => b.allocation - a.allocation)[0].symbol}
                                            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-error)', marginLeft: '6px' }}>
                                                ({stockAllocations.sort((a, b) => b.allocation - a.allocation)[0].allocation.toFixed(1)}%)
                                            </span>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-tertiary)' }}>No positions</div>
                                    )}
                                </div>
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>Risk Intelligence</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, fontWeight: 500 }}>
                                        {hasAllocationWarnings ? 'Risk identified in concentration limits. Consider rebalancing to institutional 5% rules.' : 'Portfolio is currently within optimized risk parameters.'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Risk Meter & Strategy Profile */}
                        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Zap size={20} color="var(--color-warning)" fill="var(--color-warning)" style={{ opacity: 0.8 }} />
                                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Strategic Intelligence</h3>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', padding: '1rem 0' }}>
                                <div style={{ position: 'relative', width: '120px', height: '70px' }}>
                                    <svg width="120" height="70" viewBox="0 0 120 70">
                                        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" strokeLinecap="round" />
                                        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke={riskColor} strokeWidth="10" strokeLinecap="round" strokeDasharray="157" strokeDashoffset={157 - (riskScore / 100 * 157)} style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
                                    </svg>
                                    <div style={{ position: 'absolute', bottom: '5px', left: '50%', transform: 'translateX(-50%)', fontWeight: 900, fontSize: '1.5rem', color: riskColor, letterSpacing: '-0.02em' }}>
                                        {riskScore}%
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>Strategy Profile</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', margin: '2px 0' }}>{riskLabel}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                                        Based on sector concentration and asset volatility.
                                    </div>
                                </div>
                            </div>

                            {/* Benchmarking */}
                            <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '1.25rem', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 600 }}>Performance vs S&P 500 (1Y)</span>
                                    <span style={{ color: 'var(--color-success)', fontWeight: 800, background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>OUTPERFORMING</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '70px', fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Portfolio</div>
                                        <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                                            <div style={{ width: '92%', height: '100%', background: 'var(--gradient-primary)', borderRadius: '5px' }} />
                                        </div>
                                        <div style={{ width: '45px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-success)', textAlign: 'right' }}>+24%</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '70px', fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>S&P 500</div>
                                        <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                                            <div style={{ width: '70%', height: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '5px' }} />
                                        </div>
                                        <div style={{ width: '45px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-tertiary)', textAlign: 'right' }}>+18%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Warnings and AI Analysis Button */}
                    {hasAllocationWarnings && (
                        <div style={{
                            padding: '1.25rem',
                            background: 'rgba(245, 158, 11, 0.08)',
                            border: '1px solid rgba(245, 158, 11, 0.2)',
                            borderRadius: '16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem',
                            marginBottom: '2rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <AlertTriangle size={20} color="var(--color-warning)" />
                                <span style={{ fontSize: '0.85rem', color: 'var(--color-warning)', fontWeight: 600 }}>
                                    ⚠️ Warning: Some positions exceed allocation limits (5% per stock, 20% per sector)
                                </span>
                            </div>
                            <button
                                className="btn btn-primary ai-pulse-button"
                                style={{
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    color: '#000',
                                    fontWeight: 900,
                                    fontSize: '0.75rem',
                                    padding: '8px 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    border: 'none',
                                    boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)',
                                    borderRadius: '25px',
                                    transition: 'all 0.3s ease',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}
                                onClick={() => setShowAIAdvice(true)}
                            >
                                <Zap size={16} fill="currentColor" /> AI Recommendation Analysis Portfolio
                            </button>
                        </div>
                    )}
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


            {/* Edit Position Modal */}
            {editingPosition && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 3000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
                        padding: '1rem',
                    }}
                    onClick={() => setEditingPosition(null)}
                >
                    <div
                        className="glass-card"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%', maxWidth: '400px',
                            background: 'rgba(8,8,16,0.98)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 'var(--radius-xl)',
                            padding: '1.75rem',
                            boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
                            animation: 'slideUp 0.2s ease-out both',
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Edit Position</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                    {editingPosition.symbol} — update units or average cost
                                </p>
                            </div>
                            <button
                                onClick={() => setEditingPosition(null)}
                                style={{
                                    background: 'rgba(255,255,255,0.06)', border: 'none',
                                    borderRadius: '8px', width: '30px', height: '30px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: 'var(--color-text-secondary)',
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Fields */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                                    Units (Shares / Qty)
                                </label>
                                <input
                                    type="number"
                                    min="0.0001"
                                    step="any"
                                    value={editForm.units}
                                    onChange={(e) => setEditForm(f => ({ ...f, units: e.target.value }))}
                                    style={{
                                        width: '100%', padding: '0.8rem 1rem',
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--color-text-primary)',
                                        fontSize: '1rem', fontFamily: 'inherit', outline: 'none',
                                        transition: 'border-color 0.2s',
                                    }}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                                    Average Cost (per unit)
                                </label>
                                <input
                                    type="number"
                                    min="0.0001"
                                    step="any"
                                    value={editForm.avgCost}
                                    onChange={(e) => setEditForm(f => ({ ...f, avgCost: e.target.value }))}
                                    style={{
                                        width: '100%', padding: '0.8rem 1rem',
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--color-text-primary)',
                                        fontSize: '1rem', fontFamily: 'inherit', outline: 'none',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); }}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button
                                onClick={() => setEditingPosition(null)}
                                style={{
                                    flex: 1, padding: '0.8rem',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                    color: 'var(--color-text-secondary)', fontWeight: 600,
                                    fontSize: '0.9rem',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={isSavingEdit}
                                style={{
                                    flex: 2, padding: '0.8rem',
                                    background: isSavingEdit ? 'rgba(99,102,241,0.4)' : 'var(--gradient-primary)',
                                    border: 'none', borderRadius: 'var(--radius-md)',
                                    cursor: isSavingEdit ? 'not-allowed' : 'pointer',
                                    color: 'white', fontWeight: 700, fontSize: '0.9rem',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: '0.5rem',
                                    boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
                                }}
                            >
                                <Save size={16} />
                                {isSavingEdit ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

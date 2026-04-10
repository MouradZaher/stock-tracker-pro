import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, X, Zap, Bell, ShieldCheck, BarChart2, TrendingUp, TrendingDown, Minus, ArrowRight, Pencil, Save, Cloud, CheckCircle, RefreshCw, AlertTriangle, Sparkles, LayoutGrid } from 'lucide-react';

import { usePortfolioStore } from '../hooks/usePortfolio';
import { useAuth } from '../contexts/AuthContext';
import { getStockQuote, getMultipleQuotes } from '../services/stockDataService';
import { REFRESH_INTERVALS } from '../services/api';
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
import RealTimePrice from './RealTimePrice';
import PortfolioIntelligencePanel from './PortfolioIntelligencePanel';
import CompanyLogo from './CompanyLogo';
import RiskReturnChart from './RiskReturnChart';
import SubNavbar from './SubNavbar';
import { getFullCompanyName } from '../data/companyNames';

// --- NEW: Scenario Hedging Component ---
const ScenarioHedging: React.FC<{ positions: any[] }> = ({ positions }) => {
    const [scenario, setScenario] = useState<'crash' | 'recession' | 'inflation' | 'base'>('base');
    
    const scenarios = {
        base: { label: 'Neutral', impact: 0, color: 'var(--color-text-tertiary)' },
        crash: { label: 'Flash Crash (-10%)', impact: -10, color: 'var(--color-error)' },
        recession: { label: 'Bear Market (-25%)', impact: -25, color: 'var(--color-error)' },
        inflation: { label: 'Stagflation (+5%)', impact: 5, color: 'var(--color-warning)' },
    };

    const hedgingAssets = positions.filter(p => ['GLD', 'SLV', 'VOO', 'TLT'].includes(p.symbol));
    const totalValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
    const hedgeValue = hedgingAssets.reduce((sum, p) => sum + p.marketValue, 0);
    const hedgeRatio = totalValue > 0 ? (hedgeValue / totalValue) * 100 : 0;

    // Simulated Beta protection: Gold (GLD) protects 0.8x of crash, VOO 0x, etc.
    const getProtection = () => {
        let protectedValue = 0;
        hedgingAssets.forEach(p => {
            if (p.symbol === 'GLD') protectedValue += p.marketValue * 0.8;
            if (p.symbol === 'TLT') protectedValue += p.marketValue * 0.6;
        });
        return protectedValue;
    };

    const potentialLoss = (totalValue * (scenarios[scenario].impact / 100));
    const protectedAmount = scenario === 'base' ? 0 : (getProtection() * (Math.abs(scenarios[scenario].impact) / 100));
    const netImpact = potentialLoss + protectedAmount;

    return (
        <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} color="var(--color-success)" /> Scenario Hedging Simulator
                </h3>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-text-tertiary)', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                    HEDGE RATIO: {hedgeRatio.toFixed(1)}%
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
                {(Object.entries(scenarios) as [keyof typeof scenarios, any][]).map(([key, item]) => (
                    <button
                        key={key}
                        onClick={() => { soundService.playTap(); setScenario(key); }}
                        style={{
                            flex: 1,
                            padding: '10px 6px',
                            background: scenario === key ? 'rgba(255,255,255,0.05)' : 'transparent',
                            border: `1px solid ${scenario === key ? item.color : 'rgba(255,255,255,0.05)'}`,
                            borderRadius: '8px',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            color: scenario === key ? 'white' : 'var(--color-text-tertiary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1.25rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Potential Drawdown</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-error)' }}>{potentialLoss === 0 ? '--' : formatCurrency(potentialLoss)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Protected Alpha</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-success)' }}>{protectedAmount === 0 ? '--' : `+${formatCurrency(protectedAmount)}`}</div>
                </div>
                <div style={{ gridColumn: 'span 2', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>ESTIMATED NET IMPACT</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: netImpact >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                        {netImpact === 0 ? '$0.00' : (netImpact > 0 ? '+' : '') + formatCurrency(netImpact)}
                    </span>
                </div>
            </div>

            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '1rem', lineHeight: 1.4, textAlign: 'center' }}>
                {hedgeRatio < 15 ? '⚠️ Warning: Hedge ratio below 15%. Portfolio is vulnerable to tail-risk events. Consider adding GLD or TLT.' : '✅ Optimal hedging detected. Strategic assets provide significant downside protection.'}
            </p>
        </div>
    );
};

interface PortfolioProps {
    onSelectSymbol?: (symbol: string) => void;
}

const Portfolio: React.FC<PortfolioProps> = ({ onSelectSymbol }) => {
    const { user } = useAuth();
    const { selectedMarket } = useMarket();
    const fmt = (v: number) => formatCurrencyForMarket(v, selectedMarket.currency);
    const { positions: allPositions, addPosition, removePosition, updatePosition, getAdvancedMetrics, updatePrice, syncPrices } = usePortfolioStore();

    const positions = React.useMemo(() => {
        return allPositions.filter(pos => getMarketForSymbol(pos.symbol) === selectedMarket.id);
    }, [allPositions, selectedMarket.id]);

    const [showModal, setShowModal] = useState(false);
    const [editingPosition, setEditingPosition] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({ units: '', avgCost: '' });
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState<'overview' | 'positions' | 'intelligence'>('overview');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAIAdvice, setShowAIAdvice] = useState(false);
    const [aiRecs, setAiRecs] = useState<Record<string, StockRecommendation>>({});
    const [newlyAddedSymbol, setNewlyAddedSymbol] = useState<string | null>(null);
    const [formData, setFormData] = useState({ symbol: '', units: '', avgCost: '', name: '', currentPrice: 0 });
    const [alertConfig, setAlertConfig] = useState<{ symbol: string; price: number } | null>(null);

    const summary = React.useMemo(() => {
        const globalTotalValueUSD = allPositions.reduce((sum, pos) => sum + (pos.marketValueUSD || 0), 0);
        const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
        const totalCost = positions.reduce((sum, pos) => sum + pos.purchaseValue, 0);
        const totalProfitLoss = totalValue - totalCost;
        const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

        return {
            totalValue,
            normalizedTotalValueUSD: globalTotalValueUSD,
            totalCost,
            totalProfitLoss,
            totalProfitLossPercent,
            positions
        };
    }, [allPositions, positions]);

    useEffect(() => {
        syncPrices();
        const interval = setInterval(syncPrices, REFRESH_INTERVALS.PORTFOLIO);
        return () => clearInterval(interval);
    }, [syncPrices]);

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
    }, [positions.length]);

    const handleAddPosition = async () => {
        if (!formData.symbol || !formData.units || !formData.avgCost) return;
        setIsSubmitting(true);
        const upperSymbol = formData.symbol.toUpperCase();
        try {
            const quote = await getStockQuote(upperSymbol);
            const livePrice = quote?.price || parseFloat(formData.avgCost);
            await addPosition({
                symbol: upperSymbol,
                name: formData.name || upperSymbol,
                units: parseFloat(formData.units),
                avgCost: parseFloat(formData.avgCost),
                currentPrice: livePrice,
                sector: getSectorForSymbol(upperSymbol),
                dividends: [],
            }, user?.id);
            setNewlyAddedSymbol(upperSymbol);
            setShowModal(false);
            setFormData({ symbol: '', units: '', avgCost: '', name: '', currentPrice: 0 });
            setTimeout(() => setNewlyAddedSymbol(null), 3000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemove = (id: string, symbol: string, e: React.MouseEvent) => {
        e.stopPropagation();
        removePosition(id, symbol, user?.id);
    };

    const handleEditClick = (position: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingPosition(position);
        setEditForm({ units: position.units.toString(), avgCost: position.avgCost.toString() });
    };

    const handleSaveEdit = async () => {
        if (!editingPosition) return;
        setIsSavingEdit(true);
        try {
            await updatePosition(editingPosition.id, { units: parseFloat(editForm.units), avgCost: parseFloat(editForm.avgCost) }, user?.id);
            setEditingPosition(null);
        } finally {
            setIsSavingEdit(false);
        }
    };

    const sectorAllocations = positions.reduce((acc, pos) => {
        const existing = acc.find((a) => a.sector === pos.sector);
        if (existing) existing.value += pos.marketValue;
        else acc.push({ sector: pos.sector, value: pos.marketValue });
        return acc;
    }, [] as { sector: string; value: number }[]).map((s) => ({
        ...s,
        allocation: calculateAllocation(s.value, summary.totalValue),
        valid: checkAllocationLimits(calculateAllocation(s.value, summary.totalValue), 'sector', s.sector),
    }));

    const hasAllocationWarnings = sectorAllocations.some((a) => !a.valid.valid);
    const advMetrics = getAdvancedMetrics();
    const riskScore = hasAllocationWarnings ? 65 : 88;
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

    const getRecIcon = (rec?: string) => {
        if (rec === 'Buy') return <TrendingUp size={14} color="var(--color-success)" />;
        if (rec === 'Sell') return <TrendingDown size={14} color="var(--color-error)" />;
        return <Minus size={14} color="var(--color-warning)" />;
    };

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
            const limit = ['GLD', 'SLV', 'VOO'].includes(p.symbol) ? 30 : 5;

            if (allocation > limit) {
                actions.push({
                    symbol: p.symbol,
                    action: 'Trim',
                    reason: `Allocation is ${allocation.toFixed(1)}%, exceeding the ${limit}% limit.`,
                    impact: `Trim to ~${limit}% to maintain balanced exposure.`,
                    priority: allocation > (limit + 10) ? 'High' : 'Medium'
                });
            }
        }
        return actions;
    }, [showAIAdvice, positions]);

    const handleRowClick = (symbol: string) => onSelectSymbol?.(symbol);

    return (
        <div className="tab-content dashboard-viewport" style={{ padding: 0, gap: 0 }}>
            <SubNavbar 
                activeTab={activeSubTab}
                onTabChange={setActiveSubTab}
                tabs={[
                    { id: 'overview', label: 'Overview', icon: LayoutGrid, color: 'var(--color-accent)' },
                    { id: 'positions', label: 'Positions', icon: BarChart2, color: 'var(--color-success)' },
                    { id: 'intelligence', label: 'Intelligence', icon: Zap, color: 'var(--color-warning)' }
                ]}
            />

            {activeSubTab === 'positions' && (
                <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', padding: '0.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={14} /> Add Asset
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {activeSubTab === 'overview' && (
                    <div className="scrollable-panel" style={{ padding: '1rem 1.5rem' }}>
                        <div className="portfolio-summary-grid" style={{ 
                            display: 'grid', 
                            gridTemplateColumns: window.innerWidth < 480 ? '1fr 1fr' : 'repeat(auto-fit, minmax(130px, 1fr))', 
                            gap: '0.5rem', 
                            marginBottom: '1rem' 
                        }}>
                            <div className="summary-card glass-card" style={{ padding: '0.75rem', gridColumn: window.innerWidth < 480 ? 'span 2' : 'auto' }}>
                                <div className="summary-label" style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Net Assets (USD)</div>
                                <div className="summary-value" style={{ fontSize: '1.4rem', fontWeight: 950, color: 'white' }}>{formatCurrency(summary.normalizedTotalValueUSD)}</div>
                            </div>
                            <div className="summary-card glass-card" style={{ padding: '0.75rem' }}>
                                <div className="summary-label" style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Performance</div>
                                <div className="summary-value" style={{ fontSize: '1.1rem', fontWeight: 950, color: summary.totalProfitLoss >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                                    {formatPercent(summary.totalProfitLossPercent)}
                                </div>
                            </div>
                            <div className="summary-card glass-card" style={{ padding: '0.75rem' }}>
                                <div className="summary-label" style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alpha Delta</div>
                                <div className="summary-value" style={{ fontSize: '1.1rem', fontWeight: 950, color: riskColor }}>{riskScore}</div>
                            </div>
                        </div>
                        <div className="adaptive-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                            <ScenarioHedging positions={positions} />
                            <div className="glass-card" style={{ padding: '1.25rem' }}>
                                <RiskReturnChart positions={positions} />
                            </div>
                        </div>
                    </div>
                )}

                {activeSubTab === 'positions' && (
                    <div className="positions-container" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 1.5rem 1.5rem 1.5rem' }}>
                        {/* Desktop Table View */}
                        <div className="desktop-only" style={{ display: window.innerWidth >= 768 ? 'block' : 'none' }}>
                            <div className="table-container glass-card custom-scrollbar">
                                <table className="portfolio-table sticky-header">
                                    <thead>
                                        <tr>
                                            <th>Asset</th>
                                            <th style={{ textAlign: 'right' }}>Units</th>
                                            <th style={{ textAlign: 'right' }}>Avg Cost</th>
                                            <th style={{ textAlign: 'right' }}>Price</th>
                                            <th style={{ textAlign: 'right' }}>Market Value</th>
                                            <th style={{ textAlign: 'right' }}>P/L %</th>
                                            <th style={{ textAlign: 'center' }}>AI Strategy</th>
                                            <th style={{ textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupedPositions.map(([sector, sectorPositions]) => (
                                            <React.Fragment key={sector}>
                                                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                    <td colSpan={8} style={{ padding: '0.6rem 1rem', fontWeight: 800, fontSize: '0.7rem' }}>{sector}</td>
                                                </tr>
                                                {sectorPositions.map((pos) => (
                                                    <tr key={pos.id} onClick={() => handleRowClick(pos.symbol)} className="portfolio-row">
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <CompanyLogo symbol={pos.symbol} size={32} />
                                                                <div>
                                                                    <div style={{ fontWeight: 800 }}>{pos.symbol.replace(/[()]/g, '')}</div>
                                                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>{getFullCompanyName(pos.symbol, pos.name)}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>{pos.units.toLocaleString()}</td>
                                                        <td style={{ textAlign: 'right' }}>{fmt(pos.avgCost)}</td>
                                                        <td style={{ textAlign: 'right' }}><RealTimePrice price={pos.currentPrice} showCurrency={false} /></td>
                                                        <td style={{ textAlign: 'right' }}>{fmt(pos.marketValue)}</td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <span className={getChangeClass(pos.profitLossPercent)}>{formatPercent(pos.profitLossPercent)}</span>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            {aiRecs[pos.symbol] ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                                    {getRecIcon(aiRecs[pos.symbol].recommendation)}
                                                                    <span style={{ fontSize: '0.65rem', fontWeight: 900 }}>{aiRecs[pos.symbol].recommendation?.toUpperCase()}</span>
                                                                </div>
                                                            ) : '...'}
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                                                                <button className="btn-icon" onClick={(e) => handleEditClick(pos, e)}><Pencil size={14} /></button>
                                                                <button className="btn-icon text-error" onClick={(e) => handleRemove(pos.id, pos.symbol, e)}><Trash2 size={14} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Card View (optimized for 390px) */}
                        <div className="mobile-only" style={{ display: window.innerWidth < 768 ? 'flex' : 'none', flexDirection: 'column', gap: '0.75rem' }}>
                            {positions.map((pos) => (
                                <div key={pos.id} className="glass-card" style={{ padding: '1rem', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => handleRowClick(pos.symbol)}>
                                            <CompanyLogo symbol={pos.symbol} size={36} />
                                            <div>
                                                <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>{pos.symbol}</div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>{pos.name}</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 900, fontSize: '1rem' }}><RealTimePrice price={pos.currentPrice} showCurrency={false} /></div>
                                            <div className={getChangeClass(pos.profitLossPercent)} style={{ fontWeight: 800, fontSize: '0.75rem' }}>
                                                {formatPercent(pos.profitLossPercent)}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '8px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', marginBottom: '0.75rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.55rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Units</div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{pos.units}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.55rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Avg Cost</div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{fmt(pos.avgCost)}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.55rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Value</div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{fmt(pos.marketValue)}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {aiRecs[pos.symbol] && (
                                                <span style={{ fontSize: '0.65rem', fontWeight: 900, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Zap size={10} color="var(--color-accent)" /> {aiRecs[pos.symbol].recommendation?.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="glass-button" onClick={(e) => handleEditClick(pos, e)} style={{ padding: '6px 12px', fontSize: '0.7rem' }}>EDIT</button>
                                            <button className="glass-button text-error" onClick={(e) => handleRemove(pos.id, pos.symbol, e)} style={{ padding: '6px 12px', fontSize: '0.7rem' }}>REMOVE</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeSubTab === 'intelligence' && (
                    <div className="scrollable-panel" style={{ padding: '1.5rem', gap: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                            <RiskReturnChart positions={positions} />
                            <ScenarioHedging positions={positions} />
                        </div>
                        <div className="glass-card" style={{ padding: '1.75rem' }}>
                            <PortfolioIntelligencePanel />
                        </div>
                    </div>
                )}
            </div>

            {/* AI Advice Modal */}
            {showAIAdvice && (
                <div className="modal-overlay glass-blur" onClick={() => setShowAIAdvice(false)}>
                    <div className="modal glass-effect" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '95%', border: '1px solid var(--glass-border-bright)' }}>
                        <div className="modal-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <div>
                                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem', fontWeight: 800 }}>
                                    <Zap size={22} color="var(--color-warning)" fill="var(--color-warning)" style={{ opacity: 0.8 }} />
                                    Strategic Portfolio Optimization
                                </h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
                                    AI-driven rebalancing recommendations based on risk exposure
                                </p>
                            </div>
                            <button className="btn btn-icon glass-button" onClick={() => setShowAIAdvice(false)} style={{ borderRadius: '50%', padding: '0.5rem' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '2rem' }}>
                            <div className="glass-card" style={{
                                padding: '1.25rem',
                                marginBottom: '2rem',
                                background: 'rgba(99, 102, 241, 0.05)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                borderRadius: '16px'
                            }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <ShieldCheck size={24} color="var(--color-accent)" style={{ marginTop: '2px' }} />
                                    <div>
                                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-accent)', marginBottom: '4px' }}>
                                            Institutional Safety Rules
                                        </h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                            Analysis baseline: <strong>5% cap for individual assets</strong> and <strong>20% cap per sector</strong>. Strategic exceptions (30% asset / 40% sector) apply to hedging assets (Gold, Silver) and diversified indexes (VOO) to mitigate tail-risk.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {rebalancingActions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: 'rgba(16, 185, 129, 0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 1.5rem'
                                    }}>
                                        <CheckCircle size={40} color="var(--color-success)" style={{ opacity: 0.6 }} />
                                    </div>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>Portfolio Optimized</h4>
                                    <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem' }}>
                                        All assets currently adhere to risk management protocols.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {rebalancingActions.map((action, idx) => (
                                        <div key={idx} className="glass-card recommendation-card" style={{
                                            padding: '1.5rem',
                                            borderLeft: `5px solid ${action.action === 'Trim' ? 'var(--color-error)' : (action.action === 'Add' ? 'var(--color-success)' : 'var(--color-warning)')}`,
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '12px',
                                            transition: 'transform 0.2s ease'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '8px',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.9rem',
                                                        fontWeight: 900,
                                                        color: 'white'
                                                    }}>
                                                        {action.symbol.substring(0, 1)}
                                                    </div>
                                                    <div>
                                                        <span style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>{action.symbol}</span>
                                                        <div style={{
                                                            fontSize: '0.6rem',
                                                            fontWeight: 900,
                                                            color: action.priority === 'High' ? 'var(--color-error)' : 'var(--color-text-tertiary)',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.05em',
                                                            marginTop: '2px'
                                                        }}>
                                                            {action.priority} Priority
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                                                {action.reason} <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{action.impact}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer" style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'center' }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowAIAdvice(false)}
                                style={{
                                    background: 'var(--gradient-primary)',
                                    padding: '0.8rem 2.5rem',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    border: 'none',
                                    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
                                    width: '100%',
                                    maxWidth: '300px'
                                }}
                            >
                                Acknowledge Strategy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Position Modal */}
            {showModal && (
                <div className="modal-overlay glass-blur" onClick={() => setShowModal(false)}>
                    <div className="modal glass-effect" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', border: '1px solid var(--glass-border-bright)', borderRadius: '24px' }}>
                        <div className="modal-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <h3 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>New Asset Position</h3>
                            <button className="btn btn-icon glass-button" onClick={() => setShowModal(false)} style={{ borderRadius: '50%', padding: '0.5rem' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ padding: '2rem' }}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label" style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--color-text-tertiary)', marginBottom: '0.75rem', display: 'block' }}>Asset Search</label>
                                <SymbolSearchInput
                                    placeholder={`Search ${selectedMarket.name} assets...`}
                                    onSelect={(symbol) => setFormData({ ...formData, symbol })}
                                    initialValue={formData.symbol}
                                    marketId={selectedMarket.id}
                                    autoFocus
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--color-text-tertiary)', marginBottom: '0.75rem', display: 'block' }}>Units</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0.00"
                                        value={formData.units}
                                        onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 600 }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--color-text-tertiary)', marginBottom: '0.75rem', display: 'block' }}>Avg Cost</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0.00"
                                        step="0.01"
                                        value={formData.avgCost}
                                        onChange={(e) => setFormData({ ...formData, avgCost: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 600 }}
                                    />
                                </div>
                            </div>

                            {formData.units && formData.avgCost && !isNaN(parseFloat(formData.units) * parseFloat(formData.avgCost)) && (
                                <div className="glass-card" style={{ padding: '1rem 1.25rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>Purchase Value</div>
                                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--color-accent)' }}>
                                        {formatCurrency(parseFloat(formData.units) * parseFloat(formData.avgCost))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer" style={{ padding: '0 2rem 2rem', border: 'none', display: 'flex', gap: '1rem' }}>
                            <button
                                className="btn btn-secondary glass-button"
                                onClick={() => setShowModal(false)}
                                disabled={isSubmitting}
                                style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', fontWeight: 700 }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddPosition}
                                disabled={isSubmitting || !formData.symbol || !formData.units || !formData.avgCost}
                                style={{
                                    flex: 2,
                                    padding: '0.8rem',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    background: 'var(--gradient-primary)',
                                    border: 'none',
                                    boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)'
                                }}
                            >
                                {isSubmitting ? <RefreshCw className="animate-spin" size={18} /> : 'Secure Position'}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Edit Position Modal */}
            {editingPosition && (
                <div className="modal-overlay glass-blur" onClick={() => setEditingPosition(null)}>
                    <div className="modal glass-effect" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', border: '1px solid var(--glass-border-bright)', borderRadius: '24px' }}>
                        <div className="modal-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <div>
                                <h3 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Modify Position</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
                                    {editingPosition.symbol} — {editingPosition.name}
                                </p>
                            </div>
                            <button className="btn btn-icon glass-button" onClick={() => setEditingPosition(null)} style={{ borderRadius: '50%', padding: '0.5rem' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ padding: '2rem' }}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label" style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--color-text-tertiary)', marginBottom: '0.75rem', display: 'block' }}>Units (Quantity)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={editForm.units}
                                    onChange={(e) => setEditForm(f => ({ ...f, units: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        padding: '0.85rem 1.15rem',
                                        borderRadius: '12px',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                    autoFocus
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label" style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--color-text-tertiary)', marginBottom: '0.75rem', display: 'block' }}>Average Purchase Cost</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={editForm.avgCost}
                                    onChange={(e) => setEditForm(f => ({ ...f, avgCost: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        padding: '0.85rem 1.15rem',
                                        borderRadius: '12px',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); }}
                                />
                            </div>
                        </div>

                        <div className="modal-footer" style={{ padding: '0 2rem 2rem', border: 'none', display: 'flex', gap: '1rem' }}>
                            <button
                                className="btn btn-secondary glass-button"
                                onClick={() => setEditingPosition(null)}
                                style={{ flex: 1, padding: '0.85rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem' }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSaveEdit}
                                disabled={isSavingEdit}
                                style={{
                                    flex: 2,
                                    padding: '0.85rem',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    background: 'var(--gradient-primary)',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)'
                                }}
                            >
                                {isSavingEdit ? <RefreshCw className="animate-spin" size={16} /> : <><Save size={16} /> Update Position</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

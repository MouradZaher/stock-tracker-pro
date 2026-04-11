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
import { getFullCompanyName } from '../data/companyNames';

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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [aiRecs, setAiRecs] = useState<Record<string, StockRecommendation>>({});
    const [formData, setFormData] = useState({ symbol: '', units: '', avgCost: '', name: '', currentPrice: 0 });

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
            setShowModal(false);
            setFormData({ symbol: '', units: '', avgCost: '', name: '', currentPrice: 0 });
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

    const handleRowClick = (symbol: string) => onSelectSymbol?.(symbol);

    return (
        <div className="tab-content dashboard-viewport" style={{ padding: 0, gap: 0, background: '#000' }}>
            
            {/* PORTFOLIO HEADER (Total Net Assets & Performance) */}
            <div style={{ 
                padding: '0.75rem 1.5rem', 
                background: 'rgba(0,0,0,0.6)', 
                borderBottom: '1px solid #111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '64px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.45rem', fontWeight: 900, color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>TOTAL NET ASSETS (USD)</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 950, color: 'white', letterSpacing: '-0.02em' }}>{formatCurrency(summary.normalizedTotalValueUSD)}</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.45rem', fontWeight: 900, color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PERFORMANCE</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 950, color: summary.totalProfitLoss >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                            {summary.totalProfitLoss >= 0 ? '📈' : '📉'} {formatPercent(summary.totalProfitLossPercent)}
                        </span>
                    </div>

                    <div style={{ height: '30px', width: '1px', background: '#111' }} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ padding: '4px 8px', background: 'rgba(74, 222, 128, 0.05)', border: '1px solid rgba(74, 222, 128, 0.1)', borderRadius: '4px' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--color-accent)' }}>POSITIONS</span>
                        </div>
                    </div>
                </div>

                <button onClick={() => setShowModal(true)} style={{ 
                    background: 'var(--color-accent)', border: 'none', color: 'black', 
                    padding: '8px 16px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 900,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                    <Plus size={14} strokeWidth={3} /> ADD ASSET
                </button>
            </div>

            <div className="positions-container" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '1.5rem' }}>
                <div className="table-container glass-card custom-scrollbar" style={{ border: '1px solid #111', background: 'transparent' }}>
                    <table className="portfolio-table sticky-header">
                        <thead>
                            <tr style={{ background: '#050505' }}>
                                <th style={{ color: '#444', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Asset</th>
                                <th style={{ textAlign: 'right', color: '#444', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Units</th>
                                <th style={{ textAlign: 'right', color: '#444', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Avg Cost</th>
                                <th style={{ textAlign: 'right', color: '#444', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Price</th>
                                <th style={{ textAlign: 'right', color: '#444', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Market Value</th>
                                <th style={{ textAlign: 'right', color: '#444', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>P/L %</th>
                                <th style={{ textAlign: 'center', color: '#444', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Strategy</th>
                                <th style={{ textAlign: 'center', color: '#444', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedPositions.map(([sector, sectorPositions]) => (
                                <React.Fragment key={sector}>
                                    <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                                        <td colSpan={8} style={{ padding: '0.4rem 1rem', fontWeight: 900, fontSize: '0.55rem', color: '#333', borderBottom: '1px solid #0a0a0a' }}>{sector.toUpperCase()}</td>
                                    </tr>
                                    {sectorPositions.map((pos) => (
                                        <tr key={pos.id} onClick={() => handleRowClick(pos.symbol)} className="portfolio-row" style={{ borderBottom: '1px solid #0a0a0a' }}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <CompanyLogo symbol={pos.symbol} size={28} />
                                                    <div>
                                                        <div style={{ fontWeight: 900, fontSize: '0.8rem', color: 'white' }}>{pos.symbol.replace(/[()]/g, '')}</div>
                                                        <div style={{ fontSize: '0.6rem', color: '#444', fontWeight: 700 }}>{getFullCompanyName(pos.symbol, pos.name).toUpperCase()}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.75rem' }}>{pos.units.toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.75rem', color: '#666' }}>{fmt(pos.avgCost)}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '0.75rem' }}><RealTimePrice price={pos.currentPrice} showCurrency={false} /></td>
                                            <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '0.75rem', color: 'var(--color-accent)' }}>{fmt(pos.marketValue)}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <span className={getChangeClass(pos.profitLossPercent)} style={{ fontWeight: 900, fontSize: '0.75rem' }}>{formatPercent(pos.profitLossPercent)}</span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {aiRecs[pos.symbol] ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: 0.8 }}>
                                                        {getRecIcon(aiRecs[pos.symbol].recommendation)}
                                                        <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'white' }}>{aiRecs[pos.symbol].recommendation?.toUpperCase()}</span>
                                                    </div>
                                                ) : '...'}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                                    <button className="btn-icon" onClick={(e) => handleEditClick(pos, e)} style={{ opacity: 0.3 }}><Pencil size={12} /></button>
                                                    <button className="btn-icon text-error" onClick={(e) => handleRemove(pos.id, pos.symbol, e)} style={{ opacity: 0.3 }}><Trash2 size={12} /></button>
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

            {/* Add Position Modal */}
            {showModal && (
                <div className="modal-overlay glass-blur" onClick={() => setShowModal(false)} style={{ zIndex: 10000 }}>
                    <div className="modal glass-effect" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', background: '#050505', border: '1px solid #111', borderRadius: '4px' }}>
                        <div className="modal-header" style={{ padding: '1.25rem', borderBottom: '1px solid #111' }}>
                            <h3 className="modal-title" style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase' }}>New Asset Position</h3>
                            <button className="btn btn-icon" onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#444' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ padding: '1.5rem' }}>
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.5rem', color: '#444', marginBottom: '8px', display: 'block' }}>Search Symbol</label>
                                <SymbolSearchInput
                                    placeholder={`Search ${selectedMarket.name} assets...`}
                                    onSelect={(symbol) => setFormData({ ...formData, symbol })}
                                    initialValue={formData.symbol}
                                    marketId={selectedMarket.id}
                                    autoFocus
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div className="form-group">
                                    <label style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.5rem', color: '#444', marginBottom: '8px', display: 'block' }}>Units</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.units}
                                        onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                                        style={{ width: '100%', padding: '0.6rem', background: '#0a0a0a', border: '1px solid #111', color: 'white', fontWeight: 700, outline: 'none' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.5rem', color: '#444', marginBottom: '8px', display: 'block' }}>Avg Cost</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.avgCost}
                                        onChange={(e) => setFormData({ ...formData, avgCost: e.target.value })}
                                        style={{ width: '100%', padding: '0.6rem', background: '#0a0a0a', border: '1px solid #111', color: 'white', fontWeight: 700, outline: 'none' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer" style={{ padding: '0 1.5rem 1.5rem', display: 'flex', gap: '1rem' }}>
                            <button
                                className="btn"
                                onClick={handleAddPosition}
                                disabled={isSubmitting || !formData.symbol || !formData.units || !formData.avgCost}
                                style={{
                                    flex: 1, padding: '0.75rem', background: 'var(--color-accent)', border: 'none',
                                    color: 'black', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer'
                                }}
                            >
                                {isSubmitting ? 'PROCESSING...' : 'SECURE POSITION'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingPosition && (
                <div className="modal-overlay glass-blur" onClick={() => setEditingPosition(null)} style={{ zIndex: 10000 }}>
                    <div className="modal glass-effect" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', background: '#050505', border: '1px solid #111', borderRadius: '4px' }}>
                         <div className="modal-header" style={{ padding: '1.25rem', borderBottom: '1px solid #111' }}>
                            <h3 className="modal-title" style={{ fontSize: '0.85rem', fontWeight: 900 }}>MODIFY {editingPosition.symbol}</h3>
                            <button className="btn btn-icon" onClick={() => setEditingPosition(null)} style={{ background: 'transparent', border: 'none', color: '#444' }}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ padding: '1.5rem' }}>
                             <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.5rem', color: '#444', marginBottom: '8px', display: 'block' }}>Modify Units</label>
                                <input
                                    type="number"
                                    value={editForm.units}
                                    onChange={(e) => setEditForm(f => ({ ...f, units: e.target.value }))}
                                    style={{ width: '100%', padding: '0.6rem', background: '#0a0a0a', border: '1px solid #111', color: 'white', fontWeight: 700, outline: 'none' }}
                                />
                            </div>
                             <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.5rem', color: '#444', marginBottom: '8px', display: 'block' }}>Modify Avg Cost</label>
                                <input
                                    type="number"
                                    value={editForm.avgCost}
                                    onChange={(e) => setEditForm(f => ({ ...f, avgCost: e.target.value }))}
                                    style={{ width: '100%', padding: '0.6rem', background: '#0a0a0a', border: '1px solid #111', color: 'white', fontWeight: 700, outline: 'none' }}
                                />
                            </div>
                        </div>
                        <div className="modal-footer" style={{ padding: '0 1.5rem 1.5rem' }}>
                            <button
                                className="btn"
                                onClick={handleSaveEdit}
                                style={{
                                    width: '100%', padding: '0.75rem', background: 'var(--color-accent)', border: 'none',
                                    color: 'black', fontWeight: 900, fontSize: '0.7rem'
                                }}
                            >
                                {isSavingEdit ? 'SAVING...' : 'UPDATE POSITION'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Portfolio;

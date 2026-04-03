import React, { useState, useEffect, useMemo } from 'react';
import {
    RefreshCw, X, Zap, ArrowRight, Check, TrendingUp,
    MessageSquare, BarChart2, Sparkles, LayoutGrid,
    Shield, Search, Activity, Globe, ZapOff, Fingerprint,
    Cpu, Target, Command as CommandIcon, Brain, Layers
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';
import { useNotifications } from '../contexts/NotificationContext';
import { soundService } from '../services/soundService';
import { getGroupedRecommendations } from '../services/aiRecommendationService';
import { getStockData } from '../services/stockDataService';
import { useMarket } from '../contexts/MarketContext';
import type { MarketId } from '../contexts/MarketContext';
import CompanyLogo from './CompanyLogo';
import AIIntelligenceStream from './AIIntelligenceStream';
import AIPerformanceTracker from './AIPerformanceTracker';
import AIStrategyIntelliHub from './AIStrategyIntelliHub';
import AIInstitutionalHub from './AIInstitutionalHub';
import SubNavbar from './SubNavbar';

// --- NEW COMPONENT: Alpha Card ---
const AlphaPickCard: React.FC<{ rec: any; onClick: () => void }> = ({ rec, onClick }) => {
    const getScoreColor = (score: number) => {
        if (score >= 90) return 'var(--color-success)';
        if (score >= 70) return 'var(--color-warning)';
        return 'var(--color-error)';
    };

    return (
        <div
            onClick={onClick}
            className="glass-card hover-lift"
            style={{
                padding: '1.25rem',
                cursor: 'pointer',
                border: '1px solid var(--glass-border)',
                background: 'rgba(255,255,255,0.02)',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '16px',
                flexShrink: 0
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <CompanyLogo symbol={rec.symbol} size={40} />
                        <div style={{ position: 'absolute', bottom: -2, right: -2, width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-success)', border: '2px solid var(--color-bg-primary)' }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 900, fontSize: '1rem', color: 'white' }}>{rec.symbol}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{rec.sector}</div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: getScoreColor(rec.score), textShadow: `0 0 10px ${getScoreColor(rec.score)}55` }}>{rec.score}%</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', fontWeight: 900, letterSpacing: '0.1em' }}>ALPHA PROB</div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1.25rem' }}>
                <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white' }}>{formatCurrency(rec.price || 0)}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <TrendingUp size={12} /> +{Math.floor(Math.random() * 8 + 5)}% ESTIMATED
                    </div>
                </div>
            </div>

            <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.05)', marginTop: '1rem', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${rec.score}%`, height: '100%', background: getScoreColor(rec.score), borderRadius: '2px', boxShadow: `0 0 8px ${getScoreColor(rec.score)}` }} />
            </div>
        </div>
    );
};

const US_RECS = [
    { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', score: 94, recommendation: 'Buy', suggestedAllocation: 5.0, price: 172.70 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', score: 89, recommendation: 'Buy', suggestedAllocation: 5.0, price: 381.87 },
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', score: 86, recommendation: 'Buy', suggestedAllocation: 5.0, price: 248.28 },
    { symbol: 'LLY', name: 'Eli Lilly & Co.', sector: 'Healthcare', score: 84, recommendation: 'Buy', suggestedAllocation: 4.5, price: 810.00 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', score: 81, recommendation: 'Buy', suggestedAllocation: 4.5, price: 301.00 },
    { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology', score: 79, recommendation: 'Buy', suggestedAllocation: 4.0, price: 310.51 },
];

const EGYPT_RECS = [
    { symbol: 'COMI', name: 'Commercial Intl Bank', sector: 'Banking', score: 91, recommendation: 'Buy', suggestedAllocation: 5.0, price: 92.0 },
    { symbol: 'TMGH', name: 'Talaat Moustafa Group', sector: 'Real Estate', score: 87, recommendation: 'Buy', suggestedAllocation: 5.0, price: 104.0 },
    { symbol: 'HRHO', name: 'Hermes Holding', sector: 'Financial Services', score: 85, recommendation: 'Buy', suggestedAllocation: 5.0, price: 32.5 },
];

const ABUDHABI_RECS = [
    { symbol: 'IHC', name: 'International Holding Co.', sector: 'Conglomerate', score: 90, recommendation: 'Buy', suggestedAllocation: 5.0, price: 390.0 },
    { symbol: 'FAB', name: 'First Abu Dhabi Bank', sector: 'Banking', score: 87, recommendation: 'Buy', suggestedAllocation: 5.0, price: 17.5 },
];

const RECS_MAP: Record<MarketId, typeof US_RECS> = { us: US_RECS, egypt: EGYPT_RECS, abudhabi: ABUDHABI_RECS };

const AIRecommendations: React.FC<{ onSelectStock?: (symbol: string) => void }> = ({ onSelectStock }) => {
    const { addNotification } = useNotifications();
    const { selectedMarket } = useMarket();
    const [isScanning, setIsScanning] = useState(false);
    const [viewMode, setViewMode] = useState<'terminal' | 'intel' | 'strategy'>('terminal');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeRecs, setActiveRecs] = useState<any[]>([]);

    const allSearchable = useMemo(() => [...US_RECS, ...EGYPT_RECS, ...ABUDHABI_RECS], []);
    const suggestions = useMemo(() => {
        if (!searchQuery) return [];
        return allSearchable.filter(s =>
            s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5);
    }, [searchQuery, allSearchable]);

    const INSTANT_RECS = useMemo(() => {
        return [...(RECS_MAP[selectedMarket.id] || US_RECS)].sort((a, b) => b.score - a.score);
    }, [selectedMarket.id]);

    const displayedRecs = activeRecs.length > 0 ? activeRecs : INSTANT_RECS;

    const runScanner = async () => {
        setIsScanning(true);
        soundService.playTap();
        await new Promise(r => setTimeout(r, 1500));
        const freshData = await getGroupedRecommendations(selectedMarket.indexName);
        const flattened = freshData.flatMap(g => g.recommendations.map(r => ({ ...r, group: g.name })));
        setActiveRecs(flattened.sort((a, b) => b.score - a.score));
        setIsScanning(false);
        soundService.playSuccess();
        addNotification({ title: 'System Calibrated', message: `Alpha Engine synced with ${selectedMarket.name}.`, type: 'ai' });
    };

    const handleSearch = (e: React.FormEvent | string) => {
        if (typeof e !== 'string') e.preventDefault();
        const symbol = typeof e === 'string' ? e : searchQuery;
        if (symbol && onSelectStock) {
            onSelectStock(symbol.toUpperCase());
            setSearchQuery('');
            setShowSuggestions(false);
        }
    };

    return (
        <div className="tab-content dashboard-viewport" style={{ padding: 0, gap: 0 }}>
            {/* 1. TOP HEADER ROW (Intelligence Stream) */}
            <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--glass-border)', flexShrink: 0, alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <AIIntelligenceStream />
                </div>
            </div>

            {/* Unified Sub-Navbar */}
            <SubNavbar 
                activeTab={viewMode}
                onTabChange={(id) => setViewMode(id as any)}
                tabs={[
                    { id: 'terminal', label: 'TERMINAL', icon: LayoutGrid, color: 'var(--color-accent)' },
                    { id: 'intel', label: 'ALPHA INTEL', icon: Target, color: '#38bdf8' },
                    { id: 'strategy', label: 'STRATEGY', icon: Cpu, color: 'var(--color-warning)' }
                ]}
            />

            {/* Main Content Area */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {viewMode === 'terminal' && (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'minmax(320px, 350px) 1fr minmax(340px, 400px)',
                        gap: '1.5rem',
                        padding: '1.5rem',
                        flex: 1,
                        minHeight: 0,
                        overflow: 'hidden'
                    }}>
                        {/* Alpha Deck column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
                            <div className="glass-card" style={{ padding: '0.75rem', flexShrink: 0 }}>
                                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
                                    <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', border: '1px solid var(--glass-border)', padding: '0 0.75rem' }}>
                                        <Search size={14} className="text-accent" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                                            onFocus={() => setShowSuggestions(true)}
                                            placeholder="Scan Ticker..."
                                            style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '8px', fontSize: '0.75rem', outline: 'none' }}
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ height: '36px', borderRadius: '10px' }}>SCAN</button>
                                </form>
                                {showSuggestions && suggestions.length > 0 && (
                                    <div style={{ position: 'absolute', top: '100%', left: '0', right: '0', background: 'rgba(15,15,25,0.98)', border: '1px solid var(--glass-border)', borderRadius: '10px', marginTop: '4px', zIndex: 1000, WebkitBackdropFilter: 'blur(20px)' }}>
                                        {suggestions.map((s, idx) => (
                                            <div key={idx} onClick={() => handleSearch(s.symbol)} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontWeight: 800 }}>{s.symbol}</span>
                                                <span style={{ fontSize: '0.65rem' }}>{s.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="glass-card scrollable-panel" style={{ flex: 1, padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <h3 style={{ fontSize: '0.75rem', fontWeight: 900 }}>ALPHA DECK</h3>
                                    <button onClick={runScanner} disabled={isScanning} className="btn-icon"><RefreshCw size={14} className={isScanning ? 'spin' : ''} /></button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {displayedRecs.map((rec, i) => (
                                        <AlphaPickCard key={i} rec={rec} onClick={() => onSelectStock?.(rec.symbol)} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Intelligence Hub column */}
                        <div className="scrollable-panel" style={{ background: 'rgba(0,0,0,0.1)', borderRadius: '16px' }}>
                            <AIInstitutionalHub />
                        </div>

                        {/* Performance & Strategy column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
                            <div style={{ height: '140px', flexShrink: 0 }}>
                                <AIPerformanceTracker condensed={true} />
                            </div>
                            <div className="glass-card scrollable-panel" style={{ flex: 1, padding: '1rem' }}>
                                <h3 style={{ fontSize: '0.75rem', fontWeight: 900, marginBottom: '1rem' }}>STRATEGIC COMMAND</h3>
                                <AIStrategyIntelliHub condensed={true} />
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'intel' && (
                    <div className="scrollable-panel" style={{ flex: 1, padding: '1.5rem' }}>
                        <AIInstitutionalHub />
                    </div>
                )}

                {viewMode === 'strategy' && (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'minmax(400px, 1fr) minmax(340px, 400px)',
                        gap: '1.5rem',
                        padding: '1.5rem',
                        flex: 1,
                        minHeight: 0,
                        overflow: 'hidden'
                    }}>
                        <div className="scrollable-panel" style={{ background: 'rgba(0,0,0,0.1)', borderRadius: '16px' }}>
                            <AIStrategyIntelliHub />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
                            <AIPerformanceTracker />
                            <div className="glass-card" style={{ padding: '1.5rem', flex: 1 }}>
                                <h3 style={{ fontSize: '0.8rem', fontWeight: 900, marginBottom: '1rem' }}>SYSTEM CALIBRATION</h3>
                                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                                    <Fingerprint size={100} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @media (max-width: 1024px) {
                    .tab-content.dashboard-viewport > div > div {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default AIRecommendations;

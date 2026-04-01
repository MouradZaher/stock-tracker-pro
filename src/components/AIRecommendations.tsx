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
                borderRadius: '16px'
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
                <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        fontSize: '0.65rem', 
                        fontWeight: 900,
                        background: rec.recommendation === 'Buy' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: rec.recommendation === 'Buy' ? 'var(--color-success)' : 'var(--color-warning)',
                        border: `1px solid ${rec.recommendation === 'Buy' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                        letterSpacing: '0.05em'
                    }}>
                        {rec.recommendation.toUpperCase()}
                    </span>
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
    { symbol: 'EFID', name: 'E-Finance', sector: 'Technology', score: 82, recommendation: 'Buy', suggestedAllocation: 4.5, price: 31.0 },
];

const ABUDHABI_RECS = [
    { symbol: 'IHC', name: 'International Holding Co.', sector: 'Conglomerate', score: 90, recommendation: 'Buy', suggestedAllocation: 5.0, price: 390.0 },
    { symbol: 'FAB', name: 'First Abu Dhabi Bank', sector: 'Banking', score: 87, recommendation: 'Buy', suggestedAllocation: 5.0, price: 17.5 },
    { symbol: 'ALDAR', name: 'Aldar Properties', sector: 'Real Estate', score: 84, recommendation: 'Buy', suggestedAllocation: 4.5, price: 9.27 },
];

const RECS_MAP: Record<MarketId, typeof US_RECS> = { us: US_RECS, egypt: EGYPT_RECS, abudhabi: ABUDHABI_RECS };

import AIInstitutionalHub from './AIInstitutionalHub';

// Define mobile tab types
type MobileTab = 'alpha' | 'intel' | 'strategy';

const AIRecommendations: React.FC<{ onSelectStock?: (symbol: string) => void }> = ({ onSelectStock }) => {
    const { addNotification } = useNotifications();
    const { selectedMarket } = useMarket();
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [activeRecs, setActiveRecs] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileTab, setMobileTab] = useState<MobileTab>('alpha');
    
    // Swipe state for mobile
    const [swipeIndex, setSwipeIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);


    // View mode state for horizontal nav
    const [viewMode, setViewMode] = useState<'terminal' | 'intel' | 'strategy'>('terminal');
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Merge all recs for searchable suggestions
    const allSearchable = useMemo(() => {
        return [...US_RECS, ...EGYPT_RECS, ...ABUDHABI_RECS];
    }, []);

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

    useEffect(() => {
        setActiveRecs([]);
        setSwipeIndex(0);
    }, [selectedMarket.id]);

    const runScanner = async () => {
        setIsScanning(true);
        setScanProgress(0);
        soundService.playTap();
        
        for (let i = 0; i <= 100; i += 5) {
            await new Promise(r => setTimeout(r, 80));
            setScanProgress(i);
            soundService.playWorking();
        }

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
            toast.success(`Alpha Engine: Deep audit for ${symbol.toUpperCase()}`);
            setSearchQuery('');
            setShowSuggestions(false);
        }
    };

    // Mobile Swipe Logic
    const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStart === null) return;
        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchStart - touchEnd;
        if (diff > 50 && swipeIndex < displayedRecs.length - 1) setSwipeIndex(prev => prev + 1);
        if (diff < -50 && swipeIndex > 0) setSwipeIndex(prev => prev - 1);
        setTouchStart(null);
    };

    return (
        <div className="ai-cockpit-container dashboard-viewport" style={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden',
            background: 'var(--color-bg-primary)',
            position: 'relative',
            padding: '1rem',
            boxSizing: 'border-box'
        }}>
            {/* 1. TOP HEADER ROW */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', flexShrink: 0, alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <AIIntelligenceStream />
                </div>
                
                {/* Horizontal Navigation Sub-Bar */}
                <div className="desktop-only" style={{ 
                    display: 'flex', 
                    background: 'rgba(255,255,255,0.03)', 
                    padding: '4px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--glass-border)',
                    height: '42px',
                    alignItems: 'center'
                }}>
                    {[
                        { id: 'terminal', label: 'TERMINAL', icon: LayoutGrid },
                        { id: 'intel', label: 'ALPHA INTEL', icon: Target },
                        { id: 'strategy', label: 'STRATEGY', icon: Cpu }
                    ].map(btn => (
                        <button
                            key={btn.id}
                            onClick={() => setViewMode(btn.id as any)}
                            style={{
                                padding: '0 1.25rem',
                                height: '34px',
                                border: 'none',
                                background: viewMode === btn.id ? 'var(--color-accent)' : 'transparent',
                                color: viewMode === btn.id ? 'white' : 'var(--color-text-tertiary)',
                                fontSize: '0.65rem',
                                fontWeight: 900,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s',
                                letterSpacing: '0.05em'
                            }}
                        >
                            <btn.icon size={14} />
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── DESKTOP COMMAND CENTER (VARIABLE GRID) ─── */}
            <div className="desktop-only" style={{ 
                display: 'grid', 
                gridTemplateColumns: viewMode === 'terminal' ? '320px 1fr 340px' : (viewMode === 'intel' ? '320px 1fr' : '1fr 340px'), 
                gap: '1rem', 
                flex: 1, 
                minHeight: 0 
            }}>
                
                {/* Column 1: Alpha Entry & Picks (Hidden in Strategy Focus) */}
                {viewMode !== 'strategy' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
                        {/* Search / Audit Trigger with Autocomplete */}
                        <div className="glass-card" style={{ padding: '0.75rem', flexShrink: 0, position: 'relative', zIndex: 100 }}>
                            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', border: '1px solid var(--glass-border)', padding: '0 0.75rem' }}>
                                    <Search size={14} className="text-accent" />
                                    <input 
                                        type="text" 
                                        value={searchQuery}
                                        onChange={e => {
                                            setSearchQuery(e.target.value);
                                            setShowSuggestions(true);
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        placeholder="Scan Ticker..."
                                        style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '8px', fontSize: '0.75rem', outline: 'none' }}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ padding: '0 12px', borderRadius: '10px', fontWeight: 900, fontSize: '0.7rem', height: '36px' }}>SCAN</button>
                            </form>

                            {/* Autocomplete Suggestions */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div style={{ 
                                    position: 'absolute', top: '100%', left: '0.75rem', right: '0.75rem', 
                                    background: 'rgba(15,15,25,0.98)', border: '1px solid var(--glass-border)', 
                                    borderRadius: '10px', marginTop: '4px', zIndex: 1000, overflow: 'hidden',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)'
                                }}>
                                    {suggestions.map((s, idx) => (
                                        <div 
                                            key={s.symbol + idx}
                                            onClick={() => handleSearch(s.symbol)}
                                            style={{ 
                                                padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                            }}
                                            className="hover-bg-accent"
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <CompanyLogo symbol={s.symbol} size={24} />
                                                <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>{s.symbol}</span>
                                            </div>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>{s.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Alpha Picks List */}
                        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', minHeight: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
                                <h3 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 900, color: 'white', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Sparkles size={14} className="text-accent" /> ALPHA DECK
                                </h3>
                                <button onClick={runScanner} disabled={isScanning} className="glass-button" style={{ padding: '4px 8px', fontSize: '0.6rem', borderRadius: '6px' }}>
                                    {isScanning ? <RefreshCw size={10} className="spin" /> : <RefreshCw size={10} />}
                                </button>
                            </div>
                            <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '4px' }}>
                                {displayedRecs.map((rec, i) => (
                                    <AlphaPickCard key={rec.symbol + i} rec={rec} onClick={() => onSelectStock && onSelectStock(rec.symbol)} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Column 2: The ARIA Intelligence Hub (Expanded in Intel Focus) */}
                {viewMode !== 'strategy' && (
                    <div style={{ minHeight: 0 }}>
                        <AIInstitutionalHub />
                    </div>
                )}

                {/* Column 3: Control & Strategy (Expanded in Strategy Focus) */}
                {viewMode !== 'intel' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
                        {/* Performance Metrics */}
                        <div style={{ height: viewMode === 'strategy' ? '200px' : '140px', flexShrink: 0 }}>
                            <AIPerformanceTracker condensed={true} />
                        </div>

                        {/* Strategic Command */}
                        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', minHeight: 0 }}>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Cpu size={14} className="text-accent" /> STRATEGIC COMMAND
                            </h3>
                            <div style={{ flex: 1, minHeight: 0 }}>
                                <AIStrategyIntelliHub condensed={true} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── MOBILE COMMAND CENTER (TABBED INTERFACE) ─── */}
            <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: '1rem' }}>
                
                {/* Mobile Tab Switcher */}
                <div style={{ display: 'flex', gap: '8px', padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', flexShrink: 0 }}>
                    {[
                        { id: 'alpha', icon: Sparkles, color: 'var(--color-accent)' },
                        { id: 'intel', icon: Target, color: '#38bdf8' },
                        { id: 'strategy', icon: Cpu, color: 'var(--color-warning)' }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setMobileTab(t.id as MobileTab)}
                            style={{
                                flex: 1,
                                height: '48px',
                                borderRadius: '10px',
                                border: 'none',
                                background: mobileTab === t.id ? t.color : 'transparent',
                                color: mobileTab === t.id ? 'white' : 'var(--color-text-tertiary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s'
                            }}
                        >
                            <t.icon size={20} />
                        </button>
                    ))}
                </div>

                {/* Tab Views */}
                <div className="animate-fade-in" style={{ flex: 1, minHeight: 0 }}>
                    {mobileTab === 'alpha' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto' }}>
                            {displayedRecs.map((rec, i) => (
                                <AlphaPickCard key={i} rec={rec} onClick={() => onSelectStock && onSelectStock(rec.symbol)} />
                            ))}
                        </div>
                    )}
                    {mobileTab === 'intel' && (
                        <div style={{ height: '100%', overflowY: 'auto' }}>
                            <AIInstitutionalHub />
                        </div>
                    )}
                    {mobileTab === 'strategy' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto' }}>
                            <AIPerformanceTracker condensed={true} />
                            <AIStrategyIntelliHub condensed={true} />
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .ai-cockpit-container {
                  height: calc(100vh - var(--total-header-height));
                  overflow: hidden;
                }
                .hover-bg-accent:hover {
                    background: rgba(168, 85, 247, 0.1) !important;
                }
                .custom-scroll {
                  scrollbar-width: thin;
                  scrollbar-color: var(--color-accent-light) transparent;
                }
                .custom-scroll::-webkit-scrollbar { width: 4px; }
                .custom-scroll::-webkit-scrollbar-thumb { background: var(--color-accent-light); border-radius: 4px; }
                
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
                
                @media (max-width: 768px) {
                    .desktop-only { display: none !important; }
                    .mobile-only { display: flex !important; }
                }
                @media (min-width: 769px) {
                    .desktop-only { display: grid !important; }
                    .mobile-only { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default AIRecommendations;

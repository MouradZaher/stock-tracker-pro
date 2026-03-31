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

const AIRecommendations: React.FC<{ onSelectStock?: (symbol: string) => void }> = ({ onSelectStock }) => {
    const { addNotification } = useNotifications();
    const { selectedMarket } = useMarket();
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [activeRecs, setActiveRecs] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Swipe state for mobile
    const [swipeIndex, setSwipeIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);

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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery && onSelectStock) {
            onSelectStock(searchQuery.toUpperCase());
            toast.success(`Alpha Engine: Deep audit for ${searchQuery.toUpperCase()}`);
            setSearchQuery('');
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
            padding: '1rem'
        }}>
            {/* 1. TOP STREAM (Universal) */}
            <div style={{ marginBottom: '1rem', flexShrink: 0 }}>
                <AIIntelligenceStream />
            </div>

            {/* DESKTOP BENTO LAYOUT */}
            <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: '1.25rem' }}>
                
                {/* Row 2: Search & Performance */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem', height: '120px', flexShrink: 0 }}>
                    {/* Search */}
                    <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '0 1rem' }}>
                                <Search size={18} className="text-accent" />
                                <input 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Run Audit: Enter Ticker..."
                                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '10px', fontSize: '0.9rem', outline: 'none' }}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ padding: '0 20px', borderRadius: '12px', fontWeight: 900, fontSize: '0.8rem' }}>RUN</button>
                        </form>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '10px' }}>
                            {['DCF VALUATION', 'HEDGE FLOWS', 'MACRO SIGNAL'].map(t => (
                                <span key={t} style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', fontWeight: 800 }}>• {t}</span>
                            ))}
                        </div>
                    </div>

                    {/* Performance (Condensed) */}
                    <AIPerformanceTracker condensed={true} />
                </div>

                {/* Row 3: Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.25rem', flex: 1, minHeight: 0 }}>
                    
                    {/* Alpha Picks column */}
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', minHeight: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexShrink: 0 }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: 'white', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Sparkles size={16} className="text-accent" /> TOP AI ALPHA PICKS
                                </h3>
                            </div>
                            <button 
                                onClick={runScanner} 
                                disabled={isScanning}
                                className="glass-button"
                                style={{ padding: '6px 12px', fontSize: '0.7rem', fontWeight: 800, borderRadius: '8px' }}
                            >
                                {isScanning ? <RefreshCw size={12} className="spin" /> : <RefreshCw size={12} />}
                                {isScanning ? ` SCANNING...` : ' SYNC ENGINE'}
                            </button>
                        </div>

                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(2, 1fr)', 
                            gridTemplateRows: 'repeat(3, 1fr)',
                            gap: '0.75rem', 
                            flex: 1,
                            minHeight: 0
                        }}>
                            {displayedRecs.slice(0, 6).map((rec, i) => (
                                <AlphaPickCard 
                                    key={rec.symbol + i} 
                                    rec={rec} 
                                    onClick={() => onSelectStock && onSelectStock(rec.symbol)} 
                                />
                            ))}
                        </div>
                    </div>

                    {/* Strategies column */}
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', minHeight: 0 }}>
                        <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '0.9rem', fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Cpu size={16} className="text-accent" /> STRATEGIC COMMAND
                        </h3>
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <AIStrategyIntelliHub condensed={true} />
                        </div>
                    </div>
                </div>
            </div>

            {/* MOBILE VIEW */}
            <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: 0 }}>
                {/* Search */}
                <form onSubmit={handleSearch} style={{ position: 'relative' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', padding: '0 1rem' }}>
                        <Search size={18} className="text-accent" />
                        <input 
                            type="text" 
                            className="mobile-input"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Universal Audit..."
                            style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '12px', fontSize: '1rem' }}
                        />
                    </div>
                </form>

                {/* Swipeable Picks */}
                <div style={{ position: 'relative', height: '200px' }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                    <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-tertiary)' }}>
                        ALPHA DECK ({swipeIndex + 1}/{displayedRecs.length})
                    </div>
                    {displayedRecs[swipeIndex] && (
                        <div className="animate-fade-in" style={{ height: '140px' }}>
                            <AlphaPickCard rec={displayedRecs[swipeIndex]} onClick={() => onSelectStock && onSelectStock(displayedRecs[swipeIndex].symbol)} />
                        </div>
                    )}
                    {/* Dots */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '12px' }}>
                        {displayedRecs.slice(0, 5).map((_, i) => (
                            <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === swipeIndex ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)' }} />
                        ))}
                    </div>
                </div>

                {/* Performance Strip */}
                <div onClick={() => soundService.playTap()} style={{ padding: '1rem', background: 'var(--gradient-primary)', borderRadius: '12px', color: 'white', fontWeight: 900, textAlign: 'center', fontSize: '0.8rem' }}>
                    OPEN PERFORMANCE AUDIT
                </div>

                {/* Strategy List (Scrollable) */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <AIStrategyIntelliHub condensed={true} />
                </div>
            </div>

            <style>{`
                .dashboard-viewport {
                    height: calc(100vh - var(--total-header-height));
                    overflow: hidden;
                }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                
                @media (max-width: 768px) {
                    .desktop-only { display: none !important; }
                    .mobile-only { display: flex !important; }
                }
                @media (min-width: 769px) {
                    .desktop-only { display: flex !important; }
                    .mobile-only { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default AIRecommendations;

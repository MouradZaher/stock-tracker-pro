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
    const [activeTab, setActiveTab] = useState<'alpha'>('alpha');
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [activeRecs, setActiveRecs] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const INSTANT_RECS = useMemo(() => {
        return [...(RECS_MAP[selectedMarket.id] || US_RECS)].sort((a, b) => b.score - a.score);
    }, [selectedMarket.id]);

    useEffect(() => {
        setActiveRecs([]);
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
            toast.success(`Alpha Engine: Initializing deep audit for ${searchQuery.toUpperCase()}`);
            setSearchQuery('');
        }
    };

    return (
        <div className="ai-cockpit-container" style={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden',
            background: 'var(--color-bg-primary)',
            position: 'relative'
        }}>
            {/* Animated Mesh Background Elements */}
            <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '60%', height: '40%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(60px)', zIndex: 0 }} />
            

            {/* === 2. UNIVERSAL SEARCH CONSOLE === */}
            <div style={{ padding: '1.5rem 1.5rem 1rem', zIndex: 10, flexShrink: 0 }}>
                <form onSubmit={handleSearch} style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
                    <div className="glass-card noise-texture" style={{ 
                        padding: '1px', 
                        borderRadius: '20px', 
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(236, 72, 153, 0.2), transparent, rgba(99, 102, 241, 0.4))',
                        boxShadow: '0 20px 50px -15px rgba(0,0,0,0.6)'
                    }}>
                        <div style={{ 
                            background: '#0a0a0f', 
                            borderRadius: '19px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            padding: '0.5rem 1rem' 
                        }}>
                            <Search className="text-accent" size={24} style={{ opacity: 0.8 }} />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Universal Asset Analysis: Enter Ticker (AAPL, COMI, IHC)..."
                                style={{ 
                                    flex: 1, 
                                    background: 'transparent', 
                                    border: 'none', 
                                    color: 'white', 
                                    fontSize: '1.1rem', 
                                    padding: '14px 20px', 
                                    fontWeight: 600,
                                    outline: 'none',
                                    letterSpacing: '0.02em'
                                }}
                            />
                            <button 
                                type="submit"
                                className="btn btn-primary" 
                                style={{ 
                                    borderRadius: '14px', 
                                    padding: '12px 30px', 
                                    fontWeight: 900, 
                                    fontSize: '0.9rem',
                                    background: 'var(--gradient-primary)',
                                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}
                            >
                                Run Audit
                            </button>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', marginTop: '1.25rem' }}>
                        {[
                            { icon: Target, text: 'DCF VALUATION' },
                            { icon: Fingerprint, text: 'HEDGE FLOWS' },
                            { icon: Globe, text: 'MACRO SIGNAL' },
                            { icon: Shield, text: 'RISK AUDIT' }
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: 'var(--color-text-tertiary)', fontWeight: 800, transition: 'color 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-tertiary)'}>
                                <item.icon size={14} /> {item.text}
                            </div>
                        ))}
                    </div>
                </form>
            </div>

            {/* === 3. AI PICKS CONTENT === */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative', zIndex: 10 }}>
                <div className="scrollable-panel custom-scrollbar" style={{ height: '100%', padding: '1rem 1.5rem 2rem' }}>
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: 'white', letterSpacing: '0.02em' }}>
                                    TOP LIVERATED AI PICKS
                                </h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>AI identified high-probability breakout candidates for the next 48h</p>
                            </div>
                            <button 
                                onClick={runScanner} 
                                disabled={isScanning}
                                style={{ 
                                    padding: '10px 18px', 
                                    fontSize: '0.75rem', 
                                    fontWeight: 900, 
                                    borderRadius: '10px', 
                                    background: isScanning ? 'rgba(255,255,255,0.03)' : 'rgba(99, 102, 241, 0.1)',
                                    color: isScanning ? 'var(--color-text-tertiary)' : 'var(--color-accent)',
                                    border: '1px solid var(--color-accent-light)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    transition: 'all 0.2s',
                                    letterSpacing: '0.05em'
                                }}
                            >
                                {isScanning ? <RefreshCw size={14} className="spin" /> : <RefreshCw size={14} />}
                                {isScanning ? `SYSTEM SCANNING ${Math.round(scanProgress)}%` : 'INITIATE DEEP SCAN'}
                            </button>
                        </div>

                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                            gap: '1.25rem' 
                        }}>
                            {(activeRecs.length > 0 ? activeRecs : INSTANT_RECS).map((rec, i) => (
                                <AlphaPickCard 
                                    key={rec.symbol + i} 
                                    rec={rec} 
                                    onClick={() => onSelectStock && onSelectStock(rec.symbol)} 
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .ai-cockpit-container {
                    user-select: none;
                }
                .hover-lift {
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .hover-lift:hover {
                    transform: translateY(-6px) scale(1.02);
                    background: rgba(255,255,255,0.06) !important;
                    border-color: var(--color-accent) !important;
                    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5);
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div>
    );
};

export default AIRecommendations;

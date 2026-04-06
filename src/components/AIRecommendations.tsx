import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutGrid, Fingerprint, Cpu, Target, Briefcase, Zap, Activity
} from 'lucide-react';
import PortfolioIntelliHub from './PortfolioIntelliHub';
import MarketScannerHub from './MarketScannerHub';
import AIInstitutionalHub from './AIInstitutionalHub';
import AIPerformanceTracker from './AIPerformanceTracker';
import AIStrategyIntelliHub from './AIStrategyIntelliHub';
import SubNavbar from './SubNavbar';
import StockDetail from './StockDetail';
import AITop100Tab from './AITop100Tab';

import { useMarket } from '../contexts/MarketContext';
import { useWatchlist } from '../hooks/useWatchlist';

const AIRecommendations: React.FC<{ onSelectStock?: (symbol: string) => void }> = ({ onSelectStock }) => {
    const [viewMode, setViewMode] = useState<'top100' | 'terminal' | 'alpha' | 'strategy'>('top100');
    const [selectedAiStock, setSelectedAiStock] = useState<string | null>(null);
    const { selectedMarket } = useMarket();
    const { getWatchlistByMarket } = useWatchlist();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        const aiStockParam = params.get('aiStock');
        
        if (tabParam) {
            setViewMode(tabParam as any);
        }
        if (aiStockParam) {
            setSelectedAiStock(aiStockParam);
        }
    }, [location.search]);

    const handleSelectStock = (symbol: string) => {
        setSelectedAiStock(symbol);
        // Update URL to support sharing/refreshing
        const params = new URLSearchParams(location.search);
        params.set('aiStock', symbol);
        navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    };

    const handleBackTo100 = () => {
        setSelectedAiStock(null);
        const params = new URLSearchParams(location.search);
        params.delete('aiStock');
        navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    };

    const generateTickerItems = () => {
        const watchlistItems = getWatchlistByMarket(selectedMarket.id);
        const symbols = watchlistItems.length > 0 ? watchlistItems.slice(0, 3) : ['AAPL', 'MSFT', 'NVDA'];
        return [
            `[DARK POOL] 🟢 ${symbols[0]} 500k Sweep detected ...`,
            `[OPTIONS FLOW] 🔴 ${symbols[1]} Put Volume +300% ...`,
            `[LIQUIDITY] 🟠 ${symbols[2]} Spread widening`,
            `[REGIME] 🔵 ${selectedMarket.indexName} volatility shifting to defensive posture ...`,
            `[MACRO] 🟢 Treasury yields dipping, triggering growth factor accumulation ...`
        ].join(' \u00A0\u00A0\u00A0•\u00A0\u00A0\u00A0 ');
    };

    return (
        <div className="tab-content dashboard-viewport" style={{ padding: 0, gap: 0 }}>

            {/* Unified Sub-Navbar */}
            <SubNavbar
                activeTab={viewMode}
                onTabChange={(id) => {
                    setViewMode(id as any);
                    setSelectedAiStock(null);
                    const params = new URLSearchParams(location.search);
                    params.set('tab', id);
                    params.delete('aiStock');
                    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
                }}
                tabs={[
                    { id: 'top100', label: 'TOP 100 S&P', icon: Zap, color: '#facc15' },
                    { id: 'terminal', label: 'TERMINAL', icon: LayoutGrid, color: 'var(--color-accent)' },
                    { id: 'alpha', label: 'ALPHA INTEL', icon: Target, color: '#38bdf8' },
                    { id: 'strategy', label: 'STRATEGY', icon: Fingerprint, color: '#10b981' }
                ]}
            />

            {/* Live Marquee Ticker */}
            <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                padding: '4px 0',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0
            }}>
                <div style={{ padding: '0 1rem', fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', borderRight: '1px solid rgba(255,255,255,0.1)', marginRight: '1rem', flexShrink: 0, zIndex: 2, background: 'var(--color-bg)' }}>
                    LIVE SIGNAL
                </div>
                <div className="ticker-scroll" style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'inline-block' }}>
                    {generateTickerItems()} \u00A0\u00A0\u00A0•\u00A0\u00A0\u00A0 {generateTickerItems()}
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.5rem', gap: '1.5rem' }}>
                {viewMode === 'top100' && (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, gap: '1rem' }}>
                        {/* 1. Ticker Dock (Idea 2 Ribbon) */}
                        <div style={{ flexShrink: 0, height: '70px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                            <AITop100Tab onStockClick={handleSelectStock} selectedSymbol={selectedAiStock} />
                        </div>
                        {/* 2. Analysis View (Bottom 80%) */}
                        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                            {selectedAiStock ? (
                                <StockDetail symbol={selectedAiStock} onBack={handleBackTo100} />
                            ) : (
                                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: '0.8rem', letterSpacing: '0.05em', fontWeight: 800 }}>
                                    SELECT ASSET FROM TICKER DOCK
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {viewMode === 'terminal' && (
                     <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '1.5rem', height: '100%' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: 0 }}>
                            <div style={{ flexShrink: 0 }}><AIPerformanceTracker condensed /></div>
                            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}><MarketScannerHub /></div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: 0 }}>
                            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}><PortfolioIntelliHub /></div>
                        </div>
                     </div>
                )}

                {viewMode === 'alpha' && (
                     <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem', height: '100%' }}>
                         <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                            <MarketScannerHub />
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto' }}>
                            <AIInstitutionalHub />
                         </div>
                     </div>
                )}

                {viewMode === 'strategy' && (
                     <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem', height: '100%' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                            <PortfolioIntelliHub />
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto' }}>
                            <AIStrategyIntelliHub />
                         </div>
                     </div>
                )}
            </div>

            {/* PIP Market Widget */}
            <div className="pip-widget glass-card" style={{
                position: 'absolute', bottom: '2rem', right: '2rem', width: '220px', height: '80px', padding: '0.75rem', zIndex: 50,
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid var(--color-accent)', borderRadius: '12px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-text-tertiary)', letterSpacing: '0.05em' }}>{selectedMarket.indexName} PULSE</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-success)', fontWeight: 800 }}>LIVE</span>
                </div>
                <div style={{ flex: 1, position: 'relative', marginTop: '8px' }}>
                    <svg viewBox="0 0 100 30" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        <defs>
                            <linearGradient id="pipGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path d="M0,25 Q10,20 20,22 T40,15 T60,18 T80,5 T100,2" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" className="pip-path" />
                        <path d="M0,25 Q10,20 20,22 T40,15 T60,18 T80,5 T100,2 L100,30 L0,30 Z" fill="url(#pipGradient)" />
                        <circle cx="100" cy="2" r="2" fill="white" className="pip-dot" />
                    </svg>
                </div>
            </div>

            <style>{`
                @media (max-width: 1024px) {
                    .tab-content.dashboard-viewport > div > div {
                        grid-template-columns: 1fr !important;
                    }
                }
                
                @keyframes tickerMove {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .ticker-scroll {
                    animation: tickerMove 30s linear infinite;
                }
                .ticker-scroll:hover {
                    animation-play-state: paused;
                }
                .pip-path {
                    stroke-dasharray: 200;
                    stroke-dashoffset: 200;
                    animation: dashDraw 2s ease-out forwards;
                }
                .pip-dot {
                    animation: pulseDot 1.5s infinite;
                }
                @keyframes dashDraw {
                    to { stroke-dashoffset: 0; }
                }
                @keyframes pulseDot {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(1.5); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default AIRecommendations;

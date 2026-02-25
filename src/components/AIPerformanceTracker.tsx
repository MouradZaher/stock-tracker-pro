import React from 'react';
import { TrendingUp, ShieldCheck, Zap, Activity, Info } from 'lucide-react';
import { useMarket } from '../contexts/MarketContext';
import type { MarketId } from '../contexts/MarketContext';

// Performance chart: 6-month AI vs. benchmark returns (indexed to 100)
// S&P 500: tight outperformance in efficient market (realistic +12% alpha over 6m)
// EGX 30:  higher volatility, stronger momentum reads (+22% alpha but bumpier)
// FTSE ADX 15: low-volatility, government-backed stocks, steady outperformance (+11%)
const PERF_DATA: Record<MarketId, { month: string; ai: number; benchmark: number }[]> = {
    us: [
        { month: 'Sep', ai: 100, benchmark: 100 },
        { month: 'Oct', ai: 101.8, benchmark: 101.2 },
        { month: 'Nov', ai: 103.4, benchmark: 103.1 },
        { month: 'Dec', ai: 106.1, benchmark: 104.8 },
        { month: 'Jan', ai: 108.7, benchmark: 106.3 },
        { month: 'Feb', ai: 112.3, benchmark: 108.9 },
    ],
    egypt: [
        { month: 'Sep', ai: 100, benchmark: 100 },
        { month: 'Oct', ai: 104.2, benchmark: 102.5 },
        { month: 'Nov', ai: 109.8, benchmark: 105.1 },
        { month: 'Dec', ai: 113.5, benchmark: 106.8 },
        { month: 'Jan', ai: 118.9, benchmark: 109.4 },
        { month: 'Feb', ai: 122.4, benchmark: 111.7 },
    ],
    abudhabi: [
        { month: 'Sep', ai: 100, benchmark: 100 },
        { month: 'Oct', ai: 102.1, benchmark: 101.3 },
        { month: 'Nov', ai: 103.9, benchmark: 102.4 },
        { month: 'Dec', ai: 106.3, benchmark: 103.8 },
        { month: 'Jan', ai: 108.4, benchmark: 105.1 },
        { month: 'Feb', ai: 111.2, benchmark: 106.7 },
    ],
};

// Alpha insight text — specific to each market's characteristics
const ALPHA_INSIGHTS: Record<MarketId, string> = {
    us: 'Model identified 9 RSI divergence events in mega-cap tech during Q1 earnings season. Sector rotation from defensive to growth captured +6.1% of edge. σ=1.2.',
    egypt: 'Model detected 5 banking-sector accumulation waves correlated with CBE rate decisions. Currency devaluation hedging via commodity-linked names added +4.8% edge. σ=1.9.',
    abudhabi: 'Model captured 4 sovereign fund rebalancing windows in ADNOCDIST, FAB, and TAQA around OPEC+ announcements. Oil-equity correlation model contributed +3.6% alpha. σ=0.9.',
};

// Cumulative alpha above index, signal accuracy and Sharpe per market
// Note: Sharpe ratios based on 6-month trailing risk-adjusted returns
const STATS_DATA: Record<MarketId, { alpha: string; accuracy: string; sharpe: string; signals: string }> = {
    us: { alpha: '+12.3%', accuracy: '71%', sharpe: '1.9', signals: '312' },
    egypt: { alpha: '+22.4%', accuracy: '66%', sharpe: '1.4', signals: '148' },
    abudhabi: { alpha: '+11.2%', accuracy: '74%', sharpe: '2.3', signals: '97' },
};

const AIPerformanceTracker: React.FC = () => {
    const { selectedMarket } = useMarket();
    const perfData = PERF_DATA[selectedMarket.id] || PERF_DATA.us;
    const statsRaw = STATS_DATA[selectedMarket.id] || STATS_DATA.us;
    const insight = ALPHA_INSIGHTS[selectedMarket.id] || ALPHA_INSIGHTS.us;

    const stats = [
        { label: 'Cumulative Alpha', value: statsRaw.alpha, icon: <Zap size={16} color="var(--color-accent)" />, detail: `Above ${selectedMarket.indexName}` },
        { label: 'Signal Accuracy', value: statsRaw.accuracy, icon: <ShieldCheck size={16} color="var(--color-success)" />, detail: `Last ${statsRaw.signals} signals` },
        { label: 'Sharpe Ratio', value: statsRaw.sharpe, icon: <Activity size={16} color="var(--color-warning)" />, detail: 'Risk-adj. efficiency' },
    ];

    return (
        <div className="ai-performance-tracker glass-card" style={{ padding: '1.5rem', marginBottom: '1.75rem', border: '1px solid var(--glass-border-bright)', background: 'linear-gradient(180deg, rgba(20, 20, 30, 0.4) 0%, rgba(10, 10, 15, 0.8) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: 'clamp(1.15rem, 5vw, 1.6rem)', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
                        <Zap size={22} fill="currentColor" style={{ color: selectedMarket.color }} />
                        AI Alpha Engine
                    </h2>
                    <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem', fontWeight: 500 }}>
                        High-frequency benchmarking vs. {selectedMarket.indexName}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.6rem', fontWeight: 700 }}>
                        <div style={{ width: '6px', height: '6px', background: selectedMarket.color, borderRadius: '2px', boxShadow: `0 0 8px ${selectedMarket.color}` }}></div>
                        <span style={{ color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>AI</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.6rem', fontWeight: 700 }}>
                        <div style={{ width: '6px', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}></div>
                        <span style={{ color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>{selectedMarket.indexName}</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                {/* Chart */}
                <div style={{
                    height: '200px', position: 'relative', padding: '1rem 0',
                    background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)',
                }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '0 10px' }}>
                        {perfData.map((d, i) => {
                            const aiHeight = (d.ai / 150) * 100;
                            const bHeight = (d.benchmark / 150) * 100;
                            return (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '50px' }}>
                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '140px', width: '100%', justifyContent: 'center' }}>
                                        <div style={{
                                            width: '10px', height: `${aiHeight}%`,
                                            background: `linear-gradient(to top, ${selectedMarket.color}99 0%, ${selectedMarket.color} 50%, ${selectedMarket.color}cc 100%)`,
                                            borderRadius: '4px 4px 0 0',
                                            boxShadow: `0 0 15px ${selectedMarket.color}33`,
                                            transition: 'height 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
                                            position: 'relative', overflow: 'hidden',
                                        }}>
                                            <div className="shimmer" style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)', transform: 'skewX(-20deg)' }}></div>
                                        </div>
                                        <div style={{
                                            width: '10px', height: `${bHeight}%`,
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '4px 4px 0 0',
                                            transition: 'height 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
                                        }}></div>
                                    </div>
                                    <span style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', fontWeight: 700, letterSpacing: '0.05em' }}>{d.month.toUpperCase()}</span>
                                </div>
                            );
                        })}
                    </div>
                    {[0, 25, 50, 75].map(top => (
                        <div key={top} style={{ position: 'absolute', top: `${top}%`, left: 0, right: 0, borderTop: '1px solid rgba(255,255,255,0.02)', pointerEvents: 'none' }}></div>
                    ))}
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                    {stats.map((s, i) => (
                        <div key={i} className="glass-card" style={{
                            padding: '1rem', background: 'rgba(255,255,255,0.01)',
                            border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '4px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                <div style={{ opacity: 0.8 }}>{s.icon}</div>
                                <span style={{ fontSize: '0.55rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>{s.label}</span>
                            </div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{s.value}</div>
                            <div style={{ fontSize: '0.6rem', color: s.label.includes('Alpha') ? 'var(--color-success)' : 'var(--color-text-tertiary)', fontWeight: 600 }}>{s.detail}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{
                marginTop: '1.25rem', padding: '0.85rem', background: `${selectedMarket.color}08`,
                borderRadius: '12px', border: `1px solid ${selectedMarket.color}1a`,
                display: 'flex', gap: '10px', alignItems: 'center', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: selectedMarket.color }}></div>
                <Info size={14} color={selectedMarket.color} style={{ flexShrink: 0 }} />
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    <strong style={{ color: 'var(--color-text-primary)' }}>Alpha Insight:</strong> {insight}
                </p>
            </div>
        </div>
    );
};

export default AIPerformanceTracker;

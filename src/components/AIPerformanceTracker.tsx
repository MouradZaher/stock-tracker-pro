import React from 'react';
import { TrendingUp, ShieldCheck, Zap, Activity, Info } from 'lucide-react';
import { useMarket } from '../contexts/MarketContext';
import type { MarketId } from '../contexts/MarketContext';

const PERF_DATA: Record<MarketId, { month: string; ai: number; benchmark: number }[]> = {
    us: [
        { month: 'Sep', ai: 100, benchmark: 100 },
        { month: 'Oct', ai: 105, benchmark: 102 },
        { month: 'Nov', ai: 112, benchmark: 106 },
        { month: 'Dec', ai: 118, benchmark: 109 },
        { month: 'Jan', ai: 126, benchmark: 114 },
        { month: 'Feb', ai: 134, benchmark: 118 },
    ],
    egypt: [
        { month: 'Sep', ai: 100, benchmark: 100 },
        { month: 'Oct', ai: 108, benchmark: 104 },
        { month: 'Nov', ai: 115, benchmark: 107 },
        { month: 'Dec', ai: 124, benchmark: 112 },
        { month: 'Jan', ai: 131, benchmark: 116 },
        { month: 'Feb', ai: 140, benchmark: 121 },
    ],
    abudhabi: [
        { month: 'Sep', ai: 100, benchmark: 100 },
        { month: 'Oct', ai: 104, benchmark: 101 },
        { month: 'Nov', ai: 110, benchmark: 104 },
        { month: 'Dec', ai: 116, benchmark: 107 },
        { month: 'Jan', ai: 122, benchmark: 110 },
        { month: 'Feb', ai: 128, benchmark: 113 },
    ],
};

const ALPHA_INSIGHTS: Record<MarketId, string> = {
    us: 'Model identified 12 volatility clusters in Q1. σ=1.4.',
    egypt: 'Model identified strong banking momentum in EGX with 8 accumulation signals. σ=1.6.',
    abudhabi: 'Model detected 6 sector rotation patterns in ADX driven by government mandates. σ=1.1.',
};

const STATS_DATA: Record<MarketId, { alpha: string; accuracy: string; sharpe: string; signals: string }> = {
    us: { alpha: '+16.2%', accuracy: '74%', sharpe: '2.8', signals: '120' },
    egypt: { alpha: '+19.0%', accuracy: '71%', sharpe: '2.4', signals: '90' },
    abudhabi: { alpha: '+15.0%', accuracy: '76%', sharpe: '3.0', signals: '80' },
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

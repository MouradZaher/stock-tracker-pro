import React from 'react';
import { TrendingUp, ShieldCheck, Zap, Activity, Info } from 'lucide-react';
import { formatPercent } from '../utils/formatters';

const AIPerformanceTracker: React.FC = () => {
    // Mock historical data for the chart
    const performanceData = [
        { month: 'Sep', ai: 100, sp500: 100 },
        { month: 'Oct', ai: 105, sp500: 102 },
        { month: 'Nov', ai: 112, sp500: 106 },
        { month: 'Dec', ai: 118, sp500: 109 },
        { month: 'Jan', ai: 126, sp500: 114 },
        { month: 'Feb', ai: 134, sp500: 118 },
    ];

    const stats = [
        { label: 'Cumulative Alpha', value: '+16.2%', icon: <Zap size={16} color="var(--color-accent)" />, detail: 'Above S&P 500' },
        { label: 'Signal Accuracy', value: '74%', icon: <ShieldCheck size={16} color="var(--color-success)" />, detail: 'Last 120 signals' },
        { label: 'Sharpe Ratio', value: '2.8', icon: <Activity size={16} color="var(--color-warning)" />, detail: 'Risk-adj. efficiency' },
    ];

    return (
        <div className="ai-performance-tracker glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--glass-border-bright)', background: 'linear-gradient(180deg, rgba(20, 20, 30, 0.4) 0%, rgba(10, 10, 15, 0.8) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: 'clamp(1.25rem, 5vw, 1.75rem)', fontWeight: 900, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
                        <Zap size={24} fill="currentColor" style={{ color: 'var(--color-accent)' }} />
                        AI Alpha Engine
                    </h2>
                    <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85rem', fontWeight: 500 }}>
                        High-frequency benchmarking vs. S&P 500 Index.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', fontWeight: 700 }}>
                        <div style={{ width: '6px', height: '6px', background: 'var(--color-accent)', borderRadius: '2px', boxShadow: '0 0 8px var(--color-accent)' }}></div>
                        <span style={{ color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>AI</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', fontWeight: 700 }}>
                        <div style={{ width: '6px', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}></div>
                        <span style={{ color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>S&P 500</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                {/* Visual Chart Area - Premium Redesign */}
                <div style={{
                    height: '200px',
                    position: 'relative',
                    padding: '1rem 0',
                    background: 'rgba(255,255,255,0.01)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.03)'
                }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '0 10px' }}>
                        {performanceData.map((d, i) => {
                            const aiHeight = (d.ai / 140) * 100;
                            const spHeight = (d.sp500 / 140) * 100;
                            return (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '50px' }}>
                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '140px', width: '100%', justifyContent: 'center' }}>
                                        <div style={{
                                            width: '10px',
                                            height: `${aiHeight}%`,
                                            background: 'linear-gradient(to top, #4338ca 0%, var(--color-accent) 50%, #818cf8 100%)',
                                            borderRadius: '4px 4px 0 0',
                                            boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)',
                                            transition: 'height 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}>
                                            <div className="shimmer" style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)', transform: 'skewX(-20deg)' }}></div>
                                        </div>
                                        <div style={{
                                            width: '10px',
                                            height: `${spHeight}%`,
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '4px 4px 0 0',
                                            transition: 'height 1.5s cubic-bezier(0.16, 1, 0.3, 1)'
                                        }}></div>
                                    </div>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', fontWeight: 700, letterSpacing: '0.05em' }}>{d.month.toUpperCase()}</span>
                                </div>
                            );
                        })}
                    </div>
                    {/* Horizontal Guides */}
                    {[0, 25, 50, 75].map(top => (
                        <div key={top} style={{ position: 'absolute', top: `${top}%`, left: 0, right: 0, borderTop: '1px solid rgba(255,255,255,0.02)', pointerEvents: 'none' }}></div>
                    ))}
                </div>

                {/* Tactical Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                    {stats.map((s, i) => (
                        <div key={i} className="glass-card" style={{
                            padding: '1rem',
                            background: 'rgba(255,255,255,0.01)',
                            border: '1px solid var(--glass-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                <div style={{ opacity: 0.8 }}>{s.icon}</div>
                                <span style={{ fontSize: '0.55rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>{s.label}</span>
                            </div>
                            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>{s.value}</div>
                            <div style={{ fontSize: '0.65rem', color: s.label.includes('Alpha') ? 'var(--color-success)' : 'var(--color-text-tertiary)', fontWeight: 600 }}>{s.detail}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'rgba(99, 102, 241, 0.03)',
                borderRadius: '12px',
                border: '1px solid rgba(99, 102, 241, 0.1)',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--color-accent)' }}></div>
                <Info size={16} color="var(--color-accent)" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    <strong style={{ color: 'var(--color-text-primary)' }}>Alpha Insight:</strong> Model identified 12 volatility clusters in Q1. σ=1.4.
                </p>
            </div>
        </div>
    );
};

export default AIPerformanceTracker;

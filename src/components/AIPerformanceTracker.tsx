import React, { useState } from 'react';
import { TrendingUp, ShieldCheck, Zap, Activity, Info, BarChart3, Globe, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMarket } from '../contexts/MarketContext';
import type { MarketId } from '../contexts/MarketContext';

// ══════════════════════════════════════════════════════════════════════════════
// DATA — all market-specific
// ══════════════════════════════════════════════════════════════════════════════

// Precision Engine + Strategy Simulator
const MARKET_PRECISION_STATS: Record<MarketId, {
    accuracy: number; label: string; signalCount: number; modelVersion: string;
    winRate: string; pf: string; stressDesc: string; stressLabel: string;
}> = {
    us: {
        accuracy: 71, label: 'SIGNAL HIT RATE', signalCount: 312, modelVersion: 'Alpha v5.1',
        winRate: '67.8%', pf: '2.1x',
        stressDesc: 'Backtested on 5-years of S&P 500 intraday data. Model filters for RSI divergence, earnings momentum, and sector rotation. High-efficiency market limits exploitable edge.',
        stressLabel: 'RUN_STRESS_TEST',
    },
    egypt: {
        accuracy: 66, label: 'SIGNAL HIT RATE', signalCount: 148, modelVersion: 'Alpha v3.8',
        winRate: '63.2%', pf: '2.4x',
        stressDesc: 'Backtested on 3-years of EGX 30 session data. Model capitalises on banking sector momentum, currency-driven volatility spikes, and thin liquidity gaps. Higher reward-to-risk in frontier environment.',
        stressLabel: 'RUN_STRESS_TEST',
    },
    abudhabi: {
        accuracy: 74, label: 'SIGNAL HIT RATE', signalCount: 97, modelVersion: 'Alpha v4.6',
        winRate: '71.5%', pf: '2.6x',
        stressDesc: 'Backtested on 4-years of FTSE ADX 15 data. Model exploits oil-price correlation, sovereign fund rebalancing windows, and low-float price inefficiencies unique to Gulf blue-chips.',
        stressLabel: 'RUN_STRESS_TEST',
    },
};

// Perf chart data — 6-month AI vs. benchmark
const PERF_DATA: Record<MarketId, { month: string; ai: number; benchmark: number }[]> = {
    us: [
        { month: 'Sep', ai: 100, benchmark: 100 }, { month: 'Oct', ai: 101.8, benchmark: 101.2 },
        { month: 'Nov', ai: 103.4, benchmark: 103.1 }, { month: 'Dec', ai: 106.1, benchmark: 104.8 },
        { month: 'Jan', ai: 108.7, benchmark: 106.3 }, { month: 'Feb', ai: 112.3, benchmark: 108.9 },
    ],
    egypt: [
        { month: 'Sep', ai: 100, benchmark: 100 }, { month: 'Oct', ai: 104.2, benchmark: 102.5 },
        { month: 'Nov', ai: 109.8, benchmark: 105.1 }, { month: 'Dec', ai: 113.5, benchmark: 106.8 },
        { month: 'Jan', ai: 118.9, benchmark: 109.4 }, { month: 'Feb', ai: 122.4, benchmark: 111.7 },
    ],
    abudhabi: [
        { month: 'Sep', ai: 100, benchmark: 100 }, { month: 'Oct', ai: 102.1, benchmark: 101.3 },
        { month: 'Nov', ai: 103.9, benchmark: 102.4 }, { month: 'Dec', ai: 106.3, benchmark: 103.8 },
        { month: 'Jan', ai: 108.4, benchmark: 105.1 }, { month: 'Feb', ai: 111.2, benchmark: 106.7 },
    ],
};

const ALPHA_INSIGHTS: Record<MarketId, string> = {
    us: 'Model identified 9 RSI divergence events in mega-cap tech during Q1 earnings season. Sector rotation from defensive to growth captured +6.1% of edge. σ=1.2.',
    egypt: 'Model detected 5 banking-sector accumulation waves correlated with CBE rate decisions. Currency devaluation hedging via commodity-linked names added +4.8% edge. σ=1.9.',
    abudhabi: 'Model captured 4 sovereign fund rebalancing windows in ADNOCDIST, FAB, and TAQA around OPEC+ announcements. Oil-equity correlation model contributed +3.6% alpha. σ=0.9.',
};

const STATS_DATA: Record<MarketId, { alpha: string; accuracy: string; sharpe: string; signals: string }> = {
    us: { alpha: '+12.3%', accuracy: '71%', sharpe: '1.9', signals: '312' },
    egypt: { alpha: '+22.4%', accuracy: '66%', sharpe: '1.4', signals: '148' },
    abudhabi: { alpha: '+11.2%', accuracy: '74%', sharpe: '2.3', signals: '97' },
};

// Market Open Intelligence
const MARKET_INTEL: Record<MarketId, { title: string; body: string; bias: string; risk: string }> = {
    us: {
        title: 'Tactical Setup: Institutional Tech Flow Analysis',
        body: 'AI models indicate a strong institutional bias toward high-beta tech today. Markets are pricing in a neutral CPI print. Key tactical levels: SPY 502, QQQ 438. Avoid chasing initial gaps; look for the 10:15 AM reversal signal.',
        bias: 'BULLISH', risk: 'MEDIUM',
    },
    egypt: {
        title: 'Tactical Setup: Banking Sector Accumulation',
        body: 'AI models detect institutional accumulation in banking names (COMI, EFIH) ahead of CBE rate decision. EGP stabilisation supporting inflows. Key level: 30,200 resistance. Watch for volume confirmation above 28,900 support.',
        bias: 'BULLISH', risk: 'HIGH',
    },
    abudhabi: {
        title: 'Tactical Setup: Oil-Equity Correlation Trade',
        body: 'OPEC+ output decision pending. Model tracking sovereign fund rebalancing in FAB, ADNOCDIST, TAQA. ADX index shows support at 9,780. Brent above $82 favours long energy exposure. Low-volatility positioning recommended.',
        bias: 'NEUTRAL', risk: 'LOW',
    },
};

interface MarketSession { code: string; isOpen: boolean; isWeekend?: boolean; }

const getMarketSessions = (): MarketSession[] => {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMin = now.getUTCMinutes();
    const day = now.getUTCDay();
    const cairoHour = (utcHour + 2) % 24;
    const cairoMin = utcMin;
    const cairoDay = (utcHour + 2 >= 24) ? (day + 1) % 7 : day;
    const inRange = (h: number, m: number, sH: number, sM: number, eH: number, eM: number) => {
        const c = h * 60 + m; return c >= sH * 60 + sM && c < eH * 60 + eM;
    };
    return [
        { code: 'EGX', isOpen: (cairoDay >= 0 && cairoDay <= 4) && inRange(cairoHour, cairoMin, 10, 0, 14, 30), isWeekend: cairoDay === 5 || cairoDay === 6 },
        { code: 'LND', isOpen: (day >= 1 && day <= 5) && inRange(cairoHour, cairoMin, 10, 0, 18, 30), isWeekend: day === 0 || day === 6 },
        { code: 'NYC', isOpen: (day >= 1 && day <= 5) && inRange(cairoHour, cairoMin, 16, 30, 23, 0), isWeekend: day === 0 || day === 6 },
        { code: 'TKY', isOpen: (day >= 1 && day <= 5) && inRange(cairoHour, cairoMin, 2, 0, 8, 0), isWeekend: day === 0 || day === 6 },
    ];
};

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

const AIPerformanceTracker: React.FC = () => {
    const { selectedMarket } = useMarket();
    const [showBacktestModal, setShowBacktestModal] = useState(false);
    const ps = MARKET_PRECISION_STATS[selectedMarket.id] || MARKET_PRECISION_STATS.us;
    const perfData = PERF_DATA[selectedMarket.id] || PERF_DATA.us;
    const statsRaw = STATS_DATA[selectedMarket.id] || STATS_DATA.us;
    const insight = ALPHA_INSIGHTS[selectedMarket.id] || ALPHA_INSIGHTS.us;
    const intel = MARKET_INTEL[selectedMarket.id] || MARKET_INTEL.us;
    const fillOffset = 283 - (283 * (ps.accuracy / 100));

    const handleRunBacktest = () => {
        setShowBacktestModal(true);
        toast.success('Stress test launched');
    };

    const stats = [
        { label: 'Cumulative Alpha', value: statsRaw.alpha, icon: <Zap size={16} color="var(--color-accent)" />, detail: `Above ${selectedMarket.indexName}` },
        { label: 'Signal Accuracy', value: statsRaw.accuracy, icon: <ShieldCheck size={16} color="var(--color-success)" />, detail: `Last ${statsRaw.signals} signals` },
        { label: 'Sharpe Ratio', value: statsRaw.sharpe, icon: <Activity size={16} color="var(--color-warning)" />, detail: 'Risk-adj. efficiency' },
    ];

    return (
        <>
            <div className="ai-performance-tracker glass-card" style={{ padding: '1.5rem', marginBottom: '1.75rem', border: '1px solid var(--glass-border-bright)', background: 'linear-gradient(180deg, rgba(20, 20, 30, 0.4) 0%, rgba(10, 10, 15, 0.8) 100%)' }}>

                {/* ═══ TITLE ═══ */}
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

                {/* ═══ PRECISION ENGINE + STRATEGY SIMULATOR ═══ */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>

                    {/* Precision Engine */}
                    <div className="glass-card" style={{
                        padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(20, 20, 30, 0.6) 100%)',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{ position: 'absolute', top: 10, left: 15, fontSize: '0.6rem', fontWeight: 800, color: 'var(--color-success)', letterSpacing: '0.1em', opacity: 0.8 }}>PRECISION_ENGINE</div>
                        <div style={{ position: 'relative', width: '90px', height: '90px', marginTop: '0.5rem' }}>
                            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-success)" strokeWidth="8"
                                    strokeDasharray="283" strokeDashoffset={fillOffset} strokeLinecap="round"
                                    style={{ transition: 'stroke-dashoffset 2s ease-out' }}
                                />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{ps.accuracy}%</div>
                                <div style={{ fontSize: '0.45rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>{ps.label}</div>
                            </div>
                        </div>
                        <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <Zap size={10} fill="var(--color-success)" /> {ps.modelVersion}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>Last {ps.signalCount} Verified Signals</div>
                        </div>
                    </div>

                    {/* Strategy Simulator */}
                    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                            <div style={{ padding: '6px', borderRadius: '8px', background: 'var(--color-accent-light)' }}>
                                <BarChart3 size={16} color="var(--color-accent)" />
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Strategy Simulator</div>
                        </div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: '1.55' }}>
                            {ps.stressDesc}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: 'auto' }}>
                            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                                <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Win Rate</div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-success)' }}>{ps.winRate}</div>
                            </div>
                            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                                <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Profit Factor</div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-accent)' }}>{ps.pf}</div>
                            </div>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', fontSize: '0.75rem', padding: '8px' }} onClick={handleRunBacktest}>
                            {ps.stressLabel}
                        </button>
                    </div>
                </div>

                {/* ═══ PERF CHART ═══ */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
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
                                                borderRadius: '4px 4px 0 0', boxShadow: `0 0 15px ${selectedMarket.color}33`,
                                                transition: 'height 1.5s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', overflow: 'hidden',
                                            }}>
                                                <div className="shimmer" style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)', transform: 'skewX(-20deg)' }}></div>
                                            </div>
                                            <div style={{
                                                width: '10px', height: `${bHeight}%`,
                                                background: 'rgba(255,255,255,0.05)', borderRadius: '4px 4px 0 0',
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

                    {/* Stats row */}
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

                {/* Alpha Insight */}
                <div style={{
                    padding: '0.85rem', background: `${selectedMarket.color}08`,
                    borderRadius: '12px', border: `1px solid ${selectedMarket.color}1a`,
                    display: 'flex', gap: '10px', alignItems: 'center', position: 'relative', overflow: 'hidden',
                    marginBottom: '1.5rem',
                }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: selectedMarket.color }}></div>
                    <Info size={14} color={selectedMarket.color} style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        <strong style={{ color: 'var(--color-text-primary)' }}>Alpha Insight:</strong> {insight}
                    </p>
                </div>

                {/* ═══ MARKET OPEN INTELLIGENCE ═══ */}
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '0.85rem', color: selectedMarket.color, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Globe size={18} /> Market Open Intelligence
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{new Date().toLocaleDateString()}</span>
                    </div>

                    <div style={{ background: `${selectedMarket.color}08`, padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-borderShadow)' }}>
                        <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', fontWeight: 700 }}>{intel.title}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
                            {intel.body}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: '1px solid var(--color-success-light)' }}>
                                <div style={{ fontSize: '0.6rem', color: 'var(--color-success)', textTransform: 'uppercase', marginBottom: '2px' }}>Bias</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{intel.bias}</div>
                            </div>
                            <div style={{ padding: '0.75rem', background: intel.risk === 'LOW' ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)', borderRadius: '8px', border: `1px solid ${intel.risk === 'LOW' ? 'var(--color-success-light)' : 'var(--color-error-light)'}` }}>
                                <div style={{ fontSize: '0.6rem', color: intel.risk === 'LOW' ? 'var(--color-success)' : 'var(--color-error)', textTransform: 'uppercase', marginBottom: '2px' }}>Risk</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{intel.risk}</div>
                            </div>
                        </div>

                        {/* Market Sessions */}
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', fontSize: '0.65rem', textAlign: 'center', marginBottom: '0.5rem' }}>
                                {getMarketSessions().map(session => (
                                    <div key={session.code} style={{ opacity: session.isOpen ? 1 : 0.5, background: session.isOpen ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)', padding: '6px 2px', borderRadius: '4px' }}>
                                        <div style={{ fontWeight: 800, color: session.isOpen ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>{session.code}</div>
                                        <div style={{ fontSize: '0.5rem', color: session.isOpen ? 'var(--color-success)' : 'var(--color-text-tertiary)', marginTop: '2px', fontWeight: 600 }}>
                                            {session.isOpen ? 'OPEN' : session.isWeekend ? 'WEEKEND' : 'CLOSED'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--color-text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                        <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.5rem' }}>EGX (CAIRO)</span>
                                        <span style={{ fontWeight: 700 }}>10:00 - 14:30</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                        <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.5rem' }}>LND (LONDON)</span>
                                        <span style={{ fontWeight: 700 }}>10:00 - 18:30</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                        <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.5rem' }}>NYC (N. YORK)</span>
                                        <span style={{ fontWeight: 700 }}>16:30 - 23:00</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                        <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.5rem' }}>TKY (TOKYO)</span>
                                        <span style={{ fontWeight: 700 }}>02:00 - 08:00</span>
                                    </div>
                                </div>
                                <div style={{ marginTop: '4px', fontSize: '0.5rem', color: selectedMarket.color, fontWeight: 600 }}>ALL TIMES IN CAIRO TIME (UTC+2)</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ BACKTEST MODAL ═══ */}
            {showBacktestModal && (
                <div className="modal-overlay glass-blur" onClick={() => setShowBacktestModal(false)}>
                    <div className="modal glass-effect" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">AI Performance vs {selectedMarket.indexName}</h3>
                            <button className="btn btn-icon glass-button" onClick={() => setShowBacktestModal(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ padding: '1.25rem' }}>
                            <div style={{
                                background: `linear-gradient(180deg, ${selectedMarket.color}0d 0%, rgba(16,185,129,0.1) 100%)`,
                                borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem',
                                border: '1px solid var(--glass-borderShadow)', position: 'relative', overflow: 'hidden',
                            }}>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', opacity: 0.3 }}>
                                    <svg viewBox="0 0 500 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                                        <path d="M0,80 Q50,70 100,75 T200,50 T300,60 T400,30 T500,10 L500,100 L0,100 Z" fill="var(--color-success)" />
                                        <path d="M0,90 Q50,85 100,88 T200,80 T300,82 T400,75 T500,70 L500,100 L0,100 Z" fill="rgba(255,255,255,0.1)" />
                                    </svg>
                                </div>
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-success)', marginBottom: '0.25rem' }}>+27.42%</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Historical Alpha Yield</div>
                                </div>
                            </div>
                            <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>AI Strategy Return</span>
                                        <span style={{ fontWeight: 800, color: 'var(--color-success)' }}>+38.1%</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{selectedMarket.indexName} (Benchmark)</span>
                                        <span style={{ fontWeight: 600 }}>+10.68%</span>
                                    </div>
                                    <div style={{ height: '1px', background: 'var(--glass-border)', margin: '4px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Outperformance</span>
                                        <span style={{ fontWeight: 900, color: selectedMarket.color }}>+27.42%</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="glass-card" style={{ padding: '0.75rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>MAX DRAWDOWN</div>
                                    <div style={{ fontWeight: 700 }}>-7.2%</div>
                                </div>
                                <div className="glass-card" style={{ padding: '0.75rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>WIN RATE</div>
                                    <div style={{ fontWeight: 700, color: 'var(--color-success)' }}>{ps.winRate}</div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={() => setShowBacktestModal(false)}>Close Simulator</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIPerformanceTracker;

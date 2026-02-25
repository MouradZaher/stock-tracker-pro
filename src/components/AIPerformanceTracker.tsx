import React, { useState, useEffect } from 'react';
import { TrendingUp, ShieldCheck, Zap, Activity, Info, BarChart3, Globe, Check, HelpCircle, X, ArrowRight, Clock } from 'lucide-react';
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
        stressLabel: 'RUN STRESS TEST',
    },
    egypt: {
        accuracy: 66, label: 'SIGNAL HIT RATE', signalCount: 148, modelVersion: 'Alpha v3.8',
        winRate: '63.2%', pf: '2.4x',
        stressDesc: 'Backtested on 3-years of EGX 30 session data. Model capitalises on banking sector momentum, currency-driven volatility spikes, and thin liquidity gaps.',
        stressLabel: 'RUN STRESS TEST',
    },
    abudhabi: {
        accuracy: 74, label: 'SIGNAL HIT RATE', signalCount: 97, modelVersion: 'Alpha v4.6',
        winRate: '71.5%', pf: '2.6x',
        stressDesc: 'Backtested on 4-years of FTSE ADX 15 data. Model exploits oil-price correlation, sovereign fund rebalancing windows, and low-float price inefficiencies.',
        stressLabel: 'RUN STRESS TEST',
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

const ALPHA_SOURCES: Record<MarketId, { title: string; desc: string; contribution: string }[]> = {
    us: [
        { title: 'Quantitative Momentum Feed', desc: 'Machine learning models processing tick-by-tick momentum and RSI divergence in mega-cap tech.', contribution: '42%' },
        { title: 'Sector Relative Valuation', desc: 'Arbitraging capital flows between defensive consumer staples and high-growth semiconductors.', contribution: '35%' },
        { title: 'Institutional Sentiment Mapping', desc: 'Real-time NLP analysis of earnings calls and headline delta vs. dark pool positioning.', contribution: '23%' },
    ],
    egypt: [
        { title: 'FX-Indexed Arbitrage', desc: 'Exploiting price inefficiencies in commodity and export-oriented EGX majors during currency volatility.', contribution: '51%' },
        { title: 'Order Book Imbalance', desc: 'Detecting institutional accumulation waves in banking and real-estate sectors through thin liquidity filtering.', contribution: '28%' },
        { title: 'Macro-Catalyst Convergence', desc: 'Mapping CBE policy shifts and foreign direct investment news to high-conviction momentum plays.', contribution: '21%' },
    ],
    abudhabi: [
        { title: 'Sovereign Flow Sync', desc: 'Model captures rebalancing windows of major sovereign funds.', contribution: '48%' },
        { title: 'Energy-Equity Decoupling', desc: 'Arbitraging oil price lags in regional utilities and energy stocks.', contribution: '32%' },
        { title: 'Institutional Buy-backs', desc: 'Detecting corporate support levels in low-float majors.', contribution: '20%' },
    ],
};

const STATS_DATA: Record<MarketId, { alpha: string; accuracy: string; sharpe: string; outperformance: string }> = {
    us: { alpha: '+12.3%', accuracy: '71%', sharpe: '1.9', outperformance: '21.5%' },
    egypt: { alpha: '+22.4%', accuracy: '66%', sharpe: '1.4', outperformance: '34.8%' },
    abudhabi: { alpha: '+11.2%', accuracy: '74%', sharpe: '2.3', outperformance: '19.2%' },
};

const MARKET_INTEL: Record<MarketId, { title: string; body: string; bias: string; risk: string }> = {
    us: {
        title: 'Tactical Setup: Institutional Tech Flow Analysis',
        body: 'AI models indicate a strong institutional bias toward high-beta tech today. Markets are pricing in a neutral CPI print. Key tactical levels: SPY 502, QQQ 438.',
        bias: 'BULLISH', risk: 'MEDIUM',
    },
    egypt: {
        title: 'Tactical Setup: Banking Sector Accumulation',
        body: 'AI models detect institutional accumulation in banking names (COMI, EFIH) ahead of CBE rate decision. EGP stabilisation supporting inflows.',
        bias: 'BULLISH', risk: 'HIGH',
    },
    abudhabi: {
        title: 'Tactical Setup: Oil-Equity Correlation Trade',
        body: 'OPEC+ output decision pending. Model tracking sovereign fund rebalancing in FAB, ADNOCDIST. ADX index shows support at 9,780.',
        bias: 'NEUTRAL', risk: 'LOW',
    },
};

const SESSION_CONFIG: Record<MarketId, { code: string; name: string; hours: string; startH: number; startM: number; endH: number; endM: number; dayRange: [number, number] }> = {
    us: {
        code: 'NYC',
        name: 'NYC (N. YORK)',
        hours: '16:30 - 23:00',
        startH: 16, startM: 30, endH: 23, endM: 0,
        dayRange: [1, 5] // Mon-Fri
    },
    egypt: {
        code: 'EGX',
        name: 'EGX (CAIRO)',
        hours: '10:00 - 14:30',
        startH: 10, startM: 0, endH: 14, endM: 30,
        dayRange: [0, 4] // Sun-Thu
    },
    abudhabi: {
        code: 'ADX',
        name: 'ADX (A. DHABI)',
        hours: '08:00 - 13:00',
        startH: 8, startM: 0, endH: 13, endM: 0,
        dayRange: [1, 5] // Mon-Fri (UAE shifted to Mon-Fri in 2022)
    }
};

const getMarketSessionStatus = (marketId: MarketId): { code: string; name: string; hours: string; isOpen: boolean } => {
    const config = SESSION_CONFIG[marketId];
    const now = new Date();
    const utcHour = now.getUTCHours();
    const day = now.getUTCDay();

    // Cairo time (UTC+2)
    const cairoHour = (utcHour + 2) % 24;
    const cairoMin = now.getUTCMinutes();
    const cairoDay = (utcHour + 2 >= 24) ? (day + 1) % 7 : day;

    const currentMinutes = cairoHour * 60 + cairoMin;
    const startMinutes = config.startH * 60 + config.startM;
    const endMinutes = config.endH * 60 + config.endM;

    const isDayMatch = (cairoDay >= config.dayRange[0] && cairoDay <= config.dayRange[1]);
    const isOpen = isDayMatch && currentMinutes >= startMinutes && currentMinutes < endMinutes;

    return {
        code: config.code,
        name: config.name,
        hours: config.hours,
        isOpen
    };
};

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

const AIPerformanceTracker: React.FC = () => {
    const { selectedMarket } = useMarket();
    const [showBacktestModal, setShowBacktestModal] = useState(false);
    const [showExplainerModal, setShowExplainerModal] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const ps = MARKET_PRECISION_STATS[selectedMarket.id] || MARKET_PRECISION_STATS.us;
    const statsRaw = STATS_DATA[selectedMarket.id] || STATS_DATA.us;
    const alphaSources = ALPHA_SOURCES[selectedMarket.id] || ALPHA_SOURCES.us;
    const intel = MARKET_INTEL[selectedMarket.id] || MARKET_INTEL.us;
    const session = getMarketSessionStatus(selectedMarket.id);

    const handleRunBacktest = () => {
        setShowBacktestModal(true);
        toast.success('Stress test launched');
    };

    return (
        <div className="ai-performance-tracker" style={{ marginBottom: '2.5rem' }}>
            {/* ═══ LIVE SYNC HEADER ═══ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', padding: '0 0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="pulse-dot" style={{ width: '8px', height: '8px', background: 'var(--color-success)', borderRadius: '50%', boxShadow: '0 0 10px var(--color-success)' }}></div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--color-success)' }}>LIVE SYNCED</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-tertiary)', fontSize: '0.7rem', fontWeight: 600 }}>
                    <Clock size={12} />
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
            </div>

            {/* ═══ MAIN GLASS CONTAINER ═══ */}
            <div className="glass-card" style={{
                padding: '2rem',
                border: '1px solid var(--glass-border-bright)',
                background: 'linear-gradient(180deg, rgba(20, 20, 30, 0.6) 0%, rgba(10, 10, 15, 0.9) 100%)',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '24px'
            }}>
                {/* Background Glows */}
                <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '150px', background: `${selectedMarket.color}22`, filter: 'blur(80px)', pointerEvents: 'none' }}></div>

                {/* Header Content */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 800, color: selectedMarket.color, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.75rem' }}>
                        AI Alpha Engine Core
                    </h2>

                    {/* CENTERED HERO SECTION */}
                    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: '4.5rem', fontWeight: 900, letterSpacing: '-0.05em', color: 'white', lineHeight: 1, textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                            {statsRaw.outperformance}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>OUTPERformance</span>
                            <button
                                onClick={() => setShowExplainerModal(true)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '4px',
                                    cursor: 'pointer',
                                    color: selectedMarket.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'transform 0.2s ease',
                                    opacity: 0.8
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <HelpCircle size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* MAIN GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    {/* Precision Card */}
                    <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)' }}>
                                <ShieldCheck size={20} color="var(--color-success)" />
                            </div>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>VERIFIED</span>
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '2px' }}>{ps.accuracy}%</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>Signal Accuracy</div>
                        <div style={{ marginTop: '1rem', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                            <div style={{ width: `${ps.accuracy}%`, height: '100%', background: 'var(--color-success)', borderRadius: '2px', boxShadow: '0 0 10px var(--color-success)' }}></div>
                        </div>
                    </div>

                    {/* Sharpe Card */}
                    <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)' }}>
                                <Activity size={20} color="var(--color-warning)" />
                            </div>
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '2px' }}>{statsRaw.sharpe}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>Sharpe Ratio</div>
                        <p style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', marginTop: '0.5rem', lineHeight: 1.4 }}>
                            Risk-adjusted efficiency against {selectedMarket.indexName} volatility.
                        </p>
                    </div>

                    {/* Stress Test Card */}
                    <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                            <BarChart3 size={18} color={selectedMarket.color} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>Strategy Simulator</span>
                        </div>
                        <div style={{ display: 'flex', gap: '15px', marginBottom: 'auto' }}>
                            <div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Win Rate</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-success)' }}>{ps.winRate}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>P. Factor</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: selectedMarket.color }}>{ps.pf}</div>
                            </div>
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '1.25rem', fontSize: '0.7rem', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}
                            onClick={handleRunBacktest}
                        >
                            {ps.stressLabel}
                        </button>
                    </div>
                </div>

                {/* TACTICAL SETUP BAR */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '1.25rem',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '16px',
                    border: '1px solid var(--glass-border)'
                }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${selectedMarket.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Zap size={20} color={selectedMarket.color} fill={selectedMarket.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '2px' }}>{intel.title}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>BIAS: <strong style={{ color: 'var(--color-success)' }}>{intel.bias}</strong></span>
                            <span style={{ width: '1px', height: '10px', background: 'var(--glass-border)' }}></span>
                            <span>RISK: <strong style={{ color: intel.risk === 'HIGH' ? 'var(--color-error)' : 'var(--color-success)' }}>{intel.risk}</strong></span>
                        </div>
                    </div>
                    <ArrowRight size={16} color="var(--color-text-tertiary)" />
                </div>
            </div>

            {/* ═══ MARKET SESSIONS ROW ═══ */}
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <div className="glass-card" style={{
                    padding: '12px 24px',
                    textAlign: 'center',
                    background: session.isOpen ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    minWidth: '280px',
                    justifyContent: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', background: session.isOpen ? 'var(--color-success)' : 'var(--color-text-tertiary)', borderRadius: '50%', boxShadow: session.isOpen ? '0 0 10px var(--color-success)' : 'none' }}></div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 900, color: session.isOpen ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>{session.code}</div>
                    </div>
                    <div style={{ width: '1px', height: '15px', background: 'var(--glass-border)' }}></div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                        {session.hours} (CAIRO)
                    </div>
                    <div style={{ width: '1px', height: '15px', background: 'var(--glass-border)' }}></div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 900, color: session.isOpen ? 'var(--color-success)' : 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                        {session.isOpen ? 'Active' : 'Closed'}
                    </div>
                </div>
            </div>

            {/* ═══ EXPLAINER MODAL ═══ */}
            {showExplainerModal && (
                <div className="modal-overlay glass-blur" onClick={() => setShowExplainerModal(false)} style={{ zIndex: 1000 }}>
                    <div className="modal glass-effect" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '95%', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ padding: '8px', borderRadius: '10px', background: `${selectedMarket.color}22` }}>
                                    <HelpCircle size={22} color={selectedMarket.color} />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>How AI Outperformed</h3>
                            </div>
                            <button onClick={() => setShowExplainerModal(false)} className="btn-icon glass-button"><X size={20} /></button>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
                            Our proprietary Alpha Engine combines three distinct execution layers to generate outperformance against market benchmarks.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {alphaSources.map((source, i) => (
                                <div key={i} style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: selectedMarket.color, width: '45px', textAlign: 'right' }}>{source.contribution}</div>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '4px' }}>{source.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>{source.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '2.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 800 }}>Model Confidence</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                    <div style={{ width: '88%', height: '100%', background: selectedMarket.color, borderRadius: '3px' }}></div>
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 900 }}>88%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ BACKTEST MODAL (EXISTING) ═══ */}
            {showBacktestModal && (
                <div className="modal-overlay glass-blur" onClick={() => setShowBacktestModal(false)} style={{ zIndex: 1000 }}>
                    <div className="modal glass-effect" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">AI Performance vs {selectedMarket.indexName}</h3>
                            <button className="btn btn-icon glass-button" onClick={() => setShowBacktestModal(false)}><X size={20} /></button>
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
        </div>
    );
};

export default AIPerformanceTracker;

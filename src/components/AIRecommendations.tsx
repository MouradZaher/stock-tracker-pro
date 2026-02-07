import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, TrendingUp, Minus, X, BarChart3, Zap, ArrowRight, Check, Plus, Clock, Globe } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';
import { soundService } from '../services/soundService';
import SearchEngine from './SearchEngine';

interface AIRecommendationsProps {
    onSelectStock?: (symbol: string) => void;
}

// Hardcoded recommendations
const MOCK_RECOMMENDATIONS = [
    { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology', price: 194.60, score: 99, recommendation: 'Buy', suggestedAllocation: 5, reasoning: ['RSI at 29.2 indicates oversold conditions', 'Bullish trend: 50-day MA above 200-day MA'] },
    { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology', price: 671.99, score: 94, recommendation: 'Buy', suggestedAllocation: 5, reasoning: ['RSI at 30.5 shows neutral momentum', 'Bullish trend: 50-day MA above 200-day MA'] },
    { symbol: 'ORCL', name: 'Oracle Corporation', sector: 'Technology', price: 143.20, score: 94, recommendation: 'Buy', suggestedAllocation: 5, reasoning: ['RSI at 43.8 shows neutral momentum', 'Bullish trend: 50-day MA above 200-day MA'] },
    { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', price: 240.94, score: 100, recommendation: 'Buy', suggestedAllocation: 5, reasoning: ['RSI at 67.8 shows neutral momentum', 'Bullish trend: 50-day MA above 200-day MA'] },
    { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', price: 277.81, score: 94, recommendation: 'Buy', suggestedAllocation: 5, reasoning: ['RSI at 52.9 shows neutral momentum', 'Bullish trend: 50-day MA above 200-day MA'] },
    { symbol: 'LLY', name: 'Eli Lilly and Company', sector: 'Healthcare', price: 1060.02, score: 89, recommendation: 'Buy', suggestedAllocation: 5, reasoning: ['RSI at 18.3 indicates oversold conditions', 'Bullish trend: 50-day MA above 200-day MA'] },
];

const AIRecommendations: React.FC<AIRecommendationsProps> = ({ onSelectStock }) => {
    const [detailSymbol, setDetailSymbol] = useState<string | null>(null);
    const [checklist, setChecklist] = useState({
        positiveBreadth: true,
        volumeHigh: true,
        rsiValid: true,
        macdConfirm: false,
        candleClose: false,
        volumeEntry: false,
        fakeBreakout: true
    });

    const handleLocalSelect = (symbol: string) => {
        soundService.playTap();
        setDetailSymbol(symbol);
        // Simulate automated checks
        setChecklist({
            positiveBreadth: Math.random() > 0.3,
            volumeHigh: Math.random() > 0.4,
            rsiValid: Math.random() > 0.2,
            macdConfirm: Math.random() > 0.5,
            candleClose: Math.random() > 0.5,
            volumeEntry: Math.random() > 0.5,
            fakeBreakout: Math.random() > 0.2
        });
    };

    const handleWatchlistToggle = () => {
        soundService.playTap();
        toast.success(`Added ${detailSymbol} to Watchlist`);
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'var(--color-success)';
        if (score >= 70) return 'var(--color-warning)';
        return 'var(--color-error)';
    };

    // --- DETAILED VIEW (Trade Analysis) ---
    if (detailSymbol) {
        return (
            <div className="portfolio-container" style={{ paddingTop: '0', animation: 'fadeIn 0.3s ease' }}>
                {/* Header & Navigation */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => setDetailSymbol(null)} className="btn btn-icon glass-button">
                            <ArrowRight size={20} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                        <h2 style={{ margin: 0 }}>Detailed Trade Analysis</h2>
                    </div>
                    <button className="btn btn-primary" onClick={handleWatchlistToggle} style={{ gap: '0.5rem' }}>
                        <Plus size={18} /> Add to Watchlist
                    </button>
                </div>

                {/* Stock Header & Data */}
                <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>{detailSymbol}.US</div>
                            <div style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary)' }}>NASDAQ</div>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>$280.91</div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.25rem' }}>
                            <div style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '1.1rem' }}>+$258.91 (+1176.84%)</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>Live Updates: Just now</div>
                        </div>
                    </div>

                    {/* Market Sessions - Compact */}
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', textAlign: 'center' }}>
                        {[
                            { code: 'EGX', time: '10:00AM - 2:30PM', active: false },
                            { code: 'LND', time: '8:00AM - 4:30PM', active: false },
                            { code: 'NYC', time: '9:30AM - 4:00PM', active: true },
                            { code: 'TKY', time: '9:00AM - 3:00PM', active: false },
                        ].map(session => (
                            <div key={session.code} style={{ opacity: session.active ? 1 : 0.4 }}>
                                <div style={{ fontWeight: 700, marginBottom: '2px', color: session.active ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>{session.code}</div>
                                <div style={{ whiteSpace: 'nowrap' }}>{session.time}</div>
                                {session.active && <div style={{ fontSize: '0.6rem', color: 'var(--color-success)', marginTop: '2px' }}>● OPEN</div>}
                            </div>
                        ))}
                        <div style={{ alignSelf: 'center', fontSize: '1.2rem', fontWeight: 800, marginLeft: '1rem', color: 'var(--color-text-secondary)' }}>
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>

                    {/* Left Column: Chart & Checklist */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* TradingView Chart Container */}
                        <div className="glass-card" style={{ height: '400px', padding: '0.5rem', overflow: 'hidden' }}>
                            <iframe
                                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${detailSymbol}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=${detailSymbol}`}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                title="TradingView Chart"
                            />
                        </div>

                        {/* Execution Checklist - Automated */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Check size={16} color="var(--color-accent)" /> Execution Checklist
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div>
                                    <h4 style={{ color: 'var(--color-warning)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>PRE-TRADE CHECKLIST</h4>
                                    <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1px solid ${checklist.positiveBreadth ? 'var(--color-success)' : 'var(--color-text-tertiary)'}`, background: checklist.positiveBreadth ? 'var(--color-success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {checklist.positiveBreadth && <Check size={12} color="#000" />}
                                            </div>
                                            Market opened with positive breadth
                                        </li>
                                        <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1px solid ${checklist.volumeHigh ? 'var(--color-success)' : 'var(--color-text-tertiary)'}`, background: checklist.volumeHigh ? 'var(--color-success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {checklist.volumeHigh && <Check size={12} color="#000" />}
                                            </div>
                                            Stock volume &gt;120% of 20-day average
                                        </li>
                                        <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1px solid ${checklist.rsiValid ? 'var(--color-success)' : 'var(--color-text-tertiary)'}`, background: checklist.rsiValid ? 'var(--color-success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {checklist.rsiValid && <Check size={12} color="#000" />}
                                            </div>
                                            RSI &lt;70 for buys, &gt;30 for shorts
                                        </li>
                                        <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1px solid ${checklist.macdConfirm ? 'var(--color-success)' : 'var(--color-text-tertiary)'}`, background: checklist.macdConfirm ? 'var(--color-success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {checklist.macdConfirm && <Check size={12} color="#000" />}
                                            </div>
                                            MACD confirmation on 15-min chart
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 style={{ color: 'var(--color-success)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>ENTRY RULES</h4>
                                    <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1px solid ${checklist.candleClose ? 'var(--color-success)' : 'var(--color-text-tertiary)'}`, background: checklist.candleClose ? 'var(--color-success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {checklist.candleClose && <Check size={12} color="#000" />}
                                            </div>
                                            1. Wait for FULL CANDLE CLOSE above entry
                                        </li>
                                        <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1px solid ${checklist.volumeEntry ? 'var(--color-success)' : 'var(--color-text-tertiary)'}`, background: checklist.volumeEntry ? 'var(--color-success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {checklist.volumeEntry && <Check size={12} color="#000" />}
                                            </div>
                                            2. Volume must exceed 120% threshold
                                        </li>
                                        <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1px solid ${checklist.fakeBreakout ? 'var(--color-success)' : 'var(--color-text-tertiary)'}`, background: checklist.fakeBreakout ? 'var(--color-success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {checklist.fakeBreakout && <Check size={12} color="#000" />}
                                            </div>
                                            3. Fake breakout: Wick &gt;50% of body = AVOID
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Position & Stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Your Position */}
                        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-accent)' }}>
                            <h3 style={{ textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                                Your Position
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="flex justify-between items-center">
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Units</span>
                                    <span style={{ fontWeight: 600 }}>0.359</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Avg Cost</span>
                                    <span style={{ fontWeight: 600 }}>$229.05</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Value</span>
                                    <span style={{ fontWeight: 600 }}>$100.98</span>
                                </div>
                                <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.5rem 0' }}></div>
                                <div className="flex justify-between items-center">
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>P/L</span>
                                    <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>+$18.64 (+22.64%)</span>
                                </div>
                            </div>
                        </div>

                        {/* Market Stats */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                                Market Statistics
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Open</span>
                                    <span>$280.00</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--color-text-secondary)' }}>High</span>
                                    <span>$282.12</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Low</span>
                                    <span>$278.93</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Vol</span>
                                    <span>2.4M</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--color-text-secondary)' }}>P/E</span>
                                    <span>24.5</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Cap</span>
                                    <span>$1.2T</span>
                                </div>
                            </div>
                        </div>

                        {/* Trade AI Summary */}
                        <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)' }}>
                            <h3 style={{ fontSize: '0.85rem', color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Zap size={14} /> AI Insight
                            </h3>
                            <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                Conviction: <span style={{ fontWeight: 800 }}>HIGH</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                                Momentum confirms bullish entry. Volume spike supports breakout hypothesis. Target $290.00.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- MAIN OVERVIEW ---
    return (
        <div className="portfolio-container" style={{ paddingTop: '0' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <SearchEngine onSelectSymbol={handleLocalSelect} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Success Rate Card */}
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                        <svg width="80" height="80" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                            <circle cx="40" cy="40" r="35" fill="none" stroke="var(--color-success)" strokeWidth="8" strokeDasharray="220" strokeDashoffset="33" transform="rotate(-90 40 40)" />
                        </svg>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 800, fontSize: '1.25rem' }}>85%</div>
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>AI Accuracy</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Historical success rate based on 'Buy' calls reaching target within 30 days.</p>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>+12.4% Avg Return</div>
                    </div>
                </div>

                {/* Strategy Simulator */}
                <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.1) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart3 size={16} /> Strategy Simulator
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                        Test AI performance against S&P 500 over the last 12 months.
                    </p>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => soundService.playSuccess()}>Run Backtest</button>
                </div>
            </div>

            {/* Daily Strategy Reports */}
            <div className="glass-card" style={{ padding: '1.5rem', gridColumn: '1 / -1', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={16} /> Daily Strategy Intelligence
                </h3>
                {/* Make it look like a list of reports */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', background: 'var(--color-bg-secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Clock size={20} color="var(--color-text-secondary)" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>Pre-Market Analysis - Feb {7 + i}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>Key levels for SPY, QQQ, and NVDA.</div>
                                </div>
                            </div>
                            <button className="btn btn-secondary btn-small">Read</button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="portfolio-header">
                <div>
                    <h2>Top Recommendations</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', marginTop: '0.5rem' }}>
                        Following 5% per stock, 20% per sector allocation rules
                    </p>
                </div>
                <div className="flex gap-md">
                    <button className="btn btn-primary">
                        <RefreshCw size={18} /> Refresh
                    </button>
                </div>
            </div>

            <div className="table-container" style={{ overflowX: 'auto' }}>
                <table className="portfolio-table">
                    <thead>
                        <tr>
                            <th>Symbol</th>
                            <th>Sector</th>
                            <th style={{ textAlign: 'right' }}>Price</th>
                            <th style={{ textAlign: 'right' }}>Score</th>
                            <th>Recommendation</th>
                            <th style={{ textAlign: 'right' }}>Suggested %</th>
                            <th>Reasoning</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MOCK_RECOMMENDATIONS.map((rec) => (
                            <tr key={rec.symbol} onClick={() => handleLocalSelect(rec.symbol)} style={{ cursor: 'pointer' }}>
                                <td>
                                    <strong>{rec.symbol}</strong>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{rec.name}</div>
                                </td>
                                <td style={{ fontSize: '0.85rem' }}>{rec.sector}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(rec.price)}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <span style={{ color: getScoreColor(rec.score), fontWeight: 700 }}>{rec.score}/100</span>
                                </td>
                                <td>
                                    <div className="flex items-center gap-sm">
                                        {rec.recommendation === 'Buy' ? <TrendingUp size={16} color="var(--color-success)" /> : <Minus size={16} />}
                                        <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{rec.recommendation}</span>
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>{rec.suggestedAllocation}%</td>
                                <td style={{ maxWidth: '300px' }}>
                                    {rec.reasoning.map((r, i) => (
                                        <div key={i} style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>• {r}</div>
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AIRecommendations;

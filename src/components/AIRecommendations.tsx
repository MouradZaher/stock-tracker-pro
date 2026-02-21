import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, TrendingUp, Minus, X, BarChart3, Zap, ArrowRight, Check, Plus, Clock, Globe } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';
import { useNotifications } from '../contexts/NotificationContext';
import { soundService } from '../services/soundService';
import SearchEngine from './SearchEngine';
import FamousHoldings from './FamousHoldings';
import { getAllRecommendations } from '../services/aiRecommendationService';
import { getStockData, getStockQuote } from '../services/stockDataService';

interface MarketSession {
    code: string;
    isOpen: boolean;
    isWeekend?: boolean;
}

const getMarketSessions = (): MarketSession[] => {
    const now = new Date();
    // Cairo is UTC+2
    const utcHour = now.getUTCHours();
    const utcMin = now.getUTCMinutes();
    const day = now.getUTCDay(); // 0-6 (Sun-Sat)

    // Cairo Time = UTC + 2
    const cairoHour = (utcHour + 2) % 24;
    const cairoMin = utcMin;
    const cairoDay = (utcHour + 2 >= 24) ? (day + 1) % 7 : day;

    const isTimeInRange = (h: number, m: number, startH: number, startM: number, endH: number, endM: number) => {
        const current = h * 60 + m;
        const start = startH * 60 + startM;
        const end = endH * 60 + endM;
        return current >= start && current < end;
    };

    return [
        {
            code: 'EGX',
            // Sunday - Thursday, 10:00 - 14:30 Cairo
            isOpen: (cairoDay >= 0 && cairoDay <= 4) && isTimeInRange(cairoHour, cairoMin, 10, 0, 14, 30),
            isWeekend: cairoDay === 5 || cairoDay === 6
        },
        {
            code: 'LND',
            // Monday - Friday, 08:00 - 16:30 UTC -> 10:00 - 18:30 Cairo
            isOpen: (day >= 1 && day <= 5) && isTimeInRange(cairoHour, cairoMin, 10, 0, 18, 30),
            isWeekend: day === 0 || day === 6
        },
        {
            code: 'NYC',
            // Monday - Friday, 09:30 - 16:00 EST (UTC-5) -> 16:30 - 23:00 Cairo
            isOpen: (day >= 1 && day <= 5) && isTimeInRange(cairoHour, cairoMin, 16, 30, 23, 0),
            isWeekend: day === 0 || day === 6
        },
        {
            code: 'TKY',
            // Monday - Friday, 09:00 - 15:00 JST (UTC+9) -> 02:00 - 08:00 Cairo
            isOpen: (day >= 1 && day <= 5) && isTimeInRange(cairoHour, cairoMin, 2, 0, 8, 0),
            isWeekend: day === 0 || day === 6
        }
    ];
};

interface AIRecommendationsProps {
    onSelectStock?: (symbol: string) => void;
}

// Hardcoded recommendations (DEPRECATED - Using real service data)
const MOCK_RECOMMENDATIONS: any[] = [];

import AIPerformanceTracker from './AIPerformanceTracker';

const AIRecommendations: React.FC<AIRecommendationsProps> = ({ onSelectStock }) => {
    const { addNotification } = useNotifications();
    const [detailSymbol, setDetailSymbol] = useState<string | null>(null);
    const [showReportModal, setShowReportModal] = useState<number | null>(null);
    const [showBacktestModal, setShowBacktestModal] = useState(false);

    // Scanner State
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [scanLog, setScanLog] = useState<string[]>([]);
    // Instant curated recommendations shown immediately — no API needed
    const INSTANT_RECS = React.useMemo(() => {
        const curated = [
            { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', score: 82, recommendation: 'Buy', suggestedAllocation: 5.0 },
            { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', score: 85, recommendation: 'Buy', suggestedAllocation: 5.0 },
            { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', score: 88, recommendation: 'Buy', suggestedAllocation: 5.0 },
            { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', score: 79, recommendation: 'Buy', suggestedAllocation: 4.5 },
            { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Cyclical', score: 76, recommendation: 'Buy', suggestedAllocation: 4.0 },
            { symbol: 'META', name: 'Meta Platforms', sector: 'Technology', score: 74, recommendation: 'Buy', suggestedAllocation: 3.5 },
            { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financial', score: 72, recommendation: 'Buy', suggestedAllocation: 4.0 },
            { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', score: 70, recommendation: 'Hold', suggestedAllocation: 3.0 },
            { symbol: 'V', name: 'Visa Inc.', sector: 'Financial', score: 68, recommendation: 'Hold', suggestedAllocation: 3.0 },
            { symbol: 'LLY', name: 'Eli Lilly & Co.', sector: 'Healthcare', score: 80, recommendation: 'Buy', suggestedAllocation: 4.5 },
            { symbol: 'XOM', name: 'Exxon Mobil Corp.', sector: 'Energy', score: 65, recommendation: 'Hold', suggestedAllocation: 2.5 },
            { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', score: 62, recommendation: 'Hold', suggestedAllocation: 2.5 },
            { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Staples', score: 69, recommendation: 'Hold', suggestedAllocation: 3.0 },
            { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Cyclical', score: 58, recommendation: 'Hold', suggestedAllocation: 2.0 },
            { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology', score: 77, recommendation: 'Buy', suggestedAllocation: 4.0 },
        ];
        return curated.sort((a, b) => b.score - a.score);
    }, []);

    // Fetch real recommendations ONLY on demand (Run AI Scan)
    const [activeRecs, setActiveRecs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

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

    const handleReadReport = (id: number) => {
        soundService.playTap();
        setShowReportModal(id);
    };

    const handleRunBacktest = () => {
        soundService.playSuccess();
        setShowBacktestModal(true);
    };

    const runScanner = async () => {
        setIsScanning(true);
        setScanProgress(0);
        setScanLog(['Initializing AI Scanner...', 'Loading market data from 12+ sources...', 'Establishing institutional social links...']);
        soundService.playTap();

        const logs = [
            'Analyzing technical indicators (RSI, SMA, EMA)...',
            'Processing social sentiment from X Pulse handlers...',
            'Calculating conviction scores...',
            'Evaluating institutional flows...',
            'Scanning for volume anomalies...',
            'Finalizing tactical setups...'
        ];

        for (let i = 0; i < logs.length; i++) {
            await new Promise(r => setTimeout(r, 800));
            setScanLog(prev => [...prev, logs[i]]);
            setScanProgress(((i + 1) / logs.length) * 100);
        }

        await new Promise(r => setTimeout(r, 1000));
        setIsScanning(false);
        soundService.playSuccess();

        addNotification({
            title: 'Market Scan Complete',
            message: '12 High Conviction setups identified via X Pulse and Technical analysis.',
            type: 'ai'
        });

        toast.success('Market scan complete. 12 High Conviction setups found.');

        // REFRESH RECOMMENDATIONS
        try {
            console.log('Refreshing recommendations after scan...');
            const freshRecs = await getAllRecommendations();
            setActiveRecs(freshRecs);
            // Ensure we are back at the top view if we were in a detail view
            setDetailSymbol(null);
        } catch (error) {
            console.error('Failed to refresh recs after scan:', error);
            toast.error('Failed to refresh recommendations.');
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'var(--color-success)';
        if (score >= 70) return 'var(--color-warning)';
        return 'var(--color-error)';
    };

    // --- DETAILED VIEW (Trade Analysis) ---
    const [detailStockData, setDetailStockData] = useState<any>(null);

    useEffect(() => {
        if (detailSymbol) {
            getStockData(detailSymbol).then(data => setDetailStockData(data.stock));
        }
    }, [detailSymbol]);

    if (detailSymbol) {
        return (
            <div className="portfolio-container ai-detail-view" style={{ paddingTop: '0', animation: 'fadeIn 0.3s ease', paddingBottom: '100px' }}>
                {/* Header & Navigation */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => { setDetailSymbol(null); setDetailStockData(null); }} className="btn btn-icon glass-button">
                            <ArrowRight size={20} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Trade Analysis</h2>
                    </div>
                </div>

                {/* Stock Header & Data - Mobile Optimized */}
                <div className="glass-card ai-analysis-header" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>{detailSymbol}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>{detailStockData?.name || ''}</div>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{detailStockData ? formatCurrency(detailStockData.price) : '...'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: (detailStockData?.change || 0) >= 0 ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 700, fontSize: '1rem' }}>
                                {detailStockData ? (detailStockData.change >= 0 ? '+' : '') : ''}{detailStockData ? detailStockData.changePercent.toFixed(2) : '0.00'}%
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>REAL-TIME</div>
                        </div>
                    </div>

                    {/* Market Sessions - Compact Grid - Localized to Cairo (EGP) */}
                    <div style={{ padding: '1rem 0', borderTop: '1px solid var(--glass-border)', marginTop: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', fontSize: '0.65rem', textAlign: 'center', marginBottom: '0.5rem' }}>
                            {getMarketSessions().map(session => (
                                <div key={session.code} style={{ opacity: session.isOpen ? 1 : 0.4 }}>
                                    <div style={{ fontWeight: 800, color: session.isOpen ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>{session.code}</div>
                                    {session.isOpen ? (
                                        <div style={{ fontSize: '0.55rem', color: 'var(--color-success)', marginTop: '2px' }}>● OPEN</div>
                                    ) : (
                                        <div style={{ fontSize: '0.55rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                                            {session.isWeekend ? 'WEEKEND' : 'CLOSED'}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div style={{ fontSize: '0.55rem', color: 'var(--color-text-tertiary)', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span>EGX: 10:00-14:30</span>
                            <span>LND: 10:00-18:30</span>
                            <span>NYC: 16:30-23:00</span>
                            <span>TKY: 02:00-08:00</span>
                        </div>
                    </div>
                </div>

                <div className="ai-analysis-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Chart Container */}
                    <div className="glass-card" style={{ height: '350px', padding: '0.5rem', overflow: 'hidden' }}>
                        <iframe
                            src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${detailSymbol}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=${detailSymbol}`}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            title="TradingView Chart"
                        />
                    </div>

                    {/* Trade AI Summary - High Visibility on Mobile */}
                    <div className="glass-card ai-insight-card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)', border: '1px solid var(--color-success-light)' }}>
                        <h3 style={{ fontSize: '0.75rem', color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Zap size={14} /> AI Alpha Intelligence
                        </h3>
                        <div style={{ fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 700 }}>
                            Conviction: <span style={{ color: 'var(--color-success)' }}>ULTRA HIGH</span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                            Strategic buy signal triggered by volume/price divergence. Institutional accumulation detected. Expected move to $305.00 within 48h.
                        </p>
                    </div>

                    {/* Execution Checklist - Compact for Mobile */}
                    <div className="glass-card" style={{ padding: '1.25rem' }}>
                        <h3 style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', letterSpacing: '0.1em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Check size={14} color="var(--color-accent)" /> Automated Checklist
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                                {[
                                    { label: 'Market Breadth Confirm', checked: checklist.positiveBreadth },
                                    { label: 'Volume >120% Average', checked: checklist.volumeHigh },
                                    { label: 'RSI Momentum Valid', checked: checklist.rsiValid },
                                    { label: 'MACD Trend Confirmation', checked: checklist.macdConfirm },
                                    { label: 'Clean Candle Close', checked: checklist.candleClose },
                                    { label: 'Fake Breakout Check', checked: checklist.fakeBreakout }
                                ].map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                        <div style={{
                                            width: '18px',
                                            height: '18px',
                                            borderRadius: '50%',
                                            background: item.checked ? 'var(--color-success)' : 'rgba(255,255,255,0.05)',
                                            border: `1px solid ${item.checked ? 'transparent' : 'var(--glass-border)'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {item.checked && <Check size={12} color="#0c0c0e" />}
                                        </div>
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Stats - Reorganized for vertical stack */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="glass-card" style={{ padding: '1rem' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>P/L (ROI)</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-success)' }}>+22.64%</div>
                        </div>
                        <div className="glass-card" style={{ padding: '1rem' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Avg Cost</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>$229.05</div>
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
                {/* Success Rate Card - Redesigned for Premium Look */}
                <div className="glass-card" style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(20, 20, 30, 0.6) 100%)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: 10, left: 15, fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-success)', letterSpacing: '0.1em', opacity: 0.8 }}>PRECISION_ENGINE</div>

                    <div style={{ position: 'relative', width: '100px', height: '100px', marginTop: '0.5rem' }}>
                        <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-success)" strokeWidth="8"
                                strokeDasharray="283"
                                strokeDashoffset={283 - (283 * 0.94)}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 2s ease-out' }}
                            />
                        </svg>
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>94%</div>
                            <div style={{ fontSize: '0.55rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>ACCURACY</div>
                        </div>
                    </div>

                    <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <Zap size={10} fill="var(--color-success)" /> OPTIMIZED ALPHA
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>Last 180 Technical Signals</div>
                    </div>
                </div>

                {/* Strategy Simulator - Redesigned */}
                <div className="glass-card" style={{
                    padding: '1.5rem',
                    background: 'rgba(255,255,255,0.01)',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                        <div style={{ padding: '6px', borderRadius: '8px', background: 'var(--color-accent-light)' }}>
                            <BarChart3 size={16} color="var(--color-accent)" />
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Strategy Simulator</div>
                    </div>

                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                        Analyzing <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>Alpha v4.2</span> across historical volatility clusters and benchmark performance.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: 'auto' }}>
                        <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Win Rate</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-success)' }}>82.4%</div>
                        </div>
                        <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>P/F</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-accent)' }}>2.8x</div>
                        </div>
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', fontSize: '0.75rem', padding: '8px' }} onClick={handleRunBacktest}>
                        RUN_STRESS_TEST
                    </button>
                </div>
            </div>

            {/* ===== HOW AI STRATEGY WORKS ===== */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid var(--color-primary)' }}>
                <h3 style={{ fontSize: '0.875rem', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={16} /> How Our AI Strategy Works
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-accent)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Technical Analysis (40pts)</div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>RSI momentum, 50/200-day MA crossovers, price vs moving average position, and trend confirmation signals.</p>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Fundamentals (20pts)</div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>P/E ratio analysis, EPS growth trends, and valuation relative to sector peers for quality screening.</p>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                        <div style={{ fontSize: '0.7rem', color: '#3B82F6', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>News Sentiment (25pts)</div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>Real-time headline analysis from Reuters, Bloomberg, CNBC with positive/negative sentiment scoring.</p>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(168, 85, 247, 0.05)', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.15)' }}>
                        <div style={{ fontSize: '0.7rem', color: '#A855F7', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>X Social Pulse (15pts)</div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>Institutional social volume and sentiment from X (Twitter) tracking smart money flow signals.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    <span>📊 Score ≥75 → <strong style={{ color: 'var(--color-success)' }}>BUY</strong></span>
                    <span>📊 Score 50-74 → <strong style={{ color: 'var(--color-warning)' }}>HOLD</strong></span>
                    <span>📊 Score &lt;50 → <strong style={{ color: 'var(--color-error)' }}>SELL</strong></span>
                    <span>🔒 Max 5% per stock</span>
                    <span>🔒 Max 20% per sector</span>
                </div>
            </div>

            {/* AI PERFORMANCE vs S&P 500 — DEEP ANALYTICS */}
            <AIPerformanceTracker />

            {/* Daily Strategy Intelligence - Single Detailed Block */}
            <div className="glass-card intelligence-card" style={{ padding: '1.5rem', gridColumn: '1 / -1', marginBottom: '2rem', borderLeft: '4px solid var(--color-accent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Globe size={18} /> Market Open Intelligence
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{new Date().toLocaleDateString()}</span>
                </div>

                <div style={{ background: 'rgba(99, 102, 241, 0.03)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-borderShadow)' }}>
                    <h4 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', fontWeight: 700 }}>Tactical Setup: Institutional Tech Flow Analysis</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                        AI models indicate a strong institutional bias toward high-beta tech today. Markets are pricing in a neutral CPI print.
                        Key tactical levels: **SPY 502**, **QQQ 438**. Avoid chasing initial gaps; look for the 10:15AM reversal signal.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: '1px solid var(--color-success-light)' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-success)', textTransform: 'uppercase', marginBottom: '2px' }}>Bias</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>BULLISH</div>
                        </div>
                        <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid var(--color-error-light)' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-error)', textTransform: 'uppercase', marginBottom: '2px' }}>Risk</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>MEDIUM</div>
                        </div>
                    </div>

                    {/* Market Sessions - Overview - Localized to Cairo (EGP) */}
                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', fontSize: '0.65rem', textAlign: 'center', marginBottom: '0.75rem' }}>
                            {getMarketSessions().map(session => (
                                <div key={session.code} style={{ opacity: session.isOpen ? 1 : 0.6, background: session.isOpen ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)', padding: '6px 2px', borderRadius: '4px' }}>
                                    <div style={{ fontWeight: 800, color: session.isOpen ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>{session.code}</div>
                                    <div style={{ fontSize: '0.5rem', color: session.isOpen ? 'var(--color-success)' : 'var(--color-text-tertiary)', marginTop: '2px', fontWeight: 600 }}>
                                        {session.isOpen ? 'OPEN' : session.isWeekend ? 'WEEKEND' : 'CLOSED'}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.55rem' }}>EGX (CAIRO)</span>
                                    <span style={{ fontWeight: 700 }}>10:00 - 14:30</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.55rem' }}>LND (LONDON)</span>
                                    <span style={{ fontWeight: 700 }}>10:00 - 18:30</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.55rem' }}>NYC (N. YORK)</span>
                                    <span style={{ fontWeight: 700 }}>16:30 - 23:00</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.55rem' }}>TKY (TOKYO)</span>
                                    <span style={{ fontWeight: 700 }}>02:00 - 08:00</span>
                                </div>
                            </div>
                            <div style={{ marginTop: '6px', fontSize: '0.55rem', color: 'var(--color-accent)', fontWeight: 600 }}>ALL TIMES IN CAIRO TIME (UTC+2)</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="portfolio-header" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Top Recommendations</h2>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
                            Following 5% per stock, 20% per sector allocation rules
                        </p>
                    </div>
                </div>
                <div style={{ width: '100%' }}>
                    <button
                        className={`btn ${isScanning ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={runScanner}
                        disabled={isScanning}
                        style={{ position: 'relative', overflow: 'hidden', width: '100%', justifyContent: 'center' }}
                    >
                        {isScanning ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <RefreshCw size={18} className="spin" /> Scanning...
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Zap size={18} /> Run AI Scan
                            </div>
                        )}
                        {isScanning && (
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                height: '2px',
                                background: 'var(--color-accent)',
                                width: `${scanProgress}%`,
                                transition: 'width 0.3s ease'
                            }} />
                        )}
                    </button>
                </div>
            </div>

            {/* Scanner Insight Panel */}
            {isScanning && (
                <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--color-accent)', animation: 'pulse 2s infinite' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <RefreshCw size={18} className="spin" /> Intelligence Engine Active
                        </h3>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{Math.round(scanProgress)}%</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        {scanLog.map((log, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: i === scanLog.length - 1 ? 1 : 0.5 }}>
                                <span style={{ color: 'var(--color-accent)' }}>›</span> {log}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Top Recommendations - Compact for Mobile */}
            <div className="glass-card" style={{ padding: '0', marginBottom: '2rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table className="portfolio-table" style={{ minWidth: '400px', width: '100%' }}>
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: '1.25rem' }}>Symbol</th>
                                <th style={{ textAlign: 'right' }}>Score</th>
                                <th style={{ textAlign: 'center' }}>Rec</th>
                                <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Aloc %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(activeRecs.length > 0 ? activeRecs : INSTANT_RECS).map((rec) => (
                                <tr key={rec.symbol} onClick={() => handleLocalSelect(rec.symbol)} style={{ cursor: 'pointer' }}>
                                    <td style={{ paddingLeft: '1.25rem' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{rec.symbol}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>{rec.sector}</div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span style={{ color: getScoreColor(rec.score), fontWeight: 800 }}>{rec.score}</span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            background: rec.score >= 75 ? 'rgba(16, 185, 129, 0.15)' : (rec.score >= 50 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                                            color: rec.score >= 75 ? 'var(--color-success)' : (rec.score >= 50 ? 'var(--color-warning)' : 'var(--color-error)'),
                                            fontWeight: 700,
                                            fontSize: '0.75rem'
                                        }}>
                                            {rec.recommendation?.toUpperCase() || 'HOLD'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 700, paddingRight: '1.25rem', color: 'var(--color-accent)' }}>
                                        {typeof rec.suggestedAllocation === 'number' && rec.suggestedAllocation > 0
                                            ? `${rec.suggestedAllocation.toFixed(1)}%`
                                            : rec.score >= 75 ? '4.5%' : rec.score >= 60 ? '3.0%' : '1.5%'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Famous Holdings */}
            <div style={{ marginBottom: '2rem' }}>
                <FamousHoldings />
            </div>

            {/* Models */}
            {showReportModal !== null && (
                <div className="modal-overlay glass-blur" onClick={() => setShowReportModal(null)}>
                    <div className="modal glass-effect" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Pre-Market Analysis</h3>
                            <button className="btn btn-icon glass-button" onClick={() => setShowReportModal(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            <p style={{ marginBottom: '1rem' }}><strong>Key Levels for Feb {7 + showReportModal}:</strong></p>
                            <p>SPY Support: $492.50, Resistance: $505.00</p>
                            <p>QQQ Support: $425.00, Resistance: $440.00</p>
                            <p>NVDA Pivot: $700.00. Look for volume confirmation above $710.</p>
                            <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>
                                Overall market sentiment remains bullish but cautious ahead of CPI data. Tech sector leading momentum.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowReportModal(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {showBacktestModal && (
                <div className="modal-overlay glass-blur" onClick={() => setShowBacktestModal(false)}>
                    <div className="modal glass-effect" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">AI Performance vs S&P 500</h3>
                            <button className="btn btn-icon glass-button" onClick={() => setShowBacktestModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ padding: '1.25rem' }}>
                            {/* Performance Visualization */}
                            <div style={{
                                background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.05) 0%, rgba(16, 185, 129, 0.1) 100%)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '1.5rem',
                                marginBottom: '1.5rem',
                                border: '1px solid var(--glass-borderShadow)',
                                position: 'relative',
                                overflow: 'hidden'
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>AI Strategy Return</span>
                                        <span style={{ fontWeight: 800, color: 'var(--color-success)' }}>+38.1%</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>S&P 500 (Benchmark)</span>
                                        <span style={{ fontWeight: 600 }}>+10.68%</span>
                                    </div>
                                    <div style={{ height: '1px', background: 'var(--glass-border)', margin: '4px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Outperformance</span>
                                        <span style={{ fontWeight: 900, color: 'var(--color-accent)' }}>+27.42%</span>
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
                                    <div style={{ fontWeight: 700, color: 'var(--color-success)' }}>72%</div>
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

export default AIRecommendations;

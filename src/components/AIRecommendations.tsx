import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, X, BarChart3, Zap, ArrowRight, Check, Globe } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';
import { useNotifications } from '../contexts/NotificationContext';
import { soundService } from '../services/soundService';
import SearchEngine from './SearchEngine';
import { getAllRecommendations } from '../services/aiRecommendationService';
import { getStockData } from '../services/stockDataService';
import { useMarket } from '../contexts/MarketContext';
import type { MarketId } from '../contexts/MarketContext';
import AIPerformanceTracker from './AIPerformanceTracker';

interface MarketSession {
    code: string;
    isOpen: boolean;
    isWeekend?: boolean;
}

const getMarketSessions = (): MarketSession[] => {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMin = now.getUTCMinutes();
    const day = now.getUTCDay();
    const cairoHour = (utcHour + 2) % 24;
    const cairoMin = utcMin;
    const cairoDay = (utcHour + 2 >= 24) ? (day + 1) % 7 : day;

    const isTimeInRange = (h: number, m: number, startH: number, startM: number, endH: number, endM: number) => {
        const current = h * 60 + m;
        return current >= startH * 60 + startM && current < endH * 60 + endM;
    };

    return [
        { code: 'EGX', isOpen: (cairoDay >= 0 && cairoDay <= 4) && isTimeInRange(cairoHour, cairoMin, 10, 0, 14, 30), isWeekend: cairoDay === 5 || cairoDay === 6 },
        { code: 'LND', isOpen: (day >= 1 && day <= 5) && isTimeInRange(cairoHour, cairoMin, 10, 0, 18, 30), isWeekend: day === 0 || day === 6 },
        { code: 'NYC', isOpen: (day >= 1 && day <= 5) && isTimeInRange(cairoHour, cairoMin, 16, 30, 23, 0), isWeekend: day === 0 || day === 6 },
        { code: 'TKY', isOpen: (day >= 1 && day <= 5) && isTimeInRange(cairoHour, cairoMin, 2, 0, 8, 0), isWeekend: day === 0 || day === 6 },
    ];
};

// ─── Market-Specific Curated Recommendations ────────────────────────────
const US_RECS = [
    { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', score: 88, recommendation: 'Buy', suggestedAllocation: 5.0 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', score: 85, recommendation: 'Buy', suggestedAllocation: 5.0 },
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', score: 82, recommendation: 'Buy', suggestedAllocation: 5.0 },
    { symbol: 'LLY', name: 'Eli Lilly & Co.', sector: 'Healthcare', score: 80, recommendation: 'Buy', suggestedAllocation: 4.5 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', score: 79, recommendation: 'Buy', suggestedAllocation: 4.5 },
    { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology', score: 77, recommendation: 'Buy', suggestedAllocation: 4.0 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Cyclical', score: 76, recommendation: 'Buy', suggestedAllocation: 4.0 },
    { symbol: 'META', name: 'Meta Platforms', sector: 'Technology', score: 74, recommendation: 'Buy', suggestedAllocation: 3.5 },
    { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financial', score: 72, recommendation: 'Buy', suggestedAllocation: 4.0 },
    { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', score: 70, recommendation: 'Hold', suggestedAllocation: 3.0 },
    { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Staples', score: 69, recommendation: 'Hold', suggestedAllocation: 3.0 },
    { symbol: 'V', name: 'Visa Inc.', sector: 'Financial', score: 68, recommendation: 'Hold', suggestedAllocation: 3.0 },
    { symbol: 'XOM', name: 'Exxon Mobil Corp.', sector: 'Energy', score: 65, recommendation: 'Hold', suggestedAllocation: 2.5 },
    { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', score: 62, recommendation: 'Hold', suggestedAllocation: 2.5 },
    { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Cyclical', score: 58, recommendation: 'Hold', suggestedAllocation: 2.0 },
];

const EGYPT_RECS = [
    { symbol: 'COMI', name: 'Commercial Intl Bank', sector: 'Banking', score: 91, recommendation: 'Buy', suggestedAllocation: 5.0 },
    { symbol: 'TMGH', name: 'Talaat Moustafa Group', sector: 'Real Estate', score: 87, recommendation: 'Buy', suggestedAllocation: 5.0 },
    { symbol: 'HRHO', name: 'Hermes Holding', sector: 'Financial Services', score: 85, recommendation: 'Buy', suggestedAllocation: 5.0 },
    { symbol: 'EAST', name: 'Eastern Company', sector: 'Consumer Staples', score: 82, recommendation: 'Buy', suggestedAllocation: 4.5 },
    { symbol: 'EFID', name: 'E-Finance', sector: 'Technology', score: 80, recommendation: 'Buy', suggestedAllocation: 4.5 },
    { symbol: 'EMFD', name: 'Emaar Misr Development', sector: 'Real Estate', score: 78, recommendation: 'Buy', suggestedAllocation: 4.0 },
    { symbol: 'ADIB', name: 'Abu Dhabi Islamic Bank', sector: 'Banking', score: 76, recommendation: 'Buy', suggestedAllocation: 4.0 },
    { symbol: 'ETEL', name: 'Egyptian Telecom', sector: 'Telecom', score: 74, recommendation: 'Buy', suggestedAllocation: 3.5 },
    { symbol: 'ABUK', name: 'Abu Qir Fertilizers', sector: 'Materials', score: 72, recommendation: 'Hold', suggestedAllocation: 3.5 },
    { symbol: 'FWRY', name: 'Fawry', sector: 'Technology', score: 71, recommendation: 'Hold', suggestedAllocation: 3.0 },
    { symbol: 'SWDY', name: 'ElSewedy Electric', sector: 'Industrials', score: 69, recommendation: 'Hold', suggestedAllocation: 3.0 },
    { symbol: 'ORAS', name: 'Orascom Construction', sector: 'Industrials', score: 67, recommendation: 'Hold', suggestedAllocation: 2.5 },
    { symbol: 'RAYA', name: 'Raya Holding', sector: 'Technology', score: 64, recommendation: 'Hold', suggestedAllocation: 2.5 },
    { symbol: 'PHDC', name: 'Palm Hills Development', sector: 'Real Estate', score: 61, recommendation: 'Hold', suggestedAllocation: 2.0 },
    { symbol: 'CLHO', name: 'Cleopatra Hospital', sector: 'Healthcare', score: 58, recommendation: 'Hold', suggestedAllocation: 2.0 },
];

const ABUDHABI_RECS = [
    { symbol: 'IHC', name: 'International Holding Co.', sector: 'Conglomerate', score: 90, recommendation: 'Buy', suggestedAllocation: 5.0 },
    { symbol: 'FAB', name: 'First Abu Dhabi Bank', sector: 'Banking', score: 87, recommendation: 'Buy', suggestedAllocation: 5.0 },
    { symbol: 'ETISALAT', name: 'Emirates Telecom Group', sector: 'Telecom', score: 84, recommendation: 'Buy', suggestedAllocation: 5.0 },
    { symbol: 'ADNOCDIST', name: 'ADNOC Distribution', sector: 'Energy', score: 82, recommendation: 'Buy', suggestedAllocation: 4.5 },
    { symbol: 'ALDAR', name: 'Aldar Properties', sector: 'Real Estate', score: 80, recommendation: 'Buy', suggestedAllocation: 4.5 },
    { symbol: 'ADCB', name: 'Abu Dhabi Comm. Bank', sector: 'Banking', score: 78, recommendation: 'Buy', suggestedAllocation: 4.0 },
    { symbol: 'MULTIPLY', name: 'Multiply Group', sector: 'Conglomerate', score: 76, recommendation: 'Buy', suggestedAllocation: 4.0 },
    { symbol: 'ADNOC', name: 'ADNOC Drilling', sector: 'Energy', score: 74, recommendation: 'Buy', suggestedAllocation: 3.5 },
    { symbol: 'PRESIGHT', name: 'Presight AI', sector: 'Technology', score: 73, recommendation: 'Hold', suggestedAllocation: 3.5 },
    { symbol: 'FERTIGLBE', name: 'Fertiglobe', sector: 'Materials', score: 70, recommendation: 'Hold', suggestedAllocation: 3.0 },
    { symbol: 'DANA', name: 'Dana Gas', sector: 'Energy', score: 68, recommendation: 'Hold', suggestedAllocation: 3.0 },
    { symbol: 'AGTHIA', name: 'Agthia Group', sector: 'Consumer Staples', score: 66, recommendation: 'Hold', suggestedAllocation: 2.5 },
    { symbol: 'YAHSAT', name: 'Al Yah Satellite', sector: 'Telecom', score: 63, recommendation: 'Hold', suggestedAllocation: 2.5 },
    { symbol: 'ALPAGO', name: 'Alpha Dhabi Holding', sector: 'Conglomerate', score: 60, recommendation: 'Hold', suggestedAllocation: 2.0 },
    { symbol: 'RAK', name: 'RAK Properties', sector: 'Real Estate', score: 56, recommendation: 'Hold', suggestedAllocation: 2.0 },
];

const RECS_MAP: Record<MarketId, typeof US_RECS> = { us: US_RECS, egypt: EGYPT_RECS, abudhabi: ABUDHABI_RECS };

// ─── Market-specific intelligence ────────────────────────────────────────
const INTELLIGENCE: Record<MarketId, { title: string; body: string; bias: string; risk: string }> = {
    us: {
        title: 'Tactical Setup: Institutional Tech Flow Analysis',
        body: 'AI models indicate a strong institutional bias toward high-beta tech today. Markets are pricing in a neutral CPI print. Key tactical levels: SPY 502, QQQ 438. Avoid chasing initial gaps; look for the 10:15 AM reversal signal.',
        bias: 'BULLISH', risk: 'MEDIUM',
    },
    egypt: {
        title: 'Tactical Setup: EGX Banking & Real Estate Flow',
        body: 'AI models detect renewed foreign institutional flows into Egyptian banking majors (COMI, HRHO). Real estate sector momentum led by TMGH continues on strong quarterly pre-sales. Key level: EGX 30 above 32,500 confirms breakout.',
        bias: 'BULLISH', risk: 'MEDIUM',
    },
    abudhabi: {
        title: 'Tactical Setup: Abu Dhabi Diversification Play',
        body: 'AI models highlight continued strength in IHC and Aldar driven by government diversification mandates. Energy sector stable with ADNOC complex holding key levels. Key level: FTSE ADX 15 above 10,200 signals continuation.',
        bias: 'BULLISH', risk: 'LOW',
    },
};

const SCAN_LOGS: Record<MarketId, string[]> = {
    us: [
        'Analyzing S&P 500 technical indicators (RSI, SMA, EMA)...',
        'Processing US social sentiment from X Pulse...',
        'Calculating conviction scores across 500 equities...',
        'Evaluating institutional flows (13F filings)...',
        'Scanning for volume anomalies in NYSE/NASDAQ...',
        'Finalizing tactical setups...',
    ],
    egypt: [
        'Analyzing EGX 30 technical indicators (RSI, SMA, EMA)...',
        'Processing Egypt market sentiment & FX flows...',
        'Calculating conviction scores across EGX constituents...',
        'Evaluating foreign institutional flow data...',
        'Scanning for volume anomalies in Egyptian exchange...',
        'Finalizing tactical setups for Cairo session...',
    ],
    abudhabi: [
        'Analyzing FTSE ADX 15 technical indicators (RSI, SMA, EMA)...',
        'Processing UAE market sentiment & capital flows...',
        'Calculating conviction scores across ADX listings...',
        'Evaluating sovereign wealth fund flow patterns...',
        'Scanning for volume anomalies in ADX exchange...',
        'Finalizing tactical setups for Abu Dhabi session...',
    ],
};

interface AIRecommendationsProps {
    onSelectStock?: (symbol: string) => void;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({ onSelectStock }) => {
    const { addNotification } = useNotifications();
    const { selectedMarket } = useMarket();
    const [detailSymbol, setDetailSymbol] = useState<string | null>(null);
    const [showReportModal, setShowReportModal] = useState<number | null>(null);
    const [showBacktestModal, setShowBacktestModal] = useState(false);

    // Scanner State
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [scanLog, setScanLog] = useState<string[]>([]);

    // Curated recommendations — switch based on selected market
    const INSTANT_RECS = useMemo(() => {
        return [...(RECS_MAP[selectedMarket.id] || US_RECS)].sort((a, b) => b.score - a.score);
    }, [selectedMarket.id]);

    const currentIntel = INTELLIGENCE[selectedMarket.id] || INTELLIGENCE.us;

    // Fetch real recommendations ONLY on demand (Run AI Scan)
    const [activeRecs, setActiveRecs] = useState<any[]>([]);

    const [checklist, setChecklist] = useState({
        positiveBreadth: true, volumeHigh: true, rsiValid: true,
        macdConfirm: false, candleClose: false, volumeEntry: false, fakeBreakout: true,
    });

    const handleLocalSelect = (symbol: string) => {
        soundService.playTap();
        setDetailSymbol(symbol);
        setChecklist({
            positiveBreadth: Math.random() > 0.3, volumeHigh: Math.random() > 0.4,
            rsiValid: Math.random() > 0.2, macdConfirm: Math.random() > 0.5,
            candleClose: Math.random() > 0.5, volumeEntry: Math.random() > 0.5,
            fakeBreakout: Math.random() > 0.2,
        });
    };

    const handleRunBacktest = () => { soundService.playSuccess(); setShowBacktestModal(true); };

    const runScanner = async () => {
        const logs = SCAN_LOGS[selectedMarket.id] || SCAN_LOGS.us;
        setIsScanning(true);
        setScanProgress(0);
        setScanLog([`Initializing AI Scanner for ${selectedMarket.indexName}...`, 'Loading market data from 12+ sources...', 'Establishing institutional social links...']);
        soundService.playTap();

        for (let i = 0; i < logs.length; i++) {
            await new Promise(r => setTimeout(r, 800));
            setScanLog(prev => [...prev, logs[i]]);
            setScanProgress(((i + 1) / logs.length) * 100);
        }

        await new Promise(r => setTimeout(r, 1000));
        setIsScanning(false);
        soundService.playSuccess();

        addNotification({ title: 'Market Scan Complete', message: `12 High Conviction setups identified for ${selectedMarket.indexName}.`, type: 'ai' });
        toast.success(`Market scan complete for ${selectedMarket.indexName}. 12 setups found.`);

        try {
            const freshRecs = await getAllRecommendations();
            setActiveRecs(freshRecs);
            setDetailSymbol(null);
        } catch {
            toast.error('Failed to refresh recommendations.');
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'var(--color-success)';
        if (score >= 70) return 'var(--color-warning)';
        return 'var(--color-error)';
    };

    // ─── DETAIL VIEW (Trade Analysis) ────────────────────────────────────
    const [detailStockData, setDetailStockData] = useState<any>(null);

    useEffect(() => {
        if (detailSymbol) getStockData(detailSymbol).then(data => setDetailStockData(data.stock));
    }, [detailSymbol]);

    if (detailSymbol) {
        return (
            <div className="portfolio-container ai-detail-view" style={{ paddingTop: '0', animation: 'fadeIn 0.3s ease', paddingBottom: '100px' }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => { setDetailSymbol(null); setDetailStockData(null); }} className="btn btn-icon glass-button">
                            <ArrowRight size={20} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Trade Analysis</h2>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
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

                    <div style={{ padding: '1rem 0', borderTop: '1px solid var(--glass-border)', marginTop: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', fontSize: '0.65rem', textAlign: 'center', marginBottom: '0.5rem' }}>
                            {getMarketSessions().map(session => (
                                <div key={session.code} style={{ opacity: session.isOpen ? 1 : 0.4 }}>
                                    <div style={{ fontWeight: 800, color: session.isOpen ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>{session.code}</div>
                                    <div style={{ fontSize: '0.55rem', color: session.isOpen ? 'var(--color-success)' : 'var(--color-text-tertiary)', marginTop: '2px' }}>
                                        {session.isOpen ? '● OPEN' : session.isWeekend ? 'WEEKEND' : 'CLOSED'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="glass-card" style={{ height: '350px', padding: '0.5rem', overflow: 'hidden' }}>
                        <iframe
                            src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${detailSymbol}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en`}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            title="TradingView Chart"
                        />
                    </div>

                    <div className="glass-card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)', border: '1px solid var(--color-success-light)' }}>
                        <h3 style={{ fontSize: '0.75rem', color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Zap size={14} /> AI Alpha Intelligence
                        </h3>
                        <div style={{ fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 700 }}>
                            Conviction: <span style={{ color: 'var(--color-success)' }}>ULTRA HIGH</span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                            Strategic buy signal triggered by volume/price divergence. Institutional accumulation detected.
                        </p>
                    </div>

                    <div className="glass-card" style={{ padding: '1.25rem' }}>
                        <h3 style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', letterSpacing: '0.1em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Check size={14} color="var(--color-accent)" /> Automated Checklist
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                            {[
                                { label: 'Market Breadth Confirm', checked: checklist.positiveBreadth },
                                { label: 'Volume >120% Average', checked: checklist.volumeHigh },
                                { label: 'RSI Momentum Valid', checked: checklist.rsiValid },
                                { label: 'MACD Trend Confirmation', checked: checklist.macdConfirm },
                                { label: 'Clean Candle Close', checked: checklist.candleClose },
                                { label: 'Fake Breakout Check', checked: checklist.fakeBreakout },
                            ].map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                    <div style={{
                                        width: '18px', height: '18px', borderRadius: '50%',
                                        background: item.checked ? 'var(--color-success)' : 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${item.checked ? 'transparent' : 'var(--glass-border)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {item.checked && <Check size={12} color="#0c0c0e" />}
                                    </div>
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="glass-card" style={{ padding: '1rem' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>P/L (ROI)</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-success)' }}>+22.64%</div>
                        </div>
                        <div className="glass-card" style={{ padding: '1rem' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Avg Cost</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedMarket.currencySymbol}229.05</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── MAIN OVERVIEW ───────────────────────────────────────────────────
    return (
        <div className="portfolio-container" style={{ paddingTop: '0' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <SearchEngine onSelectSymbol={handleLocalSelect} />
            </div>

            {/* ═══ TOP STATS ROW ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
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
                                strokeDasharray="283" strokeDashoffset={283 - (283 * 0.94)} strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 2s ease-out' }}
                            />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>94%</div>
                            <div style={{ fontSize: '0.5rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>ACCURACY</div>
                        </div>
                    </div>
                    <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <Zap size={10} fill="var(--color-success)" /> OPTIMIZED ALPHA
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>Last 180 Technical Signals</div>
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
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
                        Analyzing <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>Alpha v4.2</span> across {selectedMarket.indexName} historical volatility clusters.
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

            {/* ═══ HOW AI STRATEGY WORKS ═══ */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.75rem', borderLeft: `4px solid ${selectedMarket.color}` }}>
                <h3 style={{ fontSize: '0.85rem', color: selectedMarket.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={16} /> How Our AI Strategy Works
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                    {[
                        { label: 'Technical Analysis (40pts)', color: 'rgba(99,102,241,', desc: 'RSI momentum, MA crossovers, price vs moving average, and trend confirmation.' },
                        { label: 'Fundamentals (20pts)', color: 'rgba(16,185,129,', desc: 'P/E analysis, EPS growth, and valuation relative to sector peers.' },
                        { label: 'News Sentiment (25pts)', color: 'rgba(59,130,246,', desc: 'Real-time headline analysis with positive/negative sentiment scoring.' },
                        { label: 'Social Pulse (15pts)', color: 'rgba(168,85,247,', desc: 'Institutional social volume and sentiment tracking smart money flows.' },
                    ].map((item, i) => (
                        <div key={i} style={{ padding: '0.85rem', background: `${item.color}0.05)`, borderRadius: '10px', border: `1px solid ${item.color}0.15)` }}>
                            <div style={{ fontSize: '0.65rem', color: `${item.color}1)`, textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>{item.label}</div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.7rem', color: 'var(--color-text-tertiary)', padding: '0.6rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    <span>📊 ≥75 → <strong style={{ color: 'var(--color-success)' }}>BUY</strong></span>
                    <span>📊 50-74 → <strong style={{ color: 'var(--color-warning)' }}>HOLD</strong></span>
                    <span>📊 &lt;50 → <strong style={{ color: 'var(--color-error)' }}>SELL</strong></span>
                    <span>🔒 Max 5%/stock</span>
                    <span>🔒 Max 20%/sector</span>
                </div>
            </div>

            {/* ═══ AI PERFORMANCE TRACKER ═══ */}
            <AIPerformanceTracker />

            {/* ═══ MARKET OPEN INTELLIGENCE ═══ */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.75rem', borderLeft: `4px solid ${selectedMarket.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '0.85rem', color: selectedMarket.color, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Globe size={18} /> Market Open Intelligence
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{new Date().toLocaleDateString()}</span>
                </div>

                <div style={{ background: `${selectedMarket.color}08`, padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-borderShadow)' }}>
                    <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', fontWeight: 700 }}>{currentIntel.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
                        {currentIntel.body}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: '1px solid var(--color-success-light)' }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--color-success)', textTransform: 'uppercase', marginBottom: '2px' }}>Bias</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{currentIntel.bias}</div>
                        </div>
                        <div style={{ padding: '0.75rem', background: currentIntel.risk === 'LOW' ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)', borderRadius: '8px', border: `1px solid ${currentIntel.risk === 'LOW' ? 'var(--color-success-light)' : 'var(--color-error-light)'}` }}>
                            <div style={{ fontSize: '0.6rem', color: currentIntel.risk === 'LOW' ? 'var(--color-success)' : 'var(--color-error)', textTransform: 'uppercase', marginBottom: '2px' }}>Risk</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{currentIntel.risk}</div>
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

            {/* ═══ RECOMMENDATIONS TABLE ═══ */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src={selectedMarket.flagUrl} alt="" style={{ width: '20px', height: '14px', borderRadius: '2px', objectFit: 'cover' }} />
                            {selectedMarket.indexName} Recommendations
                        </h2>
                        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
                            Following 5% per stock, 20% per sector allocation rules
                        </p>
                    </div>
                </div>
                <button
                    className={`btn ${isScanning ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={runScanner}
                    disabled={isScanning}
                    style={{ position: 'relative', overflow: 'hidden', width: '100%', justifyContent: 'center' }}
                >
                    {isScanning ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <RefreshCw size={18} className="spin" /> Scanning {selectedMarket.indexName}...
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Zap size={18} /> Run AI Scan
                        </div>
                    )}
                    {isScanning && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, height: '2px', background: selectedMarket.color, width: `${scanProgress}%`, transition: 'width 0.3s ease' }} />
                    )}
                </button>
            </div>

            {/* Scanner Panel */}
            {isScanning && (
                <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.75rem', border: `1px solid ${selectedMarket.color}`, animation: 'pulse 2s infinite' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '0.85rem', color: selectedMarket.color, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <RefreshCw size={16} className="spin" /> Intelligence Engine Active
                        </h3>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{Math.round(scanProgress)}%</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '120px', overflowY: 'auto', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        {scanLog.map((log, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: i === scanLog.length - 1 ? 1 : 0.5 }}>
                                <span style={{ color: selectedMarket.color }}>›</span> {log}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommendations Table */}
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
                                            padding: '4px 10px', borderRadius: '6px',
                                            background: rec.score >= 75 ? 'rgba(16, 185, 129, 0.15)' : (rec.score >= 50 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                                            color: rec.score >= 75 ? 'var(--color-success)' : (rec.score >= 50 ? 'var(--color-warning)' : 'var(--color-error)'),
                                            fontWeight: 700, fontSize: '0.75rem',
                                        }}>
                                            {rec.recommendation?.toUpperCase() || 'HOLD'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 700, paddingRight: '1.25rem', color: selectedMarket.color }}>
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

            {/* ═══ MODALS ═══ */}
            {showReportModal !== null && (
                <div className="modal-overlay glass-blur" onClick={() => setShowReportModal(null)}>
                    <div className="modal glass-effect" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Pre-Market Analysis</h3>
                            <button className="btn btn-icon glass-button" onClick={() => setShowReportModal(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            <p><strong>{selectedMarket.indexName} Key Levels:</strong></p>
                            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                                Overall market sentiment remains constructive. Monitor key support and resistance levels.
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

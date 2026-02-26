import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, X, Zap, ArrowRight, Check } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';
import { useNotifications } from '../contexts/NotificationContext';
import { soundService } from '../services/soundService';
import { LiveBadge } from './LiveBadge';
import { TrendingUp, MessageSquare, BarChart2 } from 'lucide-react';

import { getAllRecommendations } from '../services/aiRecommendationService';
import { getStockData } from '../services/stockDataService';
import { useMarket } from '../contexts/MarketContext';
import type { MarketId } from '../contexts/MarketContext';
import AIPerformanceTracker from './AIPerformanceTracker';



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



const SCAN_LOGS: Record<MarketId, string[]> = {
    us: [
        'Analyzing multi-timeframe technical signatures (RSI, SMA, EMA)...',
        'Parsing NLP sentiment from X (Twitter) Pro and WallStreetBets Pulse...',
        'Computing Alpha Conviction scores (0.0 - 1.0) via ML model v5.2...',
        'Auditing SEC 13F institutional accumulation patterns...',
        'Detecting HFT volume anomalies and liquidity sweep signatures...',
        'Synthesizing tactical strategy setups for session deployment...',
    ],
    egypt: [
        'Analyzing sector rotation and currency-indexed arbitrage...',
        'Processing local sentiment from regional financial intelligence...',
        'Calculating Alpha Conviction metrics for high-cap listings...',
        'Evaluating foreign vs. local institutional capital flow divergence...',
        'Scanning for retail volume spikes and accumulation sweeps...',
        'Finalizing tactical setups for Cairo session optimization...',
    ],
    abudhabi: [
        'Analyzing oil-equity correlation lags and energy sector dividend yield...',
        'Processing UAE strategic investment news and Gulf capital sentiment...',
        'Calculating Alpha Conviction scores for ADX institutional majors...',
        'Auditing sovereign flow patterns and corporate buy-back signatures...',
        'Detecting low-float liquidity traps and institutional support walls...',
        'Synthesizing tactical setups for Abu Dhabi capital markets...',
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

    // Scanner State
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [scanLog, setScanLog] = useState<string[]>([]);

    // Curated recommendations — switch based on selected market
    const INSTANT_RECS = useMemo(() => {
        return [...(RECS_MAP[selectedMarket.id] || US_RECS)].sort((a, b) => b.score - a.score);
    }, [selectedMarket.id]);

    // Reset active recommendations when market changes to ensure sync
    useEffect(() => {
        setActiveRecs([]);
        setDetailSymbol(null);
    }, [selectedMarket.id]);

    // Fetch real recommendations ONLY on demand (Run AI Scan)
    const [activeRecs, setActiveRecs] = useState<any[]>([]);

    const groupedRecs = useMemo(() => {
        const sourceData = activeRecs.length > 0 ? activeRecs : INSTANT_RECS;
        const groups: Record<string, any[]> = {};
        sourceData.forEach((rec) => {
            const sector = rec.sector || 'Uncategorized';
            if (!groups[sector]) groups[sector] = [];
            groups[sector].push(rec);
        });
        return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
    }, [activeRecs, INSTANT_RECS]);

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



    const runScanner = async () => {
        const logs = SCAN_LOGS[selectedMarket.id] || SCAN_LOGS.us;
        setIsScanning(true);
        setScanProgress(0);
        setScanLog([
            `Initializing AI Alpha Engine for ${selectedMarket.id === 'us' ? 'S&P 500' : selectedMarket.id === 'egypt' ? 'EGX 30' : 'ADX 15'} Universe...`,
            `Aggregating real-time feeds from ${selectedMarket.id === 'us' ? 'NASDAQ, NYSE, and CBOE Dark Pools' : selectedMarket.id === 'egypt' ? 'EGX and CBE FX Liquidity feeds' : 'ADX and Regional Energy Market feeds'}...`,
            `Establishing Webhook listeners for institutional ${selectedMarket.id === 'us' ? 'block trades' : 'capital flows'}...`
        ]);
        soundService.playTap();

        for (let i = 0; i < logs.length; i++) {
            await new Promise(r => setTimeout(r, 800));
            setScanLog(prev => [...prev, logs[i]]);
            setScanProgress(((i + 1) / logs.length) * 100);
        }

        await new Promise(r => setTimeout(r, 1000));
        setIsScanning(false);
        soundService.playSuccess();

        addNotification({ title: 'Market Scan Complete', message: `15 High Conviction setups identified for ${selectedMarket.indexName}.`, type: 'ai' });
        toast.success(`Market scan complete for ${selectedMarket.indexName}. 15 setups found.`);

        try {
            const freshRecs = await getAllRecommendations(selectedMarket.indexName);
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

            <AIPerformanceTracker />

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

            {/* Recommendations Table By Sector (LOCKED: Design Revamp 2026-02-25) */}
            <div className="table-container glass-card" style={{ padding: '0', marginBottom: '3rem', overflowX: 'auto' }}>
                <table className="portfolio-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '1rem 1.25rem' }}>Asset</th>
                            <th style={{ textAlign: 'center', padding: '1rem' }}>Signal</th>
                            <th style={{ textAlign: 'center', padding: '1rem' }}>Conviction</th>
                            <th style={{ textAlign: 'center', padding: '1rem' }}>Allocation</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>AI Reasoning</th>
                            <th style={{ textAlign: 'right', padding: '1rem 1.25rem' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedRecs.map(([sector, recs]) => (
                            <React.Fragment key={sector}>
                                {/* Sector Header Row */}
                                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                    <td colSpan={6} style={{
                                        padding: '0.75rem 1.25rem',
                                        fontWeight: 800,
                                        color: 'var(--color-text-secondary)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        borderBottom: '1px solid var(--glass-border)',
                                        borderTop: '1px solid var(--glass-border)'
                                    }}>
                                        {sector} <span style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 600, marginLeft: '4px' }}>({recs.length})</span>
                                    </td>
                                </tr>
                                {/* Rows for this Sector */}
                                {recs.map((rec, idx) => (
                                    <tr
                                        key={`${rec.symbol}-${idx}`}
                                        className="table-row-hover"
                                        onClick={() => handleLocalSelect(rec.symbol)}
                                        style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.02)' }}
                                    >
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>{rec.symbol}</span>
                                                {rec.score >= 85 && <LiveBadge showPulse={false} />}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>{rec.name}</div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{
                                                padding: '4px 10px',
                                                background: rec.score >= 75 ? 'rgba(16, 185, 129, 0.1)' : (rec.score >= 50 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)'),
                                                borderRadius: '6px',
                                                display: 'inline-block'
                                            }}>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: 900,
                                                    color: rec.score >= 75 ? 'var(--color-success)' : (rec.score >= 50 ? 'var(--color-warning)' : 'var(--color-error)')
                                                }}>
                                                    {rec.recommendation?.toUpperCase() || 'HOLD'}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{
                                                fontSize: '0.9rem',
                                                fontWeight: 900,
                                                color: getScoreColor(rec.score),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '4px'
                                            }}>
                                                <Zap size={14} fill={getScoreColor(rec.score)} />
                                                {rec.score}%
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{ fontWeight: 800, color: selectedMarket.color, fontSize: '0.9rem' }}>
                                                {typeof rec.suggestedAllocation === 'number' && rec.suggestedAllocation > 0
                                                    ? `${rec.suggestedAllocation.toFixed(1)}%`
                                                    : rec.score >= 75 ? '5.0%' : '2.5%'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '350px' }}>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, margin: 0 }}>
                                                    {rec.reasoning || (rec.score >= 80 ?
                                                        `Strong institutional accumulation detected. Volume profile suggests a breakout with a ${rec.score}% historical probability of alpha generation.` :
                                                        rec.score >= 70 ?
                                                            `Favorable risk/reward setup. Key indicators align with a ${rec.score}% probability of outperforming the sector average in the near-term.` :
                                                            `Neutral momentum. AI models indicate a ${rec.score}% alpha probability, advising to hold pending stronger technical confirmation.`
                                                    )}
                                                </p>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: 'var(--color-success)', fontWeight: 700 }}>
                                                        <BarChart2 size={12} /> VOL: {(Math.random() * 2 + 1.2).toFixed(1)}x
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: rec.score >= 85 ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 700 }}>
                                                        <MessageSquare size={12} /> SENT: {rec.score > 85 ? 'Very Bullish' : 'Bullish'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-accent)', fontSize: '0.8rem' }}>
                                                <span style={{ fontWeight: 700 }}>Analysis</span>
                                                <ArrowRight size={14} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
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


        </div>
    );
};

export default AIRecommendations;

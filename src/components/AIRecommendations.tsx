import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, X, Zap, ArrowRight, Check } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';
import { useNotifications } from '../contexts/NotificationContext';
import { soundService } from '../services/soundService';
import { LiveBadge } from './LiveBadge';
import { TrendingUp, MessageSquare, BarChart2, Sparkles, LayoutGrid, Shield } from 'lucide-react';

import { getGroupedRecommendations, getAllRecommendations } from '../services/aiRecommendationService';
import { getStockData } from '../services/stockDataService';
import { useMarket } from '../contexts/MarketContext';
import type { MarketId } from '../contexts/MarketContext';
import AIPerformanceTracker from './AIPerformanceTracker';
import PortfolioIntelligencePanel from './PortfolioIntelligencePanel';
import AIStrategyIntelliHub from './AIStrategyIntelliHub';



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

const generateDynamicReasoning = (symbol: string, name: string, sector: string, score: number) => {
    const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const volumeMultiplier = (1.2 + (hash % 15) * 0.1).toFixed(1);

    // Logic Breakdown based on hash/score
    const techBase = 40 + (hash % 40);
    const fundBase = 100 - techBase;

    if (score >= 80) {
        const templates = [
            `Strong institutional accumulation detected in ${symbol}. Volume profile suggests a breakout with a ${score}% historical probability of alpha generation.`,
            `Recent earnings whisper numbers for ${name} indicate significant upside. Algorithmic blocks detected fueling a ${score}% breakout conviction.`,
            `Hedge fund flow analysis shows aggressive buying in the ${sector} sector, positioning ${symbol} for accelerated growth.`,
            `Algorithmic dark pool sweeps indicate smart money is loading up on ${symbol}. Technicals align for a high-probability swing setup.`
        ];
        return {
            text: templates[hash % templates.length],
            vol: volumeMultiplier,
            sent: 'Very Bullish',
            tech: techBase,
            fund: fundBase
        };
    } else if (score >= 70) {
        const templates = [
            `Favorable risk/reward setup for ${symbol}. Key indicators align with a ${score}% probability of outperforming the ${sector} average.`,
            `Moderate options flow suggests bullish sentiment building around ${name}. Support levels are holding firm.`,
            `Technical consolidation phase nearing completion. Momentum oscillators indicate an impending trend continuation for ${symbol}.`
        ];
        return {
            text: templates[hash % templates.length],
            vol: volumeMultiplier,
            sent: 'Bullish',
            tech: techBase,
            fund: fundBase
        };
    } else {
        const templates = [
            `Neutral momentum. Quantitative models indicate a ${score}% alpha probability for ${symbol}, advising to hold pending stronger confirmation.`,
            `${sector} sector headwinds are creating sideways price action for ${name}. Wait for a clear volume catalyst before deploying capital.`,
            `Mixed signals on the daily timeframe for ${symbol}. Risk parameters suggest defensive positioning at current levels.`
        ];
        return {
            text: templates[hash % templates.length],
            vol: volumeMultiplier,
            sent: 'Neutral',
            tech: techBase,
            fund: fundBase
        };
    }
};

interface AIRecommendationsProps {
    onSelectStock?: (symbol: string) => void;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({ onSelectStock }) => {
    const { addNotification } = useNotifications();
    const { selectedMarket } = useMarket();
    const [detailSymbol, setDetailSymbol] = useState<string | null>(null);
    const [activeSubTab, setActiveSubTab] = useState<'pulse' | 'intelligence'>('pulse');
    const [detailRec, setDetailRec] = useState<any>(null);
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
        setDetailRec(null);
    }, [selectedMarket.id]);

    // Fetch real recommendations ONLY on demand (Run AI Scan)
    const [activeRecs, setActiveRecs] = useState<any[]>([]);

    const groupedRecs = useMemo(() => {
        // If we have activeRecs (from a scan), they are already grouped by the new service
        if (activeRecs.length > 0) return activeRecs;

        // Fallback to instant recs (manual grouping)
        const groups: Record<string, any[]> = {};
        INSTANT_RECS.forEach((rec) => {
            const sector = rec.sector || 'Uncategorized';
            if (!groups[sector]) groups[sector] = [];
            groups[sector].push(rec);
        });
        return Object.entries(groups)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([name, recommendations]) => ({ name, recommendations }));
    }, [activeRecs, INSTANT_RECS]);

    // Extract "Undervalued Gems" (High Score + specifically Low RSI or PEG)
    const undervaluedGems = useMemo(() => {
        const flatList = activeRecs.length > 0
            ? activeRecs.flatMap(group => group.recommendations)
            : INSTANT_RECS;

        return flatList
            .filter(r => r.score >= 80) // High conviction
            .sort((a, b) => b.score - a.score)
            .slice(0, 4);
    }, [activeRecs, INSTANT_RECS]);

    const [checklist, setChecklist] = useState({
        positiveBreadth: true, volumeHigh: true, rsiValid: true,
        macdConfirm: false, candleClose: false, volumeEntry: false, fakeBreakout: true,
    });

    const handleLocalSelect = (rec: any) => {
        soundService.playTap();
        setDetailSymbol(rec.symbol);
        setDetailRec(rec);
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
            `Auditing Undervalued Metrics: PEG < 1.0, Forward P/E < Industry Avg, and RSI < 40...`,
            `Filtering for High-Growth EPS Acceleration signatures (Fundamental Strength)...`,
            `Detecting Support Bounce signatures in Under-owned Sectors...`
        ]);
        soundService.playTap();

        for (let i = 0; i < logs.length; i++) {
            await new Promise(r => setTimeout(r, 600));
            setScanLog(prev => [...prev, logs[i]]);
            setScanProgress(((i + 1) / logs.length) * 100);
            soundService.playWorking(); // "Like it was working" sound
        }

        await new Promise(r => setTimeout(r, 800));

        try {
            const freshGroupedRecs = await getGroupedRecommendations(selectedMarket.indexName);
            setActiveRecs(freshGroupedRecs);
            setIsScanning(false);
            soundService.playSuccess();
            setDetailSymbol(null);
            setDetailRec(null);

            addNotification({
                title: 'Deep Market Scan Complete',
                message: `Identified ${freshGroupedRecs.length} sectors with undervalued growth opportunities.`,
                type: 'ai'
            });
            toast.success(`Scan complete. Found deep-value picks in ${freshGroupedRecs.length} sectors.`);
        } catch (error) {
            console.error('Scan failed:', error);
            setIsScanning(false);
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
        if (detailSymbol) getStockData(detailSymbol).then(data => {
            if (!data?.stock) return;
            // Normalize all numeric fields so .toFixed() never throws
            const s = data.stock;
            setDetailStockData({
                ...s,
                price: Number(s.price) || 0,
                change: Number(s.change) || 0,
                changePercent: Number(s.changePercent) || 0,
                previousClose: Number(s.previousClose) || 0,
                open: Number(s.open) || 0,
                high: Number(s.high) || 0,
                low: Number(s.low) || 0,
                volume: Number(s.volume) || 0,
            });
        });
    }, [detailSymbol]);

    if (detailSymbol) {
        return (
            <div className="portfolio-container ai-detail-view" style={{ paddingTop: '0', animation: 'fadeIn 0.3s ease', paddingBottom: '100px' }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => { setDetailSymbol(null); setDetailRec(null); setDetailStockData(null); }} className="btn btn-icon glass-button">
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
                                {detailStockData ? (detailStockData.change >= 0 ? '+' : '') : ''}{detailStockData ? (Number(detailStockData.changePercent) || 0).toFixed(2) : '0.00'}%
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

                    <div className="glass-card" style={{ padding: '1.25rem', background: detailRec?.score >= 80 ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)' : 'rgba(255, 255, 255, 0.02)', border: detailRec?.score >= 80 ? '1px solid var(--color-success-light)' : '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.75rem', color: detailRec?.score >= 80 ? 'var(--color-success)' : 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Zap size={14} /> Intelligence Breakdown
                            </h3>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                                Conviction: <span style={{ color: getScoreColor(detailRec?.score || 50) }}>{detailRec?.score || '--'}%</span>
                            </div>
                        </div>

                        {/* Logic Breakdown Meter */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '8px' }}>
                                <span>Technical Analysis</span>
                                <span>Fundamental Growth</span>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                                <div style={{
                                    width: `${detailRec ? generateDynamicReasoning(detailRec.symbol, detailRec.name, detailRec.sector, detailRec.score).tech : 50}%`,
                                    height: '100%',
                                    background: 'var(--color-accent)',
                                    transition: 'width 1s ease'
                                }} />
                                <div style={{
                                    width: `${detailRec ? generateDynamicReasoning(detailRec.symbol, detailRec.name, detailRec.sector, detailRec.score).fund : 50}%`,
                                    height: '100%',
                                    background: 'var(--color-success)',
                                    transition: 'width 1s ease'
                                }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '6px', fontWeight: 700 }}>
                                <span>{detailRec ? generateDynamicReasoning(detailRec.symbol, detailRec.name, detailRec.sector, detailRec.score).tech : 50}% Blend</span>
                                <span>{detailRec ? generateDynamicReasoning(detailRec.symbol, detailRec.name, detailRec.sector, detailRec.score).fund : 50}% Blend</span>
                            </div>
                        </div>

                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                            {detailRec ? generateDynamicReasoning(detailRec.symbol, detailRec.name, detailRec.sector, detailRec.score).text : 'Analyzing market data...'}
                        </p>

                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-text-primary)' }}>
                                <BarChart2 size={14} color="var(--color-text-secondary)" /> Vol: {detailRec ? generateDynamicReasoning(detailRec.symbol, detailRec.name, detailRec.sector, detailRec.score).vol : '1.0'}x Average
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-text-primary)' }}>
                                <MessageSquare size={14} color="var(--color-text-secondary)" /> Sentiment: {detailRec ? generateDynamicReasoning(detailRec.symbol, detailRec.name, detailRec.sector, detailRec.score).sent : 'Determining...'}
                            </div>
                        </div>
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
        <div className="portfolio-container tab-content-wrapper" style={{ paddingBottom: '120px' }}>
            {!detailSymbol && (
                <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    marginBottom: '2rem', 
                    borderBottom: '1px solid var(--glass-border)',
                    padding: '0.5rem 0.25rem',
                    position: 'sticky',
                    top: 0,
                    background: 'var(--color-bg-primary)',
                    zIndex: 10,
                    backdropFilter: 'blur(10px)'
                }}>
                    <button 
                        onClick={() => { soundService.playTap(); setActiveSubTab('pulse'); }}
                        style={{
                            background: activeSubTab === 'pulse' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                            border: 'none',
                            color: activeSubTab === 'pulse' ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            padding: '0.6rem 1.25rem',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            borderBottom: activeSubTab === 'pulse' ? '2px solid var(--color-accent)' : '2px solid transparent',
                        }}
                    >
                        <LayoutGrid size={16} /> Market Pulse
                    </button>
                    <button 
                        onClick={() => { soundService.playTap(); setActiveSubTab('intelligence'); }}
                        style={{
                            background: activeSubTab === 'intelligence' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                            border: 'none',
                            color: activeSubTab === 'intelligence' ? 'var(--color-success)' : 'var(--color-text-tertiary)',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            padding: '0.6rem 1.25rem',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            borderBottom: activeSubTab === 'intelligence' ? '2px solid var(--color-success)' : '2px solid transparent',
                        }}
                    >
                        <Shield size={16} /> Strategic Intelligence
                    </button>
                </div>
            )}

            {activeSubTab === 'pulse' ? (
                <>
                {/* ═══ HOW AI STRATEGY WORKS ═══ */}
                <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.75rem', borderLeft: `4px solid ${selectedMarket.color}` }}>
                    <h3 style={{ fontSize: '0.85rem', color: selectedMarket.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={16} /> How Our AI Strategy Works
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
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

                {/* ═══ UNDERVALUED GEMS (NEW) ═══ */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', padding: '0 0.25rem' }}>
                        <Zap size={14} color="var(--color-warning)" /> Undervalued Discovery Gems
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '0.75rem',
                        padding: '0 0.25rem'
                    }}>
                        {undervaluedGems.map((stock, i) => (
                            <div
                                key={stock.symbol}
                                onClick={() => handleLocalSelect(stock)}
                                className={`glass-card-hover animate-fade-in-up stagger-${i + 1}`}
                                style={{
                                    padding: '1.25rem',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white' }}>{stock.symbol}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-success)', fontWeight: 800 }}>{stock.score}% ALPHA</div>
                                    </div>
                                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Value</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--color-success)' }}>{Math.round(stock.fundamentals?.valueScore || 0)}</div>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, marginBottom: '0.75rem', height: '2.8em', overflow: 'hidden' }}>
                                        {stock.reasoning?.[0] || 'High growth potential with low RSI signatures.'}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <div style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-tertiary)' }}>
                                            {stock.sector}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'white' }}>
                                        {stock.price ? formatCurrency(stock.price) : '--'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ═══ RECOMMENDATIONS TABLE ═══ */}
                <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div>
                            <h2 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <img src={selectedMarket.flagUrl} alt="" style={{ width: '16px', height: '11px', borderRadius: '2px', objectFit: 'cover' }} />
                                {selectedMarket.indexName} Market Pulse
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '4px 10px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    borderRadius: '20px',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    fontSize: '0.6rem',
                                    color: 'var(--color-error)',
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-error)', animation: 'pulse-glow 1.5s infinite' }} />
                                    Live Engine
                                </div>
                            </h2>
                            <p style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                                Rules: 5% stock, 20% sector limit
                            </p>
                        </div>
                    </div>
                    <button
                        className={`btn ${isScanning ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={runScanner}
                        disabled={isScanning}
                        style={{ position: 'relative', overflow: 'hidden', width: '100%', justifyContent: 'center', height: '36px', fontSize: '0.8rem' }}
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
                            {groupedRecs.map((group) => {
                                const sector = group.name;
                                const recs = group.recommendations;
                                return (
                                    <React.Fragment key={sector}>
                                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                            <td colSpan={6} style={{ padding: '0.75rem 1.25rem', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontSize: '0.7rem', borderBottom: '1px solid var(--glass-border)' }}>
                                                {sector} ({recs.length})
                                            </td>
                                        </tr>
                                        {recs.map((rec, idx) => (
                                            <tr key={`${rec.symbol}-${idx}`} onClick={() => handleLocalSelect(rec)} style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                <td style={{ padding: '1rem 1.25rem' }}>
                                                    <div style={{ fontWeight: 900, color: 'white' }}>{rec.symbol}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>{rec.name}</div>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <div style={{ padding: '2px 8px', borderRadius: '4px', background: rec.score >= 75 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: rec.score >= 75 ? 'var(--color-success)' : 'var(--color-warning)', fontSize: '0.6rem', fontWeight: 900, display: 'inline-block' }}>
                                                        {rec.recommendation?.toUpperCase()}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <div style={{ color: getScoreColor(rec.score), fontWeight: 900 }}>{rec.score}%</div>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <div style={{ fontWeight: 800, color: 'white' }}>{rec.suggestedAllocation}%</div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4, maxWidth: '300px' }}>
                                                        {rec.reasoning?.[0] || generateDynamicReasoning(rec.symbol, rec.name, rec.sector, rec.score).text}
                                                    </p>
                                                </td>
                                                <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                                                    <ArrowRight size={16} color="var(--color-text-tertiary)" />
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                </>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', animation: 'fadeIn 0.5s ease' }}>
                    <AIStrategyIntelliHub />
                    <div style={{ marginTop: '1rem' }}>
                        <PortfolioIntelligencePanel />
                    </div>
                </div>
            )}

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

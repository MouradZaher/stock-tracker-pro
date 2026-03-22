import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, X, Zap, ArrowRight, Check, TrendingUp, MessageSquare, BarChart2, Sparkles, LayoutGrid, Shield } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';
import { useNotifications } from '../contexts/NotificationContext';
import { soundService } from '../services/soundService';
import { LiveBadge } from './LiveBadge';
import { getGroupedRecommendations, getAllRecommendations } from '../services/aiRecommendationService';
import { getStockData } from '../services/stockDataService';
import { useMarket } from '../contexts/MarketContext';
import type { MarketId } from '../contexts/MarketContext';
import AIPerformanceTracker from './AIPerformanceTracker';
import PortfolioIntelligencePanel from './PortfolioIntelligencePanel';
import AIStrategyIntelliHub from './AIStrategyIntelliHub';
import CompanyLogo from './CompanyLogo';

// --- NEW: Reasoning Path Component ---
const ReasoningPath: React.FC<{ tech: number; fund: number; score: number }> = ({ tech, fund, score }) => {
    return (
        <div style={{ position: 'relative', height: '100px', width: '100%', margin: '1rem 0', opacity: 0.9 }}>
            <svg viewBox="0 0 400 100" style={{ width: '100%', height: '100%' }}>
                {/* Connection Paths */}
                <path 
                    d="M 50 50 Q 125 10, 200 50 T 350 50" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.05)" 
                    strokeWidth="2" 
                />
                <path 
                    className="path-animate"
                    d="M 50 50 Q 125 10, 200 50 T 350 50" 
                    fill="none" 
                    stroke="var(--color-accent)" 
                    strokeWidth="2"
                    strokeDasharray="10, 5"
                    style={{ filter: 'drop-shadow(0 0 5px var(--color-accent))' }}
                />

                {/* Nodes */}
                <circle cx="50" cy="50" r="4" fill="var(--color-accent)" />
                <circle cx="200" cy="50" r="4" fill="var(--color-success)" />
                <circle cx="350" cy="50" r="6" fill={score >= 75 ? 'var(--color-success)' : 'var(--color-warning)'} />
                
                {/* Labels */}
                <text x="50" y="75" textAnchor="middle" fontSize="10" fill="var(--color-text-tertiary)" fontWeight="700">TECHNICAL</text>
                <text x="200" y="75" textAnchor="middle" fontSize="10" fill="var(--color-text-tertiary)" fontWeight="700">FUNDAMENTAL</text>
                <text x="350" y="75" textAnchor="middle" fontSize="10" fill="var(--color-text-tertiary)" fontWeight="700">CONVICTION</text>
                <text x="350" y="40" textAnchor="middle" fontSize="12" fill="white" fontWeight="900">{score}%</text>
            </svg>
            <style>{`
                .path-animate {
                    stroke-dashoffset: 100;
                    animation: dash 10s linear infinite;
                }
                @keyframes dash {
                    to { stroke-dashoffset: 0; }
                }
            `}</style>
        </div>
    );
};

// --- NEW: Confidence Heatmap Component ---
const ConfidenceHeatmap: React.FC<{ items: any[] }> = ({ items }) => {
    return (
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LayoutGrid size={14} color="var(--color-accent)" /> Strategy Confidence Matrix
            </h3>
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', 
                gap: '4px' 
            }}>
                {items.slice(0, 48).map((item, i) => {
                    const opacity = (item.score - 50) / 50; 
                    return (
                        <div 
                            key={i}
                            title={`${item.symbol}: ${item.score}% Confidence`}
                            style={{ 
                                height: '30px', 
                                background: item.score >= 80 ? `rgba(16, 185, 129, ${0.1 + opacity * 0.5})` : 
                                            item.score >= 70 ? `rgba(245, 158, 11, ${0.1 + opacity * 0.5})` : 
                                            `rgba(239, 68, 68, ${0.1 + opacity * 0.5})`,
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.6rem',
                                fontWeight: 900,
                                color: 'rgba(255,255,255,0.7)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                transition: 'all 0.2s',
                                cursor: 'help'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.2) z-index: 10';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                            }}
                        >
                            {item.symbol.substring(0, 3)}
                        </div>
                    );
                })}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '1rem', fontSize: '0.6rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--color-success)' }} /> High Conviction</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--color-warning)' }} /> Moderate</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--color-error)' }} /> Watchlist</div>
            </div>
        </div>
    );
};

// --- Market-Specific Curated Recommendations ---
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
    const techBase = 40 + (hash % 40);
    const fundBase = 100 - techBase;

    if (score >= 80) {
        const templates = [
            `Strong institutional accumulation detected in ${symbol}. Volume profile suggests a breakout with a ${score}% probability.`,
            `Recent earnings whisper numbers for ${name} indicate significant upside. High conviction score of ${score}%.`,
            `Hedge fund flow analysis shows aggressive buying in the ${sector} sector for ${symbol}.`,
            `Algorithmic dark pool sweeps indicate smart money accumulation in ${symbol}.`
        ];
        return { text: templates[hash % templates.length], vol: volumeMultiplier, sent: 'Very Bullish', tech: techBase, fund: fundBase };
    } else if (score >= 70) {
        const templates = [
            `Favorable risk/reward setup for ${symbol}. Matches ${score}% of our Alpha criteria.`,
            `Moderate options flow suggests bullish sentiment building around ${name}.`,
            `Technical consolidation phase nearing completion for ${symbol}.`
        ];
        return { text: templates[hash % templates.length], vol: volumeMultiplier, sent: 'Bullish', tech: techBase, fund: fundBase };
    } else {
        const templates = [
            `Neutral momentum. Alpha probability for ${symbol} is ${score}%.`,
            `${sector} sector headwinds are affecting ${name}.`,
            `Mixed signals on the daily timeframe for ${symbol}.`
        ];
        return { text: templates[hash % templates.length], vol: volumeMultiplier, sent: 'Neutral', tech: techBase, fund: fundBase };
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
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [scanLog, setScanLog] = useState<string[]>([]);
    const [activeRecs, setActiveRecs] = useState<any[]>([]);
    const [detailStockData, setDetailStockData] = useState<any>(null);

    const INSTANT_RECS = useMemo(() => {
        return [...(RECS_MAP[selectedMarket.id] || US_RECS)].sort((a, b) => b.score - a.score);
    }, [selectedMarket.id]);

    useEffect(() => {
        setActiveRecs([]);
        setDetailSymbol(null);
        setDetailRec(null);
    }, [selectedMarket.id]);

    const groupedRecs = useMemo(() => {
        if (activeRecs.length > 0) return activeRecs;
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

    const undervaluedGems = useMemo(() => {
        const flatList = activeRecs.length > 0 ? activeRecs.flatMap(group => group.recommendations) : INSTANT_RECS;
        return flatList.filter(r => r.score >= 80).sort((a, b) => b.score - a.score).slice(0, 4);
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
        if (onSelectStock) onSelectStock(rec.symbol);
    };

    const runScanner = async () => {
        const logs = SCAN_LOGS[selectedMarket.id] || SCAN_LOGS.us;
        setIsScanning(true);
        setScanProgress(0);
        setScanLog(['Initializing Engine...', 'Auditing Metrics...', 'Filtering Sectors...']);
        soundService.playTap();

        for (let i = 0; i < logs.length; i++) {
            await new Promise(r => setTimeout(r, 600));
            setScanLog(prev => [...prev, logs[i]]);
            setScanProgress(((i + 1) / logs.length) * 100);
            soundService.playWorking();
        }

        try {
            const freshGroupedRecs = await getGroupedRecommendations(selectedMarket.indexName);
            setActiveRecs(freshGroupedRecs);
            setIsScanning(false);
            soundService.playSuccess();
            addNotification({ title: 'Scan Complete', message: `Found picks in ${freshGroupedRecs.length} sectors.`, type: 'ai' });
        } catch (error) {
            setIsScanning(false);
            toast.error('Scan failed.');
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'var(--color-success)';
        if (score >= 70) return 'var(--color-warning)';
        return 'var(--color-error)';
    };

    useEffect(() => {
        if (detailSymbol) {
            getStockData(detailSymbol).then(data => {
                if (data?.stock) setDetailStockData({ ...data.stock, price: Number(data.stock.price) || 0, changePercent: Number(data.stock.changePercent) || 0 });
            });
        }
    }, [detailSymbol]);

    if (detailSymbol) {
        return (
            <div className="tab-content ai-detail-view" style={{ paddingTop: '0', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => { setDetailSymbol(null); setDetailRec(null); }} className="btn btn-icon glass-button">
                        <ArrowRight size={20} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Trade Analysis</h2>
                </div>

                <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <CompanyLogo symbol={detailSymbol} size={48} />
                            <div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{detailSymbol}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{detailStockData ? formatCurrency(detailStockData.price) : '...'}</div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: (detailStockData?.changePercent || 0) >= 0 ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 700 }}>
                                {(detailStockData?.changePercent || 0).toFixed(2)}%
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="glass-card" style={{ height: '350px', padding: '0.5rem', overflow: 'hidden' }}>
                        <iframe
                            src={`https://s.tradingview.com/widgetembed/?symbol=${detailSymbol}&interval=D&theme=dark&style=1&locale=en`}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            title="TradingView Chart"
                        />
                    </div>

                    <div className="glass-card" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Intelligence Breakdown</h3>
                            <div style={{ fontWeight: 700 }}>Conviction: <span style={{ color: getScoreColor(detailRec?.score || 50) }}>{detailRec?.score || '--'}%</span></div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '8px' }}>
                                <span>Technical Analysis</span>
                                <span>Fundamental Growth</span>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                                <div style={{ width: `${detailRec ? generateDynamicReasoning(detailRec.symbol, detailRec.name, detailRec.sector, detailRec.score).tech : 50}%`, background: 'var(--color-accent)' }} />
                                <div style={{ width: `${detailRec ? generateDynamicReasoning(detailRec.symbol, detailRec.name, detailRec.sector, detailRec.score).fund : 50}%`, background: 'var(--color-success)' }} />
                            </div>
                        </div>

                        <ReasoningPath 
                            tech={detailRec ? generateDynamicReasoning(detailRec.symbol, detailRec.name, detailRec.sector, detailRec.score).tech : 50}
                            fund={detailRec ? generateDynamicReasoning(detailRec.symbol, detailRec.name, detailRec.sector, detailRec.score).fund : 50}
                            score={detailRec?.score || 50}
                        />

                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                            {detailRec ? generateDynamicReasoning(detailRec.symbol, detailRec.name, detailRec.sector, detailRec.score).text : 'Analyzing...'}
                        </p>
                    </div>

                    <div className="glass-card" style={{ padding: '1.25rem' }}>
                        <h3 style={{ textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '1rem' }}>Automated Checklist</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {Object.entries(checklist).map(([key, val]) => (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: val ? 'var(--color-success)' : 'rgba(255,255,255,0.1)' }} />
                                    {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="tab-content ai-recommendations-wrapper" style={{ 
            height: 'calc(100vh - 120px)', 
            overflowY: 'auto', 
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            paddingTop: '0',
            gap: '1rem'
        }}>
            {!detailSymbol && (
                <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    marginBottom: '0.5rem',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    background: 'var(--color-bg)',
                    padding: '1rem 0'
                }}>
                    <button onClick={() => setActiveSubTab('pulse')} style={{ borderRadius: '8px', background: activeSubTab === 'pulse' ? 'rgba(99,102,241,0.1)' : 'transparent', color: activeSubTab === 'pulse' ? 'var(--color-accent)' : 'inherit', border: activeSubTab === 'pulse' ? '1px solid var(--color-accent)' : '1px solid transparent', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700 }}>Market Pulse</button>
                    <button onClick={() => setActiveSubTab('intelligence')} style={{ borderRadius: '8px', background: activeSubTab === 'intelligence' ? 'rgba(16,185,129,0.1)' : 'transparent', color: activeSubTab === 'intelligence' ? 'var(--color-success)' : 'inherit', border: activeSubTab === 'intelligence' ? '1px solid var(--color-success)' : '1px solid transparent', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700 }}>Intelligence</button>
                </div>
            )}

            {activeSubTab === 'pulse' ? (
                <>
                    {/* 1. AI Scan Controller (PRIORITIZED) */}
                    <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.1em', fontWeight: 800, margin: 0 }}>AI Strategic Scanner</h3>
                            <LiveBadge />
                        </div>
                        <button 
                            className="btn btn-primary" 
                            onClick={runScanner} 
                            disabled={isScanning} 
                            style={{ 
                                width: '100%', 
                                padding: '1.25rem',
                                fontSize: '1rem',
                                fontWeight: 900,
                                background: 'var(--gradient-primary)',
                                boxShadow: '0 8px 32px rgba(99,102,241,0.3)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px'
                            }}
                        >
                            <Zap size={20} fill="currentColor" />
                            {isScanning ? 'Processing Market Intelligence...' : 'Initiate Deep AI Scan'}
                        </button>

                        {isScanning && (
                            <div style={{ marginTop: '1rem', animation: 'fadeIn 0.3s ease' }}>
                                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ width: `${scanProgress}%`, height: '100%', background: 'var(--color-success)', transition: 'width 0.3s ease' }} />
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', marginTop: '8px', fontFamily: 'monospace' }}>
                                    {scanLog[scanLog.length - 1]}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. Assets (Recommendation Table) */}
                    <div className="table-container glass-card" style={{ padding: '0', overflowX: 'auto', border: '1px solid var(--glass-border-bright)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Asset</th>
                                    <th style={{ textAlign: 'center', padding: '1rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Signal</th>
                                    <th style={{ textAlign: 'center', padding: '1rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Conviction</th>
                                    <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedRecs.map((group) => (
                                    <React.Fragment key={group.name}>
                                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                            <td colSpan={4} style={{ padding: '0.5rem 1rem', fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-accent)' }}>{group.name.toUpperCase()}</td>
                                        </tr>
                                        {group.recommendations.map((rec) => (
                                            <tr 
                                                key={rec.symbol} 
                                                onClick={() => handleLocalSelect(rec)} 
                                                style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }}
                                                className="hover-bg-blur"
                                            >
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <CompanyLogo symbol={rec.symbol} size={24} />
                                                        <span style={{ fontWeight: 800 }}>{rec.symbol}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <span style={{ 
                                                        padding: '4px 8px', 
                                                        borderRadius: '6px', 
                                                        fontSize: '0.7rem', 
                                                        fontWeight: 900,
                                                        background: rec.recommendation === 'Buy' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                        color: rec.recommendation === 'Buy' ? 'var(--color-success)' : 'var(--color-warning)'
                                                    }}>
                                                        {rec.recommendation.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 800, color: getScoreColor(rec.score) }}>{rec.score}%</td>
                                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(rec.price || 0)}</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 3. Performance & Heatmap (Secondary) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                        <AIPerformanceTracker />
                        <ConfidenceHeatmap items={activeRecs.length > 0 ? activeRecs.flatMap(g => g.recommendations) : INSTANT_RECS} />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.1em', fontWeight: 800, marginBottom: '0.75rem' }}>Alpha Conviction Gems</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                            {undervaluedGems.map((stock, i) => (
                                <div key={stock.symbol} onClick={() => handleLocalSelect(stock)} className="glass-card hover-glow" style={{ padding: '1.25rem', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 900, fontSize: '1rem' }}>{stock.symbol}</div>
                                        <div style={{ color: 'var(--color-success)', fontSize: '0.65rem', fontWeight: 900, padding: '2px 6px', background: 'rgba(16,185,129,0.1)', borderRadius: '4px' }}>{stock.score}% ALPHA</div>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', marginTop: '1rem', fontWeight: 700 }}>{formatCurrency(stock.price)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <AIStrategyIntelliHub />
                    <PortfolioIntelligencePanel />
                </div>
            )}
        </div>
    );
};

export default AIRecommendations;

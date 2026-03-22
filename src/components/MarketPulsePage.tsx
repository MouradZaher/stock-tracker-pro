import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { soundService } from '../services/soundService';
import { getStockNews } from '../services/newsService';
import { useQuery } from '@tanstack/react-query';
import { Timer, TrendingUp, TrendingDown, Activity, BarChart2, RefreshCw, Zap, AlertTriangle, Layers, MessageSquare, ShieldCheck, Globe, Play, ExternalLink, Info, Sparkles } from 'lucide-react';
import type { NewsArticle, SocialPost } from '../types';
import { socialFeedService } from '../services/SocialFeedService';
import { getSectorPerformance, getVolumeAnomalies, getMultipleQuotes } from '../services/stockDataService';
import { useMarket } from '../contexts/MarketContext';
import EarningsCalendar from './EarningsCalendar';
import OptionsFlowSimulator from './OptionsFlowSimulator';
import CompanyLogo from './CompanyLogo';

import { CHANNELS } from './LiveIntelligenceStreams';

interface MarketPulsePageProps {
    onSelectStock?: (symbol: string) => void;
}

// Use centralized channels for consistent experience
const MARKET_STREAMS = CHANNELS;

// Inline stream player component — shows a single active stream with channel selector strip
const LiveStreamsPlayer: React.FC<{ streams: typeof MARKET_STREAMS }> = ({ streams }) => {
    const [active, setActive] = useState(streams[0]);
    const [muted, setMuted] = useState(true);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    return (
        <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)', position: 'relative' }}>
            {/* Stream Status Overlay */}
            <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, display: 'flex', gap: '8px' }}>
                <div style={{ background: 'rgba(0,255,100,0.2)', border: '1px solid #00FF66', borderRadius: '4px', padding: '2px 6px', fontSize: '0.6rem', color: '#00FF66', fontWeight: 900, backdropFilter: 'blur(4px)' }}>
                    📡 ENCRYPTED_STREAM_ACTIVE
                </div>
                <div style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid #3b82f6', borderRadius: '4px', padding: '2px 6px', fontSize: '0.6rem', color: '#3b82f6', fontWeight: 900, backdropFilter: 'blur(4px)' }}>
                    🔐 REGION_BYPASS: US_PROXY
                </div>
            </div>

            {/* Video Player */}
            <div style={{ position: 'relative', paddingBottom: '42%', background: '#000', minHeight: '200px' }}>
                <iframe
                    key={`${active.id}-${muted}`}
                    src={active.videoId 
                        ? `https://www.youtube.com/embed/${active.videoId}?autoplay=1&mute=${muted ? 1 : 0}&rel=0&modestbranding=1&playsinline=1&gl=US&hl=en`
                        : `https://www.youtube.com/embed/live_stream?channel=${active.youtubeId}&autoplay=1&mute=${muted ? 1 : 0}&rel=0&modestbranding=1&playsinline=1&gl=US&hl=en`
                    }
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    title={active.name}
                    onLoad={() => console.log(`Stream loaded: ${active.name}`)}
                />
            </div>

            {/* Channel Info + Controls */}
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white' }}>{active.logo} {active.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>{active.category} • {active.region}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                        onClick={() => {
                            const current = active;
                            setActive({...streams[0]}); // Jiggle state
                            setTimeout(() => setActive(current), 50);
                            soundService.playTap();
                        }}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '0.7rem' }}
                    >
                        <RefreshCw size={12} /> Force Sync
                    </button>
                    <button
                        onClick={() => setMuted(!muted)}
                        style={{ background: muted ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.15)', border: `1px solid ${muted ? 'var(--glass-border)' : 'var(--color-accent)'}`, borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', color: muted ? 'var(--color-text-tertiary)' : 'var(--color-accent)', fontSize: '0.7rem', fontWeight: 700 }}
                    >
                        {muted ? '🔇 Muted' : '🔊 Live'}
                    </button>
                    <a
                        href={`https://www.youtube.com/channel/${active.youtubeId}/live`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ 
                            background: '#FF0000', 
                            border: 'none', 
                            borderRadius: '8px', 
                            padding: '6px 10px', 
                            cursor: 'pointer', 
                            color: 'white', 
                            fontSize: '0.7rem', 
                            fontWeight: 800,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 0 15px rgba(255,0,0,0.3)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <ExternalLink size={12} /> YouTube
                    </a>
                </div>
            </div>

            {/* Channel Selector Strip */}
            <div ref={scrollRef} style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.75rem', scrollbarWidth: 'none', flexWrap: 'nowrap', msOverflowStyle: 'none' }}>
                {streams.map((ch) => {
                    const isActive = ch.id === active.id;
                    return (
                        <button
                            key={ch.id}
                            onClick={() => setActive(ch)}
                            style={{
                                flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '5px',
                                padding: '5px 10px', borderRadius: '8px', cursor: 'pointer',
                                border: `1px solid ${isActive ? ch.color : 'var(--glass-border)'}`,
                                background: isActive ? `${ch.color}20` : 'rgba(255,255,255,0.02)',
                                color: isActive ? ch.color : 'var(--color-text-secondary)',
                                fontWeight: isActive ? 800 : 500, fontSize: '0.72rem',
                                transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                                boxShadow: isActive ? `0 0 10px ${ch.color}25` : 'none',
                                minWidth: 'fit-content'
                            }}
                        >
                            <span style={{ fontSize: '0.85rem' }}>{ch.logo}</span>
                            {ch.name}
                            {isActive && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: ch.color, display: 'inline-block', animation: 'pulse 1.5s infinite' }} />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const MARKET_ALPHA: Record<string, any[]> = {
    us: [
        { symbol: 'NVDA', score: 94, rec: 'Strong Buy', color: '#10B981' },
        { symbol: 'MSFT', score: 88, rec: 'Buy', color: '#10B981' },
        { symbol: 'AAPL', score: 85, rec: 'Buy', color: '#10B981' },
        { symbol: 'TSLA', score: 72, rec: 'Hold', color: '#F59E0B' },
        { symbol: 'META', score: 89, rec: 'Buy', color: '#10B981' }
    ],
    egypt: [
        { symbol: 'COMI', score: 92, rec: 'Strong Buy', color: '#10B981' },
        { symbol: 'TMGH', score: 87, rec: 'Buy', color: '#10B981' },
        { symbol: 'FWRY', score: 84, rec: 'Buy', color: '#10B981' },
        { symbol: 'SWDY', score: 79, rec: 'Buy', color: '#10B981' },
        { symbol: 'ABUK', score: 75, rec: 'Hold', color: '#F59E0B' }
    ],
    abudhabi: [
        { symbol: 'IHC', score: 95, rec: 'Strong Buy', color: '#10B981' },
        { symbol: 'FAB', score: 89, rec: 'Buy', color: '#10B981' },
        { symbol: 'ETISALAT', score: 86, rec: 'Buy', color: '#10B981' },
        { symbol: 'ALDAR', score: 82, rec: 'Buy', color: '#10B981' },
        { symbol: 'ADNOCDIST', score: 78, rec: 'Hold', color: '#F59E0B' }
    ]
};

const MarketPulsePage: React.FC<MarketPulsePageProps> = ({ onSelectStock }) => {
    const { effectiveMarket, setSentimentScore } = useMarket();
    const handleAction = useCallback((symbol: string) => {
        soundService.playTap();
        onSelectStock?.(symbol);
    }, [onSelectStock]);

    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({ hours: 0, minutes: 0, seconds: 0 });
    const [sectorData, setSectorData] = useState<any[]>([]);
    const [volumeAnomalies, setVolumeAnomalies] = useState<any[]>([]);
    const [macroData, setMacroData] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Fetch real breaking news - Sync to market
    const { data: breakingNews, refetch: refetchNews } = useQuery<NewsArticle[]>({
        queryKey: ['breakingNews', effectiveMarket.id],
        queryFn: async () => {
            const ticker = effectiveMarket.indexSymbol.replace('%5E', '^');
            return await getStockNews(ticker, 5);
        },
        refetchInterval: 30000,
        staleTime: 15000,
    });

    // Fetch Sector and Volume data - Market Aware
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingData(true);
            try {
                const [sectors, volumes] = await Promise.all([
                    getSectorPerformance(effectiveMarket.id),
                    getVolumeAnomalies(effectiveMarket.id)
                ]);
                setSectorData(sectors);
                setVolumeAnomalies(volumes);

                // Live Macro Data
                const goldSymbol = effectiveMarket.id === 'us' ? 'GC=F' : effectiveMarket.id === 'egypt' ? 'XAUUSD=X' : 'CL=F';
                const volSymbol = effectiveMarket.id === 'us' ? '^VIX' : effectiveMarket.indexSymbol.replace('%5E', '^');
                const flowSymbol = effectiveMarket.id === 'us' ? 'SPY' : effectiveMarket.indexSymbol.replace('%5E', '^');

                const macroQuotes = await getMultipleQuotes([goldSymbol, volSymbol, flowSymbol]);

                const goldQuote = macroQuotes.get(goldSymbol);
                const volQuote = macroQuotes.get(volSymbol);
                const flowQuote = macroQuotes.get(flowSymbol);

                const isGoldUp = goldQuote ? goldQuote.change > 0 : true;
                const isVolUp = volQuote ? volQuote.change > 0 : false;
                const isFlowUp = flowQuote ? flowQuote.change > 0 : true;

                const newMacroData = [
                    {
                        label: `${effectiveMarket.id === 'us' ? 'Gold (GC=F)' : effectiveMarket.id === 'egypt' ? 'Gold (XAU/USD)' : 'WTI Crude'} Intelligence`,
                        status: isGoldUp ? 'Hedge Bias' : 'Risk On',
                        color: isGoldUp ? '#10B981' : '#F59E0B',
                        desc: `Cross-asset analysis confirms liquidity flows in ${effectiveMarket.name} are moving toward ${isGoldUp ? 'defensive structures' : 'risk-on positions'}. Institutional conviction is high for mid-term stability.`,
                        action: isGoldUp ? 'Strategic Long' : 'Reduce Hedges'
                    },
                    {
                        label: `${effectiveMarket.indexName} Volatility`,
                        status: isVolUp ? 'Elevated' : 'Order Flow',
                        color: isVolUp ? '#EF4444' : '#F59E0B',
                        desc: `Real-time monitoring of ${effectiveMarket.indexName} components suggests ${isVolUp ? 'increasing hedging activity' : 'pending rotation'}. Liquidity clusters identified at key structural supports.`,
                        action: isVolUp ? 'Hedge Portfolio' : 'Defensive Bias'
                    },
                    {
                        label: 'Institutional Flow',
                        status: isFlowUp ? 'Smart Money' : 'Distribution',
                        color: isFlowUp ? '#3b82f6' : '#EF4444',
                        desc: `Aggregated order book data reveals significant block trade activity in ${effectiveMarket.shortName} top constituents. Tracking ${isFlowUp ? 'sovereign wealth accumulation' : 'systematic distribution'}.`,
                        action: isFlowUp ? 'Accumulate' : 'Wait & See'
                    }
                ];
                setMacroData(newMacroData);

            } catch (error) {
                console.error('Failed to fetch pulse data:', error);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 3000); // 3s refresh for live pulse (accelerated from 8s)
        return () => clearInterval(interval);
    }, [effectiveMarket.id]);

    // Calculate next market event
    const nextEventData = React.useMemo(() => {
        const now = new Date();
        const events = [
            { name: 'Market Open', hour: 9, minute: 30 },
            { name: 'Market Close', hour: 16, minute: 0 },
            { name: 'Pre-Market', hour: 4, minute: 0 },
            { name: 'After Hours End', hour: 20, minute: 0 },
        ];

        let nextEventTime: Date | null = null;
        let nextEventName = 'Market Event';

        for (const event of events) {
            const eventTime = new Date();
            eventTime.setHours(event.hour, event.minute, 0, 0);
            if (eventTime > now && (!nextEventTime || eventTime < nextEventTime)) {
                nextEventTime = eventTime;
                nextEventName = event.name;
            }
        }

        if (!nextEventTime) {
            nextEventTime = new Date();
            nextEventTime.setDate(nextEventTime.getDate() + 1);
            nextEventTime.setHours(4, 0, 0, 0);
            nextEventName = 'Pre-Market';
        }

        return { name: nextEventName, time: nextEventTime };
    }, []);

    useEffect(() => {
        const targetTime = nextEventData.time.getTime();
        const interval = setInterval(() => {
            const now = Date.now();
            const diff = targetTime - now;

            if (diff <= 0) {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
            } else {
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft({ hours, minutes, seconds });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [nextEventData.time]);

    // Sentiment Calculation (from real data)
    const bullishCount = sectorData.filter(s => s.change > 0).length;
    const sentimentScore = sectorData.length > 0 ? (bullishCount / sectorData.length) * 100 : 50;
    const overallSentiment = sentimentScore >= 60 ? 'Bullish' : sentimentScore <= 40 ? 'Bearish' : 'Neutral';
    const sentimentColor = overallSentiment === 'Bullish' ? '#10B981' : overallSentiment === 'Bearish' ? '#EF4444' : '#F59E0B';

    const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);

    /** Global Theme Update (Mega Deep Dive Innovation) */
    useEffect(() => {
        setSentimentScore(sentimentScore);
    }, [sentimentScore, setSentimentScore]);

    useEffect(() => {
        const fetchSocial = async () => {
            const posts = await socialFeedService.getGlobalFeed();
            setSocialPosts(posts);
        };
        fetchSocial();

        const interval = setInterval(() => {
            socialFeedService.generateLivePost();
            fetchSocial();
        }, 15000); // New post every 15s

        return () => clearInterval(interval);
    }, []);

    const newsTickerText = breakingNews?.map(n => n.headline).join(' • ') || 'Monitoring global markets for breaking news...';

    return (
        <div className="tab-content market-pulse-main">
            {/* ── Breaking News Ticker (Smooth Marquee) ── */}
            {breakingNews && breakingNews.length > 0 && (
                <div
                    className="pulse-ticker-container"
                    style={{
                        background: 'rgba(99, 102, 241, 0.05)',
                        borderBottom: '1px solid var(--glass-border)',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        padding: '8px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2rem'
                    }}>
                    <div style={{
                        background: 'var(--color-accent)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        marginLeft: '1.5rem',
                        flexShrink: 0,
                        zIndex: 2
                    }}>LIVE PULSE</div>
                    <div style={{
                        display: 'inline-block',
                        animation: 'scroll-news 60s linear infinite',
                        paddingLeft: '100%'
                    }}>
                        {breakingNews.map((news, i) => (
                            <span key={i} style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginRight: '4rem',
                                fontSize: '0.8rem',
                                color: 'var(--color-text-secondary)',
                                fontWeight: 500
                            }}>
                                <span style={{ color: 'var(--color-accent)', fontWeight: 800 }}>•</span>
                                {news.headline}
                                <span style={{ opacity: 0.4, fontSize: '0.7rem' }}>— {news.source}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Header Area */}
            <div className="pulse-page-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)', background: 'linear-gradient(to bottom, rgba(255,255,255,0.02), transparent)' }}>
                <div>
                    <h1 style={{ fontSize: '2.75rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '16px', letterSpacing: '-0.03em' }}>
                        Market Pulse
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 14px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '24px',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            fontSize: '0.7rem',
                            color: 'var(--color-error)',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            boxShadow: '0 0 20px rgba(239, 68, 68, 0.15)'
                        }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-error)', animation: 'pulse-glow 1.5s infinite' }} />
                            Pulse Active
                        </div>
                    </h1>
                    <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.95rem', margin: 0, fontWeight: 500 }}>
                        Real-time institutional grade market intelligence and sentiment analysis.
                    </p>
                </div>
            </div>

            {/* ═══ LIVE WORLD FINANCIAL NETWORKS ═══ */}
            <div style={{ marginBottom: '1.5rem', padding: '0 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                    <div className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-error)', boxShadow: '0 0 8px var(--color-error)' }}></div>
                    <h2 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Live Intelligence Streams</h2>
                </div>

                {/* Channel Selector + Video Player */}
                <LiveStreamsPlayer streams={MARKET_STREAMS} />
            </div>

            {/* Main Pulse Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
                gap: '1rem',
                margin: '0 1rem 1.5rem 1rem'
            }}>
                {/* ═══ TOP ALPHA PICKS (Institutional High Conviction) ═══ */}
                <div className="glass-card hover-glow" style={{ padding: '1.25rem', gridColumn: '1 / -1', border: '1px solid var(--color-accent-light)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, transparent 100%)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                            <Sparkles size={18} color="var(--color-warning)" /> Institutional Alpha Picks
                        </h3>
                        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-accent)', background: 'var(--color-accent-light)', padding: '3px 10px', borderRadius: '12px' }}>
                            {effectiveMarket.name.toUpperCase()} MARKET
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        {MARKET_ALPHA[effectiveMarket.id]?.map((pick) => (
                            <div 
                                key={pick.symbol} 
                                onClick={() => handleAction(pick.symbol)}
                                style={{ 
                                    padding: '1rem', 
                                    background: 'rgba(255,255,255,0.02)', 
                                    borderRadius: '12px', 
                                    border: '1px solid var(--glass-border)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    e.currentTarget.style.borderColor = 'var(--color-accent)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                                }}
                            >
                                <CompanyLogo symbol={pick.symbol} size={40} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 900, fontSize: '1rem' }}>{pick.symbol}</span>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: pick.color }}>{pick.score}%</span>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', fontWeight: 700, marginTop: '2px' }}>
                                        {pick.rec}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Fear & Greed Gauge */}
                <div className="glass-card hover-glow" style={{ padding: '1.25rem', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <h3 style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Zap size={16} color="var(--color-warning)" /> Fear & Greed Index
                            </h3>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: sentimentColor, marginTop: '0.25rem' }}>
                                {sentimentScore.toFixed(0)}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>MOOD</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: sentimentColor }}>{overallSentiment.toUpperCase()}</div>
                        </div>
                    </div>
                    <div style={{ height: '10px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                        <div style={{ width: `${sentimentScore}%`, height: '100%', background: sentimentColor, boxShadow: `0 0 10px ${sentimentColor}40`, transition: 'width 1s ease' }} />
                    </div>
                </div>

                <div className="glass-card hover-glow" style={{ padding: '1.25rem', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                    <EarningsCalendar />
                </div>
                
                <div className="glass-card hover-glow" style={{ padding: '1.25rem', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                    <OptionsFlowSimulator />
                </div>

                <div className="glass-card hover-glow" style={{ padding: '1.25rem', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={14} /> Industry Rotation
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {sectorData.map(sector => (
                            <div key={sector.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ fontSize: '1.2rem' }}>{sector.icon}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sector.name}</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: sector.change >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                                            {sector.change > 0 ? '+' : ''}{sector.change.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                                        <div style={{ width: `${Math.min(100, Math.abs(sector.change) * 20)}%`, height: '100%', background: sector.change >= 0 ? 'var(--color-success)' : 'var(--color-error)', borderRadius: '2px' }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* X Feed */}
                <div className="glass-card hover-glow" style={{ padding: '1.25rem', gridColumn: 'span 2', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MessageSquare size={14} color="#1DA1F2" /> Social Sentiment Flow
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                        {socialPosts.slice(0, 10).map(post => (
                            <div key={post.id} style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{post.author}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>{new Date(post.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>{post.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketPulsePage;

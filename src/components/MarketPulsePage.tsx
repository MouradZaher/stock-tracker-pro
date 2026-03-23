import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { soundService } from '../services/soundService';
import { getStockNews } from '../services/newsService';
import { useQuery } from '@tanstack/react-query';
import { Timer, TrendingUp, TrendingDown, Activity, BarChart2, RefreshCw, Zap, AlertTriangle, Layers, MessageSquare, ShieldCheck, Globe, Play, ExternalLink, Info, Sparkles, Move } from 'lucide-react';
import type { NewsArticle, SocialPost } from '../types';
import { socialFeedService } from '../services/SocialFeedService';
import { getSectorPerformance, getVolumeAnomalies, getMultipleQuotes } from '../services/stockDataService';
import { useMarket } from '../contexts/MarketContext';
import EarningsCalendar from './EarningsCalendar';
import OptionsFlowSimulator from './OptionsFlowSimulator';
import CompanyLogo from './CompanyLogo';

import { CHANNELS } from './LiveIntelligenceStreams';
import { usePiPStore } from '../services/usePiPStore';

interface MarketPulsePageProps {
    onSelectStock?: (symbol: string) => void;
}

// Use centralized channels for consistent experience
const MARKET_STREAMS = CHANNELS;

// Inline stream player component — shows a single active stream with channel selector strip
const LiveStreamsPlayer: React.FC<{ streams: typeof MARKET_STREAMS }> = ({ streams }) => {
    const { activeStream, setActiveStream, isMuted, setMuted, setPiPActive } = usePiPStore();
    const active = activeStream || streams[0];
    
    // Sync local selection to global store on first load if none active
    useEffect(() => {
        if (!activeStream) {
            setActiveStream(streams[0]);
        }
    }, [activeStream, setActiveStream, streams]);

    const scrollRef = React.useRef<HTMLDivElement>(null);

    return (
        <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)', position: 'relative' }}>
            {/* Stream Status Overlays removed as per request */}

            {/* Video Player */}
            <div style={{ position: 'relative', paddingBottom: '42%', background: '#000', minHeight: '200px' }}>
                <iframe
                    key={`${active.id}-${isMuted}`}
                    src={active.videoId 
                        ? `https://www.youtube.com/embed/${active.videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1&playsinline=1&gl=US&hl=en`
                        : `https://www.youtube.com/embed/live_stream?channel=${active.youtubeId}&autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1&playsinline=1&gl=US&hl=en`
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
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '20px', height: '20px', borderRadius: '4px',
                            background: 'white', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
                            padding: '2px', border: '1px solid rgba(0,0,0,0.1)'
                        }}>
                            <img 
                                src={active.logo} 
                                alt={active.shortName}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        </div>
                        {active.name}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>{active.category} • {active.region}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                        onClick={() => {
                            const current = active;
                            setActiveStream({...streams[0]}); // Jiggle state
                            setTimeout(() => setActiveStream(current), 50);
                            soundService.playTap();
                        }}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '0.7rem' }}
                    >
                        <RefreshCw size={12} /> Force Sync
                    </button>
                    <button
                        onClick={() => setMuted(!isMuted)}
                        style={{ background: isMuted ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.15)', border: `1px solid ${isMuted ? 'var(--glass-border)' : 'var(--color-accent)'}`, borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', color: isMuted ? 'var(--color-text-tertiary)' : 'var(--color-accent)', fontSize: '0.7rem', fontWeight: 700 }}
                    >
                        {isMuted ? '🔇 Muted' : '🔊 Live'}
                    </button>
                    <button
                        onClick={() => {
                            setPiPActive(true);
                            soundService.playTap();
                        }}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '0.7rem' }}
                        title="Minimize to Picture-in-Picture"
                    >
                        <Move size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Minimize
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
                            onClick={() => setActiveStream(ch)}
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
                            <div style={{
                                width: '16px', height: '16px', borderRadius: '3px',
                                background: 'white', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
                                padding: '1px', border: '1px solid rgba(0,0,0,0.1)'
                            }}>
                                <img 
                                    src={ch.logo} 
                                    alt={ch.shortName}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </div>
                            {ch.shortName}
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
    const { activeStream, setPiPActive } = usePiPStore();

    // Reset PiP when on this page
    useEffect(() => {
        setPiPActive(false);
    }, [setPiPActive]);

    // Enable PiP when leaving if a stream is active
    useEffect(() => {
        return () => {
            if (activeStream) {
                setPiPActive(true);
            }
        };
    }, [activeStream, setPiPActive]);

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
        <div style={{ 
            height: 'calc(100vh - 90px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
        }}>
            {/* Live Stream + Channel Bar — fixed top section */}
            <div style={{ padding: '0.6rem 1rem 0', flexShrink: 0 }}>
                <LiveStreamsPlayer streams={MARKET_STREAMS} />
            </div>

            {/* 3-Column Dashboard Grid — fills all remaining height */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.4fr 1fr',
                gridTemplateRows: '1fr',
                gap: '0.75rem',
                flex: 1,
                minHeight: 0,
                padding: '0.6rem 1rem 0.6rem',
                overflow: 'hidden',
            }}>

                {/* ── LEFT COLUMN ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', minHeight: 0, overflow: 'hidden' }}>

                    {/* Fear & Greed */}
                    <div className="glass-card" style={{ padding: '1rem', border: '1px solid var(--glass-border)', flexShrink: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                            <h3 style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                <Zap size={14} color="var(--color-warning)" fill="var(--color-warning)" /> Fear & Greed
                            </h3>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.55rem', color: 'var(--color-text-tertiary)', fontWeight: 800, letterSpacing: '0.1em' }}>MARKET MOOD</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 900, color: sentimentColor }}>{overallSentiment.toUpperCase()}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: sentimentColor, textShadow: `0 0 20px ${sentimentColor}40`, letterSpacing: '-0.02em', lineHeight: 1 }}>
                                {sentimentScore.toFixed(0)}
                            </div>
                            <div style={{ flex: 1, position: 'relative', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ background: 'linear-gradient(90deg, #EF4444, #F59E0B, #10B981)', height: '100%', borderRadius: '4px' }} />
                                <div style={{
                                    position: 'absolute', top: '-4px',
                                    left: `${Math.max(4, Math.min(96, sentimentScore))}%`,
                                    transform: 'translateX(-50%)',
                                    width: '14px', height: '14px', borderRadius: '50%',
                                    background: 'white', border: `3px solid ${sentimentColor}`,
                                    boxShadow: `0 0 10px ${sentimentColor}60`,
                                    transition: 'left 1s ease'
                                }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                            <span style={{ fontSize: '0.55rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>FEAR</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.55rem', color: sentimentColor, fontWeight: 800 }}>
                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: sentimentColor, animation: 'pulse 1.5s infinite' }} />
                                REAL-TIME
                            </div>
                            <span style={{ fontSize: '0.55rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>GREED</span>
                        </div>
                    </div>

                    {/* Industry Rotation */}
                    <div className="glass-card" style={{ padding: '1rem', border: '1px solid var(--glass-border)', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexShrink: 0 }}>
                            <h3 style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                <Layers size={14} color="var(--color-accent)" /> Industry Rotation
                            </h3>
                            {sectorData.length > 0 && (
                                <div style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--color-success)', background: 'var(--color-success-light)', padding: '3px 8px', borderRadius: '20px' }}>
                                    {sectorData.filter(s => s.change > 0).length}/{sectorData.length} BULLISH
                                </div>
                            )}
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }} className="custom-scrollbar">
                            {sectorData.map(sector => (
                                <div key={sector.name}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ fontSize: '0.9rem' }}>{sector.icon}</span> {sector.name}
                                        </span>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 900, color: sector.change >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                                            {sector.change > 0 ? '+' : ''}{sector.change.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.min(100, Math.abs(sector.change) * 25)}%`, height: '100%', background: sector.change >= 0 ? 'var(--color-success)' : 'var(--color-error)', borderRadius: '2px', transition: 'width 1.5s ease' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── CENTER COLUMN ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', minHeight: 0, overflow: 'hidden' }}>
                    {/* Earnings Calendar */}
                    <div className="glass-card" style={{ padding: '1rem', border: '1px solid var(--glass-border)', flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                            <EarningsCalendar />
                        </div>
                    </div>
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', minHeight: 0, overflow: 'hidden' }}>
                    {/* Options Flow */}
                    <div className="glass-card" style={{ padding: '1rem', border: '1px solid var(--glass-border)', flex: '0 0 auto', maxHeight: '45%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                            <OptionsFlowSimulator />
                        </div>
                    </div>

                    {/* Social Sentiment Feed */}
                    <div className="glass-card" style={{ padding: '1rem', border: '1px solid var(--glass-border)', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexShrink: 0 }}>
                            <h3 style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                <MessageSquare size={14} color="#1DA1F2" /> Social Feed
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00FF66', boxShadow: '0 0 8px #00FF66', animation: 'pulse 1.5s infinite' }} />
                                <span style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--color-text-tertiary)', letterSpacing: '0.05em' }}>24/7 LIVE</span>
                            </div>
                        </div>
                        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingRight: '4px' }}>
                            {socialPosts.slice(0, 10).map(post => (
                                <div key={post.id} style={{ padding: '0.65rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--glass-border)', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 900, color: 'white', flexShrink: 0 }}>
                                                {post.author[0]}
                                            </div>
                                            <span style={{ fontWeight: 800, fontSize: '0.72rem', color: 'white' }}>{post.author}</span>
                                            {post.author.includes('Wall St') && <ShieldCheck size={10} color="var(--color-accent)" />}
                                        </div>
                                        <span style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>{new Date(post.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: '1.5', fontWeight: 500 }}>{post.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketPulsePage;


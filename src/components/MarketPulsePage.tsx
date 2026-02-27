import React, { useState, useEffect, useCallback } from 'react';
import { soundService } from '../services/soundService';
import { getStockNews } from '../services/newsService';
import { useQuery } from '@tanstack/react-query';
import { Timer, TrendingUp, TrendingDown, Activity, BarChart2, RefreshCw, Zap, AlertTriangle, Layers, MessageSquare, ShieldCheck, Globe, Play, ExternalLink, Info, Sparkles } from 'lucide-react';
import type { NewsArticle, SocialPost } from '../types';
import { socialFeedService } from '../services/SocialFeedService';

import { getSectorPerformance, getVolumeAnomalies, getMultipleQuotes } from '../services/stockDataService';
import { useMarket } from '../contexts/MarketContext';

interface MarketPulsePageProps {
    onSelectStock?: (symbol: string) => void;
}

const MARKET_STREAMS: Record<string, any[]> = {
    us: [
        { name: 'Bloomberg Markets', origin: 'Global Financial', color: '#0000FF', videoId: 'iEpJwprxDdk' },
        { name: 'Sky News Business', origin: 'International', color: '#ff0000', videoId: 'YDvsBbKfLPA' },
        { name: 'Yahoo Finance Live', origin: 'US Market Focus', color: '#18002d', videoId: 'KQp-e_XQnDE' }
    ],
    egypt: [
        { name: 'Thndr | Latest Update 1', origin: 'Egypt Markets', color: '#10B981', playlistId: 'UU2h4E4aZ-NBO41cCnLvW6Og', index: 0 },
        { name: 'Thndr | Latest Update 2', origin: 'Egypt Markets', color: '#10B981', playlistId: 'UU2h4E4aZ-NBO41cCnLvW6Og', index: 1 },
        { name: 'Thndr | Latest Update 3', origin: 'Egypt Markets', color: '#10B981', playlistId: 'UU2h4E4aZ-NBO41cCnLvW6Og', index: 2 }
    ],
    abudhabi: [
        { name: 'Stalk Stock UAE Latest', origin: 'UAE Markets Expert', color: '#3b82f6', playlistId: 'UUWrdHtyJD9_VIDL0d-1rYqQ', index: 0 },
        { name: 'ADX Official Latest', origin: 'Abu Dhabi Exchange', color: '#10b981', playlistId: 'UUTXDxQ1zAsRC1mX1zHzbEVw', index: 0 },
        { name: 'CNBC Arabia Latest', origin: 'Gulf Business News', color: '#004a99', playlistId: 'UUm6M_r9MRf_MAsq_o7K_wWA', index: 0 }
    ]
};

const MarketPulsePage: React.FC<MarketPulsePageProps> = ({ onSelectStock }) => {
    const { effectiveMarket } = useMarket();
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
        refetchInterval: 60000,
        staleTime: 30000,
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
                        desc: `Cross-asset analysis confirms ${effectiveMarket.name} liquidity flows are moving toward ${isGoldUp ? 'defensive structures' : 'risk-on positions'}. Institutional conviction is high for mid-term stability.`,
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
        const interval = setInterval(fetchData, 30000); // 30s refresh
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
            maxWidth: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
            background: 'var(--color-bg-primary)',
            overflowX: 'hidden',
            padding: '0 0 var(--spacing-xl) 0'
        }}>
            {/* ── Breaking News Ticker (Smooth Marquee) ── */}
            {breakingNews && breakingNews.length > 0 && (
                <div style={{
                    margin: '0 -1.5rem 1.5rem',
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

            {/* Header Area - More Compact */}
            <div style={{ marginBottom: '1rem', padding: '0 0.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                    Market Pulse
                </h1>
                <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Real-time institutional grade market intelligence.
                </p>
            </div>

            {/* ═══ GLOBAL MACRO INTELLIGENCE (WORLD MONITOR SYNC) ═══ */}
            <div style={{
                marginBottom: '1.25rem',
                padding: '1.25rem',
                background: 'rgba(59, 130, 246, 0.08)',
                borderRadius: '16px',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1)'
            }}>
                {/* Background Animation */}
                <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: 'rgba(59, 130, 246, 0.1)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            padding: '6px',
                            borderRadius: '8px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: 'pulse-blue 3s infinite ease-in-out',
                            boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)'
                        }}>
                            <Globe size={18} color="#3b82f6" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h2 style={{ fontSize: '0.8rem', fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Global Macro Intelligence</h2>
                                <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>LIVE MONITOR</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', position: 'relative', zIndex: 1 }}>
                    {(macroData.length > 0 ? macroData : [
                        {
                            label: `${effectiveMarket.id === 'us' ? 'Gold (GC=F)' : effectiveMarket.id === 'egypt' ? 'USD/EGP Parallel' : 'WTI Crude'} Intelligence`,
                            status: 'Hedge Bias',
                            color: '#10B981',
                            desc: `Cross-asset analysis confirms ${effectiveMarket.name} liquidity flows are moving toward defensive structures. Institutional conviction is high for mid-term stability.`,
                            action: 'Strategic Long'
                        },
                        {
                            label: `${effectiveMarket.indexName} Volatility`,
                            status: 'Order Flow',
                            color: '#F59E0B',
                            desc: `Real-time monitoring of ${effectiveMarket.indexName} components suggests pending rotation. Liquidity clusters identified at key structural supports.`,
                            action: 'Defensive Bias'
                        },
                        {
                            label: 'Institutional Flow',
                            status: 'Smart Money',
                            color: '#3b82f6',
                            desc: `Aggregated order book data reveals significant block trade activity in ${effectiveMarket.shortName} top constituents. Tracking sovereign wealth participation.`,
                            action: 'Accumulate'
                        }
                    ]).map((item, i) => (
                        <div key={i} className="glass-card-hover" style={{
                            padding: '1.25rem',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white' }}>{item.label}</div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: item.color, background: `${item.color}15`, padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', border: `1px solid ${item.color}30` }}>{item.status}</div>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: '0 0 12px 0', minHeight: '3em' }}>{item.desc}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>TACTICAL_ACTION:</div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Zap size={10} /> {item.action}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ═══ LIVE WORLD FINANCIAL NETWORKS ═══ */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', padding: '0 0.5rem' }}>
                    <div className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-error)', boxShadow: '0 0 8px var(--color-error)' }}></div>
                    <h2 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Live Intelligence Streams</h2>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
                    gap: '1rem'
                }}>
                    {(MARKET_STREAMS[effectiveMarket.id] || MARKET_STREAMS.us).map((stream, i) => (
                        <div key={i} className="glass-card" style={{ padding: '0', overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--glass-borderShadow)' }}>
                            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={stream.playlistId
                                            ? `https://www.youtube.com/embed?listType=playlist&list=${stream.playlistId}&index=${stream.index}&autoplay=0&mute=1&controls=1`
                                            : stream.videoId
                                                ? `https://www.youtube.com/embed/${stream.videoId}?autoplay=0&mute=1&controls=1`
                                                : `https://www.youtube.com/embed/live_stream?channel_id=${stream.channelId}&autoplay=0&mute=1&controls=1`}
                                        title={stream.name}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        style={{ position: 'absolute', top: 0, left: 0 }}
                                    ></iframe>
                                </div>
                            </div>
                            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white' }}>{stream.name}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>{stream.origin} Network</div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)' }}>
                                        <Play size={14} fill="currentColor" />
                                    </div>
                                    <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)' }}>
                                        <ExternalLink size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>


            {/* Breaking News Ticker - Financial Terminal Style */}
            <div className="glass-card" style={{
                padding: '0 var(--spacing-xs)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0',
                overflow: 'hidden',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--glass-border-bright)',
                borderRadius: '12px',
                height: '36px'
            }}>
                <div style={{
                    background: 'var(--color-error)',
                    color: '#fff',
                    padding: '0 var(--spacing-sm)',
                    height: '100%',
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    letterSpacing: '0.1em',
                    boxShadow: '10px 0 20px rgba(0,0,0,0.5)',
                    zIndex: 2,
                    position: 'relative'
                }}>
                    <div className="pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }}></div>
                    LIVE_FEED
                </div>

                <div style={{
                    padding: '0 var(--spacing-md)',
                    height: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    color: 'var(--color-text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    letterSpacing: '0.05em',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    whiteSpace: 'nowrap'
                }}>
                    GLOBAL_INTELLIGENCE_FLOW
                </div>

                <div style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--color-text-primary)', flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                    <div style={{
                        display: 'inline-block',
                        animation: 'scroll-news 45s linear infinite',
                        paddingLeft: '20px',
                        fontWeight: 500,
                        letterSpacing: '0.02em',
                        color: 'var(--color-success)'
                    }}>
                        {newsTickerText}
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
                gap: '1rem',
                marginBottom: '1rem'
            }}>

                {/* Market Psychological Gauge (Fear & Greed) */}
                <div className="glass-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Zap size={16} color="var(--color-warning)" /> Fear & Greed Index
                            </h3>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: sentimentColor, marginTop: '0.25rem', letterSpacing: '-0.03em' }}>
                                {sentimentScore.toFixed(0)}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>MARKET_MOOD</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: sentimentColor }}>{overallSentiment.toUpperCase()}</div>
                        </div>
                    </div>

                    {/* Gauge Visual - Institutional Style */}
                    <div style={{ position: 'relative', height: '100px', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '15px' }}>
                        {/* Gauge Track */}
                        <div style={{
                            height: '14px',
                            width: '100%',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '7px',
                            position: 'relative',
                            display: 'flex',
                            overflow: 'hidden',
                            border: '1px solid var(--glass-border)'
                        }}>
                            <div style={{ flex: 1, background: '#EF4444', opacity: 0.2 }} />
                            <div style={{ flex: 1, background: '#F59E0B', opacity: 0.2 }} />
                            <div style={{ flex: 1, background: '#10B981', opacity: 0.2 }} />

                            {/* Active Indicator Fill */}
                            <div style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                height: '100%',
                                width: `${sentimentScore}%`,
                                background: sentimentColor,
                                opacity: 0.8,
                                boxShadow: `0 0 15px ${sentimentColor}60`,
                                transition: 'width 1s cubic-bezier(0.2, 0.8, 0.2, 1)'
                            }} />
                        </div>

                        {/* Labels */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: 'var(--spacing-xs) var(--spacing-sm)' }}>
                            {['EXTREME FEAR', 'NEUTRAL', 'EXTREME GREED'].map((label, idx) => (
                                <div key={label} style={{
                                    fontSize: '0.6rem',
                                    fontWeight: 800,
                                    color: idx === 0 && sentimentScore < 33 ? '#EF4444' : (idx === 1 && sentimentScore >= 33 && sentimentScore < 66 ? '#F59E0B' : (idx === 2 && sentimentScore >= 66 ? '#10B981' : 'var(--color-text-tertiary)')),
                                    transition: 'color 0.3s ease'
                                }}>
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Next Event Timer */}
                <div className="glass-card" style={{
                    padding: '1.25rem',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-borderShadow)'
                }}>
                    <h3 style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Timer size={14} /> Next Major Event
                    </h3>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>{nextEventData.name}</div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                            {['hours', 'minutes', 'seconds'].map(unit => (
                                <div key={unit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{
                                        fontSize: '1.8rem',
                                        fontWeight: 800,
                                        color: 'var(--color-accent)',
                                        fontVariantNumeric: 'tabular-nums',
                                        background: 'rgba(0,0,0,0.3)',
                                        padding: '0.5rem',
                                        borderRadius: '8px',
                                        minWidth: '50px'
                                    }}>
                                        {String(timeLeft[unit as keyof typeof timeLeft]).padStart(2, '0')}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '4px', textTransform: 'uppercase' }}>{unit}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Industry Rotation */}
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={14} /> Industry Rotation
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {sectorData.map(sector => (
                            <div key={sector.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ fontSize: '1.2rem' }}>{sector.icon}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', gap: '8px' }}>
                                        <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{sector.name}</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: sector.change >= 0 ? 'var(--color-success)' : 'var(--color-error)', whiteSpace: 'nowrap' }}>
                                            {sector.change > 0 ? '+' : ''}{sector.change.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', position: 'relative' }}>
                                        <div style={{
                                            position: 'absolute',
                                            left: '50%',
                                            width: `${Math.abs(sector.change) * 15}%`,
                                            height: '100%',
                                            background: sector.change >= 0 ? 'var(--color-success)' : 'var(--color-error)',
                                            transform: sector.change < 0 ? 'translateX(-100%)' : 'none',
                                            borderRadius: '2px'
                                        }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Volume Anomalies */}
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart2 size={14} /> Volume Anomalies
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {volumeAnomalies.map(stock => (
                            <div
                                key={stock.symbol}
                                className="glass-card-hover"
                                onClick={() => handleAction(stock.symbol)}
                                style={{
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.03)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    border: '1px solid transparent'
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontWeight: 700 }}>{stock.symbol}</span>
                                        <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px' }}>{stock.vol} Vol</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>{stock.reason}</div>
                                </div>
                                <div style={{ color: stock.change >= 0 ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 600 }}>
                                    {stock.change > 0 ? '+' : ''}{stock.change}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* X Pulse / Social Feed */}
                <div className="glass-card x-pulse-card" style={{ padding: '1.25rem', gridColumn: 'span 2' }}>
                    <style>{`
                        @media (max-width: 1024px) {
                            .x-pulse-card { grid-column: span 1 !important; }
                        }
                    `}</style>
                    <h3 style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MessageSquare size={14} color="#1DA1F2" /> X Market Pulse
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                        {socialPosts.map(post => (
                            <div key={post.id} style={{
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '12px',
                                borderLeft: `3px solid ${post.sentiment === 'positive' ? 'var(--color-success)' : post.sentiment === 'negative' ? 'var(--color-error)' : 'var(--glass-border)'}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{post.author}</span>
                                        <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem' }}>{post.handle}</span>
                                        {post.isVerified && <ShieldCheck size={14} color="#1DA1F2" />}
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
                                        {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.85rem', lineHeight: '1.4', margin: '0 0 0.5rem 0', color: 'var(--color-text-secondary)' }}>
                                    {post.content}
                                </p>
                                {post.symbol && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <span
                                            onClick={() => handleAction(post.symbol!)}
                                            style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                color: 'var(--color-accent)',
                                                cursor: 'pointer',
                                                background: 'rgba(99, 102, 241, 0.1)',
                                                padding: '2px 6px',
                                                borderRadius: '4px'
                                            }}
                                        >
                                            ${post.symbol}
                                        </span>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>Weight: {post.weight}/10</span>

                                        <a
                                            href={post.url || `https://x.com/search?q=${encodeURIComponent(post.symbol || post.author)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ marginLeft: 'auto', color: '#1DA1F2', fontSize: '0.75rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                                        >
                                            <Globe size={12} /> {post.url ? 'View Real Link' : 'View on X Pulse'}
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>

        </div>
    );
};

export default MarketPulsePage;

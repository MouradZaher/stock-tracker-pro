import React, { useState, useEffect, useCallback } from 'react';
import EconomicCalendar from './EconomicCalendar';
import TopMovers from './TopMovers';
import { soundService } from '../services/soundService';
import { getStockNews } from '../services/newsService';
import { useQuery } from '@tanstack/react-query';
import { Timer, TrendingUp, TrendingDown, Activity, BarChart2, RefreshCw, Zap, AlertTriangle, Layers, MessageSquare, ShieldCheck, Globe } from 'lucide-react';
import type { NewsArticle, SocialPost } from '../types';
import { socialFeedService } from '../services/SocialFeedService';

import { getSectorPerformance, getVolumeAnomalies } from '../services/stockDataService';

interface MarketPulsePageProps {
    onSelectStock?: (symbol: string) => void;
}

const MarketPulsePage: React.FC<MarketPulsePageProps> = ({ onSelectStock }) => {
    const handleAction = useCallback((symbol: string) => {
        soundService.playTap();
        onSelectStock?.(symbol);
    }, [onSelectStock]);

    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({ hours: 0, minutes: 0, seconds: 0 });
    const [sectorData, setSectorData] = useState<any[]>([]);
    const [volumeAnomalies, setVolumeAnomalies] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Fetch real breaking news - US Markets focus
    const { data: breakingNews, refetch: refetchNews } = useQuery<NewsArticle[]>({
        queryKey: ['breakingNews'],
        queryFn: async () => {
            return await getStockNews('SPY', 5);
        },
        refetchInterval: 60000,
        staleTime: 30000,
    });

    // Fetch Sector and Volume data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingData(true);
            try {
                const [sectors, volumes] = await Promise.all([
                    getSectorPerformance(),
                    getVolumeAnomalies()
                ]);
                setSectorData(sectors);
                setVolumeAnomalies(volumes);
            } catch (error) {
                console.error('Failed to fetch pulse data:', error);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // 30s refresh
        return () => clearInterval(interval);
    }, []);

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
            padding: window.innerWidth < 768 ? 'var(--spacing-md)' : 'var(--spacing-md) var(--spacing-xl)',
            maxWidth: '100vw',
            margin: '0 auto',
            boxSizing: 'border-box',
            background: 'var(--color-bg-primary)',
            overflowX: 'hidden'
        }}>

            {/* Header Area */}
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, letterSpacing: '-0.02em', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                    Market Pulse
                </h1>
                <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-xs)' }}>
                    Real-time institutional grade market intelligence.
                </p>
            </div>

            {/* Breaking News Ticker - Financial Terminal Style */}
            <div className="glass-card" style={{
                padding: '0 var(--spacing-xs)',
                marginBottom: 'var(--spacing-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: '0',
                overflow: 'hidden',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--glass-border-bright)',
                borderRadius: 'var(--radius-md)',
                height: 'clamp(40px, 5vh, 48px)'
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

                <div style={{ whiteSpace: 'nowrap', fontSize: '0.85rem', color: 'var(--color-text-primary)', flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                    <div style={{
                        display: 'inline-block',
                        animation: 'scroll-news 45s linear infinite',
                        paddingLeft: '20px',
                        fontWeight: 500,
                        letterSpacing: '0.02em'
                    }}>
                        {newsTickerText}
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, clamp(250px, 30vw, 320px)), 1fr))',
                gap: '1.25rem',
                marginBottom: '1.5rem'
            }}>

                {/* Market Psychological Gauge (Fear & Greed) */}
                <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
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
                    padding: '1.5rem',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-borderShadow)'
                }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Timer size={16} /> Next Major Event
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
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={16} /> Industry Rotation
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
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart2 size={16} /> Volume Anomalies
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
                <div className="glass-card x-pulse-card" style={{ padding: '1.5rem', gridColumn: 'span 2' }}>
                    <style>{`
                        @media (max-width: 1024px) {
                            .x-pulse-card { grid-column: span 1 !important; }
                        }
                    `}</style>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MessageSquare size={16} color="#1DA1F2" /> X Market Pulse
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

            {/* Top Movers & Calendar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, clamp(250px, 30vw, 320px)), 1fr))', gap: '1.25rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                    <TopMovers />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                    <EconomicCalendar />
                </div>
            </div>

        </div>
    );
};

export default MarketPulsePage;

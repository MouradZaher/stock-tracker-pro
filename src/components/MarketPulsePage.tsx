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
            <div style={{ marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                    Market Pulse
                </h1>
                <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Real-time institutional grade market intelligence.
                </p>
            </div>

            {/* Breaking News Ticker - Financial Terminal Style */}
            <div className="glass-card" style={{
                padding: '0 0.5rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0',
                overflow: 'hidden',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--glass-border-bright)',
                borderRadius: '8px',
                height: '42px'
            }}>
                <div style={{
                    background: 'var(--color-error)',
                    color: '#fff',
                    padding: '0 12px',
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
                    padding: '0 15px',
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                gap: '1.25rem',
                marginBottom: '1.5rem'
            }}>

                {/* Sentiment Heatmap */}
                <div className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                        <div>
                            <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Activity size={16} color={sentimentColor} /> Market Sentiment
                            </h3>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: sentimentColor, marginTop: '0.25rem' }}>
                                {overallSentiment}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>Bullish Percent</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{sentimentScore.toFixed(0)}%</div>
                        </div>
                    </div>

                    {/* Gauge Visual */}
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                        <div style={{
                            width: `${sentimentScore}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, #EF4444 0%, #F59E0B 50%, #10B981 100%)`,
                            opacity: 0.8
                        }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                        <span>Bearish Zone</span>
                        <span>Neutral</span>
                        <span>Bullish Zone</span>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.25rem' }}>
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

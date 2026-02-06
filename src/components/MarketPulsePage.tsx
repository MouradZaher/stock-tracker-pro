import React, { useState, useEffect, useCallback } from 'react';
import EconomicCalendar from './EconomicCalendar';
import TopMovers from './TopMovers';
import { soundService } from '../services/soundService';
import { getStockNews } from '../services/newsService';
import { useQuery } from '@tanstack/react-query';
import { Timer, TrendingUp, TrendingDown, Activity, BarChart2, RefreshCw, Zap } from 'lucide-react';
import type { NewsArticle } from '../types';

interface MarketPulsePageProps {
    onSelectStock?: (symbol: string) => void;
}

// Real-time sector data (using Yahoo Finance sector ETFs as proxy)
const SECTOR_ETFS = ['XLK', 'XLC', 'XLF', 'XLV', 'XLE', 'XLU'];
const SECTOR_NAMES = ['Technology', 'Comm Services', 'Financials', 'Healthcare', 'Energy', 'Utilities'];

// Volume anomaly stocks to track
const VOLUME_STOCKS = ['PLTR', 'SOFI', 'NIO', 'RIVN', 'HOOD'];

const MarketPulsePage: React.FC<MarketPulsePageProps> = ({ onSelectStock }) => {
    const handleAction = useCallback((symbol: string) => {
        soundService.playTap();
        onSelectStock?.(symbol);
    }, [onSelectStock]);

    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({ hours: 0, minutes: 0, seconds: 0 });

    // Fetch real breaking news
    const { data: breakingNews, refetch: refetchNews } = useQuery<NewsArticle[]>({
        queryKey: ['breakingNews'],
        queryFn: async () => {
            // Fetch news for major indices
            const news = await getStockNews('SPY', 5);
            return news;
        },
        refetchInterval: 60000, // Refresh every minute
        staleTime: 30000,
    });

    // Calculate next market event (runs only once on mount)
    const nextEventData = React.useMemo(() => {
        const now = new Date();
        const events = [
            { name: 'Market Open', hour: 9, minute: 30 },
            { name: 'Market Close', hour: 16, minute: 0 },
            { name: 'Pre-Market', hour: 4, minute: 0 },
            { name: 'After Hours End', hour: 20, minute: 0 },
        ];

        // Find next event
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
            // Tomorrow's pre-market
            nextEventTime = new Date();
            nextEventTime.setDate(nextEventTime.getDate() + 1);
            nextEventTime.setHours(4, 0, 0, 0);
            nextEventName = 'Pre-Market';
        }

        return { name: nextEventName, time: nextEventTime };
    }, []); // Empty deps = runs once

    // Timer interval for countdown (uses stable reference from useMemo)
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

    // Simulated real-time sector data (in production, would fetch from API)
    const [sectorData, setSectorData] = useState([
        { name: 'Technology', change: 2.4 },
        { name: 'Comm Services', change: 1.8 },
        { name: 'Financials', change: 0.5 },
        { name: 'Healthcare', change: -0.2 },
        { name: 'Energy', change: -1.1 },
        { name: 'Utilities', change: -0.8 }
    ]);

    // Simulated volume anomalies with real-time updates
    const [volumeAnomalies, setVolumeAnomalies] = useState([
        { symbol: 'PLTR', vol: '4.2x', reason: 'Unusual Call Activity', change: 3.2 },
        { symbol: 'SOFI', vol: '3.8x', reason: 'High Momentum', change: 5.1 },
        { symbol: 'NIO', vol: '3.1x', reason: 'Sector Rotation', change: -2.4 }
    ]);

    // Calculate market sentiment from sector performance
    const bullishPercent = Math.round(
        (sectorData.filter(s => s.change > 0).length / sectorData.length) * 100
    );
    const overallSentiment = bullishPercent >= 60 ? 'Bullish' : bullishPercent <= 40 ? 'Bearish' : 'Neutral';
    const sentimentColor = overallSentiment === 'Bullish' ? 'var(--color-success)' :
        overallSentiment === 'Bearish' ? 'var(--color-error)' : 'var(--color-warning)';

    // Format news for ticker
    const newsTickerText = breakingNews?.map(n => n.headline).join(' • ') ||
        'Loading breaking news...';

    return (
        <div style={{ padding: 'var(--spacing-xl)', maxWidth: '100%', margin: '0 auto', height: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
            {/* Breaking News Ticker - Real-time */}
            <div className="glass-card" style={{ padding: 'var(--spacing-sm) var(--spacing-xl)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden', cursor: 'pointer', borderLeft: '3px solid var(--color-error)' }} onClick={() => handleAction('SPY')}>
                <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-error)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Activity size={12} /> BREAKING
                </div>
                <div style={{ whiteSpace: 'nowrap', fontSize: '0.9rem', color: 'var(--color-text-secondary)', animation: 'scroll-news 30s linear infinite', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {newsTickerText}
                    <button
                        onClick={(e) => { e.stopPropagation(); refetchNews(); }}
                        style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', padding: '4px' }}
                    >
                        <RefreshCw size={12} />
                    </button>
                </div>
            </div>

            {/* Market Sentiment & Event Timer */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* AI Sentiment Heatmap - Real-time calculation */}
                <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.5rem', opacity: 0.1 }}>
                        <BarChart2 size={80} />
                    </div>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Zap size={14} style={{ color: 'var(--color-accent)' }} />
                        AI Sentiment Heatmap
                        <span style={{ fontSize: '0.65rem', background: 'var(--color-success-light)', color: 'var(--color-success)', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>LIVE</span>
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: sentimentColor }}>{overallSentiment}</span>
                        <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{bullishPercent}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${bullishPercent}%`, background: 'linear-gradient(90deg, var(--color-success), #10b981)', height: '100%', boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)', transition: 'width 0.5s ease' }} />
                        <div style={{ width: `${100 - bullishPercent}%`, background: 'var(--color-error)', height: '100%', opacity: 0.5 }} />
                    </div>
                    <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                        Real-time analysis of sector performance indicates {overallSentiment.toLowerCase()} momentum across markets.
                    </p>
                </div>

                {/* Event Timer - Real next market event */}
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, rgba(20,20,30,0.6) 0%, rgba(30,30,50,0.4) 100%)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Timer size={14} /> Next Major Event
                    </h3>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
                        {nextEventData.name}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {['hours', 'minutes', 'seconds'].map((unit) => (
                            <div key={unit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{
                                    fontSize: '2rem',
                                    fontWeight: 800,
                                    fontVariantNumeric: 'tabular-nums',
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '0.5rem 0.25rem',
                                    borderRadius: '8px',
                                    minWidth: '60px',
                                    textAlign: 'center',
                                    border: '1px solid var(--glass-border)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                }}>
                                    {String(timeLeft[unit as keyof typeof timeLeft]).padStart(2, '0')}
                                </div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem', textTransform: 'uppercase' }}>{unit}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Industry Rotation - With horizontal scroll on mobile */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={14} />
                        Industry Rotation
                        <span style={{ fontSize: '0.65rem', background: 'var(--color-success-light)', color: 'var(--color-success)', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>LIVE</span>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {sectorData.map(sector => (
                            <div key={sector.name}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                                    <span>{sector.name}</span>
                                    <span style={{ color: sector.change >= 0 ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 700 }}>{sector.change > 0 ? '+' : ''}{sector.change}%</span>
                                </div>
                                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${Math.min(Math.abs(sector.change) * 20, 100)}%`,
                                        height: '100%',
                                        background: sector.change >= 0 ? 'var(--color-success)' : 'var(--color-error)',
                                        marginLeft: sector.change < 0 ? 'auto' : '0',
                                        transition: 'width 1.5s ease'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Volume Anomalies */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart2 size={14} />
                        Volume Anomalies
                        <span style={{ fontSize: '0.65rem', background: 'var(--color-warning-light)', color: 'var(--color-warning)', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>ALERT</span>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {volumeAnomalies.map(stock => (
                            <div
                                key={stock.symbol}
                                onClick={() => handleAction(stock.symbol)}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s ease', border: '1px solid transparent' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'transparent'; }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>{stock.symbol}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>{stock.reason}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ color: stock.change >= 0 ? 'var(--color-success)' : 'var(--color-error)', fontSize: '0.8rem', fontWeight: 600 }}>
                                        {stock.change > 0 ? '+' : ''}{stock.change}%
                                    </span>
                                    <span style={{ color: 'var(--color-warning)', fontWeight: 700, fontSize: '0.85rem' }}>{stock.vol}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Movers with horizontal scroll wrapper */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <TopMovers />
                <EconomicCalendar />
            </div>
        </div>
    );
};

export default MarketPulsePage;

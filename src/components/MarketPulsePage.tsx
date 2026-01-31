import React, { useState, useEffect } from 'react';
import EconomicCalendar from './EconomicCalendar';
import TopMovers from './TopMovers';
import { soundService } from '../services/soundService';
import { Timer, TrendingUp, TrendingDown, Activity, BarChart2 } from 'lucide-react';

interface MarketPulsePageProps {
    onSelectStock?: (symbol: string) => void;
}

const MarketPulsePage: React.FC<MarketPulsePageProps> = ({ onSelectStock }) => {
    const handleAction = (symbol: string) => {
        soundService.playTap();
        onSelectStock?.(symbol);
    };

    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({ hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const targetDate = new Date();
        targetDate.setHours(targetDate.getHours() + 4); // Fake next event in 4 hours

        const interval = setInterval(() => {
            const now = new Date();
            const diff = targetDate.getTime() - now.getTime();

            if (diff <= 0) {
                // reset or stop
            } else {
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft({ hours, minutes, seconds });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ padding: 'var(--spacing-xl)', maxWidth: '100%', margin: '0 auto', height: '100%', boxSizing: 'border-box' }}>
            {/* Breaking News Ticker */}
            <div className="glass-card" style={{ padding: 'var(--spacing-sm) var(--spacing-xl)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden', cursor: 'pointer', borderLeft: '3px solid var(--color-error)' }} onClick={() => handleAction('NVDA')}>
                <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-error)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Activity size={12} /> BREAKING
                </div>
                <div style={{ whiteSpace: 'nowrap', fontSize: '0.9rem', color: 'var(--color-text-secondary)', animation: 'scroll-news 30s linear infinite' }}>
                    FED Meeting Minutes: Inflation concerns persist as rate cuts delayed • NVDA hits record high on AI demand • Crude oil prices stabilize near $80 • Tesla announces surprise software update • S&P 500 eyes 6000 level...
                </div>
            </div>

            {/* NEW: Market Sentiment & Event Timer */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Sentiment Heatmap */}
                <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.5rem', opacity: 0.1 }}>
                        <BarChart2 size={80} />
                    </div>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        AI Sentiment Heatmap
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)' }}>Bullish</span>
                        <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>68%</span>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: '68%', background: 'linear-gradient(90deg, var(--color-success), #10b981)', height: '100%', boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }} />
                        <div style={{ width: '32%', background: 'var(--color-error)', height: '100%', opacity: 0.5 }} />
                    </div>
                    <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                        AI analysis of 15,000+ news articles indicates strong buying momentum in Tech and Energy sectors.
                    </p>
                </div>

                {/* Event Timer */}
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, rgba(20,20,30,0.6) 0%, rgba(30,30,50,0.4) 100%)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Timer size={14} /> Next Major Event
                    </h3>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
                        FOMC Rate Decision
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {['hours', 'minutes', 'seconds'].map((unit, i) => (
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

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Sector Performance (Existing) */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
                        Industry Rotation
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                            { name: 'Technology', change: 2.4 },
                            { name: 'Comm Services', change: 1.8 },
                            { name: 'Financials', change: 0.5 },
                            { name: 'Healthcare', change: -0.2 },
                            { name: 'Energy', change: -1.1 },
                            { name: 'Utilities', change: -0.8 }
                        ].map(sector => (
                            <div key={sector.name}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                                    <span>{sector.name}</span>
                                    <span style={{ color: sector.change >= 0 ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 700 }}>{sector.change > 0 ? '+' : ''}{sector.change}%</span>
                                </div>
                                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${Math.abs(sector.change) * 20}%`,
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

                {/* Unusual Volume Alerts (Existing) */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
                        Volume Anomalies
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            { symbol: 'PLTR', vol: '4.2x', reason: 'Unusual Call Activity' },
                            { symbol: 'SOFI', vol: '3.8x', reason: 'High Momentum' },
                            { symbol: 'TME', vol: '3.1x', reason: 'Sector Rotation' }
                        ].map(stock => (
                            <div
                                key={stock.symbol}
                                onClick={() => handleAction(stock.symbol)}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{stock.symbol}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{stock.reason}</div>
                                </div>
                                <div style={{ color: 'var(--color-warning)', fontWeight: 700 }}>{stock.vol} AVG</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <TopMovers />
                <EconomicCalendar />
            </div>
        </div>
    );
};

export default MarketPulsePage;

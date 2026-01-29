import React from 'react';
import EconomicCalendar from './EconomicCalendar';
import TopMovers from './TopMovers';
import { soundService } from '../services/soundService';

interface MarketPulsePageProps {
    onSelectStock?: (symbol: string) => void;
}

const MarketPulsePage: React.FC<MarketPulsePageProps> = ({ onSelectStock }) => {
    const handleAction = (symbol: string) => {
        soundService.playTap();
        onSelectStock?.(symbol);
    };

    return (
        <div style={{ padding: 'var(--spacing-xl)', maxWidth: '100%', margin: '0 auto', height: '100%', boxSizing: 'border-box' }}>
            {/* Breaking News Ticker */}
            <div className="glass-card" style={{ padding: 'var(--spacing-sm) var(--spacing-xl)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden', cursor: 'pointer' }} onClick={() => handleAction('NVDA')}>
                <span style={{ background: 'var(--color-error)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, whiteSpace: 'nowrap' }}>BREAKING</span>
                <div style={{ whiteSpace: 'nowrap', fontSize: '0.9rem', color: 'var(--color-text-secondary)', animation: 'scroll-news 30s linear infinite' }}>
                    FED Meeting Minutes: Inflation concerns persist as rate cuts delayed • NVDA hits record high on AI demand • Crude oil prices stabilize near $80 • Tesla announces surprise software update • S&P 500 eyes 6000 level...
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Sector Performance */}
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

                {/* Unusual Volume Alerts */}
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

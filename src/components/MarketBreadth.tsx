import React from 'react';
import { Activity } from 'lucide-react';

interface MarketBreadthProps {
    value?: number; // 0 to 100
}

const MarketBreadth: React.FC<MarketBreadthProps> = ({ value = 68 }) => {
    return (
        <div className="glass-card" style={{
            padding: '1rem',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            minWidth: '220px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            animation: 'slideInRight 0.5s var(--anim-bounce)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '6px', borderRadius: '8px', background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
                        <Activity size={14} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Market Breadth</span>
                </div>
                <span className={value >= 50 ? 'positive' : 'negative'} style={{ fontSize: '0.9rem', fontWeight: 900 }}>{value}%</span>
            </div>

            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                <div 
                    style={{ 
                        width: `${value}%`, 
                        height: '100%', 
                        background: value >= 50 ? 'var(--color-success)' : 'var(--color-error)',
                        borderRadius: '3px',
                        boxShadow: `0 0 10px ${value >= 50 ? 'var(--color-success)' : 'var(--color-error)'}`,
                        transition: 'width 1s var(--anim-bounce)'
                    }} 
                />
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.2)', zIndex: 1 }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>
                <span>BEARISH</span>
                <span>NEUTRAL</span>
                <span>BULLISH</span>
            </div>
            
            <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-text-tertiary)', fontStyle: 'italic', opacity: 0.8 }}>
                % of S&P 500 stocks above 50-day SMA
            </p>
        </div>
    );
};

export default MarketBreadth;

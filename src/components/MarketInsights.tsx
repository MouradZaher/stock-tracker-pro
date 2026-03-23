import React from 'react';
import { Zap, Layers } from 'lucide-react';

interface FearGreedCardProps {
    sentimentScore: number;
    overallSentiment: string;
    sentimentColor: string;
    isCompact?: boolean;
}

export const FearGreedCard: React.FC<FearGreedCardProps> = ({ sentimentScore, overallSentiment, sentimentColor, isCompact }) => (
    <div className="glass-card" style={{ 
        padding: isCompact ? '0.75rem' : '1.25rem', 
        border: '1px solid var(--glass-border)', 
        flexShrink: 0,
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isCompact ? '0.6rem' : '0.8rem' }}>
            <h3 style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Zap size={14} color="var(--color-warning)" fill="var(--color-warning)" style={{ filter: 'drop-shadow(0 0 5px var(--color-warning))' }} /> Fear & Greed
            </h3>
            {!isCompact && (
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.55rem', color: 'var(--color-text-tertiary)', fontWeight: 800, letterSpacing: '0.12em' }}>MARKET MOOD</div>
                    <div style={{ fontSize: '1rem', fontWeight: 950, color: sentimentColor, letterSpacing: '-0.01em' }}>{overallSentiment.toUpperCase()}</div>
                </div>
            )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isCompact ? '0.75rem' : '1.25rem' }}>
            <div style={{ fontSize: isCompact ? '1.8rem' : '2.8rem', fontWeight: 950, color: sentimentColor, textShadow: `0 0 40px ${sentimentColor}40`, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {sentimentScore.toFixed(0)}
            </div>
            <div style={{ flex: 1, position: 'relative', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ background: 'linear-gradient(90deg, #FF4D4D, #FFD60A, #00D1FF, #00FF94)', height: '100%', borderRadius: '4px' }} />
                <div style={{
                    position: 'absolute', top: '50%',
                    left: `${Math.max(4, Math.min(96, sentimentScore))}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '14px', height: '14px', borderRadius: '50%',
                    background: 'white', border: `3px solid ${sentimentColor}`,
                    boxShadow: `0 0 15px ${sentimentColor}`,
                    transition: 'left 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    zIndex: 10
                }} />
            </div>
        </div>
        {!isCompact && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', padding: '0 4px' }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', fontWeight: 800 }}>EXTREME FEAR</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.6rem', color: sentimentColor, fontWeight: 900 }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: sentimentColor, boxShadow: `0 0 10px ${sentimentColor}`, animation: 'pulse 1.5s infinite' }} />
                    LIVE PULSE
                </div>
                <span style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', fontWeight: 800 }}>EXTREME GREED</span>
            </div>
        )}
        {isCompact && (
             <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.6rem', fontWeight: 950, color: sentimentColor }}>
                <span style={{ letterSpacing: '0.02em' }}>{overallSentiment.toUpperCase()}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8 }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: sentimentColor, boxShadow: `0 0 5px ${sentimentColor}` }} />
                    LIVE
                </div>
             </div>
        )}
    </div>
);

interface IndustryRotationCardProps {
    sectorData: any[];
    isCompact?: boolean;
}

export const IndustryRotationCard: React.FC<IndustryRotationCardProps> = ({ sectorData, isCompact }) => (
    <div className="glass-card" style={{ 
        padding: isCompact ? '0.75rem' : '1.25rem', 
        border: '1px solid var(--glass-border)', 
        flex: 1, 
        minHeight: 0, 
        display: 'flex', 
        flexDirection: 'column',
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isCompact ? '0.6rem' : '0.8rem', flexShrink: 0 }}>
            <h3 style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Layers size={14} color="var(--color-accent)" style={{ filter: 'drop-shadow(0 0 5px var(--color-accent))' }} /> Sector Rotation
            </h3>
            {sectorData.length > 0 && (
                <div style={{ fontSize: '0.6rem', fontWeight: 950, color: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.1)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    {sectorData.filter(s => s.change > 0).length}/{sectorData.length} BULLISH
                </div>
            )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }} className="custom-scrollbar">
            {sectorData.map(sector => (
                <div key={sector.name} style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '1rem', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.2))' }}>{sector.icon}</span> {sector.name.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 950, color: sector.change >= 0 ? 'var(--color-success)' : 'var(--color-error)', fontFamily: 'monospace' }}>
                            {sector.change > 0 ? '+' : ''}{sector.change.toFixed(2)}%
                        </span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ 
                            width: `${Math.min(100, Math.abs(sector.change) * 20)}%`, 
                            height: '100%', 
                            background: sector.change >= 0 
                                ? 'linear-gradient(90deg, var(--color-success), #10B981)' 
                                : 'linear-gradient(90deg, #EF4444, #B91C1C)', 
                            borderRadius: '2px', 
                            transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            boxShadow: sector.change >= 0 ? '0 0 10px rgba(16,185,129,0.3)' : '0 0 10px rgba(239,68,68,0.3)'
                        }} />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

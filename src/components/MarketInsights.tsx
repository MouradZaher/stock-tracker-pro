import React from 'react';
import { Zap, Layers } from 'lucide-react';

interface FearGreedCardProps {
    sentimentScore: number;
    overallSentiment: string;
    sentimentColor: string;
    isCompact?: boolean;
}

export const FearGreedCard: React.FC<FearGreedCardProps> = ({ sentimentScore, overallSentiment, sentimentColor, isCompact }) => (
    <div className="glass-card" style={{ padding: isCompact ? '0.75rem' : '1rem', border: '1px solid var(--glass-border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isCompact ? '0.4rem' : '0.6rem' }}>
            <h3 style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <Zap size={14} color="var(--color-warning)" fill="var(--color-warning)" /> Fear & Greed
            </h3>
            {!isCompact && (
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.55rem', color: 'var(--color-text-tertiary)', fontWeight: 800, letterSpacing: '0.1em' }}>MARKET MOOD</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900, color: sentimentColor }}>{overallSentiment.toUpperCase()}</div>
                </div>
            )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isCompact ? '0.75rem' : '1rem' }}>
            <div style={{ fontSize: isCompact ? '1.5rem' : '2.2rem', fontWeight: 900, color: sentimentColor, textShadow: `0 0 20px ${sentimentColor}40`, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {sentimentScore.toFixed(0)}
            </div>
            <div style={{ flex: 1, position: 'relative', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(90deg, #EF4444, #F59E0B, #10B981)', height: '100%', borderRadius: '3px' }} />
                <div style={{
                    position: 'absolute', top: '-4px',
                    left: `${Math.max(4, Math.min(96, sentimentScore))}%`,
                    transform: 'translateX(-50%)',
                    width: '12px', height: '12px', borderRadius: '50%',
                    background: 'white', border: `2px solid ${sentimentColor}`,
                    boxShadow: `0 0 10px ${sentimentColor}60`,
                    transition: 'left 1s ease'
                }} />
            </div>
        </div>
        {!isCompact && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '0.55rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>FEAR</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.55rem', color: sentimentColor, fontWeight: 800 }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: sentimentColor, animation: 'pulse 1.5s infinite' }} />
                    REAL-TIME
                </div>
                <span style={{ fontSize: '0.55rem', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>GREED</span>
            </div>
        )}
        {isCompact && (
             <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.55rem', fontWeight: 900, color: sentimentColor }}>
                <span>{overallSentiment.toUpperCase()}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '20%', background: sentimentColor }} />
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
    <div className="glass-card" style={{ padding: isCompact ? '0.75rem' : '1rem', border: '1px solid var(--glass-border)', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isCompact ? '0.5rem' : '0.75rem', flexShrink: 0 }}>
            <h3 style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <Layers size={14} color="var(--color-accent)" /> Rotation
            </h3>
            {sectorData.length > 0 && (
                <div style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--color-success)', background: 'var(--color-success-light)', padding: '2px 6px', borderRadius: '4px' }}>
                    {sectorData.filter(s => s.change > 0).length}/{sectorData.length} BULLISH
                </div>
            )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }} className="custom-scrollbar">
            {sectorData.map(sector => (
                <div key={sector.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '0.8rem' }}>{sector.icon}</span> {sector.name}
                        </span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: sector.change >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                            {sector.change > 0 ? '+' : ''}{sector.change.toFixed(2)}%
                        </span>
                    </div>
                    <div style={{ height: '3px', background: 'rgba(255,255,255,0.04)', borderRadius: '1px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, Math.abs(sector.change) * 25)}%`, height: '100%', background: sector.change >= 0 ? 'var(--color-success)' : 'var(--color-error)', borderRadius: '1px', transition: 'width 1.5s ease' }} />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

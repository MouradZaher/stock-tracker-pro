import React from 'react';

interface LiveBadgeProps {
    lastUpdate?: number;
    showPulse?: boolean;
}

export const LiveBadge: React.FC<LiveBadgeProps> = ({ lastUpdate, showPulse = true }) => {
    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.15rem 0.5rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '99px',
            fontSize: '0.625rem',
            fontWeight: 800,
            color: 'var(--color-success)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        }}>
            {showPulse && (
                <span style={{
                    width: '4px',
                    height: '4px',
                    background: 'var(--color-success)',
                    borderRadius: '50%',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }} />
            )}
            <span>Real-time AI</span>
        </div>
    );
};

export default LiveBadge;

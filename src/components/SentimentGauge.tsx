import React from 'react';

const SentimentGauge: React.FC = () => {
    // Mock value for now (0-100: 0=Extreme Fear, 100=Extreme Greed)
    const sentimentValue = 68;

    const getSentimentLabel = (value: number) => {
        if (value >= 75) return { label: 'Extreme Greed', color: '#10b981' };
        if (value >= 55) return { label: 'Greed', color: '#34d399' };
        if (value >= 45) return { label: 'Neutral', color: '#f59e0b' };
        if (value >= 25) return { label: 'Fear', color: '#fb7185' };
        return { label: 'Extreme Fear', color: '#ef4444' };
    };

    const { label, color } = getSentimentLabel(sentimentValue);
    const rotation = (sentimentValue / 100) * 180 - 90; // -90 to 90 degrees

    return (
        <div className="glass-card" style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '280px' }}>
            <h4 style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem', alignSelf: 'flex-start' }}>Market Sentiment</h4>

            <div style={{ position: 'relative', width: '200px', height: '100px', overflow: 'hidden' }}>
                {/* Background Arc */}
                <div style={{
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    background: 'conic-gradient(from 270deg, #ef4444 0%, #f59e0b 25%, #34d399 50%, #10b981 75%)',
                    opacity: 0.2,
                    position: 'absolute',
                    top: 0,
                    left: 0
                }} />

                {/* Needle */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    width: '2px',
                    height: '90px',
                    background: 'white',
                    transformOrigin: 'bottom center',
                    transform: `translateX(-50%) rotate(${rotation}deg)`,
                    transition: 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    boxShadow: '0 0 10px rgba(255,255,255,0.5)',
                    zIndex: 2
                }} />

                {/* Center Hub */}
                <div style={{
                    position: 'absolute',
                    bottom: '-10px',
                    left: '50%',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    transform: 'translateX(-50%)',
                    zIndex: 3
                }} />
            </div>

            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: color }}>{sentimentValue}</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: color, marginTop: '0.25rem' }}>{label}</div>
            </div>
        </div>
    );
};

export default SentimentGauge;

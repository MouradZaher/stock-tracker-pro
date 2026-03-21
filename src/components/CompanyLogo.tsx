import React, { useState } from 'react';

interface CompanyLogoProps {
    symbol: string;
    size?: number;
    className?: string;
}

const CompanyLogo: React.FC<CompanyLogoProps> = ({ symbol, size = 24, className = '' }) => {
    const [error, setError] = useState(false);
    
    // Clean symbol (remove ^ for indices, etc) to ensure valid URL and abbreviation
    const cleanSymbol = symbol.replace(/[^a-zA-Z0-9]/g, '');

    if (error || !cleanSymbol) {
        return (
            <div 
                className={`company-logo-fallback ${className}`}
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    background: 'var(--color-bg-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: `${size * 0.45}px`,
                    fontWeight: 800,
                    color: 'var(--color-text-primary)',
                    flexShrink: 0,
                    border: '1px solid var(--glass-border)',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
                    overflow: 'hidden'
                }}
            >
                {cleanSymbol.substring(0, 2).toUpperCase() || '?'}
            </div>
        );
    }

    return (
        <img
            src={`https://financialmodelingprep.com/image-stock/${cleanSymbol}.png`}
            alt={`${symbol} logo`}
            onError={() => setError(true)}
            className={`company-logo ${className}`}
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                objectFit: 'cover',
                background: 'white', // Ensure dark/transparent logos look crisp
                padding: '2px',
                flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
            }}
        />
    );
};

export default CompanyLogo;

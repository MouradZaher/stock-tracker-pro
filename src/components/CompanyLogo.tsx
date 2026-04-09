import React, { useState } from 'react';

interface CompanyLogoProps {
    symbol: string;
    size?: number;
    className?: string;
}

const CompanyLogo: React.FC<CompanyLogoProps> = ({ symbol, size = 24, className = '' }) => {
    const [fallbackLevel, setFallbackLevel] = useState(0);
    
    // Clean symbol and trim whitespace
    const cleanSymbol = symbol.trim().replace(/[^a-zA-Z0-9]/g, '');

    // List of indices that definitely don't have FMP stock-images
    const isIndex = symbol.startsWith('^') || ['GSPC', 'DJI', 'IXIC', 'VIX', 'RUT'].includes(cleanSymbol);

    const logoSources = [
        `https://financialmodelingprep.com/image-stock/${cleanSymbol}.png`,
        `https://logo.clearbit.com/${cleanSymbol.toLowerCase()}.com`,
        `https://raw.githubusercontent.com/twelvedata/p/master/logos/${cleanSymbol}.png`
    ];

    if (!cleanSymbol || isIndex || fallbackLevel >= logoSources.length) {
        // Special styling for major indices
        let indexColor = 'var(--color-bg-elevated)';
        let indexLabel = cleanSymbol.substring(0, 2).toUpperCase();

        if (cleanSymbol === 'GSPC') { indexColor = '#10B981'; indexLabel = 'SP'; }
        else if (cleanSymbol === 'DJI') { indexColor = '#3b82f6'; indexLabel = 'DJ'; }
        else if (cleanSymbol === 'IXIC') { indexColor = '#8B5CF6'; indexLabel = 'NQ'; }
        else if (cleanSymbol === 'VIX') { indexColor = '#EF4444'; indexLabel = 'VX'; }

        return (
            <div 
                className={`company-logo-fallback ${className}`}
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    background: indexColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: `${size * 0.4}px`,
                    fontWeight: 900,
                    color: 'white',
                    flexShrink: 0,
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
                    overflow: 'hidden'
                }}
            >
                {indexLabel}
            </div>
        );
    }

    return (
        <img
            src={logoSources[fallbackLevel]}
            alt={`${symbol} logo`}
            onError={() => setFallbackLevel(prev => prev + 1)}
            className={`company-logo ${className}`}
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                objectFit: 'cover',
                background: 'white', 
                padding: '2px',
                flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
            }}
        />
    );
};

export default CompanyLogo;

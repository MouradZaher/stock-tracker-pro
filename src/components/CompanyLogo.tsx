import React, { useState } from 'react';
import { LOGO_DOMAINS } from '../data/logoMapping';

interface CompanyLogoProps {
    symbol: string;
    size?: number;
    className?: string;
}

const CompanyLogo: React.FC<CompanyLogoProps> = ({ symbol, size = 24, className = '' }) => {
    const [fallbackLevel, setFallbackLevel] = useState(0);
    
    // Clean symbol for API sources (FMP, TwelveData)
    const cleanSymbol = symbol.trim().replace(/[^a-zA-Z0-9]/g, '');
    
    // Check for high-fidelity mapping first
    const mappedDomain = LOGO_DOMAINS[symbol.toUpperCase().trim()];

    // List of indices that definitely don't have FMP stock-images
    const isIndex = symbol.startsWith('^') || ['GSPC', 'DJI', 'IXIC', 'VIX', 'RUT'].includes(cleanSymbol);

    const logoSources = [];
    
    // 1. If mapped, try Clearbit Domain (Highest quality for International)
    if (mappedDomain) {
        logoSources.push(`https://logo.clearbit.com/${mappedDomain}`);
    }

    // 2. Try FMP (Great for US Stocks)
    logoSources.push(`https://financialmodelingprep.com/image-stock/${cleanSymbol}.png`);

    // 3. Try Clearbit Symbol (Fallback for US)
    logoSources.push(`https://logo.clearbit.com/${cleanSymbol.toLowerCase()}.com`);

    // 4. Try TwelveData (Broad coverage)
    logoSources.push(`https://raw.githubusercontent.com/twelvedata/p/master/logos/${cleanSymbol}.png`);

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

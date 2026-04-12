import React, { useState } from 'react';
import { LOGO_DOMAINS } from '../data/logoMapping';

interface CompanyLogoProps {
    symbol: string;
    size?: number;
    className?: string;
}

const CompanyLogo: React.FC<CompanyLogoProps> = ({ symbol, size = 24, className = '' }) => {
    const [fallbackLevel, setFallbackLevel] = useState(0);

    // High-priority overrides for institutions that lack standard favicons or use plain text sites
    const LOGO_OVERRIDES: Record<string, string> = {
        'BRK-B': 'https://financialmodelingprep.com/image-stock/BRKB.png',
        'BRK.B': 'https://financialmodelingprep.com/image-stock/BRKB.png',
        'COP': 'https://financialmodelingprep.com/image-stock/COP.png',
        'DHR': 'https://financialmodelingprep.com/image-stock/DHR.png',
        'YAHSAT': 'https://www.yahsat.com/favicon.ico',
        'ALYAHSAT': 'https://www.yahsat.com/favicon.ico',
        'BAYANAT': 'https://www.bayanat.ai/favicon.ico',
        'FWRY': 'https://fawry.com/wp-content/uploads/2021/03/favicon.png',
        'COMI': 'https://www.cibeg.com/o/cib-theme/images/favicon.ico',
        'SKY': 'https://www.sky.com/assets/favicon.ico'
    };

    const overrideUrl = LOGO_OVERRIDES[symbol.toUpperCase().trim()];
    
    // Split ticker from market suffix (e.g., "MFOT.CA" -> ["MFOT", "CA"])
    const symbolParts = symbol.toUpperCase().trim().split('.');
    const ticker = symbolParts[0];
    const suffix = symbolParts[1] || '';
    
    // Check for high-fidelity mapping first
    const mappedDomain = LOGO_DOMAINS[symbol.toUpperCase().trim()];

    // List of indices that definitely don't have FMP stock-images
    const isIndex = symbol.startsWith('^') || ['GSPC', 'DJI', 'IXIC', 'VIX', 'RUT'].includes(ticker);

    // Egyptian Market (EGX) symbols often lack high-fidelity US-based logos
    const isEGX = suffix === 'CA' || [
        'SKPC', 'OLFI', 'BFF', 'AZG', 'BIN', 'CI30', 'BMM', 'ABUK', 'COMI', 'HRHO', 
        'SWDY', 'FWRY', 'EKHO', 'ETEL', 'MFOT', 'HELI', 'ISPH', 'AMOC', 'TMGH', 
        'ALCN', 'MICH', 'SIDP', 'KIMA', 'GBAS', 'PORT', 'AMER', 'MNHD', 'OCDI'
    ].includes(ticker);

    // Abu Dhabi Market (ADX)
    const isADX = suffix === 'AD' || [
        'IHC', 'FAB', 'ETISALAT', 'ADNOCDIST', 'ADCB', 'ALDAR', 'BOROUGE', 'ADPORTS',
        'ALYAHSAT', 'ADNOCLS', 'ADNOCDRILL', 'MULTIPLY', 'BAYANAT', 'FERTIGLOBE', 'DANA'
    ].includes(ticker);

    const logoSources: string[] = [];

    // 0. MANUAL OVERRIDES (Highest reliability for known issues)
    if (overrideUrl) {
        logoSources.push(overrideUrl);
    }

    // 1. HIGH-FIDELITY: Google Favicon API (Most reliable for corporate domains)
    if (mappedDomain) {
        logoSources.push(`https://www.google.com/s2/favicons?sz=128&domain=${mappedDomain}`);
    }

    // 2. Clearbit Mapped Domain
    if (mappedDomain) {
        logoSources.push(`https://logo.clearbit.com/${mappedDomain}`);
    }

    // 3. Financial Modeling Prep (Great for US Stocks)
    logoSources.push(`https://financialmodelingprep.com/image-stock/${ticker}.png`);

    // 4. Clearbit Fallback (Ticker-based)
    logoSources.push(`https://logo.clearbit.com/${ticker.toLowerCase()}.com`);

    // 5. TwelveData (Global coverage)
    logoSources.push(`https://raw.githubusercontent.com/twelvedata/p/master/logos/${ticker}.png`);

    // Prevent network requests for regional stocks that are known to fail standard sources
    const isRegional = isEGX || isADX;

    if (!ticker || isIndex || (isRegional && !mappedDomain && !overrideUrl) || fallbackLevel >= logoSources.length) {
        // Special styling for major indices
        let indexColor = 'var(--color-bg-elevated)';
        let indexLabel = ticker.substring(0, 2).toUpperCase();

        if (ticker === 'GSPC') { indexColor = '#10B981'; indexLabel = 'SP'; }
        else if (ticker === 'DJI') { indexColor = '#3b82f6'; indexLabel = 'DJ'; }
        else if (ticker === 'IXIC') { indexColor = '#8B5CF6'; indexLabel = 'NQ'; }
        else if (ticker === 'VIX') { indexColor = '#EF4444'; indexLabel = 'VX'; }
        else if (isRegional) { 
            indexColor = isEGX ? '#b91c1c' : '#0369a1'; 
            indexLabel = ticker.substring(0, 2);
        }

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

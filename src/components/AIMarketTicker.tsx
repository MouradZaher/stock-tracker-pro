import React, { useEffect, useRef } from 'react';
import { useMarket } from '../contexts/MarketContext';
import type { MarketId } from '../contexts/MarketContext';
import { useTheme } from '../contexts/ThemeContext';

// ─── TradingView Ticker Tape Symbols Per Market ──────────────────────────────
// Index is always the first symbol (shown as "primary").
// Then the 5 largest-cap stocks in each index.
const MARKET_SYMBOLS: Record<MarketId, { proName: string; title: string }[]> = {
    us: [
        { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
        { proName: 'NASDAQ:NVDA', title: 'NVDA' },
        { proName: 'NASDAQ:AAPL', title: 'AAPL' },
        { proName: 'NASDAQ:MSFT', title: 'MSFT' },
        { proName: 'NASDAQ:AMZN', title: 'AMZN' },
        { proName: 'NASDAQ:GOOGL', title: 'GOOGL' },
    ],
    egypt: [
        { proName: 'EGX:EGX30', title: 'EGX 30' },
        { proName: 'EGX:COMI', title: 'CIB' },
        { proName: 'EGX:HRHO', title: 'HRHO' },
        { proName: 'EGX:TMGH', title: 'TMGH' },
        { proName: 'EGX:EAST', title: 'EAST' },
        { proName: 'EGX:EFIH', title: 'EFG' },
    ],
    abudhabi: [
        { proName: 'ADX:FABN', title: 'FAB' },
        { proName: 'ADX:ADNOCDIST', title: 'ADNOC Dist.' },
        { proName: 'ADX:ETISALAT', title: 'e&' },
        { proName: 'ADX:IHC', title: 'IHC' },
        { proName: 'ADX:ALDAR', title: 'Aldar' },
        { proName: 'ADX:TAQA', title: 'TAQA' },
    ],
};

const AIMarketTicker: React.FC = () => {
    const { selectedMarket } = useMarket();
    const { theme } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        container.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
        script.async = true;
        script.type = 'text/javascript';
        script.innerHTML = JSON.stringify({
            symbols: MARKET_SYMBOLS[selectedMarket.id] || MARKET_SYMBOLS.us,
            showSymbolLogo: true,
            isTransparent: true,
            displayMode: 'adaptive',
            colorTheme: theme === 'dark' ? 'dark' : 'light',
            locale: 'en',
        });

        const wrapper = document.createElement('div');
        wrapper.className = 'tradingview-widget-container__widget';
        container.appendChild(wrapper);
        wrapper.appendChild(script);

        return () => { container.innerHTML = ''; };
    }, [selectedMarket.id, theme]);

    return (
        <div
            style={{
                width: '100%',
                marginBottom: '1.25rem',
                borderRadius: '12px',
                overflow: 'hidden',
                border: `1px solid ${selectedMarket.color}33`,
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(12px)',
                minHeight: '52px',
            }}
        >
            {/* Market label pill */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px 0',
                fontSize: '0.6rem',
                fontWeight: 800,
                color: selectedMarket.color,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                opacity: 0.85,
            }}>
                <img src={selectedMarket.flagUrl} alt="" style={{ width: '13px', height: '9px', borderRadius: '1px', objectFit: 'cover' }} />
                {selectedMarket.indexName} — LIVE
            </div>

            {/* TradingView ticker tape */}
            <div
                className="tradingview-widget-container"
                ref={containerRef}
                style={{ width: '100%', minHeight: '44px' }}
            />
        </div>
    );
};

export default AIMarketTicker;

import React, { useEffect, useRef } from 'react';
import { useMarket } from '../contexts/MarketContext';
import type { MarketId } from '../contexts/MarketContext';
import { useTheme } from '../contexts/ThemeContext';

// ─── One index symbol per market ────────────────────────────────────────────
const INDEX_SYMBOL: Record<MarketId, string> = {
    us: 'SP:SPX',       // S&P 500
    egypt: 'EGX:EGX30',    // EGX 30
    abudhabi: 'ADX:ADSMI',    // Abu Dhabi Securities Market Index
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
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
        script.async = true;
        script.type = 'text/javascript';
        script.innerHTML = JSON.stringify({
            symbol: INDEX_SYMBOL[selectedMarket.id] ?? 'SP:SPX',
            width: '100%',
            height: 200,
            locale: 'en',
            dateRange: '1D',
            colorTheme: theme === 'dark' ? 'dark' : 'light',
            isTransparent: true,
            autosize: false,
            largeChartUrl: '',
            chartOnly: false,
            noTimeScale: false,
        });

        const widget = document.createElement('div');
        widget.className = 'tradingview-widget-container__widget';
        container.appendChild(widget);
        widget.appendChild(script);

        return () => { container.innerHTML = ''; };
    }, [selectedMarket.id, theme]);

    return (
        <div
            style={{
                width: '100%',
                marginBottom: '1.25rem',
                borderRadius: '14px',
                overflow: 'hidden',
                border: `1px solid ${selectedMarket.color}44`,
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                position: 'relative',
            }}
        >
            {/* Header label */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px 0',
                fontSize: '0.6rem',
                fontWeight: 800,
                color: selectedMarket.color,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
            }}>
                <img
                    src={selectedMarket.flagUrl}
                    alt=""
                    style={{ width: '13px', height: '9px', borderRadius: '1px', objectFit: 'cover' }}
                />
                {selectedMarket.indexName} — LIVE
                <span style={{
                    marginLeft: 'auto',
                    background: `${selectedMarket.color}22`,
                    color: selectedMarket.color,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontSize: '0.5rem',
                    fontWeight: 900,
                }}>
                    1D
                </span>
            </div>

            {/* TradingView mini chart */}
            <div
                className="tradingview-widget-container"
                ref={containerRef}
                style={{ width: '100%', height: '200px' }}
            />
        </div>
    );
};

export default AIMarketTicker;

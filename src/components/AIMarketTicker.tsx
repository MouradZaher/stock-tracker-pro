import React, { useEffect, useRef } from 'react';
import { useMarket } from '../contexts/MarketContext';
import type { MarketId } from '../contexts/MarketContext';
import { useTheme } from '../contexts/ThemeContext';

// ─── One index symbol per market ────────────────────────────────────────────
// Using FOREXCOM/OANDA CFD symbols — freely embeddable across all regions.
// EGX and ADX proper exchange symbols also work in the advanced-chart widget.
const INDEX_SYMBOL: Record<MarketId, string> = {
    us: 'FOREXCOM:SPXUSD',   // S&P 500 (CFD — no geo-restriction)
    egypt: 'EGX:EGX30',         // EGX 30  (Egyptian Exchange)
    abudhabi: 'ADX:ADSMI',         // Abu Dhabi Securities Market Index
};

// Interval: 'D' = daily bars for clean intraday view, '60' = 1h
const INTERVAL = 'D';

const AIMarketTicker: React.FC = () => {
    const { selectedMarket } = useMarket();
    const { theme } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        container.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
        script.async = true;
        script.type = 'text/javascript';

        script.innerHTML = JSON.stringify({
            autosize: true,
            symbol: INDEX_SYMBOL[selectedMarket.id] ?? 'FOREXCOM:SPXUSD',
            interval: INTERVAL,
            timezone: 'Etc/UTC',
            theme: theme === 'dark' ? 'dark' : 'light',
            style: '3',       // 3 = area / mountain chart — clean look
            locale: 'en',
            backgroundColor: 'rgba(0,0,0,0)',
            gridColor: 'rgba(255,255,255,0.03)',
            hide_top_toolbar: true,
            hide_legend: true,
            hide_side_toolbar: true,
            allow_symbol_change: false,
            save_image: false,
            calendar: false,
            support_host: 'https://www.tradingview.com',
        });

        const widget = document.createElement('div');
        widget.className = 'tradingview-widget-container__widget';
        widget.style.height = '100%';
        widget.style.width = '100%';
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
            }}
        >
            {/* Header pill */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px 4px',
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
                    DAILY
                </span>
            </div>

            {/* TradingView advanced chart — area style, no toolbars */}
            <div
                className="tradingview-widget-container"
                ref={containerRef}
                style={{ width: '100%', height: '220px' }}
            />
        </div>
    );
};

export default AIMarketTicker;

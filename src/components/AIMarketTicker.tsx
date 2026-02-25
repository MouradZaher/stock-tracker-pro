import React, { useEffect, useRef } from 'react';
import { useMarket } from '../contexts/MarketContext';
import type { MarketId } from '../contexts/MarketContext';
import { useTheme } from '../contexts/ThemeContext';

const INDEX_SYMBOL: Record<MarketId, string> = {
    us: 'FOREXCOM:SPXUSD',
    egypt: 'EGX:EGX30',
    abudhabi: 'ADX:ADSMI',
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
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
        script.async = true;
        script.type = 'text/javascript';

        script.innerHTML = JSON.stringify({
            autosize: true,
            symbol: INDEX_SYMBOL[selectedMarket.id] ?? 'FOREXCOM:SPXUSD',
            interval: 'D',
            timezone: 'Etc/UTC',
            theme: theme === 'dark' ? 'dark' : 'light',
            style: '1',           // candlestick — more useful with toolbar
            locale: 'en',
            backgroundColor: 'rgba(0,0,0,0)',
            gridColor: 'rgba(255,255,255,0.04)',
            // ── Show native TradingView controls ──────────────
            hide_top_toolbar: false,          // timeframe bar, zoom, compare
            hide_legend: false,          // OHLC legend
            hide_side_toolbar: false,          // drawing tools
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
        <div style={{
            width: '100%',
            marginBottom: '1.25rem',
            borderRadius: '14px',
            overflow: 'hidden',
            border: `1px solid ${selectedMarket.color}44`,
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
        }}>
            {/* Market label */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 12px 5px',
                fontSize: '0.6rem',
                fontWeight: 800,
                color: selectedMarket.color,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
            }}>
                <img
                    src={selectedMarket.flagUrl}
                    alt=""
                    style={{ width: '13px', height: '9px', borderRadius: '1px', objectFit: 'cover' }}
                />
                {selectedMarket.indexName} — LIVE
            </div>

            {/* Full TradingView chart with native toolbar */}
            <div
                className="tradingview-widget-container"
                ref={containerRef}
                style={{ width: '100%', height: '340px' }}
            />
        </div>
    );
};

export default AIMarketTicker;

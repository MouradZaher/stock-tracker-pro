import React, { useEffect, useRef, useState } from 'react';
import { useMarket } from '../contexts/MarketContext';
import type { MarketId } from '../contexts/MarketContext';
import { useTheme } from '../contexts/ThemeContext';

const INDEX_SYMBOL: Record<MarketId, string> = {
    us: 'FOREXCOM:SPXUSD',
    egypt: 'EGX:EGX30',
    abudhabi: 'ADX:ADSMI',
};

// Label → TradingView interval code
const TIMEFRAMES = [
    { label: '1H', interval: '60' },
    { label: '1D', interval: 'D' },
    { label: '1W', interval: 'W' },
    { label: '1M', interval: 'M' },
    { label: '3M', interval: '3M' },
    { label: '1Y', interval: '12M' },
];

const AIMarketTicker: React.FC = () => {
    const { selectedMarket } = useMarket();
    const { theme } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeInterval, setActiveInterval] = useState('D');

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
            interval: activeInterval,
            timezone: 'Etc/UTC',
            theme: theme === 'dark' ? 'dark' : 'light',
            style: '3',   // area / mountain
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
    }, [selectedMarket.id, theme, activeInterval]);

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

            {/* ── Header: market name + timeframe buttons ── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 10px 6px',
                flexWrap: 'wrap',
            }}>
                {/* Market label */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    color: selectedMarket.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginRight: 'auto',
                }}>
                    <img
                        src={selectedMarket.flagUrl}
                        alt=""
                        style={{ width: '13px', height: '9px', borderRadius: '1px', objectFit: 'cover' }}
                    />
                    {selectedMarket.indexName} — LIVE
                </div>

                {/* Timeframe buttons */}
                <div style={{ display: 'flex', gap: '4px' }}>
                    {TIMEFRAMES.map(tf => {
                        const active = activeInterval === tf.interval;
                        return (
                            <button
                                key={tf.label}
                                onClick={() => setActiveInterval(tf.interval)}
                                style={{
                                    padding: '2px 7px',
                                    borderRadius: '5px',
                                    fontSize: '0.55rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    border: active
                                        ? `1px solid ${selectedMarket.color}`
                                        : '1px solid var(--glass-border)',
                                    background: active
                                        ? `${selectedMarket.color}22`
                                        : 'transparent',
                                    color: active
                                        ? selectedMarket.color
                                        : 'var(--color-text-tertiary)',
                                    transition: 'all 0.15s ease',
                                    lineHeight: 1.4,
                                }}
                            >
                                {tf.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* TradingView chart */}
            <div
                className="tradingview-widget-container"
                ref={containerRef}
                style={{ width: '100%', height: '220px' }}
            />
        </div>
    );
};

export default AIMarketTicker;

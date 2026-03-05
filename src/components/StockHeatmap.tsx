import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useMarket } from '../contexts/MarketContext';
import { socialFeedService } from '../services/SocialFeedService';
import HeatmapMobileFallback from './HeatmapMobileFallback';

const StockHeatmap: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState(false);
    const [retryKey, setRetryKey] = useState(0);
    const [sentiment, setSentiment] = useState<{ score: number; label: string; count: number } | null>(null);
    const { theme } = useTheme();
    const { effectiveMarket } = useMarket();
    const [blockSize, setBlockSize] = useState<'market_cap_basic' | 'volume'>('market_cap_basic');
    const [blockColor, setBlockColor] = useState<'change' | 'high_low_range'>('change');
    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobileView = width < 600;

    useEffect(() => {
        socialFeedService.getGlobalFeed().then(() => {
            setSentiment(socialFeedService.getGlobalSentiment());
        });
    }, [retryKey]);

    useEffect(() => {
        if (!containerRef.current || isMobileView) return;

        setError(false);
        const container = containerRef.current;
        container.innerHTML = '';

        const initWidget = () => {
            if (!container) return;
            container.innerHTML = '';

            try {
                const script = document.createElement('script');
                script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
                script.async = true;
                script.type = 'text/javascript';
                script.innerHTML = JSON.stringify({
                    "exchanges": effectiveMarket.heatmapExchanges,
                    "dataSource": effectiveMarket.heatmapDataSource,
                    "grouping": effectiveMarket.heatmapExchanges.length > 0 ? "no_group" : "sector",
                    "blockSize": blockSize,
                    "blockColor": blockColor,
                    "locale": "en",
                    "symbolUrl": window.location.origin + "/search?symbol={SYMBOL}",
                    "colorTheme": theme === 'dark' ? 'dark' : 'light',
                    "hasTopBar": true,
                    "isDataSetEnabled": true,
                    "isZoomEnabled": true,
                    "hasSymbolTooltip": true,
                    "width": "100%",
                    "height": "100%"
                });

                script.onerror = () => {
                    console.error("TradingView widget script failed to load");
                    setError(true);
                };

                const widgetContainer = document.createElement('div');
                widgetContainer.className = 'tradingview-widget-container__widget';
                widgetContainer.style.height = '100%';
                widgetContainer.style.width = '100%';

                container.appendChild(widgetContainer);
                widgetContainer.appendChild(script);
            } catch (e) {
                console.error(e);
                setError(true);
            }
        };

        // iOS needs extra time for layout to settle; desktop 200ms is fine
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
        const timer = setTimeout(initWidget, isIOS ? 700 : 200);

        return () => {
            clearTimeout(timer);
            if (container) container.innerHTML = '';
        };
    }, [retryKey, theme, effectiveMarket.id, blockSize, blockColor]);

    return (
        // ===== LOCKED: Heatmap Container Layout — DO NOT MODIFY (approved 2026-02-16) =====
        <div
            className="heatmap-container"
            style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                padding: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
            }}
        >
            {error ? (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-primary)',
                }}>
                    <AlertTriangle size={48} className="text-warning" style={{ marginBottom: '1rem' }} />
                    <p style={{ marginBottom: '1rem' }}>Failed to load market map</p>
                    <button
                        onClick={() => { setError(false); setRetryKey(k => k + 1); }}
                        className="glass-button"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <RefreshCw size={16} /> Retry
                    </button>
                </div>
            ) : isMobileView ? (
                <HeatmapMobileFallback />
            ) : (
                <>
                    {/* Premium Pulse Toolbar */}
                    <div className="heatmap-pulse-toolbar" style={{
                        position: 'absolute',
                        top: '12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '6px 16px',
                        background: 'rgba(15, 15, 25, 0.7)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-full)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        pointerEvents: 'auto'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid var(--glass-border)', paddingRight: '12px' }}>
                            <div className={`sentiment-indicator ${sentiment?.label.toLowerCase() || 'neutral'}`} style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: sentiment?.label === 'Bullish' ? 'var(--color-success)' : sentiment?.label === 'Bearish' ? 'var(--color-error)' : 'var(--color-text-tertiary)',
                                boxShadow: sentiment?.label === 'Bullish' ? '0 0 10px var(--color-success)' : sentiment?.label === 'Bearish' ? '0 0 10px var(--color-error)' : 'none'
                            }} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                AI Pulse: {sentiment?.label || 'Calibrating...'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <select
                                value={blockSize}
                                onChange={(e) => setBlockSize(e.target.value as any)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--color-text-secondary)',
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <option value="market_cap_basic">Size: Market Cap</option>
                                <option value="volume">Size: Volume</option>
                            </select>

                            <select
                                value={blockColor}
                                onChange={(e) => setBlockColor(e.target.value as any)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--color-text-secondary)',
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <option value="change">Color: Daily Change %</option>
                                <option value="high_low_range">Color: High/Low Range</option>
                            </select>
                        </div>
                    </div>

                    <div
                        className="tradingview-widget-container"
                        ref={containerRef}
                        style={{
                            flex: 1,
                            width: '100%',
                            height: '100%',
                            position: 'relative',
                            overflow: 'hidden',
                            touchAction: 'pan-x pan-y',
                            pointerEvents: 'auto',
                        }}
                    />
                </>
            )}
        </div>
    );
};

export default StockHeatmap;

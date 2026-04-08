import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, AlertTriangle, Activity, ChevronDown } from 'lucide-react';
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
    const { effectiveMarket, timeframe, setTimeframe } = useMarket();
    const [blockSize, setBlockSize] = useState<'market_cap_basic' | 'volume'>('market_cap_basic');
    const [blockColor, setBlockColor] = useState<'change' | 'high_low_range'>('change');
    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setWidth(window.innerWidth);
            }, 100); // Throttle resize events to 100ms
        };
        window.addEventListener('resize', handleResize);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', handleResize);
        }
    }, []);

    const isMobileView = width < 768;

    useEffect(() => {
        socialFeedService.getGlobalFeed().then(() => {
            setSentiment(socialFeedService.getGlobalSentiment());
        });
    }, [retryKey]);

    useEffect(() => {
        if (!containerRef.current) return;

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
                    "symbolUrl": window.location.origin + "/recommendations?tab=navigator&aiStock={SYMBOL}",
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
                widgetContainer.style.position = 'absolute';
                widgetContainer.style.top = '0';
                widgetContainer.style.bottom = '0';
                widgetContainer.style.left = '0';
                widgetContainer.style.right = '0';

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
            className="heatmap-wrapper"
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
            ) : (
                <>
                    {/* Header / Institutional Controls (Mimics Screener Table Header for Consistency) */}
                    <div style={{ 
                        display: 'flex', 
                        borderBottom: '1px solid var(--glass-border)', 
                        padding: '0.6rem 0', 
                        background: 'rgba(10,10,18,0.95)', 
                        backdropFilter: 'blur(10px)',
                        fontWeight: 900, 
                        fontSize: '0.62rem', 
                        color: 'var(--color-text-tertiary)', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.12em',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 100
                    }}>
                        <div style={{ flex: '0 0 320px', padding: '0 1.5rem' }}>Asset Heatmap</div>
                        <div style={{ flex: '0 0 110px', padding: '0 0.5rem', textAlign: 'right' }}>Pricing</div>
                        <div style={{ flex: '0 0 110px', padding: '0 0.5rem', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', position: 'relative' }}>
                            <select 
                                value={timeframe} 
                                onChange={(e) => setTimeframe(e.target.value)}
                                style={{
                                    appearance: 'none',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--color-accent)',
                                    fontSize: '0.62rem',
                                    fontWeight: 900,
                                    padding: '0 14px 0 0',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    textTransform: 'uppercase',
                                    textAlign: 'right',
                                    width: '100%',
                                    fontFamily: 'inherit',
                                    letterSpacing: 'inherit'
                                }}
                            >
                                {['5m', '1h', '4h', 'D', 'W', 'M', '6M', '1Y'].map(tf => (
                                    <option key={tf} value={tf} style={{ background: '#0a0a12', color: 'white' }}>% {tf}</option>
                                ))}
                            </select>
                            <ChevronDown size={10} style={{ position: 'absolute', right: '0.5rem', pointerEvents: 'none', opacity: 0.8, color: 'var(--color-accent)' }} />
                        </div>
                        <div style={{ flex: '0 0 130px', padding: '0 0.5rem', textAlign: 'right' }}>Vol {timeframe}</div>
                        <div style={{ display: 'flex', flex: 1, justifyContent: 'flex-end', padding: '0 1.5rem', gap: '2rem' }}>
                            <div className="desktop-only">PEG</div>
                            <div className="desktop-only">MOMENTUM</div>
                            <div className="desktop-only text-accent">LIVE FEED</div>
                        </div>
                    </div>

                    <div
                        className="tradingview-widget-container"
                        ref={containerRef}
                        style={{
                            position: 'absolute',
                            top: '40px', // Below the new header
                            left: 0,
                            right: 0,
                            bottom: 0,
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

export default React.memo(StockHeatmap);

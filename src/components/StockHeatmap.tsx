import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useMarket } from '../contexts/MarketContext';
import { socialFeedService } from '../services/SocialFeedService';

const StockHeatmap: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState(false);
    const [retryKey, setRetryKey] = useState(0);
    const [sentiment, setSentiment] = useState<{ score: number; label: string; count: number } | null>(null);
    const { theme } = useTheme();
    const { effectiveMarket } = useMarket();

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
                    "exchanges": [],
                    "dataSource": "SPX500", // TradingView heatmap only officially supports SPX500 or strictly defined ones, avoiding black screen crash
                    "grouping": "sector",
                    "blockSize": "market_cap_basic",
                    "blockColor": "change",
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
    }, [retryKey, theme, effectiveMarket.id]);

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
            ) : (
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
            )}
        </div>
    );
};

export default StockHeatmap;

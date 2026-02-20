import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, AlertTriangle, Zap, Activity } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { socialFeedService } from '../services/SocialFeedService';

const StockHeatmap: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState(false);
    const [retryKey, setRetryKey] = useState(0);
    const [sentiment, setSentiment] = useState<{ score: number; label: string; count: number } | null>(null);
    const { theme } = useTheme();

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

            const rect = container.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                // accessing offsetParent can sometimes give a better hint if hidden
                if (!container.offsetParent) return;
            }

            container.innerHTML = '';

            try {
                const script = document.createElement('script');
                script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
                script.async = true;
                script.type = 'text/javascript';
                script.innerHTML = JSON.stringify({
                    "exchanges": [],
                    "dataSource": "SPX500",
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

        // Initial load with delay to ensure layout is ready
        // 200ms is usually enough for the absolute positioning to resolve
        const timer = setTimeout(initWidget, 200);

        return () => {
            clearTimeout(timer);
            if (container) {
                container.innerHTML = '';
            }
        };
    }, [retryKey, theme]);

    // ===== LOCKED: Heatmap Container Layout — DO NOT MODIFY (approved 2026-02-16) =====
    return (
        <div className="heatmap-container" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '12px',
            border: '1px solid var(--glass-border)'
        }}>
            {error ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-primary)' }}>
                    <AlertTriangle size={48} className="text-warning" style={{ marginBottom: '1rem' }} />
                    <p style={{ marginBottom: '1rem' }}>Failed to load market map</p>
                    <button
                        onClick={() => {
                            setError(false);
                            setRetryKey(k => k + 1);
                        }}
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
                        overflow: 'hidden'
                    }}
                />
            )}

        </div >
    );
};

export default StockHeatmap;

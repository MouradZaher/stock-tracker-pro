import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

const StockHeatmap: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState(false);
    const [retryKey, setRetryKey] = useState(0);

    useEffect(() => {
        if (!containerRef.current) return;

        setError(false);
        containerRef.current.innerHTML = '';

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
                "symbolUrl": "",
                "colorTheme": "dark",
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

            containerRef.current.appendChild(widgetContainer);
            widgetContainer.appendChild(script);
        } catch (e) {
            console.error(e);
            setError(true);
        }

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [retryKey]);

    return (
        <div className="heatmap-container glass-card" style={{
            width: '100%',
            height: 'calc(100vh - 220px)',
            minHeight: '400px',
            padding: '4px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            marginTop: '0',
            marginBottom: '0',
            position: 'relative'
        }}>
            {error ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--color-text-secondary)' }}>
                    <AlertTriangle size={32} className="text-error" />
                    <p>Unable to load market map</p>
                    <button
                        className="btn btn-primary btn-small"
                        onClick={() => setRetryKey(k => k + 1)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
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
                        height: '100%'
                    }}
                />
            )}
        </div>
    );
};

export default StockHeatmap;

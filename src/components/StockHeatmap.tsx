import React, { useEffect, useRef } from 'react';

const StockHeatmap: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear previous widget
        containerRef.current.innerHTML = '';

        // Create TradingView Stock Heatmap widget
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

        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container__widget';
        widgetContainer.style.height = '100%';
        widgetContainer.style.width = '100%';

        if (containerRef.current) {
            containerRef.current.appendChild(widgetContainer);
            widgetContainer.appendChild(script);
        }

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, []);

    return (
        <div className="heatmap-container glass-card" style={{
            width: '100%',
            height: 'calc(100vh - 220px)', /* Increased height for mobile */
            minHeight: '400px',
            padding: '4px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            marginTop: '0',
            marginBottom: '0'
        }}>
            <div
                className="tradingview-widget-container"
                ref={containerRef}
                style={{
                    flex: 1,
                    width: '100%',
                    height: '100%'
                }}
            />
        </div>
    );
};

export default StockHeatmap;

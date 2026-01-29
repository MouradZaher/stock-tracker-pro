import React, { useEffect, useRef } from 'react';

const StockHeatmap: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear previous widget
        containerRef.current.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
            exchanges: [],
            dataSource: "SPX500",
            grouping: "sector",
            blockSize: "market_cap_basic",
            blockColor: "change",
            locale: "en",
            symbolUrl: "",
            colorTheme: "dark",
            hasTopBar: false,
            isDataSetEnabled: false,
            isZoomEnabled: true,
            hasSymbolTooltip: true,
            width: "100%",
            height: "100%"
        });

        containerRef.current.appendChild(script);

        return () => {
            // Cleanup handled by innerHTML clear on re-mount
        };
    }, []);

    return (
        <div className="heatmap-container" style={{ width: '100%', flex: 1, height: '100%' }}>
            <div className="tradingview-widget-container" ref={containerRef} style={{ width: '100%', height: '100%' }}>
                <div className="tradingview-widget-container__widget"></div>
            </div>
        </div>
    );
};

export default StockHeatmap;

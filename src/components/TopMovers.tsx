import React, { useEffect, useRef } from 'react';

const TopMovers: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-hotlists.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
            colorTheme: "dark",
            dateRange: "12M",
            exchange: "US",
            showChart: true,
            locale: "en",
            largeChartUrl: "",
            isTransparent: true,
            showSymbolLogo: true,
            showFloatingTooltip: false,
            width: "100%",
            height: "100%",
            plotLineColorGrowing: "rgba(41, 98, 255, 1)",
            plotLineColorFalling: "rgba(41, 98, 255, 1)",
            gridLineColor: "rgba(42, 46, 57, 0)",
            scaleFontColor: "rgba(134, 137, 147, 1)",
            belowLineFillColorGrowing: "rgba(41, 98, 255, 0.12)",
            belowLineFillColorFalling: "rgba(41, 98, 255, 0.12)",
            belowLineFillColorGrowingBottom: "rgba(41, 98, 255, 0)",
            belowLineFillColorFallingBottom: "rgba(41, 98, 255, 0)",
            symbolActiveColor: "rgba(41, 98, 255, 0.12)"
        });

        containerRef.current.appendChild(script);
    }, []);

    return (
        <div className="movers-container" style={{ width: '100%', height: 'calc(100vh - 180px)', flex: 1, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-secondary)', overflow: 'hidden' }}>
            <h3 style={{ padding: '0.4rem 1rem', fontSize: '1rem', flexShrink: 0 }}>Top Gainers & Losers (US)</h3>
            <div className="tradingview-widget-container" ref={containerRef} style={{ height: 'calc(100% - 30px)', overflowY: 'auto' }}>
                <div className="tradingview-widget-container__widget"></div>
            </div>
        </div>
    );
};

export default TopMovers;

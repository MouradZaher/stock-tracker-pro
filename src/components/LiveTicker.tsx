import React, { useEffect, useRef } from 'react';

// TradingView Ticker Tape Widget - REAL prices directly from TradingView
const LiveTicker: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear any existing content
        containerRef.current.innerHTML = '';

        // Create the TradingView widget container
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container';

        const widgetInner = document.createElement('div');
        widgetInner.className = 'tradingview-widget-container__widget';
        widgetContainer.appendChild(widgetInner);

        // Create and configure the script
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
            symbols: [
                { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
                { proName: "FOREXCOM:NSXUSD", title: "NASDAQ" },
                { proName: "FOREXCOM:DJI", title: "DOW JONES" },
                { proName: "NASDAQ:AAPL", title: "Apple" },
                { proName: "NASDAQ:NVDA", title: "NVIDIA" },
                { proName: "NASDAQ:TSLA", title: "Tesla" },
                { proName: "NASDAQ:MSFT", title: "Microsoft" },
                { proName: "NASDAQ:GOOGL", title: "Google" },
                { proName: "NASDAQ:AMZN", title: "Amazon" },
                { proName: "NASDAQ:META", title: "Meta" }
            ],
            showSymbolLogo: false,
            isTransparent: true,
            displayMode: "adaptive",
            colorTheme: "dark",
            locale: "en"
        });

        widgetContainer.appendChild(script);
        containerRef.current.appendChild(widgetContainer);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="tradingview-ticker-wrapper"
            style={{
                width: '100%',
                height: '46px',
                overflow: 'hidden',
                borderBottom: '1px solid var(--color-border)',
                background: 'rgba(0, 0, 0, 0.3)'
            }}
        />
    );
};

export default LiveTicker;

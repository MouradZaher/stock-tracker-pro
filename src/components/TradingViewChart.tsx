import React, { useEffect, useRef } from 'react';

interface TradingViewChartProps {
    symbol: string;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ symbol }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear previous widget
        containerRef.current.innerHTML = '';

        // Create TradingView widget
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
            if ((window as any).TradingView) {
                new (window as any).TradingView.widget({
                    width: '100%',
                    height: 400,
                    symbol: symbol,
                    interval: 'D',
                    timezone: 'America/New_York',
                    theme: 'dark',
                    style: '1',
                    locale: 'en',
                    toolbar_bg: '#0a0a0f',
                    enable_publishing: false,
                    hide_side_toolbar: false,
                    allow_symbol_change: false,
                    container_id: containerRef.current?.id,
                    backgroundColor: '#13141b',
                    gridColor: '#2a2b38',
                });
            }
        };

        const widgetId = `tradingview_${symbol}_${Date.now()}`;
        containerRef.current.id = widgetId;
        document.head.appendChild(script);

        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, [symbol]);

    return (
        <div className="chart-container">
            <div ref={containerRef} />
        </div>
    );
};

export default TradingViewChart;

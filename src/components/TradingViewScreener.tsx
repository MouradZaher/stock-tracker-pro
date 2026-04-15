import React, { useEffect, useRef } from 'react';
import { useMarket } from '../contexts/MarketContext';
import { useTheme } from '../contexts/ThemeContext';

const TradingViewScreener: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { selectedMarket } = useMarket();
    const { theme } = useTheme();

    useEffect(() => {
        if (!containerRef.current) return;

        // Map internal market IDs to TradingView market names
        const container = containerRef.current;
        if (!container) return;

        // Clear previous content
        container.innerHTML = '';

        // NUCLEAR: Slight delay to ensure DOM is ready and bypass script conflicts
        const timer = setTimeout(() => {
            const widgetContainer = document.createElement('div');
            widgetContainer.className = 'tradingview-widget-container__widget';
            // Force dark theme at container level for CSS targeting
            widgetContainer.setAttribute('data-theme', 'dark');

            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
            script.type = 'text/javascript';
            script.async = true;

            const config = {
                "width": "100%",
                "height": "100%",
                "defaultColumn": "overview",
                "defaultScreen": "most_capitalized",
                "market": "america",
                "showToolbar": true,
                "colorTheme": "dark",
                "isTransparent": false,
                "locale": "en",
                "theme": "dark" // FAIL-SAFE: Some versions use theme instead of colorTheme
            };

            script.innerHTML = JSON.stringify(config);
            widgetContainer.appendChild(script);
            container.appendChild(widgetContainer);
        }, 300);

        return () => {
            clearTimeout(timer);
            if (container) container.innerHTML = '';
        };
    }, []);

    return (
        <div style={{ 
            height: '100%', 
            width: '100%', 
            background: '#000000',
            overflow: 'hidden'
        }}>
            <div ref={containerRef} style={{ height: '100%', width: '100%', filter: theme === 'dark' ? 'brightness(0.9) contrast(1.1)' : 'none' }} />
        </div>
    );
};

export default TradingViewScreener;

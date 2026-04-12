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
        const marketMap: Record<string, string> = {
            'us': 'america',
            'egypt': 'egypt',
            'abudhabi': 'united_arab_emirates'
        };

        const market = marketMap[selectedMarket.id] || 'america';
        const defaultScreen = selectedMarket.id === 'us' ? 'most_capitalized' : 'general';

        // Clear previous widget
        containerRef.current.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
        script.async = true;
        script.type = 'text/javascript';
        
        // Construct the base URL for redirection
        const currentUrl = window.location.origin + window.location.pathname;

        script.innerHTML = JSON.stringify({
            "width": "100%",
            "height": "100%",
            "defaultColumn": "overview",
            "defaultScreen": defaultScreen,
            "market": market,
            "showToolbar": true,
            "colorTheme": theme,
            "locale": "en",
            "isTransparent": true,
            "largeChartUrl": currentUrl
        });

        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container';
        const widgetSubContainer = document.createElement('div');
        widgetSubContainer.className = 'tradingview-widget-container__widget';
        widgetSubContainer.style.height = '100%';
        widgetSubContainer.style.width = '100%';
        
        widgetContainer.appendChild(widgetSubContainer);
        widgetContainer.appendChild(script);
        widgetContainer.style.height = '100%';
        widgetContainer.style.width = '100%';

        containerRef.current.appendChild(widgetContainer);
    }, [selectedMarket.id, theme]);

    return (
        <div style={{ 
            height: '100%', 
            width: '100%', 
            background: theme === 'dark' ? '#000' : '#f8fafc',
            overflow: 'hidden',
            filter: theme === 'dark' ? 'brightness(0.9) contrast(1.1)' : 'none'
        }}>
            <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
        </div>
    );
};

export default TradingViewScreener;

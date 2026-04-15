import React, { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const MarketNews: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();

    useEffect(() => {
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
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
            script.type = 'text/javascript';
            script.async = true;

            const config = {
                "feedMode": "all_symbols",
                "colorTheme": "dark",
                "isTransparent": false,
                "displayMode": "regular",
                "width": "100%",
                "height": "100%",
                "locale": "en",
                "theme": "dark" // FAIL-SAFE: Some versions use theme instead of colorTheme
            };

            script.innerHTML = JSON.stringify(config);
            widgetContainer.appendChild(script);
            container.appendChild(widgetContainer);
        }, 1000);

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
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div 
                ref={containerRef} 
                className="tradingview-widget-container"
                data-theme="dark"
                style={{ height: '100%', width: '100%' }}
            />
        </div>
    );
};

export default MarketNews;

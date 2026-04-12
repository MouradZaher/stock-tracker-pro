import React, { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const MarketNews: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();

    useEffect(() => {
        if (!containerRef.current) return;

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
            "feedMode": "all_symbols",
            "colorTheme": theme,
            "isTransparent": true,
            "displayMode": "regular",
            "width": "100%",
            "height": "100%",
            "locale": "en"
        });

        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(script);
    }, [theme]);

    return (
        <div style={{ 
            height: '100%', 
            width: '100%', 
            background: theme === 'dark' ? '#000' : '#f8fafc',
            display: 'flex', 
            flexDirection: 'column',
            filter: theme === 'dark' ? 'brightness(0.9) contrast(1.1)' : 'none'
        }}>
            <div ref={containerRef} style={{ flex: 1 }} />
        </div>
    );
};

export default MarketNews;

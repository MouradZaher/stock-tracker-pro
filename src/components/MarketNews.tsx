import React, { useEffect, useRef } from 'react';

const MarketNews: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
            "feedMode": "all_symbols",
            "colorTheme": "dark",
            "isTransparent": true,
            "displayMode": "regular",
            "width": "100%",
            "height": "100%",
            "locale": "en"
        });

        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(script);
    }, []);

    return (
        <div style={{ height: '100%', width: '100%', background: '#000', display: 'flex', flexDirection: 'column' }}>
            <div ref={containerRef} style={{ flex: 1 }} />
        </div>
    );
};

export default MarketNews;

import React, { useEffect, useRef } from 'react';

const EconomicCalendar: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
            colorTheme: "dark",
            isTransparent: true,
            width: "100%",
            height: "100%",
            locale: "en",
            importanceFilter: "-1,0,1",
            countryFilter: "us"
        });

        containerRef.current.appendChild(script);
    }, []);

    return (
        <div className="calendar-container" style={{ width: '100%', height: 'calc(100vh - 180px)', flex: 1, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-secondary)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ padding: '0.4rem 1rem 0', fontSize: '1rem', flexShrink: 0 }}>Economic Calendar</h3>
            <div className="tradingview-widget-container" ref={containerRef} style={{ flex: 1, overflowY: 'auto' }}>
                <div className="tradingview-widget-container__widget"></div>
            </div>
        </div>
    );
};

export default EconomicCalendar;

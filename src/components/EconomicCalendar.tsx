import React, { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const EconomicCalendar: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();

    useEffect(() => {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
            colorTheme: theme,
            isTransparent: true,
            width: "100%",
            height: "100%",
            locale: "en",
            importanceFilter: "-1,0,1",
            countryFilter: "us"
        });

        containerRef.current.appendChild(script);
    }, [theme]);

    return (
        <div className="calendar-container glass-card" style={{ width: '100%', height: 'calc(100vh - 180px)', minHeight: '600px', flex: 1, border: 'none', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--glass-bg)' }}>
            <h3 style={{ padding: '1rem 1.5rem 0.5rem', fontSize: '1rem', flexShrink: 0, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Economic Calendar</h3>
            <div className="tradingview-widget-container" ref={containerRef} style={{ flex: 1, overflowY: 'auto' }}>
                <div className="tradingview-widget-container__widget"></div>
            </div>
        </div>
    );
};

export default EconomicCalendar;

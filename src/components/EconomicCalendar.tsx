import React, { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

import { Calendar, Globe, Info } from 'lucide-react';

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
            countryFilter: "us,eu,gb,jp,ca,au"
        });

        containerRef.current.appendChild(script);
    }, [theme]);

    return (
        <div className="calendar-container glass-card" style={{
            width: '100%',
            height: 'calc(100vh - 180px)',
            minHeight: '600px',
            flex: 1,
            border: '1px solid var(--glass-border)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--glass-bg)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}>
            <div style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.02)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        padding: '8px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Calendar size={18} color="var(--color-accent)" />
                    </div>
                    <div>
                        <h3 style={{
                            margin: 0,
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: 'var(--color-text-primary)',
                            letterSpacing: '-0.01em'
                        }}>Economic Calendar</h3>
                        <div style={{
                            fontSize: '0.7rem',
                            color: 'var(--color-text-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '2px'
                        }}>
                            <Globe size={10} /> Global Market Impact Events
                        </div>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.7rem',
                    color: 'var(--color-text-tertiary)',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '4px 8px',
                    borderRadius: '6px'
                }}>
                    <Info size={12} /> Real-time
                </div>
            </div>

            <div className="tradingview-widget-container" ref={containerRef} style={{
                flex: 1,
                padding: '0.5rem',
                overflow: 'hidden'
            }}>
                <div className="tradingview-widget-container__widget"></div>
            </div>
        </div>
    );
};

export default EconomicCalendar;

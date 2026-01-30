import React, { useEffect, useRef } from 'react';
import { TrendingUp } from 'lucide-react';

const BenefitsGrid: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear previous widget
        containerRef.current.innerHTML = '';

        // Create TradingView Stock Heatmap widget
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
        script.async = true;
        script.type = 'text/javascript';
        script.innerHTML = JSON.stringify({
            "exchanges": [],
            "dataSource": "SPX500",
            "grouping": "sector",
            "blockSize": "market_cap_basic",
            "blockColor": "change",
            "locale": "en",
            "symbolUrl": "",
            "colorTheme": "dark",
            "hasTopBar": false,
            "isDataSetEnabled": false,
            "isZoomEnabled": true,
            "hasSymbolTooltip": true,
            "width": "100%",
            "height": "500"
        });

        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container__widget';

        if (containerRef.current) {
            containerRef.current.appendChild(widgetContainer);
            widgetContainer.appendChild(script);
        }

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, []);

    return (
        <div className="hero-visual">
            <div
                className="visual-card glass-card"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    minHeight: '600px'
                }}
            >
                <div className="card-header" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={20} color="var(--color-accent)" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        📊 Live S&P 500 Market Heatmap
                    </span>
                </div>

                <div
                    className="tradingview-widget-container"
                    ref={containerRef}
                    style={{
                        minHeight: '500px',
                        width: '100%',
                        flex: 1
                    }}
                />

                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textAlign: 'center', margin: 0 }}>
                        Real-time visualization of S&P 500 stocks • Click any block to explore details
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BenefitsGrid;


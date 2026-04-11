import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, AlertTriangle, Activity, ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useMarket } from '../contexts/MarketContext';
import { socialFeedService } from '../services/SocialFeedService';
import HeatmapMobileFallback from './HeatmapMobileFallback';
import InstitutionalHeatmapGrid from './InstitutionalHeatmapGrid';

const StockHeatmap: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [retryKey, setRetryKey] = useState(0);
    const [sentiment, setSentiment] = useState<{ score: number; label: string; count: number } | null>(null);
    const { theme } = useTheme();
    const { effectiveMarket, timeframe, setTimeframe } = useMarket();
    const [blockSize, setBlockSize] = useState<'market_cap_basic' | 'volume'>('market_cap_basic');
    const [blockColor, setBlockColor] = useState<'change' | 'high_low_range'>('change');
    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setWidth(window.innerWidth);
            }, 100); // Throttle resize events to 100ms
        };
        window.addEventListener('resize', handleResize);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', handleResize);
        }
    }, []);

    const isMobileView = width < 768;

    useEffect(() => {
        socialFeedService.getGlobalFeed().then(() => {
            setSentiment(socialFeedService.getGlobalSentiment());
        });
    }, [retryKey]);

    useEffect(() => {
        if (!containerRef.current) return;

        setError(false);
        const container = containerRef.current;
        container.innerHTML = '';

        const initWidget = () => {
            if (!container) return;
            container.innerHTML = '';

            try {
                const script = document.createElement('script');
                
                // If the market doesn't support the native heatmap widget, we use the Market Overview widget as a high-quality data matrix
                if (effectiveMarket.hasHeatmapSupport) {
                    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
                    script.innerHTML = JSON.stringify({
                        "exchanges": effectiveMarket.heatmapExchanges,
                        "dataSource": effectiveMarket.heatmapDataSource,
                        "grouping": effectiveMarket.heatmapExchanges.length > 0 ? "no_group" : "sector",
                        "blockSize": blockSize,
                        "blockColor": blockColor,
                        "locale": "en",
                        "symbolUrl": window.location.origin + "/recommendations?tab=navigator&aiStock={SYMBOL}",
                        "colorTheme": theme === 'dark' ? 'dark' : 'light',
                        "hasTopBar": true,
                        "isDataSetEnabled": true,
                        "isZoomEnabled": true,
                        "hasSymbolTooltip": true,
                        "width": "100%",
                        "height": "100%"
                    });
                } else {
                    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
                    script.innerHTML = JSON.stringify({
                        "colorTheme": theme === 'dark' ? 'dark' : 'light',
                        "dateRange": "12M",
                        "showChart": true,
                        "locale": "en",
                        "largeChartUrl": "",
                        "isTransparent": true,
                        "showSymbolLogo": true,
                        "showFloatingTooltip": false,
                        "width": "100%",
                        "height": "100%",
                        "plotLineColorGrowing": "rgba(41, 98, 255, 1)",
                        "plotLineColorFalling": "rgba(41, 98, 255, 1)",
                        "gridLineColor": "rgba(240, 243, 250, 0)",
                        "scaleFontColor": "rgba(106, 109, 120, 1)",
                        "belowLineFillColorGrowing": "rgba(41, 98, 255, 0.12)",
                        "belowLineFillColorFalling": "rgba(41, 98, 255, 0.12)",
                        "belowLineFillColorGrowingBottom": "rgba(41, 98, 255, 0)",
                        "belowLineFillColorFallingBottom": "rgba(41, 98, 255, 0)",
                        "symbolActiveColor": "rgba(41, 98, 255, 0.12)",
                        "tabs": [
                            {
                                "title": effectiveMarket.name.toUpperCase() + " LEADERS",
                                "symbols": [
                                    { "s": effectiveMarket.indexSymbol, "d": effectiveMarket.indexName },
                                    { "s": effectiveMarket.id === 'egypt' ? 'EGX:COMI' : effectiveMarket.id === 'abudhabi' ? 'ADX:FAB' : 'BINANCE:BTCUSDT' },
                                    { "s": effectiveMarket.id === 'egypt' ? 'EGX:SWDY' : effectiveMarket.id === 'abudhabi' ? 'ADX:ETISALAT' : 'BINANCE:ETHUSDT' },
                                    { "s": effectiveMarket.id === 'egypt' ? 'EGX:FWRY' : effectiveMarket.id === 'abudhabi' ? 'ADX:IHC' : 'AMEX:SPY' }
                                ]
                            }
                        ]
                    });
                }
                
                script.async = true;
                script.type = 'text/javascript';

                script.onerror = () => {
                    console.error("TradingView widget script failed to load");
                    setError(true);
                };

                const widgetContainer = document.createElement('div');
                widgetContainer.className = 'tradingview-widget-container__widget';
                widgetContainer.style.position = 'absolute';
                widgetContainer.style.top = '0';
                widgetContainer.style.bottom = '0';
                widgetContainer.style.left = '0';
                widgetContainer.style.right = '0';

                container.appendChild(widgetContainer);
                widgetContainer.appendChild(script);
            } catch (e) {
                console.error(e);
                setError(true);
            }
        };

        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
        const timer = setTimeout(() => {
            initWidget();
            setIsLoading(false);
        }, isIOS ? 700 : 400);

        return () => {
            clearTimeout(timer);
            if (container) container.innerHTML = '';
        };
    }, [retryKey, theme, effectiveMarket.id, effectiveMarket.hasHeatmapSupport, blockSize, blockColor]);

    return (
        <div className="heatmap-wrapper">
            {error || (!effectiveMarket.hasHeatmapSupport && !effectiveMarket.indexSymbol) ? (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-primary)',
                    height: '100%',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <AlertTriangle size={48} color="var(--color-warning)" style={{ marginBottom: '1rem' }} />
                    <p style={{ marginBottom: '1rem', fontWeight: 600 }}>Region Specific Map Unavailable</p>
                    <p style={{ fontSize: '0.65rem', color: '#666', marginBottom: '2rem' }}>
                        The visual heatmap for {effectiveMarket.name} is currently restricted by data providers. 
                        Use the Matrix Screener for real-time institutional coverage.
                    </p>
                    <button
                        onClick={() => { setError(false); setRetryKey(k => k + 1); }}
                        className="glass-button"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <RefreshCw size={16} /> Retry Hub
                    </button>
                </div>
            ) : (
                <>
                    {isLoading && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#0a0a0a',
                            zIndex: 10,
                            gap: '12px'
                        }}>
                            <Activity size={24} color="var(--color-accent)" className="animate-pulse" />
                            <span style={{ fontSize: '0.6rem', color: '#666', fontWeight: 900, letterSpacing: '0.1em' }}>INITIALIZING {effectiveMarket.hasHeatmapSupport ? 'HEATMAP' : 'MARKET MATRIX'}...</span>
                        </div>
                    )}

                    {effectiveMarket.hasHeatmapSupport ? (
                        <div
                            className="tradingview-widget-container"
                            ref={containerRef}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                overflow: 'hidden',
                                touchAction: 'pan-x pan-y',
                                pointerEvents: 'auto',
                            }}
                        />
                    ) : (
                        <InstitutionalHeatmapGrid 
                            blockSize={blockSize}
                            blockColor={blockColor}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default React.memo(StockHeatmap);

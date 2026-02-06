import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

type TabType = 'active' | 'gainers' | 'losers';

const TopMovers: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<TabType>('active');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-hotlists.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
            colorTheme: "dark",
            dateRange: "12M",
            exchange: "US",
            showChart: true,
            locale: "en",
            largeChartUrl: "",
            isTransparent: true,
            showSymbolLogo: true,
            showFloatingTooltip: false,
            width: "100%",
            height: "100%",
            plotLineColorGrowing: "rgba(41, 98, 255, 1)",
            plotLineColorFalling: "rgba(41, 98, 255, 1)",
            gridLineColor: "rgba(42, 46, 57, 0)",
            scaleFontColor: "rgba(134, 137, 147, 1)",
            belowLineFillColorGrowing: "rgba(41, 98, 255, 0.12)",
            belowLineFillColorFalling: "rgba(41, 98, 255, 0.12)",
            belowLineFillColorGrowingBottom: "rgba(41, 98, 255, 0)",
            belowLineFillColorFallingBottom: "rgba(41, 98, 255, 0)",
            symbolActiveColor: "rgba(41, 98, 255, 0.12)"
        });

        containerRef.current.appendChild(script);
    }, []);

    const tabs: { id: TabType; label: string; icon: any; color: string }[] = [
        { id: 'active', label: 'Most Active', icon: Activity, color: 'var(--color-accent)' },
        { id: 'gainers', label: 'Top Gainers', icon: TrendingUp, color: 'var(--color-success)' },
        { id: 'losers', label: 'Top Losers', icon: TrendingDown, color: 'var(--color-error)' },
    ];

    const scrollTabs = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 120;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="movers-container glass-card" style={{
            width: '100%',
            height: 'calc(100vh - 180px)',
            minHeight: '400px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Header with scrollable tabs */}
            <div style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--color-border)',
                flexShrink: 0
            }}>
                <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    marginBottom: '0.75rem',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    Top Gainers & Losers (US)
                </h3>

                {/* Horizontal scrollable tabs */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    position: 'relative'
                }}>
                    {/* Scroll left button */}
                    <button
                        onClick={() => scrollTabs('left')}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--color-text-secondary)',
                            flexShrink: 0
                        }}
                    >
                        <ChevronLeft size={16} />
                    </button>

                    {/* Tabs scroll container */}
                    <div
                        ref={scrollContainerRef}
                        style={{
                            display: 'flex',
                            gap: '0.5rem',
                            overflowX: 'auto',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            flex: 1,
                            scrollSnapType: 'x mandatory'
                        }}
                    >
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 16px',
                                    background: activeTab === tab.id
                                        ? `linear-gradient(135deg, ${tab.color}20, ${tab.color}10)`
                                        : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${activeTab === tab.id ? tab.color + '50' : 'var(--glass-border)'}`,
                                    borderRadius: '20px',
                                    color: activeTab === tab.id ? tab.color : 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    whiteSpace: 'nowrap',
                                    fontSize: '0.8rem',
                                    fontWeight: activeTab === tab.id ? 600 : 400,
                                    scrollSnapAlign: 'start',
                                    flexShrink: 0
                                }}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Scroll right button */}
                    <button
                        onClick={() => scrollTabs('right')}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--color-text-secondary)',
                            flexShrink: 0
                        }}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* TradingView Widget with internal scroll */}
            <div
                className="tradingview-widget-container"
                ref={containerRef}
                style={{
                    flex: 1,
                    overflow: 'auto',
                    minHeight: 0 // Important for flex scroll to work
                }}
            >
                <div className="tradingview-widget-container__widget"></div>
            </div>

            {/* Hide scrollbar CSS */}
            <style>{`
                .movers-container ::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default TopMovers;

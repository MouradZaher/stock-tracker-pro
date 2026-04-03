import React, { useEffect, useRef } from 'react';
import { FileText, Calendar as CalendarIcon, Move, RefreshCw } from 'lucide-react';
import { useMarket } from '../contexts/MarketContext';
import { usePiPStore } from '../services/usePiPStore';
import { CHANNELS } from './LiveIntelligenceStreams';
import { soundService } from '../services/soundService';

interface MarketPulsePageProps {
    onSelectStock?: (symbol: string) => void;
}

const MARKET_STREAMS = CHANNELS;

const LiveStreamsPlayer: React.FC<{ streams: typeof MARKET_STREAMS }> = ({ streams }) => {
    const { activeStream, setActiveStream, isMuted, setMuted, setPiPActive } = usePiPStore();
    const active = activeStream || streams[0];
    
    useEffect(() => {
        if (!activeStream) {
            setActiveStream(streams[0]);
        }
    }, [activeStream, setActiveStream, streams]);

    return (
        <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)', position: 'relative' }}>
            <div style={{ position: 'relative', paddingBottom: '38%', background: '#000', minHeight: '200px' }}>
                <iframe
                    key={`${active.id}-${isMuted}`}
                    src={active.videoId 
                        ? `https://www.youtube.com/embed/${active.videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1&playsinline=1&gl=US&hl=en`
                        : `https://www.youtube.com/embed/live_stream?channel=${active.youtubeId}&autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1&playsinline=1&gl=US&hl=en`
                    }
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    title={active.name}
                />
            </div>

            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '20px', height: '20px', borderRadius: '4px',
                            background: 'white', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
                            padding: '2px', border: '1px solid rgba(0,0,0,0.1)'
                        }}>
                            <img src={active.logo} alt={active.shortName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        {active.name}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>{active.category} • {active.region}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                        onClick={() => {
                            const current = active;
                            setActiveStream({...streams[0]});
                            setTimeout(() => setActiveStream(current), 50);
                            soundService.playTap();
                        }}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '0.7rem' }}
                    >
                        <RefreshCw size={12} /> Sync
                    </button>
                    <button
                        onClick={() => setMuted(!isMuted)}
                        style={{ background: isMuted ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.15)', border: `1px solid ${isMuted ? 'var(--glass-border)' : 'var(--color-accent)'}`, borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', color: isMuted ? 'var(--color-text-tertiary)' : 'var(--color-accent)', fontSize: '0.7rem', fontWeight: 700 }}
                    >
                        {isMuted ? '🔇 Muted' : '🔊 Live'}
                    </button>
                    <button
                        onClick={() => {
                            setPiPActive(true);
                            soundService.playTap();
                        }}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '0.7rem' }}
                        title="Minimize to Picture-in-Picture"
                    >
                        <Move size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Min
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.75rem', scrollbarWidth: 'none', flexWrap: 'nowrap', msOverflowStyle: 'none' }}>
                {streams.map((ch) => {
                    const isActive = ch.id === active.id;
                    return (
                        <button
                            key={ch.id}
                            onClick={() => setActiveStream(ch)}
                            style={{
                                flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '5px',
                                padding: '5px 10px', borderRadius: '8px', cursor: 'pointer',
                                border: `1px solid ${isActive ? ch.color : 'var(--glass-border)'}`,
                                background: isActive ? `${ch.color}20` : 'rgba(255,255,255,0.02)',
                                color: isActive ? ch.color : 'var(--color-text-secondary)',
                                fontWeight: isActive ? 800 : 500, fontSize: '0.72rem',
                                transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                                boxShadow: isActive ? `0 0 10px ${ch.color}25` : 'none',
                                minWidth: 'fit-content'
                            }}
                        >
                            <div style={{
                                width: '16px', height: '16px', borderRadius: '3px',
                                background: 'white', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
                                padding: '1px', border: '1px solid rgba(0,0,0,0.1)'
                            }}>
                                <img src={ch.logo} alt={ch.shortName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            {ch.shortName}
                            {isActive && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: ch.color, display: 'inline-block', animation: 'pulse 1.5s infinite' }} />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const MarketPulsePage: React.FC<MarketPulsePageProps> = () => {
    const { setPiPActive, activeStream } = usePiPStore();
    const { effectiveMarket } = useMarket();
    const newsContainerRef = useRef<HTMLDivElement>(null);
    const eventsContainerRef = useRef<HTMLDivElement>(null);

    // Reset PiP when directly viewing this page
    useEffect(() => {
        setPiPActive(false);
    }, [setPiPActive]);

    // Go to PiP when leaving if stream is playing
    useEffect(() => {
        return () => {
            if (activeStream) {
                setPiPActive(true);
            }
        };
    }, [activeStream, setPiPActive]);

    // Load TradingView Timeline Widget (News)
    useEffect(() => {
        if (!newsContainerRef.current) return;
        newsContainerRef.current.innerHTML = '';
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container__widget';
        widgetContainer.style.height = '100%';
        widgetContainer.style.width = '100%';
        newsContainerRef.current.appendChild(widgetContainer);

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
        script.type = 'text/javascript';
        script.async = true;
        
        script.innerHTML = JSON.stringify({
            "feedMode": "market",
            "market": effectiveMarket.id === 'us' ? "stock" : "crypto", // fallback to crypto/forex for global if needed
            "isTransparent": true,
            "displayMode": "regular",
            "width": "100%",
            "height": "100%",
            "colorTheme": "dark",
            "locale": "en"
        });
        newsContainerRef.current.appendChild(script);
    }, [effectiveMarket.id]);

    // Load TradingView Events Calendar Widget (Economic & Earnings impact)
    useEffect(() => {
        if (!eventsContainerRef.current) return;
        eventsContainerRef.current.innerHTML = '';
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container__widget';
        widgetContainer.style.height = '100%';
        widgetContainer.style.width = '100%';
        eventsContainerRef.current.appendChild(widgetContainer);

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
        script.type = 'text/javascript';
        script.async = true;

        const curFilter = effectiveMarket.id === 'us' ? "USD" : effectiveMarket.id === 'egypt' ? "USD,EUR" : "AED,USD";
        
        script.innerHTML = JSON.stringify({
            "colorTheme": "dark",
            "isTransparent": true,
            "width": "100%",
            "height": "100%",
            "locale": "en",
            "importanceFilter": "-1,0,1",
            "currencyFilter": curFilter
        });
        eventsContainerRef.current.appendChild(script);
    }, [effectiveMarket.id]);

    return (
        <div className="tab-content dashboard-viewport" style={{ 
            gap: '1rem',
            padding: '1rem',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Live Stream Section */}
            <div style={{ flexShrink: 0 }}>
                <LiveStreamsPlayer streams={MARKET_STREAMS} />
            </div>

            {/* Real Reports & Events Grid */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                gap: '1rem',
                flex: 1,
                minHeight: 0
            }}>
                {/* Real Time News Reports */}
                <div className="glass-card" style={{ 
                    border: '1px solid var(--glass-border)', 
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    background: 'var(--glass-bg)'
                }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
                            <FileText size={16} color="var(--color-accent)" /> 
                            Real-Time Market Reports
                        </h3>
                    </div>
                    <div style={{ flex: 1, padding: '0.5rem', position: 'relative' }}>
                        <div className="tradingview-widget-container" ref={newsContainerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                    </div>
                </div>

                {/* Real Events & Earnings Indicators */}
                <div className="glass-card" style={{ 
                    border: '1px solid var(--glass-border)', 
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    background: 'var(--glass-bg)'
                }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
                            <CalendarIcon size={16} color="var(--color-warning)" /> 
                            Company Reports & Events
                        </h3>
                    </div>
                    <div style={{ flex: 1, padding: '0.5rem', position: 'relative' }}>
                        <div className="tradingview-widget-container" ref={eventsContainerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketPulsePage;

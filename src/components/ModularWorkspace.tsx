import React, { useEffect, useState } from 'react';
import { useWindowStore, type WindowId } from '../hooks/useWindowStore';
import { useLocation, useNavigate } from 'react-router-dom';
import TerminalWindow from './TerminalWindow';
import StockHeatmap from './StockHeatmap';
import InstitutionalScreener from './InstitutionalScreener';
import Portfolio from './Portfolio';
import WatchlistPage from './WatchlistPage';
import LiveIntelligenceStreams from './LiveIntelligenceStreams';
import CorporateActionsCalendar from './CorporateActionsCalendar';
import MarketPulsePage from './MarketPulsePage';
import RightTabbedPanel from './RightTabbedPanel';
import MarketNews from './MarketNews';
import AIRecommendations from './AIRecommendations';

import AdminDashboard from './AdminDashboard';
import { LayoutGrid, Activity, PieChart, Eye, Tv, Calendar, Search, ShieldCheck, Shield } from 'lucide-react';

interface ModularWorkspaceProps {
    onSelectSymbol?: (symbol: string) => void;
}

const ModularWorkspace: React.FC<ModularWorkspaceProps> = ({ onSelectSymbol }) => {
    const { windows, openWindow, bringToFront, toggleMinimize, isDraggingId, snapTarget, snapToLayout } = useWindowStore();
    const [isInitialized, setIsInitialized] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // WATCH FOR TRADINGVIEW WIDGET SYMBOL SYNC
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const widgetSymbol = params.get('tvwidgetsymbol');
        if (widgetSymbol && onSelectSymbol) {
            onSelectSymbol(widgetSymbol);
            // Clean up the URL to prevent re-triggering on refresh
            params.delete('tvwidgetsymbol');
            const newSearch = params.toString();
            navigate({
                pathname: location.pathname,
                search: newSearch ? `?${newSearch}` : ''
            }, { replace: true });
        }
    }, [location.search, onSelectSymbol, navigate, location.pathname]);

    // Initial tool spawn - One time on mount
    useEffect(() => {
        if (!isInitialized) {
            const currentWindows = useWindowStore.getState().windows;
            
            // Adjust initial sizes for mobile vs desktop grid
            if (!currentWindows['heatmap'] || !currentWindows['heatmap'].isOpen) {
                openWindow('heatmap', 'Heatmap');
                if (!isMobile) snapToLayout('heatmap', 'TL');
            }
            if (!currentWindows['screener'] || !currentWindows['screener'].isOpen) {
                openWindow('screener', 'Screener');
                if (!isMobile) snapToLayout('screener', 'BL');
            }


            setIsInitialized(true);
        }
    }, [isInitialized, openWindow, isMobile, snapToLayout]);

    const minimizedWindows = Object.values(windows).filter(w => w.isOpen && w.isMinimized);

    return (
        <div style={{ 
            position: 'relative', 
            width: '100%', 
            height: '100%', 
            overflow: 'hidden', 
            background: '#000',
            backgroundImage: 'radial-gradient(circle at 2px 2px, #080808 1px, transparent 0)',
            backgroundSize: '40px 40px'
        }}>
            {/* SNAP GHOST / DROP ZONE PREVIEW */}
            {isDraggingId && snapTarget && (
                <div style={{
                    position: 'absolute',
                    zIndex: 2,
                    pointerEvents: 'none',
                    transition: 'all 0.1s ease-out',
                    border: '2px solid rgba(74, 222, 128, 0.4)',
                    background: 'rgba(74, 222, 128, 0.05)',
                    boxShadow: '0 0 40px rgba(74, 222, 128, 0.1)',
                    ...((() => {
                        const sidebarWidth = 0; // Relative to ModularWorkspace
                        const SIDE_WIDTH = 350;
                        const availW = window.innerWidth - 48 - SIDE_WIDTH;
                        const availH = window.innerHeight;
                        const halfW = availW / 2;
                        const halfH = availH / 2;

                        switch (snapTarget) {
                            case 'TL': return { left: 0, top: 0, width: halfW, height: halfH };
                            case 'TR': return { left: halfW, top: 0, width: halfW, height: halfH };
                            case 'BL': return { left: 0, top: halfH, width: halfW, height: halfH };
                            case 'BR': return { left: halfW, top: halfH, width: halfW, height: halfH };
                            case 'SIDE': return { right: 0, top: 0, width: SIDE_WIDTH, height: availH };
                            default: return { display: 'none' };
                        }
                    })())
                }} />
            )}
            
            {/* GRID BACKGROUND / DROP ZONES */}
            <div style={{ position: 'absolute', inset: 0, opacity: isDraggingId ? 1 : 0, transition: 'opacity 0.2s', pointerEvents: 'none', zIndex: 1 }}>
                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '350px', background: 'rgba(74, 222, 128, 0.03)', borderLeft: '1px solid rgba(74, 222, 128, 0.1)' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: 'calc(100% - 350px)', height: '50%', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex' }}>
                    <div style={{ flex: 1, borderRight: '1px solid rgba(255,255,255,0.05)' }} />
                    <div style={{ flex: 1 }} />
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: 'calc(100% - 350px)', height: '50%', display: 'flex' }}>
                    <div style={{ flex: 1, borderRight: '1px solid rgba(255,255,255,0.05)' }} />
                    <div style={{ flex: 1 }} />
                </div>
            </div>
            
            {/* THE WORKSPACE (DESKTOP) */}
            <div style={{ position: 'absolute', inset: 0, padding: 0 }}>
                
                {/* 1. Heatmap Window */}
                <TerminalWindow id="heatmap" title="Heatmap" minW={350} minH={300}>
                    <StockHeatmap />
                </TerminalWindow>

                {/* 2. Screener Window (Now supports Search Tabs) */}
                <TerminalWindow id="screener" title="Screener" minW={350} minH={300}>
                    <RightTabbedPanel onSelectSymbol={onSelectSymbol || (() => {})} />
                </TerminalWindow>

                {/* 3. Portfolio Window */}
                <TerminalWindow id="portfolio" title="Portfolio" minW={350} minH={300}>
                    <Portfolio />
                </TerminalWindow>

                {/* 4. Watchlist Window */}
                <TerminalWindow id="watchlist" title="Global Watchlist" minW={350} minH={300}>
                    <WatchlistPage onSelectSymbol={onSelectSymbol || (() => {})} />
                </TerminalWindow>

                {/* 5. TV / Streams Window */}
                <TerminalWindow id="tv" title="Live News" minW={300} minH={250}>
                    <LiveIntelligenceStreams />
                </TerminalWindow>

                {/* 6. Calendar Window */}
                <TerminalWindow id="calendar" title="Corporate Actions" minW={300} minH={250}>
                    <CorporateActionsCalendar />
                </TerminalWindow>

                {/* 7. News Window */}
                <TerminalWindow id="news" title="Market News" minW={350} minH={300}>
                    <MarketNews />
                </TerminalWindow>





                {/* 10. Admin Window */}
                <TerminalWindow id="admin" title="Administrative Terminal" minW={600} minH={400}>
                    <AdminDashboard isOpen={true} onClose={() => {}} />
                </TerminalWindow>

            </div>

            {/* THE TASKBAR (BOTTOM) */}
            <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '8px',
                padding: '4px',
                background: 'rgba(5, 5, 5, 0.8)',
                border: '1px solid #111',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
                zIndex: 20000,
                opacity: minimizedWindows.length > 0 ? 1 : 0,
                pointerEvents: minimizedWindows.length > 0 ? 'auto' : 'none',
                transition: 'opacity 0.3s ease'
            }}>
                {minimizedWindows.map(w => (
                    <button
                        key={w.id}
                        onClick={() => {
                            if (w.isMinimized) {
                                bringToFront(w.id);
                            } else {
                                toggleMinimize(w.id);
                            }
                        }}
                        style={{
                            padding: '6px 12px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid #222',
                            borderRadius: '4px',
                            color: 'white',
                            fontSize: '0.5rem',
                            fontWeight: 900,
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-accent)', boxShadow: '0 0 4px var(--color-accent)' }} />
                        {w.title.toUpperCase()}
                    </button>
                ))}
            </div>

        </div>
    );
};

export default ModularWorkspace;

import React, { useEffect, useState } from 'react';
import { useWindowStore, type WindowId } from '../hooks/useWindowStore';
import { useLocation, useNavigate } from 'react-router-dom';
import TerminalWindow from './TerminalWindow';
import StockHeatmap from './StockHeatmap';
import Portfolio from './Portfolio';
import WatchlistPage from './WatchlistPage';
import LiveIntelligenceStreams from './InstitutionalStreams';
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
    const { 
        windows, openWindow, bringToFront, toggleMinimize, 
        isDraggingId, snapTarget, snapToLayout, resetToInstitutionalLayout 
    } = useWindowStore();
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
            // NUCLEAR SELF-HEAL: If any window is detected as 'lost' off-screen (e.g. x=848 on a 390px screen)
            // Or if we specifically need to force-restore the institutional 2x2 grid on mobile
            const currentWindows = windows;
            const isCorrupted = Object.values(currentWindows).some(w => w.isOpen && w.x > window.innerWidth);
            
            if (isCorrupted || (isMobile && !isInitialized)) {
                console.log('ModularWorkspace: Detected corrupted layout. Triggering Factory Reset.');
                resetToInstitutionalLayout();
                setIsInitialized(true);
                return;
            }



            // Force-open 4 core quadrants + 1 Bottom Dock to ensure visibility on mobile
            const targetLayouts: { id: WindowId, title: string, slot: any }[] = [
                { id: 'heatmap', title: 'Heatmap', slot: 'TL' },
                { id: 'screener', title: 'Screener', slot: 'TR' },
                { id: 'news', title: 'Market News', slot: 'BL' },
                { id: 'portfolio', title: 'Portfolio', slot: 'BR' },
                { id: 'tv', title: 'Live News', slot: 'SIDE' }
            ];

            targetLayouts.forEach(layout => {
                // FORCE: Always call openWindow and snapToLayout to bypass stale storage
                openWindow(layout.id, layout.title);
                snapToLayout(layout.id, layout.slot);
            });

            // ENSURE FRONT: Specifically bring Heatmap to absolute front
            setTimeout(() => {
                const { bringToFront } = useWindowStore.getState();
                bringToFront('heatmap');
            }, 100);

            setIsInitialized(true);
        }
    }, [isInitialized, openWindow, isMobile, snapToLayout, resetToInstitutionalLayout, windows]);

    const minimizedWindows = Object.values(windows).filter(w => w.isOpen && w.isMinimized);

    return (
        <div style={{ 
            position: 'relative', 
            width: '100%', 
            height: '100%', 
            overflow: 'hidden', 
            background: 'var(--color-bg-primary)',
            backgroundImage: `
                linear-gradient(var(--glass-border-bright) 1px, transparent 1px),
                linear-gradient(90deg, var(--glass-border-bright) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px'
        }}>
            {/* SNAP GHOST / DROP ZONE PREVIEW */}
            {isDraggingId && snapTarget && (
                <div style={{
                    position: 'absolute',
                    zIndex: 2,
                    pointerEvents: 'none',
                    transition: 'all 0.1s ease-out',
                    border: '2px solid var(--color-accent)',
                    background: 'rgba(74, 222, 128, 0.1)',
                    boxShadow: '0 0 50px rgba(74, 222, 128, 0.2)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: '8px',
                    margin: '10px',
                    ...((() => {
                        const SIDE_WIDTH = isMobile ? window.innerWidth * 0.8 : 350;
                        const sidebarWidth = isMobile ? 50 : 48;
                        const availW = Math.max(0, window.innerWidth - sidebarWidth - (isMobile ? 0 : SIDE_WIDTH));
                        const availH = window.innerHeight;
                        const halfW = availW / 2;
                        const halfH = availH / 2;

                        const margin = 10;
                        if (isMobile) {
                            const sidebarWidth = 50;
                            const availW = window.innerWidth - sidebarWidth;
                            const availH = window.innerHeight;
                            const dockH = availH * 0.35;
                            const gridH = availH - dockH;
                            const hW = availW / 2;
                            const hH = gridH / 2;

                            switch (snapTarget) {
                                case 'TL': return { left: 0, top: 0, width: hW - margin, height: hH - margin };
                                case 'TR': return { left: hW + margin, top: 0, width: hW - margin, height: hH - margin };
                                case 'BL': return { left: 0, top: hH + margin, width: hW - margin, height: hH - margin };
                                case 'BR': return { left: hW + margin, top: hH + margin, width: hW - margin, height: hH - margin };
                                case 'SIDE': return { left: 0, top: gridH + margin, width: availW - margin, height: dockH - margin };
                                default: return { display: 'none' };
                            }
                        } else {
                            const SIDE_WIDTH = 350;
                            const sidebarWidth = 48;
                            const availW = window.innerWidth - sidebarWidth - SIDE_WIDTH;
                            const availH = window.innerHeight;
                            const halfW = availW / 2;
                            const halfH = availH / 2;

                            switch (snapTarget) {
                                case 'TL': return { left: 0, top: 0, width: halfW - margin, height: halfH - margin };
                                case 'TR': return { left: halfW + margin, top: 0, width: halfW - margin, height: halfH - margin };
                                case 'BL': return { left: 0, top: halfH + margin, width: halfW - margin, height: halfH - margin };
                                case 'BR': return { left: halfW + margin, top: halfH + margin, width: halfW - margin, height: halfH - margin };
                                case 'SIDE': return { right: 0, top: 0, width: SIDE_WIDTH - margin, height: availH - margin };
                                default: return { display: 'none' };
                            }
                        }
                    })())
                }} />
            )}
            
            {/* GRID BACKGROUND / DROP ZONES */}
            <div style={{ position: 'absolute', inset: 0, opacity: isDraggingId ? 1 : 0.4, transition: 'opacity 0.5s', pointerEvents: 'none', zIndex: 0 }}>
                {isMobile ? (
                    // MOBILE GRID: Subtle 2x2 Grid (Top 65%) + 1 Dock (Bottom 35%)
                    <>
                        {/* 4 RECTANGULAR PANELS (Transparent Drop Zones) */}
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '32.5%', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex' }}>
                            <div style={{ flex: 1, borderRight: '1px solid rgba(255, 255, 255, 0.05)' }} />
                            <div style={{ flex: 1 }} />
                        </div>
                        <div style={{ position: 'absolute', top: '32.5%', left: 0, width: '100%', height: '32.5%', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex' }}>
                            <div style={{ flex: 1, borderRight: '1px solid rgba(255, 255, 255, 0.05)' }} />
                            <div style={{ flex: 1 }} />
                        </div>
                        {/* BOTTOM NEWS DOCK */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', background: 'rgba(255, 255, 255, 0.02)', borderTop: '1px solid var(--color-border)' }} />
                    </>
                ) : (



                    // DESKTOP GRID: 2x2 LEFT, 1 SIDE RIGHT
                    <>
                        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '350px', background: 'rgba(74, 222, 128, 0.01)', borderLeft: '1px solid var(--color-border)' }} />
                        <div style={{ position: 'absolute', top: 0, left: 0, width: 'calc(100% - 350px)', height: '50%', borderBottom: '1px solid var(--color-border)', display: 'flex', opacity: 0.3 }}>
                            <div style={{ flex: 1, borderRight: '1px solid var(--color-border)' }} />
                            <div style={{ flex: 1 }} />
                        </div>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 'calc(100% - 350px)', height: '50%', display: 'flex', opacity: 0.3 }}>
                            <div style={{ flex: 1, borderRight: '1px solid var(--color-border)' }} />
                            <div style={{ flex: 1 }} />
                        </div>
                    </>
                )}
            </div>
            
            {/* THE WORKSPACE */}
            <div style={{ 
                position: 'absolute', 
                inset: 0, 
                padding: 0,
                overflow: 'hidden'
            }}>
                {/* GLOBAL WIDGET DARK MODE ENFORCER */}
                <style dangerouslySetInnerHTML={{ __html: `
                    iframe { 
                        background: #000000 !important; 
                        color-scheme: dark !important;
                    }
                    .tradingview-widget-container, 
                    .tradingview-widget-container__widget,
                    .tv-embed-widget-wrapper {
                        background: #000000 !important;
                        background-color: #000000 !important;
                    }
                    /* Fail-safe for widgets that attempt to render white content */
                    .tradingview-widget-container iframe {
                        filter: brightness(0.9) contrast(1.1) !important;
                    }
                `}} />
                
                {/* 1. Heatmap Window */}
                <TerminalWindow id="heatmap" title="Heatmap">
                    <StockHeatmap />
                </TerminalWindow>

                {/* 2. Screener Window (Now supports Search Tabs) */}
                <TerminalWindow id="screener" title="Screener">
                    <RightTabbedPanel onSelectSymbol={onSelectSymbol || (() => {})} />
                </TerminalWindow>

                {/* 3. Portfolio Window */}
                <TerminalWindow id="portfolio" title="Portfolio">
                    <Portfolio />
                </TerminalWindow>

                {/* 4. Watchlist Window */}
                <TerminalWindow id="watchlist" title="Global Watchlist" minW={isMobile ? 320 : 350} minH={300}>
                    <WatchlistPage onSelectSymbol={onSelectSymbol || (() => {})} />
                </TerminalWindow>

                {/* 5. TV / Streams Window */}
                <TerminalWindow id="tv" title="Live News" minW={isMobile ? 300 : 300} minH={250}>
                    <LiveIntelligenceStreams />
                </TerminalWindow>

                {/* 6. Calendar Window */}
                <TerminalWindow id="calendar" title="Corporate Actions" minW={isMobile ? 300 : 300} minH={250}>
                    <CorporateActionsCalendar />
                </TerminalWindow>

                {/* 7. News Window */}
                <TerminalWindow id="news" title="Market News">
                    <MarketNews />
                </TerminalWindow>

                {/* 10. Admin Window */}
                <TerminalWindow id="admin" title="Administrative Terminal" minW={isMobile ? 320 : 600} minH={400}>
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
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
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
                            background: 'var(--color-bg-elevated)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            color: 'var(--color-text-primary)',
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

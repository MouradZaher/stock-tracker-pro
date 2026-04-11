import React, { useEffect, useState } from 'react';
import { useWindowStore, type WindowId } from '../hooks/useWindowStore';
import TerminalWindow from './TerminalWindow';
import StockHeatmap from './StockHeatmap';
import InstitutionalScreener from './InstitutionalScreener';
import Portfolio from './Portfolio';
import WatchlistPage from './WatchlistPage';
import LiveIntelligenceStreams from './LiveIntelligenceStreams';
import CorporateActionsCalendar from './CorporateActionsCalendar';
import MarketPulsePage from './MarketPulsePage';
import AIRecommendations from './AIRecommendations';
import InstitutionalAdvisory from './InstitutionalAdvisory';
import AdminDashboard from './AdminDashboard';
import { LayoutGrid, Activity, PieChart, Eye, Tv, Calendar, Search, Brain, ShieldCheck, Shield } from 'lucide-react';

interface ModularWorkspaceProps {
    onSelectSymbol?: (symbol: string) => void;
}

const ModularWorkspace: React.FC<ModularWorkspaceProps> = ({ onSelectSymbol }) => {
    const { windows, openWindow, bringToFront, toggleMinimize, isDraggingId, snapToLayout } = useWindowStore();
    const [isInitialized, setIsInitialized] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initial tool spawn - One time on mount
    useEffect(() => {
        if (!isInitialized) {
            const currentWindows = useWindowStore.getState().windows;
            
            // Adjust initial sizes for mobile vs desktop grid
            if (!currentWindows['heatmap'] || !currentWindows['heatmap'].isOpen) {
                openWindow('heatmap', 'Institutional Heatmap');
                if (!isMobile) snapToLayout('heatmap', 'TL');
            }
            if (!currentWindows['screener'] || !currentWindows['screener'].isOpen) {
                openWindow('screener', 'Data Matrix Screener');
                if (!isMobile) snapToLayout('screener', 'BL');
            }
            if (!currentWindows['advisor'] || !currentWindows['advisor'].isOpen) {
                openWindow('advisor', 'Oracle Portfolio Audit');
                if (!isMobile) snapToLayout('advisor', 'SIDE');
            }
            if (!currentWindows['recommendations'] || !currentWindows['recommendations'].isOpen) {
                openWindow('recommendations', 'Institutional Intelligence');
                if (!isMobile) snapToLayout('recommendations', 'TR');
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
                <TerminalWindow id="heatmap" title="Institutional Heatmap" minW={350} minH={300}>
                    <StockHeatmap />
                </TerminalWindow>

                {/* 2. Screener Window */}
                <TerminalWindow id="screener" title="Data Matrix Screener" minW={350} minH={300}>
                    <InstitutionalScreener onSelectSymbol={onSelectSymbol || (() => {})} />
                </TerminalWindow>

                {/* 3. Portfolio Window */}
                <TerminalWindow id="portfolio" title="Active Portfolio" minW={350} minH={300}>
                    <Portfolio />
                </TerminalWindow>

                {/* 4. Watchlist Window */}
                <TerminalWindow id="watchlist" title="Global Watchlist" minW={350} minH={300}>
                    <WatchlistPage onSelectSymbol={onSelectSymbol || (() => {})} />
                </TerminalWindow>

                {/* 5. TV / Streams Window */}
                <TerminalWindow id="tv" title="Intelligence Streams" minW={300} minH={250}>
                    <LiveIntelligenceStreams />
                </TerminalWindow>

                {/* 6. Calendar Window */}
                <TerminalWindow id="calendar" title="Corporate Actions" minW={300} minH={250}>
                    <CorporateActionsCalendar />
                </TerminalWindow>

                {/* 7. Search Window */}
                <TerminalWindow id="pulse" title="Global Asset Identification" minW={350} minH={300}>
                    <MarketPulsePage onSelectStock={onSelectSymbol} />
                </TerminalWindow>

                {/* 8. Recommendations Window */}
                <TerminalWindow id="recommendations" title="Institutional Intelligence" minW={350} minH={350}>
                    <AIRecommendations />
                </TerminalWindow>

                {/* 9. Advisory Window */}
                <TerminalWindow id="advisor" title="Oracle Portfolio Audit" minW={300} minH={400}>
                    <InstitutionalAdvisory />
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
